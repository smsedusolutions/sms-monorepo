/**
 * Timetable AI Generation Service
 * 
 * A robust scheduler using Greedy Slot-Filling with Global Teacher Balancing.
 * 
 * Algorithm Overview:
 * 1. Build a "demand table": for each section, how many periods of each subject are still needed
 * 2. Process ALL slots (day × period) across ALL sections together
 * 3. For each slot, pick the best subject to assign using a scoring heuristic:
 *    - Subjects with fewer eligible teachers are prioritized (MCV)
 *    - Subjects with higher remaining demand are prioritized  
 *    - Morning-priority subjects get a bonus for morning slots
 *    - Teachers with lower workload are preferred (load balancing)
 * 4. If a slot can't be filled (all subjects' teachers are busy), skip it and retry later
 * 5. Multiple passes to fill remaining gaps
 * 6. Randomized restarts with different orderings if any jobs remain unplaced
 * 
 * Why this works for real schools:
 * - No exponential search tree — each slot is filled greedily
 * - Global teacher pool management prevents bottlenecks
 * - MCV scoring ensures scarce-teacher subjects are placed first
 * - Multi-pass filling handles edge cases
 * - Randomized restarts handle unlucky orderings
 * 
 * Guarantees:
 * - No teacher double-booking (same day+period for two classes)
 * - No class/section double-booking (by construction — one subject per slot)
 * - maxPeriodsPerDay respected
 * - dayLimits (half-day Saturday) respected
 * - Morning priority used as scoring preference
 */

/**
 * Helper to check if a subject is assigned to a class (two-way interlinked check).
 */
function isSubjectAssignedToClass(subjectObj, classObj) {
  if (!subjectObj || !classObj) return true;

  // 1. Check subject.classes
  const subjectClasses = subjectObj.classes && Array.isArray(subjectObj.classes) ? subjectObj.classes : [];

  if (subjectClasses.length > 0) {
    const matchesClassId = subjectClasses.includes(classObj.classId) || (classObj._id && subjectClasses.includes(classObj._id.toString()));
    if (!matchesClassId) {
      return false;
    }
  }

  // 2. Check classObj.subjects
  if (classObj.subjects && Array.isArray(classObj.subjects) && classObj.subjects.length > 0) {
    const matchesSubjectId = classObj.subjects.includes(subjectObj.subjectId) || (subjectObj._id && classObj.subjects.includes(subjectObj._id.toString()));
    if (!matchesSubjectId) {
      return false;
    }
  }

  return true;
}

/**
 * Validate if the requested generation is mathematically possible given the teachers.
 */
function validateConstraints(config, classes, teachers, rules, subjects = [], options = {}) {
  const errors = [];
  const instructionalPeriods = config.periods.filter(p => !['break', 'lunch', 'assembly'].includes(p.type));
  const periodsPerDay = instructionalPeriods.length;

  const totalSlotsPerTeacher = config.workingDays.reduce((total, day) => {
    const dayLimit = options.dayLimits?.[day.toLowerCase()];
    const effectivePeriods = dayLimit && dayLimit > 0 ? Math.min(dayLimit, periodsPerDay) : periodsPerDay;
    return total + effectivePeriods;
  }, 0);

  const subjectMap = {};
  subjects.forEach(s => (subjectMap[s.subjectId] = s.name || s.subjectId));

  const parentIdsWithChildren = new Set();
  subjects.forEach(s => {
    if (s.isSubSubject && s.parentSubjectId) {
      parentIdsWithChildren.add(s.parentSubjectId);
    }
  });

  const effectiveRules = rules.filter(rule => {
    if (rule.periodsPerWeek <= 0) return false;
    if (parentIdsWithChildren.has(rule.subjectId)) return false;
    return true;
  });

  let totalSections = 0;
  classes.forEach(cls => { totalSections += (cls.sections || []).length; });

  // 1. Per-subject availability check (respecting class-subject assignment)
  const subjectNeeds = {};
  classes.forEach(cls => {
    const secCount = (cls.sections || []).length;
    if (secCount === 0) return;

    effectiveRules.forEach(rule => {
      const subObj = subjects.find(s => s.subjectId === rule.subjectId || s._id === rule.subjectId);
      if (isSubjectAssignedToClass(subObj, cls)) {
        subjectNeeds[rule.subjectId] = (subjectNeeds[rule.subjectId] || 0) + (rule.periodsPerWeek * secCount);
      }
    });
  });

  const subjectAvailability = {};
  teachers.forEach(teacher => {
    const teacherSubjects = teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects : [];
    if (teacherSubjects.length === 0) return;
    teacherSubjects.forEach(sub => {
      if (!subjectAvailability[sub]) subjectAvailability[sub] = 0;
      subjectAvailability[sub] += totalSlotsPerTeacher;
    });
  });

  Object.keys(subjectNeeds).forEach(subjectId => {
    const needed = subjectNeeds[subjectId];
    const available = subjectAvailability[subjectId] || 0;
    if (available < needed) {
      const subjectName = subjectMap[subjectId] || subjectId;
      errors.push(
        `Shortage for ${subjectName}: Needs ${needed} periods/week across assigned classes/sections, ` +
        `but available teachers can only provide at most ${available}. ` +
        `Please assign more teachers to this subject.`
      );
    }
  });

  // 2. Shared-teacher bottleneck check
  teachers.forEach(teacher => {
    const teacherSubjects = teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects : [];
    if (teacherSubjects.length <= 1) return;

    const soleSubjects = teacherSubjects.filter(subId => {
      const count = teachers.filter(t => t.subjects && t.subjects.includes(subId)).length;
      return count === 1;
    });

    if (soleSubjects.length > 1) {
      const soleNeeds = soleSubjects.reduce((sum, subId) => sum + (subjectNeeds[subId] || 0), 0);
      if (soleNeeds > totalSlotsPerTeacher) {
        const teacherName = teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.teacherId;
        const subNames = soleSubjects.map(sId => subjectMap[sId] || sId).join(', ');
        errors.push(
          `Teacher bottleneck: Teacher ${teacherName} is the ONLY teacher for multiple subjects (${subNames}). ` +
          `Together, these subjects require ${soleNeeds} periods/week, but a teacher can teach at most ${totalSlotsPerTeacher} periods/week. ` +
          `Please assign another teacher to at least one of these subjects.`
        );
      }
    }
  });

  // 3. Per-section weekly capacity check
  classes.forEach(cls => {
    let sectionPeriodsRequested = 0;
    effectiveRules.forEach(rule => {
      const subObj = subjects.find(s => s.subjectId === rule.subjectId || s._id === rule.subjectId);
      if (isSubjectAssignedToClass(subObj, cls)) {
        sectionPeriodsRequested += rule.periodsPerWeek;
      }
    });

    const sectionCapacity = totalSlotsPerTeacher;
    if (sectionPeriodsRequested > sectionCapacity) {
      errors.push(
        `Section Capacity Exceeded for Class ${cls.name}: Requested ${sectionPeriodsRequested} periods/week total, ` +
        `but weekly timetable only has ${sectionCapacity} period slots available per section. ` +
        `Please reduce periods/week for some subjects.`
      );
    }
  });

  return { isValid: errors.length === 0, errors };
}

/** Shuffles an array using the Fisher-Yates algorithm. */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Core scheduling algorithm: Greedy Slot-Filling with Global Teacher Balancing.
 */
function attemptGeneration(config, classes, teachers, subjects, rules, options = {}) {
  const subjectMap = {};
  subjects.forEach(s => (subjectMap[s.subjectId] = s.name || s.subjectId));

  const parentIdsWithChildren = new Set();
  subjects.forEach(s => {
    if (s.isSubSubject && s.parentSubjectId) {
      parentIdsWithChildren.add(s.parentSubjectId);
    }
  });

  const effectiveRules = rules.filter(rule => {
    if (rule.periodsPerWeek <= 0) return false;
    if (parentIdsWithChildren.has(rule.subjectId)) return false;
    return true;
  });

  const workingDays = config.workingDays;
  const instructionalPeriods = config.periods
    .filter(p => !['break', 'lunch', 'assembly'].includes(p.type))
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // Available periods per day (respecting dayLimits)
  const dayPeriods = {};
  workingDays.forEach(day => {
    const dayLimit = options.dayLimits?.[day.toLowerCase()];
    dayPeriods[day] = dayLimit && dayLimit > 0
      ? instructionalPeriods.slice(0, dayLimit)
      : [...instructionalPeriods];
  });

  // Morning periods per day (first half)
  const morningPeriods = {};
  workingDays.forEach(day => {
    const periods = dayPeriods[day];
    const midpoint = Math.ceil(periods.length / 2);
    morningPeriods[day] = new Set(periods.slice(0, midpoint).map(p => p.periodNumber));
  });

  // Teacher eligibility: subjectId -> [teachers] (excluding teachers with no subjects)
  const eligibleTeachersMap = {};
  effectiveRules.forEach(rule => {
    eligibleTeachersMap[rule.subjectId] = teachers.filter(
      t => t.subjects && t.subjects.length > 0 && t.subjects.includes(rule.subjectId)
    );
  });

  // All sections
  const allSections = [];
  classes.forEach(c => {
    (c.sections || []).forEach(s => {
      allSections.push({
        classId: c.classId,
        sectionId: s.sectionId,
        className: c.name,
        sectionName: s.name,
        sectionKey: `${c.classId}|${s.sectionId}`
      });
    });
  });

  // ========== STATE ==========
  // teacherSlots: "teacherId|day|periodNum" -> true
  const teacherSlots = {};
  // sectionSlots: "sectionKey|day|periodNum" -> true (O(1) section busy check)
  const sectionSlots = {};
  // teacherWorkload: teacherId -> count
  const teacherWorkload = {};
  // sectionDailySubjectCount: "sectionKey|day|subjectId" -> count
  const sectionDailySubjectCount = {};
  // remaining demand: "sectionKey|subjectId" -> remaining periods to place
  const remainingDemand = {};
  // schedule array
  const schedule = [];

  teachers.forEach(t => { teacherWorkload[t.teacherId] = 0; });

  // Initialize demand for each section (respecting class-subject interlink)
  allSections.forEach(section => {
    const classObj = classes.find(c => c.classId === section.classId);
    effectiveRules.forEach(rule => {
      const subObj = subjects.find(s => s.subjectId === rule.subjectId || s._id === rule.subjectId);
      if (isSubjectAssignedToClass(subObj, classObj)) {
        remainingDemand[`${section.sectionKey}|${rule.subjectId}`] = rule.periodsPerWeek;
      } else {
        remainingDemand[`${section.sectionKey}|${rule.subjectId}`] = 0;
      }
    });
  });

  // Helpers
  function isTeacherBusy(teacherId, day, pNum) {
    return !!teacherSlots[`${teacherId}|${day}|${pNum}`];
  }
  function isSectionBusy(sectionKey, day, pNum) {
    return !!sectionSlots[`${sectionKey}|${day}|${pNum}`];
  }
  function getDailyCount(sectionKey, day, subjectId) {
    return sectionDailySubjectCount[`${sectionKey}|${day}|${subjectId}`] || 0;
  }
  function getRemainingDemand(sectionKey, subjectId) {
    return remainingDemand[`${sectionKey}|${subjectId}`] || 0;
  }

  function placeEntry(classId, sectionId, sectionKey, subjectId, teacherId, day, pNum) {
    teacherSlots[`${teacherId}|${day}|${pNum}`] = true;
    sectionSlots[`${sectionKey}|${day}|${pNum}`] = true;
    teacherWorkload[teacherId] = (teacherWorkload[teacherId] || 0) + 1;
    const dcKey = `${sectionKey}|${day}|${subjectId}`;
    sectionDailySubjectCount[dcKey] = (sectionDailySubjectCount[dcKey] || 0) + 1;
    remainingDemand[`${sectionKey}|${subjectId}`] = (remainingDemand[`${sectionKey}|${subjectId}`] || 0) - 1;
    schedule.push({ classId, sectionId, subjectId, teacherId, dayOfWeek: day, periodNumber: pNum });
  }

  // ========== BUILD JOBS LIST ==========
  // Each job = one period to place for one section of one subject
  const jobs = [];
  for (const section of allSections) {
    const classObj = classes.find(c => c.classId === section.classId);
    for (const rule of effectiveRules) {
      const subObj = subjects.find(s => s.subjectId === rule.subjectId || s._id === rule.subjectId);
      if (!isSubjectAssignedToClass(subObj, classObj)) {
        continue; // Skip creating jobs if subject is not assigned to this class
      }
      const eligible = eligibleTeachersMap[rule.subjectId] || [];
      if (eligible.length === 0) {
        throw new Error(
          `No teacher assigned for ${subjectMap[rule.subjectId] || rule.subjectId}. ` +
          `Please assign at least one teacher to this subject.`
        );
      }
      for (let i = 0; i < rule.periodsPerWeek; i++) {
        jobs.push({
          section,
          rule,
          eligibleCount: eligible.length,
        });
      }
    }
  }

  // ========== SORT JOBS: MCV + Priority ==========
  // Sort by: fewest eligible teachers first, then most periods/week, then morning priority
  // Within same constraint level, shuffle for randomization
  jobs.sort((a, b) => {
    if (a.eligibleCount !== b.eligibleCount) return a.eligibleCount - b.eligibleCount;
    if (b.rule.periodsPerWeek !== a.rule.periodsPerWeek) return b.rule.periodsPerWeek - a.rule.periodsPerWeek;
    if ((b.rule.morningPriority ? 1 : 0) !== (a.rule.morningPriority ? 1 : 0)) {
      return (b.rule.morningPriority ? 1 : 0) - (a.rule.morningPriority ? 1 : 0);
    }
    return 0;
  });

  // Shuffle within same constraint groups
  const sortedJobs = [];
  let gStart = 0;
  for (let i = 1; i <= jobs.length; i++) {
    const same = i < jobs.length &&
      jobs[i].eligibleCount === jobs[gStart].eligibleCount &&
      jobs[i].rule.subjectId === jobs[gStart].rule.subjectId;
    if (!same) {
      sortedJobs.push(...shuffleArray(jobs.slice(gStart, i)));
      gStart = i;
    }
  }

  // ========== GREEDY PLACEMENT ==========
  // For each job, find the best (day, period, teacher) slot
  
  let unplacedJobs = [...sortedJobs];

  // Multiple passes — first pass is strict, later passes relax morning priority
  for (let pass = 0; pass < 3 && unplacedJobs.length > 0; pass++) {
    const stillUnplaced = [];

    for (const job of unplacedJobs) {
      const { section, rule } = job;
      const maxPerDay = rule.maxPeriodsPerDay || 99;
      const eligible = eligibleTeachersMap[rule.subjectId] || [];

      // Check if we still need this period
      if (getRemainingDemand(section.sectionKey, rule.subjectId) <= 0) continue;

      let bestSlot = null;
      let bestScore = -Infinity;

      // Try all (day, period) combinations
      const shuffledDays = shuffleArray(workingDays);
      
      for (const day of shuffledDays) {
        // Check maxPerDay
        if (getDailyCount(section.sectionKey, day, rule.subjectId) >= maxPerDay) continue;

        // Sort periods in natural ascending order (1, 2, 3...) to fill sequentially
        const sortedPeriods = [...dayPeriods[day]].sort((a, b) => a.periodNumber - b.periodNumber);

        for (const period of sortedPeriods) {
          const pNum = period.periodNumber;

          // Check section slot: is there already a class in this slot? (O(1))
          if (isSectionBusy(section.sectionKey, day, pNum)) continue;

          // Find available teachers
          const availableTeachers = eligible
            .filter(t => !isTeacherBusy(t.teacherId, day, pNum))
            .sort((a, b) => (teacherWorkload[a.teacherId] || 0) - (teacherWorkload[b.teacherId] || 0));

          if (availableTeachers.length === 0) continue;

          const teacher = availableTeachers[0];

          // Calculate placement score
          let score = 0;

          // Morning priority bonus (pass 0 = strict, pass 1+ = relaxed)
          if (rule.morningPriority && morningPeriods[day].has(pNum)) {
            score += 10;
          }

          // Compactness heuristic: prefer filling contiguous periods (adjacent to already filled slot)
          const hasPrev = isSectionBusy(section.sectionKey, day, pNum - 1);
          const hasNext = isSectionBusy(section.sectionKey, day, pNum + 1);
          if (hasPrev || hasNext) {
            score += 12; // Contiguity bonus for building solid blocks of classes
          }

          // Anti-gap heuristic: penalize creating an isolated gap slot (pNum-1 empty, but pNum-2 busy)
          if (pass === 0 && !hasPrev && isSectionBusy(section.sectionKey, day, pNum - 2)) {
            score -= 10;
          }

          // Sequential packing: prefer earlier periods in the day to minimize empty gaps
          score += (10 - pNum) * 1.2;

          // Prefer days where this subject has fewer periods (spread evenly across days)
          const currentDayCount = getDailyCount(section.sectionKey, day, rule.subjectId);
          score -= currentDayCount * 5;

          // Prefer teachers with less workload (balance)
          score -= (teacherWorkload[teacher.teacherId] || 0) * 0.1;

          // Prefer slots with more available teacher options (less constraining for others)
          score += availableTeachers.length * 2;

          // Small random factor to break ties
          score += Math.random() * 0.5;

          if (score > bestScore) {
            bestScore = score;
            bestSlot = { day, pNum, teacherId: teacher.teacherId };
          }
        }
      }

      if (bestSlot) {
        placeEntry(
          section.classId, section.sectionId, section.sectionKey,
          rule.subjectId, bestSlot.teacherId, bestSlot.day, bestSlot.pNum
        );
      } else {
        stillUnplaced.push(job);
      }
    }

    unplacedJobs = stillUnplaced;
  }

  if (unplacedJobs.length > 0) {
    const failedJob = unplacedJobs[0];
    const subjectName = subjectMap[failedJob.rule.subjectId] || failedJob.rule.subjectId;
    throw new Error(
      `Could not place ${unplacedJobs.length} periods. ` +
      `First failure: ${subjectName} for ${failedJob.section.className}-${failedJob.section.sectionName}. ` +
      `Eligible teachers: ${failedJob.eligibleCount}, P/Week: ${failedJob.rule.periodsPerWeek}`
    );
  }

  return schedule;
}

/**
 * Main entry point. Wraps the greedy solver with randomized restarts.
 */
function generateTimetable(config, classes, teachers, subjects, rules, options = {}) {
  const maxRetries = 200;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const schedule = attemptGeneration(config, classes, teachers, subjects, rules, options);

      // Post-generation validation: verify no conflicts
      const teacherCheck = new Set();
      const classCheck = new Set();
      for (const entry of schedule) {
        const tKey = `${entry.teacherId}|${entry.dayOfWeek}|${entry.periodNumber}`;
        const cKey = `${entry.classId}|${entry.sectionId}|${entry.dayOfWeek}|${entry.periodNumber}`;
        if (teacherCheck.has(tKey)) {
          throw new Error(`Internal error: teacher double-booking detected for ${entry.teacherId}`);
        }
        if (classCheck.has(cKey)) {
          throw new Error(`Internal error: class double-booking detected for ${entry.classId}-${entry.sectionId}`);
        }
        teacherCheck.add(tKey);
        classCheck.add(cKey);
      }

      return schedule;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && attempt <= 5) {
        console.warn(
          `Timetable Generation Attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying...`
        );
      } else if (attempt === 6) {
        console.warn(`Continuing retries silently...`);
      }
    }
  }

  throw lastError;
}

const TimetableAIService = {
  validateConstraints,
  generateTimetable
};

module.exports = TimetableAIService;