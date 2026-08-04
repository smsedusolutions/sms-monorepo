/**
 * Test script for the Timetable AI Generation Service.
 * 
 * Validates:
 * - Generation succeeds with various configurations
 * - No teacher is double-booked
 * - No class/section is double-booked
 * - maxPeriodsPerDay is respected
 * - dayLimits (Saturday cutoff) is respected
 * - Parent subjects with children are excluded
 * - Teachers with no subjects are excluded
 * - Subjects with periodsPerWeek=0 are skipped
 * 
 * Usage: node test-timetable-ai.js
 */

const TimetableAIService = require('./services/timetable-ai.service');

// ===================== TEST FIXTURES =====================

function createConfig({ workingDays, periodsPerDay = 8 } = {}) {
  const days = workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const periods = [];
  for (let i = 1; i <= periodsPerDay; i++) {
    if (i === 5) {
      periods.push({ periodNumber: i, name: 'Lunch', type: 'lunch', startTime: '12:30', endTime: '13:00' });
    } else {
      const num = i > 5 ? i - 1 : i; // adjust for lunch
      periods.push({ periodNumber: i, name: `Period ${num}`, type: 'regular', startTime: `${8 + i - 1}:00`, endTime: `${8 + i}:00` });
    }
  }
  return { workingDays: days, periods };
}

function createClass(classId, name, sectionNames) {
  return {
    classId,
    name,
    status: 'active',
    sections: sectionNames.map(sn => ({
      sectionId: `${classId}-${sn}`,
      name: sn
    }))
  };
}

function createTeacher(teacherId, firstName, lastName, subjectIds) {
  return { teacherId, firstName, lastName, subjects: subjectIds, status: 'active' };
}

function createSubject(subjectId, name, code, { isSubSubject = false, parentSubjectId = null } = {}) {
  return { subjectId, name, code, status: 'active', isSubSubject, parentSubjectId };
}

// ===================== VALIDATORS =====================

function validateNoTeacherDoubleBooking(schedule) {
  const seen = new Set();
  for (const entry of schedule) {
    const key = `${entry.teacherId}|${entry.dayOfWeek}|${entry.periodNumber}`;
    if (seen.has(key)) {
      return { pass: false, message: `Teacher ${entry.teacherId} is double-booked on ${entry.dayOfWeek} period ${entry.periodNumber}` };
    }
    seen.add(key);
  }
  return { pass: true };
}

function validateNoClassDoubleBooking(schedule) {
  const seen = new Set();
  for (const entry of schedule) {
    const key = `${entry.classId}|${entry.sectionId}|${entry.dayOfWeek}|${entry.periodNumber}`;
    if (seen.has(key)) {
      return { pass: false, message: `Class ${entry.classId}-${entry.sectionId} is double-booked on ${entry.dayOfWeek} period ${entry.periodNumber}` };
    }
    seen.add(key);
  }
  return { pass: true };
}

function validateMaxPerDay(schedule, rules) {
  const ruleMap = {};
  rules.forEach(r => { ruleMap[r.subjectId] = r; });

  const counts = {}; // "classId|sectionId|day|subjectId" -> count
  for (const entry of schedule) {
    const key = `${entry.classId}|${entry.sectionId}|${entry.dayOfWeek}|${entry.subjectId}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  for (const [key, count] of Object.entries(counts)) {
    const parts = key.split('|');
    const subjectId = parts[3];
    const rule = ruleMap[subjectId];
    const maxPerDay = rule?.maxPeriodsPerDay || 99;
    if (count > maxPerDay) {
      return { pass: false, message: `Subject ${subjectId} has ${count} periods on ${parts[2]} for ${parts[0]}-${parts[1]}, max is ${maxPerDay}` };
    }
  }
  return { pass: true };
}

function validateDayLimits(schedule, config, options) {
  for (const entry of schedule) {
    const dayLimit = options.dayLimits?.[entry.dayOfWeek.toLowerCase()];
    if (dayLimit && dayLimit > 0) {
      // Find the max period number allowed
      const instructionalPeriods = config.periods
        .filter(p => !['break', 'lunch', 'assembly'].includes(p.type))
        .sort((a, b) => a.periodNumber - b.periodNumber)
        .slice(0, dayLimit);
      const maxAllowedPeriod = Math.max(...instructionalPeriods.map(p => p.periodNumber));
      if (entry.periodNumber > maxAllowedPeriod) {
        return { pass: false, message: `Entry on ${entry.dayOfWeek} period ${entry.periodNumber} exceeds dayLimit of ${dayLimit}` };
      }
    }
  }
  return { pass: true };
}

function validateParentSubjectsExcluded(schedule, subjects) {
  const parentIdsWithChildren = new Set();
  subjects.forEach(s => {
    if (s.isSubSubject && s.parentSubjectId) parentIdsWithChildren.add(s.parentSubjectId);
  });

  for (const entry of schedule) {
    if (parentIdsWithChildren.has(entry.subjectId)) {
      return { pass: false, message: `Parent subject ${entry.subjectId} was scheduled, but it has sub-subjects and should be excluded` };
    }
  }
  return { pass: true };
}

function validateNoUnassignedTeachers(schedule, teachers) {
  const teachersWithNoSubjects = new Set(
    teachers.filter(t => !t.subjects || t.subjects.length === 0).map(t => t.teacherId)
  );

  for (const entry of schedule) {
    if (teachersWithNoSubjects.has(entry.teacherId)) {
      return { pass: false, message: `Teacher ${entry.teacherId} has no subject assignments but was scheduled` };
    }
  }
  return { pass: true };
}

function validatePeriodsCount(schedule, rules, totalSections, subjects) {
  const parentIdsWithChildren = new Set();
  subjects.forEach(s => {
    if (s.isSubSubject && s.parentSubjectId) parentIdsWithChildren.add(s.parentSubjectId);
  });

  const effectiveRules = rules.filter(r => r.periodsPerWeek > 0 && !parentIdsWithChildren.has(r.subjectId));

  const expectedTotal = effectiveRules.reduce((sum, r) => sum + r.periodsPerWeek * totalSections, 0);
  if (schedule.length !== expectedTotal) {
    return { pass: false, message: `Expected ${expectedTotal} total entries but got ${schedule.length}` };
  }
  return { pass: true };
}

// ===================== TEST RUNNER =====================

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ===================== TESTS =====================

let passed = 0;
let failed = 0;

console.log('\n========================================');
console.log('  Timetable AI Generation Tests');
console.log('========================================\n');

// --- Test 1: Basic generation ---
console.log('Test 1: Basic generation (3 subjects, 2 classes, 2 sections each)');
{
  const config = createConfig();
  const classes = [
    createClass('c1', 'Class 8', ['A', 'B']),
    createClass('c2', 'Class 9', ['A', 'B']),
  ];
  const teachers = [
    createTeacher('t1', 'Alice', 'Math', ['math']),
    createTeacher('t2', 'Bob', 'Science', ['science']),
    createTeacher('t3', 'Charlie', 'English', ['english']),
    createTeacher('t4', 'Diana', 'Math', ['math']),
  ];
  const subjects = [
    createSubject('math', 'Mathematics', 'MAT'),
    createSubject('science', 'Science', 'SCI'),
    createSubject('english', 'English', 'ENG'),
  ];
  const rules = [
    { subjectId: 'math', periodsPerWeek: 5, morningPriority: true, maxPeriodsPerDay: 1 },
    { subjectId: 'science', periodsPerWeek: 4, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'english', periodsPerWeek: 3, morningPriority: false, maxPeriodsPerDay: 1 },
  ];
  const options = { dayLimits: { saturday: 4 } };

  const result = runTest('Generation succeeds', () => {
    const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, options);
    assert(schedule.length > 0, 'Schedule should not be empty');
  });
  result ? passed++ : failed++;

  const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, options);

  let r;
  r = runTest('No teacher double-booking', () => { const v = validateNoTeacherDoubleBooking(schedule); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('No class double-booking', () => { const v = validateNoClassDoubleBooking(schedule); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('maxPeriodsPerDay respected', () => { const v = validateMaxPerDay(schedule, rules); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('dayLimits respected', () => { const v = validateDayLimits(schedule, config, options); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('Correct total entries', () => { const v = validatePeriodsCount(schedule, rules, 4, subjects); assert(v.pass, v.message); });
  r ? passed++ : failed++;
}

// --- Test 2: Parent/sub-subject filtering ---
console.log('\nTest 2: Parent/sub-subject filtering');
{
  const config = createConfig();
  const classes = [createClass('c1', 'Class 10', ['A'])];
  const teachers = [
    createTeacher('t1', 'Alice', 'Bio', ['bio']),
    createTeacher('t2', 'Bob', 'Chem', ['chem']),
    createTeacher('t3', 'Charlie', 'Phys', ['physics']),
    createTeacher('t4', 'Diana', 'Math', ['math']),
  ];
  const subjects = [
    createSubject('science', 'Science', 'SCI'),  // Parent
    createSubject('bio', 'Biology', 'BIO', { isSubSubject: true, parentSubjectId: 'science' }),
    createSubject('chem', 'Chemistry', 'CHE', { isSubSubject: true, parentSubjectId: 'science' }),
    createSubject('physics', 'Physics', 'PHY', { isSubSubject: true, parentSubjectId: 'science' }),
    createSubject('math', 'Mathematics', 'MAT'),  // Standalone
  ];
  const rules = [
    { subjectId: 'science', periodsPerWeek: 3, morningPriority: false, maxPeriodsPerDay: 2 },
    { subjectId: 'bio', periodsPerWeek: 2, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'chem', periodsPerWeek: 2, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'physics', periodsPerWeek: 2, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'math', periodsPerWeek: 5, morningPriority: true, maxPeriodsPerDay: 1 },
  ];
  const options = {};

  const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, options);

  let r;
  r = runTest('Parent subject "Science" excluded from schedule', () => {
    const v = validateParentSubjectsExcluded(schedule, subjects);
    assert(v.pass, v.message);
  });
  r ? passed++ : failed++;

  r = runTest('Sub-subjects are scheduled', () => {
    const bioEntries = schedule.filter(e => e.subjectId === 'bio');
    const chemEntries = schedule.filter(e => e.subjectId === 'chem');
    const physEntries = schedule.filter(e => e.subjectId === 'physics');
    assert(bioEntries.length === 2, `Expected 2 bio entries, got ${bioEntries.length}`);
    assert(chemEntries.length === 2, `Expected 2 chem entries, got ${chemEntries.length}`);
    assert(physEntries.length === 2, `Expected 2 physics entries, got ${physEntries.length}`);
  });
  r ? passed++ : failed++;

  r = runTest('No teacher double-booking', () => { const v = validateNoTeacherDoubleBooking(schedule); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('No class double-booking', () => { const v = validateNoClassDoubleBooking(schedule); assert(v.pass, v.message); });
  r ? passed++ : failed++;
}

// --- Test 3: Teachers with no subjects excluded ---
console.log('\nTest 3: Teachers with no subject assignments excluded');
{
  const config = createConfig();
  const classes = [createClass('c1', 'Class 8', ['A'])];
  const teachers = [
    createTeacher('t1', 'Alice', 'Math', ['math']),
    createTeacher('t2', 'NoSubjects', 'Teacher', []),  // No subjects!
  ];
  const subjects = [
    createSubject('math', 'Mathematics', 'MAT'),
  ];
  const rules = [
    { subjectId: 'math', periodsPerWeek: 3, morningPriority: false, maxPeriodsPerDay: 1 },
  ];

  const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, {});

  let r;
  r = runTest('Teacher with no subjects not used', () => {
    const v = validateNoUnassignedTeachers(schedule, teachers);
    assert(v.pass, v.message);
  });
  r ? passed++ : failed++;
}

// --- Test 4: Subjects with periodsPerWeek=0 skipped ---
console.log('\nTest 4: Subjects with periodsPerWeek=0 are skipped');
{
  const config = createConfig();
  const classes = [createClass('c1', 'Class 8', ['A'])];
  const teachers = [
    createTeacher('t1', 'Alice', 'Math', ['math']),
    createTeacher('t2', 'Bob', 'Art', ['art']),
  ];
  const subjects = [
    createSubject('math', 'Mathematics', 'MAT'),
    createSubject('art', 'Art', 'ART'),
  ];
  const rules = [
    { subjectId: 'math', periodsPerWeek: 3, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'art', periodsPerWeek: 0, morningPriority: false, maxPeriodsPerDay: 1 },  // 0!
  ];

  const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, {});

  let r;
  r = runTest('Art (periodsPerWeek=0) not in schedule', () => {
    const artEntries = schedule.filter(e => e.subjectId === 'art');
    assert(artEntries.length === 0, `Expected 0 art entries, got ${artEntries.length}`);
  });
  r ? passed++ : failed++;

  r = runTest('Math (periodsPerWeek=3) has correct count', () => {
    const mathEntries = schedule.filter(e => e.subjectId === 'math');
    assert(mathEntries.length === 3, `Expected 3 math entries, got ${mathEntries.length}`);
  });
  r ? passed++ : failed++;
}

// --- Test 5: Validation — shortage detection ---
console.log('\nTest 5: Validation detects teacher shortage');
{
  const config = createConfig();
  const classes = [
    createClass('c1', 'Class 8', ['A', 'B', 'C', 'D']),
    createClass('c2', 'Class 9', ['A', 'B', 'C', 'D']),
  ];
  const teachers = [
    createTeacher('t1', 'Alice', 'Math', ['math']),
    // Only 1 math teacher for 8 sections needing 8 periods each = 64 total, but teacher has ~42 slots max
  ];
  const subjects = [
    createSubject('math', 'Mathematics', 'MAT'),
  ];
  const rules = [
    { subjectId: 'math', periodsPerWeek: 8, morningPriority: false, maxPeriodsPerDay: 2 },
  ];
  const options = {};

  let r;
  r = runTest('Validation reports shortage', () => {
    const validation = TimetableAIService.validateConstraints(config, classes, teachers, rules, subjects, options);
    assert(!validation.isValid, 'Should be invalid');
    assert(validation.errors.length > 0, 'Should have errors');
    assert(validation.errors[0].includes('Shortage'), `Error should mention shortage: ${validation.errors[0]}`);
  });
  r ? passed++ : failed++;
}

// --- Test 6: Validation — shared teacher bottleneck ---
console.log('\nTest 6: Validation detects shared teacher bottleneck');
{
  const config = createConfig();
  const classes = [
    createClass('c1', 'Class 8', ['A', 'B', 'C', 'D']),
    createClass('c2', 'Class 9', ['A', 'B', 'C', 'D']),
  ];
  const teachers = [
    createTeacher('t1', 'Alice', 'MultiTeacher', ['math', 'science']),
    // Alice is the ONLY teacher for both math and science
  ];
  const subjects = [
    createSubject('math', 'Mathematics', 'MAT'),
    createSubject('science', 'Science', 'SCI'),
  ];
  const rules = [
    { subjectId: 'math', periodsPerWeek: 4, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'science', periodsPerWeek: 4, morningPriority: false, maxPeriodsPerDay: 1 },
  ];

  let r;
  r = runTest('Validation reports bottleneck', () => {
    const validation = TimetableAIService.validateConstraints(config, classes, teachers, rules, subjects, {});
    assert(!validation.isValid, 'Should be invalid');
    assert(validation.errors.some(e => e.includes('bottleneck') || e.includes('Shortage')), 
      `Should mention bottleneck or shortage: ${JSON.stringify(validation.errors)}`);
  });
  r ? passed++ : failed++;
}

// --- Test 7: Stress test — many classes, many subjects ---
console.log('\nTest 7: Stress test (5 classes × 2 sections, 6 subjects)');
{
  const config = createConfig({ periodsPerDay: 9 }); // 8 instructional + 1 lunch
  const classes = [
    createClass('c1', 'Class 6', ['A', 'B']),
    createClass('c2', 'Class 7', ['A', 'B']),
    createClass('c3', 'Class 8', ['A', 'B']),
    createClass('c4', 'Class 9', ['A', 'B']),
    createClass('c5', 'Class 10', ['A', 'B']),
  ];
  const teachers = [
    createTeacher('t1', 'T1', 'Math', ['math']),
    createTeacher('t2', 'T2', 'Math', ['math']),
    createTeacher('t3', 'T3', 'Science', ['science']),
    createTeacher('t4', 'T4', 'Science', ['science']),
    createTeacher('t5', 'T5', 'English', ['english']),
    createTeacher('t6', 'T6', 'English', ['english']),
    createTeacher('t7', 'T7', 'Hindi', ['hindi']),
    createTeacher('t8', 'T8', 'Hindi', ['hindi']),
    createTeacher('t9', 'T9', 'SS', ['social']),
    createTeacher('t10', 'T10', 'SS', ['social']),
    createTeacher('t11', 'T11', 'PE', ['pe']),
  ];
  const subjects = [
    createSubject('math', 'Mathematics', 'MAT'),
    createSubject('science', 'Science', 'SCI'),
    createSubject('english', 'English', 'ENG'),
    createSubject('hindi', 'Hindi', 'HIN'),
    createSubject('social', 'Social Studies', 'SS'),
    createSubject('pe', 'Physical Education', 'PE'),
  ];
  const rules = [
    { subjectId: 'math', periodsPerWeek: 6, morningPriority: true, maxPeriodsPerDay: 2 },
    { subjectId: 'science', periodsPerWeek: 5, morningPriority: true, maxPeriodsPerDay: 1 },
    { subjectId: 'english', periodsPerWeek: 5, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'hindi', periodsPerWeek: 4, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'social', periodsPerWeek: 4, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'pe', periodsPerWeek: 2, morningPriority: false, maxPeriodsPerDay: 1 },
  ];
  const options = { dayLimits: { saturday: 4 } };

  let r;
  r = runTest('Generation succeeds', () => {
    const start = Date.now();
    const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, options);
    const elapsed = Date.now() - start;
    console.log(`      (Generated ${schedule.length} entries in ${elapsed}ms)`);
    assert(schedule.length > 0, 'Schedule should not be empty');
  });
  r ? passed++ : failed++;

  const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, options);

  r = runTest('No teacher double-booking', () => { const v = validateNoTeacherDoubleBooking(schedule); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('No class double-booking', () => { const v = validateNoClassDoubleBooking(schedule); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('maxPeriodsPerDay respected', () => { const v = validateMaxPerDay(schedule, rules); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('dayLimits respected', () => { const v = validateDayLimits(schedule, config, options); assert(v.pass, v.message); });
  r ? passed++ : failed++;
}

// --- Test 8: Repeated generation consistency ---
console.log('\nTest 8: Repeated generation — 10 runs, all conflict-free');
{
  const config = createConfig();
  const classes = [
    createClass('c1', 'Class 8', ['A', 'B']),
    createClass('c2', 'Class 9', ['A']),
  ];
  const teachers = [
    createTeacher('t1', 'T1', 'Math', ['math']),
    createTeacher('t2', 'T2', 'Science', ['science']),
    createTeacher('t3', 'T3', 'English', ['english']),
    createTeacher('t4', 'T4', 'Math', ['math']),
  ];
  const subjects = [
    createSubject('math', 'Mathematics', 'MAT'),
    createSubject('science', 'Science', 'SCI'),
    createSubject('english', 'English', 'ENG'),
  ];
  const rules = [
    { subjectId: 'math', periodsPerWeek: 5, morningPriority: true, maxPeriodsPerDay: 1 },
    { subjectId: 'science', periodsPerWeek: 4, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'english', periodsPerWeek: 3, morningPriority: false, maxPeriodsPerDay: 1 },
  ];
  const options = { dayLimits: { saturday: 4 } };

  let r;
  r = runTest('All 10 runs produce conflict-free schedules', () => {
    for (let run = 0; run < 10; run++) {
      const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, options);
      
      const v1 = validateNoTeacherDoubleBooking(schedule);
      assert(v1.pass, `Run ${run + 1}: ${v1.message}`);
      
      const v2 = validateNoClassDoubleBooking(schedule);
      assert(v2.pass, `Run ${run + 1}: ${v2.message}`);
      
      const v3 = validateMaxPerDay(schedule, rules);
      assert(v3.pass, `Run ${run + 1}: ${v3.message}`);
    }
  });
  r ? passed++ : failed++;
}

// --- Test 9: Large-scale real-world simulation ---
console.log('\nTest 9: Real-world simulation (10 classes × 3 sections, 10 subjects, tight teachers)');
{
  const config = createConfig({ periodsPerDay: 9 }); // 8 instructional + 1 lunch
  const classes = [];
  for (let i = 1; i <= 10; i++) {
    classes.push(createClass(`c${i}`, `Class ${i}`, ['A', 'B', 'C']));
  }
  const teachers = [
    createTeacher('t1', 'T1', 'Math1', ['math']),
    createTeacher('t2', 'T2', 'Math2', ['math']),
    createTeacher('t3', 'T3', 'Math3', ['math']),
    createTeacher('t3_1', 'T31', 'Math4', ['math']),
    createTeacher('t3_2', 'T32', 'Math5', ['math']),
    createTeacher('t4', 'T4', 'Science1', ['science']),
    createTeacher('t5', 'T5', 'Science2', ['science']),
    createTeacher('t6', 'T6', 'Science3', ['science']),
    createTeacher('t6_1', 'T61', 'Science4', ['science']),
    createTeacher('t7', 'T7', 'English1', ['english']),
    createTeacher('t8', 'T8', 'English2', ['english']),
    createTeacher('t9', 'T9', 'English3', ['english']),
    createTeacher('t9_1', 'T91', 'English4', ['english']),
    createTeacher('t10', 'T10', 'Hindi1', ['hindi']),
    createTeacher('t11', 'T11', 'Hindi2', ['hindi']),
    createTeacher('t11_1', 'T111', 'Hindi3', ['hindi']),
    createTeacher('t12', 'T12', 'SS1', ['social']),
    createTeacher('t13', 'T13', 'SS2', ['social']),
    createTeacher('t13_1', 'T131', 'SS3', ['social']),
    createTeacher('t14', 'T14', 'PE1', ['pe']),
    createTeacher('t15', 'T15', 'PE2', ['pe']),
    createTeacher('t16', 'T16', 'Art1', ['art']),
    createTeacher('t17', 'T17', 'Computer1', ['computer']),
    createTeacher('t18', 'T18', 'Computer2', ['computer']),
    createTeacher('t19', 'T19', 'Music', ['music']),
    createTeacher('t20', 'T20', 'GK', ['gk']),
  ];
  const subjects = [
    createSubject('math', 'Mathematics', 'MAT'),
    createSubject('science', 'Science', 'SCI'),
    createSubject('english', 'English', 'ENG'),
    createSubject('hindi', 'Hindi', 'HIN'),
    createSubject('social', 'Social Studies', 'SS'),
    createSubject('pe', 'Physical Education', 'PE'),
    createSubject('art', 'Art', 'ART'),
    createSubject('computer', 'Computer Science', 'CS'),
    createSubject('music', 'Music', 'MUS'),
    createSubject('gk', 'General Knowledge', 'GK'),
  ];
  const rules = [
    { subjectId: 'math', periodsPerWeek: 6, morningPriority: true, maxPeriodsPerDay: 2 },
    { subjectId: 'science', periodsPerWeek: 5, morningPriority: true, maxPeriodsPerDay: 1 },
    { subjectId: 'english', periodsPerWeek: 5, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'hindi', periodsPerWeek: 4, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'social', periodsPerWeek: 3, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'pe', periodsPerWeek: 2, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'art', periodsPerWeek: 1, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'computer', periodsPerWeek: 2, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'music', periodsPerWeek: 1, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'gk', periodsPerWeek: 1, morningPriority: false, maxPeriodsPerDay: 1 },
  ];
  const options = { dayLimits: { saturday: 4 } };

  let r;
  r = runTest('Generation succeeds (30 sections, 10 subjects)', () => {
    const start = Date.now();
    const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, options);
    const elapsed = Date.now() - start;
    console.log(`      (Generated ${schedule.length} entries for 30 sections in ${elapsed}ms)`);
    assert(schedule.length > 0, 'Schedule should not be empty');
  });
  r ? passed++ : failed++;

  const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, options);

  r = runTest('No teacher double-booking', () => { const v = validateNoTeacherDoubleBooking(schedule); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('No class double-booking', () => { const v = validateNoClassDoubleBooking(schedule); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('maxPeriodsPerDay respected', () => { const v = validateMaxPerDay(schedule, rules); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('dayLimits respected', () => { const v = validateDayLimits(schedule, config, options); assert(v.pass, v.message); });
  r ? passed++ : failed++;

  r = runTest('Correct total entries (900 expected)', () => {
    const expected = rules.reduce((s, r) => s + r.periodsPerWeek, 0) * 30; // 30 sections
    assert(schedule.length === expected, `Expected ${expected}, got ${schedule.length}`);
  });
  r ? passed++ : failed++;
}

// --- Test 10: Interlinked Class-Subject Association Matching ---
console.log('\nTest 10: Interlinked Class-Subject Association Matching');
{
  const config = createConfig();
  const classes = [
    createClass('c1', 'Class 1', ['A']),
    createClass('c9', 'Class 9', ['A']),
  ];
  const teachers = [
    createTeacher('t1', 'Alice', 'Math', ['math']),
    createTeacher('t2', 'Bob', 'Physics', ['physics']),
    createTeacher('t3', 'Charlie', 'EVS', ['evs']),
  ];
  const subjects = [
    createSubject('math', 'Mathematics', 'MAT'), // General (applies to all)
    { subjectId: 'physics', name: 'Physics', code: 'PHY', classes: ['c9'] }, // Only Class 9
    { subjectId: 'evs', name: 'EVS', code: 'EVS', classes: ['c1'] }, // Only Class 1
  ];
  const rules = [
    { subjectId: 'math', periodsPerWeek: 3, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'physics', periodsPerWeek: 3, morningPriority: false, maxPeriodsPerDay: 1 },
    { subjectId: 'evs', periodsPerWeek: 3, morningPriority: false, maxPeriodsPerDay: 1 },
  ];

  const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, {});

  let r;
  r = runTest('Physics only scheduled for Class 9', () => {
    const physicsInClass1 = schedule.filter(e => e.classId === 'c1' && e.subjectId === 'physics');
    const physicsInClass9 = schedule.filter(e => e.classId === 'c9' && e.subjectId === 'physics');
    assert(physicsInClass1.length === 0, `Physics should not be in Class 1, found ${physicsInClass1.length}`);
    assert(physicsInClass9.length === 3, `Physics should have 3 entries in Class 9, found ${physicsInClass9.length}`);
  });
  r ? passed++ : failed++;

  r = runTest('EVS only scheduled for Class 1', () => {
    const evsInClass1 = schedule.filter(e => e.classId === 'c1' && e.subjectId === 'evs');
    const evsInClass9 = schedule.filter(e => e.classId === 'c9' && e.subjectId === 'evs');
    assert(evsInClass1.length === 3, `EVS should have 3 entries in Class 1, found ${evsInClass1.length}`);
    assert(evsInClass9.length === 0, `EVS should not be in Class 9, found ${evsInClass9.length}`);
  });
  r ? passed++ : failed++;
}

// ===================== RESULTS =====================

// ===================== TEST 11: suggestRules formula =====================
{
  console.log('\n--- Test 11: suggestRules priority-tier formula ---');

  /**
   * Pure-logic version of the suggestion algorithm (mirrors the controller).
   * We test the math independently of the HTTP layer.
   */
  function suggestRulesLocal(subjectIds, workingDaysCount = 6, regularPeriodsPerDay = 7) {
    const totalWeeklySlots = workingDaysCount * regularPeriodsPerDay;
    const n = subjectIds.length;

    const tier1End = Math.max(1, Math.ceil(n * 0.15));
    const tier2End = Math.max(tier1End + 1, Math.ceil(n * 0.35));
    const tier3End = Math.max(tier2End + 1, Math.ceil(n * 0.65));

    const tier1Budget = Math.floor(totalWeeklySlots * 0.22);
    const tier2Budget = Math.floor(totalWeeklySlots * 0.18);
    const tier3Budget = Math.floor(totalWeeklySlots * 0.13);

    const tier1Count = tier1End;
    const tier2Count = tier2End - tier1End;
    const tier3Count = tier3End - tier2End;

    const tier1PpW = Math.max(1, Math.min(workingDaysCount, Math.round(tier1Budget / tier1Count)));
    const tier2PpW = Math.max(1, Math.min(workingDaysCount, Math.round(tier2Budget / tier2Count)));
    const tier3PpW = Math.max(1, Math.min(workingDaysCount - 1, Math.round(tier3Budget / Math.max(1, tier3Count))));
    const tier4PpW = 2;

    const suggestions = {};
    subjectIds.forEach((id, index) => {
      let periodsPerWeek, morningPriority;
      if (index < tier1End)       { periodsPerWeek = tier1PpW; morningPriority = true; }
      else if (index < tier2End)  { periodsPerWeek = tier2PpW; morningPriority = true; }
      else if (index < tier3End)  { periodsPerWeek = tier3PpW; morningPriority = false; }
      else                        { periodsPerWeek = tier4PpW; morningPriority = false; }
      const maxPeriodsPerDay = Math.max(1, Math.ceil(periodsPerWeek / workingDaysCount));
      suggestions[id] = { periodsPerWeek, maxPeriodsPerDay, morningPriority };
    });
    return suggestions;
  }

  let r;

  // Test with 5 subjects
  r = runTest('Suggest 5 subjects: top 1 gets most periods (Core tier)', () => {
    const ids = ['math', 'english', 'science', 'art', 'pe'];
    const s = suggestRulesLocal(ids);
    assert(s['math'].periodsPerWeek >= s['art'].periodsPerWeek, 'Core (math) should have >= periods than Art');
    assert(s['math'].morningPriority === true, 'Core subject should get morning priority');
    assert(s['pe'].morningPriority === false, 'Minor subject should not get morning priority');
    assert(s['pe'].periodsPerWeek <= 2, `Minor should get <=2 periods, got ${s['pe'].periodsPerWeek}`);
  });
  r ? passed++ : failed++;

  // Test with 10 subjects
  r = runTest('Suggest 10 subjects: periodsPerWeek >= 1 for all subjects', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `sub${i + 1}`);
    const s = suggestRulesLocal(ids);
    ids.forEach(id => {
      assert(s[id].periodsPerWeek >= 1, `Subject ${id} should have at least 1 period per week`);
      assert(s[id].maxPeriodsPerDay >= 1, `Subject ${id} should have at least 1 max period per day`);
    });
  });
  r ? passed++ : failed++;

  // Test with 15 subjects: monotone-ish priority
  r = runTest('Suggest 15 subjects: top subjects have higher or equal periods than bottom', () => {
    const ids = Array.from({ length: 15 }, (_, i) => `sub${i + 1}`);
    const s = suggestRulesLocal(ids);
    // Top 2 (Core) should have more than last 5 (Minor)
    const topPpW = s[ids[0]].periodsPerWeek;
    const bottomPpW = s[ids[14]].periodsPerWeek;
    assert(topPpW >= bottomPpW, `Core (${topPpW}) should have >= periods than Minor (${bottomPpW})`);
  });
  r ? passed++ : failed++;

  // Test: maxPeriodsPerDay never exceeds periodsPerWeek
  r = runTest('Suggest: maxPeriodsPerDay <= periodsPerWeek for all subjects', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `sub${i + 1}`);
    const s = suggestRulesLocal(ids);
    ids.forEach(id => {
      assert(
        s[id].maxPeriodsPerDay <= s[id].periodsPerWeek,
        `maxPeriodsPerDay (${s[id].maxPeriodsPerDay}) must not exceed periodsPerWeek (${s[id].periodsPerWeek}) for ${id}`
      );
    });
  });
  r ? passed++ : failed++;
}

// ===================== FINAL RESULTS =====================

console.log('\n========================================');
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

process.exit(failed > 0 ? 1 : 0);
