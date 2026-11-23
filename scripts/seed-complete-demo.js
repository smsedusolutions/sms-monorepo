require("dotenv").config({ path: "./apps/sm-user-service/.env" });
const mongoose = require("mongoose");
const crypto = require("crypto");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Please set MONGO_URI in apps/sm-user-service/.env");
  process.exit(1);
}

const SCHOOL_DB_NAME = "school-db-demo";
const SCHOOL_ID = "DEMO101";

const generateId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

async function main() {
  console.log("=================================================");
  console.log("🚀 Starting Comprehensive Demo Data Seeder");
  console.log(`School: ${SCHOOL_ID} | DB: ${SCHOOL_DB_NAME}`);
  console.log("=================================================");

  const mainConn = await mongoose.connect(MONGO_URI);
  const schoolDb = mainConn.connection.useDb(SCHOOL_DB_NAME, { useCache: true });
  const superAdminDb = mainConn.connection.useDb("SuperAdmin", { useCache: true });

  // -------------------------------------------------------------
  // 1. SEED CALENDAR EVENTS (Sundays, Karnataka & National Holidays, School Events)
  // -------------------------------------------------------------
  console.log("\n📅 [1/6] Seeding Calendar Events (Karnataka Holidays, Sundays, Festivals)...");
  const CalendarEvent = schoolDb.collection("calendarevents");
  await CalendarEvent.deleteMany({ schoolId: SCHOOL_ID });

  const calendarEvents = [];

  // Helper to add event
  const addEvent = (title, description, eventType, startDateStr, endDateStr = null, targetAudience = ["all"], venue = null) => {
    calendarEvents.push({
      schoolId: SCHOOL_ID,
      title,
      description,
      eventType,
      startDate: new Date(startDateStr),
      endDate: endDateStr ? new Date(endDateStr) : new Date(startDateStr),
      targetAudience,
      venue,
      createdBy: "USR-55C28DEB",
      createdAt: new Date("2026-06-01T08:00:00Z"),
      updatedAt: new Date("2026-06-01T08:00:00Z"),
      __v: 0
    });
  };

  // A. All Sundays of Academic Year 2026-2027 (June 2026 - May 2027)
  const academicStart = new Date("2026-06-01");
  const academicEnd = new Date("2027-05-31");
  let curr = new Date(academicStart);
  let sundayCount = 0;
  while (curr <= academicEnd) {
    if (curr.getDay() === 0) { // Sunday
      const isoDate = curr.toISOString().split("T")[0];
      calendarEvents.push({
        schoolId: SCHOOL_ID,
        title: "Sunday - Weekly Holiday",
        description: "School closed for weekly holiday",
        eventType: "holiday",
        startDate: new Date(`${isoDate}T00:00:00.000Z`),
        endDate: new Date(`${isoDate}T23:59:59.000Z`),
        targetAudience: ["all"],
        venue: null,
        createdBy: "USR-55C28DEB",
        createdAt: new Date("2026-06-01"),
        updatedAt: new Date("2026-06-01"),
        __v: 0
      });
      sundayCount++;
    }
    curr.setDate(curr.getDate() + 1);
  }
  console.log(` -> Added ${sundayCount} Sundays as weekly holidays`);

  // B. Karnataka State & National Holidays 2026-2027
  const holidays = [
    { title: "Bakrid / Eid al-Adha", desc: "Government Holiday - School Closed", type: "holiday", start: "2026-06-28" },
    { title: "Muharram", desc: "Government Holiday - School Closed", type: "holiday", start: "2026-07-28" },
    { title: "Independence Day Celebration", desc: "Flag hoisting at 8:30 AM. Attendance mandatory for all students & teachers.", type: "event", start: "2026-08-15", venue: "School Grounds" },
    { title: "Sri Krishna Janmashtami", desc: "Festival Holiday", type: "holiday", start: "2026-09-04" },
    { title: "Ganesh Chaturthi", desc: "Karnataka State Festival Holiday - Vinayaka Chavithi", type: "holiday", start: "2026-09-14" },
    { title: "Eid Milad-un-Nabi", desc: "Government Holiday", type: "holiday", start: "2026-09-28" },
    { title: "Mahatma Gandhi Jayanti", desc: "National Holiday - Shramadaana & Floral Tributes", type: "holiday", start: "2026-10-02" },
    { title: "Mahalaya Amavasya", desc: "Karnataka State Holiday", type: "holiday", start: "2026-10-10" },
    { title: "Maha Navami / Ayudha Pooja", desc: "Karnataka State Festival - School Closed", type: "holiday", start: "2026-10-19" },
    { title: "Vijayadashami (Dasara)", desc: "Mysore Dasara Festival Holiday", type: "holiday", start: "2026-10-20" },
    { title: "Dasara Vacation (Mid-Term Break)", desc: "Mid-term autumn vacation for all classes", type: "holiday", start: "2026-10-15", end: "2026-10-25" },
    { title: "Maharshi Valmiki Jayanti", desc: "Karnataka State Holiday", type: "holiday", start: "2026-10-26" },
    { title: "Kannada Rajyotsava 💛❤️", desc: "Karnataka State Formation Day. Special cultural programs & state anthem.", type: "holiday", start: "2026-11-01", venue: "School Auditorium" },
    { title: "Naraka Chaturdashi (Diwali)", desc: "Deepavali Holiday", type: "holiday", start: "2026-11-08" },
    { title: "Deepavali / Balipadyami", desc: "Karnataka State Festival Holiday", type: "holiday", start: "2026-11-10" },
    { title: "Bhakta Kanakadasa Jayanti", desc: "Karnataka State Holiday honouring saint Kanakadasa", type: "holiday", start: "2026-11-27" },
    { title: "Christmas Day", desc: "Christian Festival Holiday", type: "holiday", start: "2026-12-25" },
    { title: "Winter Vacation", desc: "Winter Break for students and teaching staff", type: "holiday", start: "2026-12-26", end: "2027-01-01" },
    { title: "Makara Sankranti / Pongal", desc: "Harvest Festival - Ellu Bella celebration in Karnataka", type: "holiday", start: "2027-01-14" },
    { title: "Republic Day Celebration", desc: "78th Republic Day Parade & Cultural Presentation at School", type: "event", start: "2027-01-26", venue: "School Grounds" },
    { title: "Maha Shivaratri", desc: "Hindu Festival Holiday", type: "holiday", start: "2027-03-06" },
    { title: "Good Friday", desc: "Public Holiday", type: "holiday", start: "2027-03-26" },
    { title: "Chandramana Ugadi (Kannada New Year) 🌾", desc: "Karnataka New Year Festival - Bevu Bella distribution", type: "holiday", start: "2027-04-07" },
    { title: "Dr. B.R. Ambedkar Jayanti", desc: "National Holiday honoring father of Indian Constitution", type: "holiday", start: "2027-04-14" },
    { title: "Mahaveer Jayanti", desc: "Jain Festival Holiday", type: "holiday", start: "2027-04-20" },
    { title: "Basava Jayanti 🐮", desc: "Karnataka State Holiday honoring philosopher Basaveshwara", type: "holiday", start: "2027-05-08" },
  ];

  for (const h of holidays) {
    addEvent(h.title, h.desc, h.type, h.start, h.end, ["all"], h.venue || null);
  }

  // C. School Academic Events
  const schoolEvents = [
    { title: "Investiture Ceremony 2026-27", desc: "Student Council induction & badge awarding", type: "event", start: "2026-07-18", venue: "Auditorium", aud: ["all"] },
    { title: "PTM - Term 1 Progress Review", desc: "Parent-Teacher Meeting for Class 1 to 10", type: "ptm", start: "2026-09-12", venue: "Respective Classrooms", aud: ["parent", "teacher"] },
    { title: "Mid-Term Examinations 2026", desc: "Term 1 summative assessments for all grades", type: "exam", start: "2026-09-15", end: "2026-09-25", aud: ["student", "teacher", "parent"] },
    { title: "Science & Robotics Exhibition 🔬", desc: "Annual Science Fair featuring student innovative models and experiments", type: "event", start: "2026-11-14", venue: "Science Block", aud: ["all"] },
    { title: "Annual Sports Meet 2026 🏆", desc: "Inter-House Track & Field Events, March Past, and Finals", type: "sports", start: "2026-11-28", end: "2026-11-29", venue: "Main Sports Stadium", aud: ["all"] },
    { title: "Annual Cultural Day & Fest 2026 🎭", desc: "Annual Day Celebrations - Drama, Classical & Folk Dance, Music and Awards", type: "annual_day", start: "2026-12-23", venue: "School Open Air Theatre", aud: ["all"] },
    { title: "PTM - Term 2 & Pre-Board Review", desc: "Performance discussion for upcoming final exams", type: "ptm", start: "2027-01-16", venue: "Classrooms", aud: ["parent", "teacher"] },
    { title: "National Science Day Celebration", desc: "Commemorating CV Raman effect discovery", type: "event", start: "2027-02-28", venue: "Lab Hall", aud: ["student", "teacher"] },
    { title: "Annual Examinations 2027", desc: "Final Academic Year Examinations for Classes 1 to 10", type: "exam", start: "2027-03-10", end: "2027-03-22", aud: ["student", "teacher", "parent"] },
    { title: "Annual Result Declaration & Open House", desc: "Report card distribution and felicitation of toppers", type: "event", start: "2027-04-10", venue: "School Auditorium", aud: ["all"] },
  ];

  for (const se of schoolEvents) {
    addEvent(se.title, se.desc, se.type, se.start, se.end, se.aud, se.venue);
  }

  await CalendarEvent.insertMany(calendarEvents);
  console.log(`✅ Seeded ${calendarEvents.length} total calendar events (Holidays, Sundays, Karnataka Festivals, Events).`);

  // -------------------------------------------------------------
  // 2. SEED EXAM MARKS & PUBLISHED RESULTS (Mid-Term + Unit Test 1)
  // -------------------------------------------------------------
  console.log("\n📝 [2/6] Seeding Exam Marks Entry & Published Results for Mid-Term 2026...");
  const Exam = schoolDb.collection("exams");
  const ExamSchedule = schoolDb.collection("examschedules");
  const ExamResult = schoolDb.collection("examresults");
  const StudentExamReg = schoolDb.collection("studentexamregistrations");
  const Student = schoolDb.collection("students");
  const GradingSystem = schoolDb.collection("gradingsystems");

  // Fetch Grading System
  const gradingSystem = await GradingSystem.findOne({ schoolId: SCHOOL_ID }) || {
    grades: [
      { name: "A1", minPercentage: 91, points: 10 },
      { name: "A2", minPercentage: 81, points: 9 },
      { name: "B1", minPercentage: 71, points: 8 },
      { name: "B2", minPercentage: 61, points: 7 },
      { name: "C1", minPercentage: 51, points: 6 },
      { name: "C2", minPercentage: 41, points: 5 },
      { name: "D", minPercentage: 33, points: 4 },
      { name: "E", minPercentage: 0, points: 0 },
    ]
  };

  const calcGrade = (pct) => {
    for (const g of gradingSystem.grades) {
      if (pct >= g.minPercentage) return { grade: g.name, points: g.points };
    }
    return { grade: "D", points: 4 };
  };

  const remarksList = [
    "Outstanding performance! Keep it up.",
    "Excellent analytical skills and neat presentation.",
    "Very good grasp of fundamental concepts.",
    "Good performance, can aim higher with consistent practice.",
    "Satisfactory work. Focus on handwriting and problem solving.",
    "Shows steady improvement throughout the term.",
    "Active participation in class. Well done.",
    "Needs more practice in numericals and grammar.",
  ];

  // A. Mid-Term 2026 (EXM-642739A9)
  const midTermExamId = "EXM-642739A9";
  const midTermSchedules = await ExamSchedule.find({ examId: midTermExamId, schoolId: SCHOOL_ID }).toArray();
  const midTermRegs = await StudentExamReg.find({ examId: midTermExamId, schoolId: SCHOOL_ID }).toArray();

  console.log(` -> Found ${midTermSchedules.length} schedules and ${midTermRegs.length} registrations for Mid-Term Exams.`);

  // Clear existing results for this exam
  await ExamResult.deleteMany({ examId: midTermExamId, schoolId: SCHOOL_ID });

  const regByClass = new Map();
  midTermRegs.forEach(r => {
    if (!regByClass.has(r.classId)) regByClass.set(r.classId, []);
    regByClass.get(r.classId).push(r);
  });

  const examResultsToInsert = [];
  const publishedDate = new Date("2026-10-05T10:00:00Z");

  for (const schedule of midTermSchedules) {
    const classRegs = regByClass.get(schedule.classId) || [];
    const maxTheory = schedule.maxMarksTheory || 80;
    const maxPractical = schedule.maxMarksPractical || 0;
    const totalMax = maxTheory + maxPractical;

    for (const reg of classRegs) {
      // 98% present, 2% absent
      const isAbsent = Math.random() < 0.02;
      let theory = 0;
      let practical = 0;
      let total = 0;
      let grade = "E";
      let points = 0;
      let status = "present";

      if (isAbsent) {
        status = "absent";
        grade = "E";
        points = 0;
      } else {
        // Bell curve marks between 42% and 98%
        const scorePct = 0.45 + (Math.random() * 0.35) + (Math.random() * 0.18); // Mean ~72%
        theory = Math.round(scorePct * maxTheory);
        if (maxPractical > 0) {
          practical = Math.round((0.7 + Math.random() * 0.28) * maxPractical);
        }
        total = theory + practical;
        const finalPct = totalMax > 0 ? (total / totalMax) * 100 : 70;
        const g = calcGrade(finalPct);
        grade = g.grade;
        points = g.points;
      }

      examResultsToInsert.push({
        schoolId: SCHOOL_ID,
        examId: midTermExamId,
        studentId: reg.studentId,
        classId: schedule.classId,
        sectionId: reg.sectionId || "",
        subjectId: schedule.subjectId,
        scheduleId: schedule._id,
        marksObtainedTheory: theory,
        marksObtainedPractical: practical,
        totalMarks: total,
        grade,
        gradePoints: points,
        attendanceStatus: status,
        remarks: isAbsent ? "Absent on medical grounds" : remarksList[Math.floor(Math.random() * remarksList.length)],
        evaluatedBy: "USR-55C28DEB",
        evaluatedAt: new Date("2026-10-02T14:00:00Z"),
        publishStatus: "final_published",
        isPublished: true,
        finalPublishedAt: publishedDate,
        finalPublishedBy: "USR-55C28DEB",
        createdAt: new Date("2026-10-02T14:00:00Z"),
        updatedAt: publishedDate,
        __v: 0
      });
    }
  }

  // Insert in chunks of 500
  const CHUNK_SIZE = 500;
  for (let i = 0; i < examResultsToInsert.length; i += CHUNK_SIZE) {
    const chunk = examResultsToInsert.slice(i, i + CHUNK_SIZE);
    await ExamResult.insertMany(chunk);
  }
  console.log(`✅ Seeded ${examResultsToInsert.length} published exam marks for Mid-Term 2026!`);

  // Update all Mid-Term schedules to final_published
  await ExamSchedule.updateMany(
    { examId: midTermExamId, schoolId: SCHOOL_ID },
    {
      $set: {
        publishStatus: "final_published",
        finalPublishedAt: publishedDate,
        finalPublishedBy: "USR-55C28DEB",
        teacherPublishedAt: new Date("2026-10-01T16:00:00Z"),
        teacherPublishedBy: "USR-55C28DEB"
      }
    }
  );

  // Update Exam to published
  await Exam.updateOne(
    { examId: midTermExamId, schoolId: SCHOOL_ID },
    {
      $set: {
        status: "published",
        resultPublishDate: publishedDate
      }
    }
  );
  console.log("✅ Updated Mid-Term Exam and all 50 schedules to 'final_published'.");

  // -------------------------------------------------------------
  // 3. SEED LEAVE REQUESTS (Pending, Approved, Rejected - Karnataka suitable)
  // -------------------------------------------------------------
  console.log("\n🏖️ [3/6] Seeding Leave Requests (Pending, Approved, Rejected)...");
  const LeaveRequest = schoolDb.collection("leaverequests");
  await LeaveRequest.deleteMany({ schoolId: SCHOOL_ID });

  const students = await Student.find({ schoolId: SCHOOL_ID }).limit(25).toArray();
  const Teacher = schoolDb.collection("teachers");
  const teachers = await Teacher.find({ schoolId: SCHOOL_ID }).limit(10).toArray();

  const leaveTemplates = [
    // Approved
    { days: 2, type: "sick", reason: "Viral fever and doctor recommended complete bed rest", status: "approved", start: "2026-08-10" },
    { days: 3, type: "casual", reason: "Attending sister's wedding ceremony in Hubli", status: "approved", start: "2026-08-25" },
    { days: 1, type: "emergency", reason: "Family emergency, traveling to native place near Hassan", status: "approved", start: "2026-09-08" },
    { days: 4, type: "personal", reason: "House warming ceremony (Gruhapravesha) in Mysore", status: "approved", start: "2026-09-22" },
    { days: 2, type: "sick", reason: "Severe migraine and acute eye allergy", status: "approved", start: "2026-10-05" },
    { days: 3, type: "casual", reason: "Participating in Karnataka State Inter-School Chess Tournament", status: "approved", start: "2026-10-14" },
    { days: 2, type: "sick", reason: "Food poisoning and dehydration, under medical care", status: "approved", start: "2026-11-04" },
    { days: 1, type: "personal", reason: "Attending religious puja and family get-together in Udupi", status: "approved", start: "2026-11-12" },
    { days: 3, type: "casual", reason: "Family pilgrimage trip to Tirupati Balaji Temple", status: "approved", start: "2026-11-18" },

    // Pending (Ready for live demo demonstration!)
    { days: 2, type: "sick", reason: "High fever and severe throat infection, visiting hospital", status: "pending", start: "2026-11-24" },
    { days: 3, type: "personal", reason: "Attending cousin brother's marriage in Belagavi", status: "pending", start: "2026-11-25" },
    { days: 1, type: "casual", reason: "Passport renewal appointment at Passport Seva Kendra Bangalore", status: "pending", start: "2026-11-26" },
    { days: 2, type: "emergency", reason: "Urgent visit to ancestral hometown due to grandfather health issue", status: "pending", start: "2026-11-27" },
    { days: 4, type: "casual", reason: "Participating in South Zone CBSE Athletics Meet at Kanteerava Stadium", status: "pending", start: "2026-11-30" },
    { days: 2, type: "sick", reason: "Sprained ankle during football practice, doctor advised rest", status: "pending", start: "2026-12-01" },
    { days: 1, type: "personal", reason: "Family functions and Upanayana ceremony in Shimoga", status: "pending", start: "2026-12-03" },

    // Rejected
    { days: 5, type: "casual", reason: "Going on an unannounced leisure trip to Goa during term test week", status: "rejected", rejectReason: "Leave during assessment week cannot be granted without principal's prior sanction.", start: "2026-09-16" },
    { days: 6, type: "personal", reason: "Extended holiday after festival", status: "rejected", rejectReason: "Excessive leaves requested. Academic attendance falling below 75% threshold.", start: "2026-10-27" },
    { days: 4, type: "casual", reason: "Personal family tour during class project submission week", status: "rejected", rejectReason: "Crucial project evaluations scheduled for this week. Please reschedule personal travel.", start: "2026-11-09" },
    { days: 3, type: "sick", reason: "Feeling tired", status: "rejected", rejectReason: "No medical certificate provided for more than 2 days sick leave.", start: "2026-11-15" }
  ];

  const leaveDocs = [];
  let studentIdx = 0;
  let teacherIdx = 0;

  for (let i = 0; i < leaveTemplates.length; i++) {
    const t = leaveTemplates[i];
    const isTeacher = i % 4 === 0 && teacherIdx < teachers.length;
    const leaveId = `LV-${Date.now().toString(36).toUpperCase()}-${i.toString().padStart(3, "0")}`;
    const startDt = new Date(t.start);
    const endDt = new Date(startDt);
    endDt.setDate(startDt.getDate() + (t.days - 1));

    let applicantId, applicantName, applicantType, classId, sectionId;

    if (isTeacher) {
      const teach = teachers[teacherIdx++];
      applicantId = teach.teacherId;
      applicantName = `${teach.firstName} ${teach.lastName}`;
      applicantType = "teacher";
    } else {
      const stud = students[studentIdx % students.length];
      studentIdx++;
      applicantId = stud.studentId;
      applicantName = `${stud.firstName} ${stud.lastName}`;
      applicantType = "student";
      classId = stud.class;
      sectionId = stud.section;
    }

    const doc = {
      leaveId,
      schoolId: SCHOOL_ID,
      applicantId,
      applicantType,
      applicantName,
      classId: classId || null,
      sectionId: sectionId || null,
      leaveType: t.type,
      startDate: startDt,
      endDate: endDt,
      numberOfDays: t.days,
      reason: t.reason,
      status: t.status,
      appliedAt: new Date(startDt.getTime() - 86400000 * 2),
      createdAt: new Date(startDt.getTime() - 86400000 * 2),
      updatedAt: new Date(),
      __v: 0
    };

    if (t.status === "approved") {
      doc.processedBy = "USR-55C28DEB";
      doc.processedByName = "School Admin";
      doc.processedAt = new Date(startDt.getTime() - 86400000);
      doc.adminRemarks = "Approved as requested. Please catch up on syllabus covered.";
    } else if (t.status === "rejected") {
      doc.processedBy = "USR-55C28DEB";
      doc.processedByName = "School Admin";
      doc.processedAt = new Date(startDt.getTime() - 86400000);
      doc.rejectionReason = t.rejectReason;
      doc.adminRemarks = t.rejectReason;
    }

    leaveDocs.push(doc);
  }

  await LeaveRequest.insertMany(leaveDocs);
  console.log(`✅ Seeded ${leaveDocs.length} realistic Leave Requests (${leaveDocs.filter(l => l.status === "pending").length} Pending, ${leaveDocs.filter(l => l.status === "approved").length} Approved, ${leaveDocs.filter(l => l.status === "rejected").length} Rejected).`);

  // -------------------------------------------------------------
  // 4. SEED EMAIL TEMPLATES (SuperAdmin DB -> emailtemplates collection)
  // -------------------------------------------------------------
  console.log("\n✉️ [4/6] Seeding Professional Email Templates in SuperAdmin DB...");
  const EmailTemplate = superAdminDb.collection("emailtemplates");
  await EmailTemplate.deleteMany({ schoolId: SCHOOL_ID });

  const emailTemplates = [
    {
      schoolId: SCHOOL_ID,
      templateName: "Welcome & Enrollment Confirmation",
      templateType: "welcome",
      subject: "Welcome to {{school.name}} — Student Registration Confirmed",
      styleTemplate: "modern",
      isActive: true,
      isDefault: true,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background: #ffffff;">
          <h2 style="color: #2563eb; margin-bottom: 12px;">Welcome to {{school.name}}!</h2>
          <p>Dear <strong>{{parent.father.name || parent.mother.name || 'Parent'}}</strong>,</p>
          <p>We are delighted to confirm that <strong>{{student.fullName}}</strong> has been successfully enrolled into <strong>{{student.className}}</strong> for Academic Year <strong>2026-2027</strong>.</p>
          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 4px 0;"><strong>Student ID:</strong> {{student.studentId}}</p>
            <p style="margin: 4px 0;"><strong>Roll Number:</strong> {{student.rollNumber}}</p>
            <p style="margin: 4px 0;"><strong>Class & Section:</strong> {{student.className}} - {{student.sectionName}}</p>
          </div>
          <p>You can access the Parent Portal on our mobile web app to track daily attendance, examination reports, timetable, and fee receipts.</p>
          <p style="margin-top: 24px;">Warm regards,<br/><strong>Principal & Admissions Office</strong><br/>{{school.name}}</p>
        </div>
      `,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    },
    {
      schoolId: SCHOOL_ID,
      templateName: "Daily Absence Alert to Parents",
      templateType: "student_absent",
      subject: "Absence Notification: {{student.firstName}} was absent on {{date}}",
      styleTemplate: "minimal",
      isActive: true,
      isDefault: true,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #334155;">
          <h3 style="color: #dc2626;">Attendance Alert — Student Absent</h3>
          <p>Dear Parent/Guardian,</p>
          <p>This is to notify you that your ward <strong>{{student.fullName}}</strong> (Class {{student.className}}) was marked <strong>ABSENT</strong> during the morning roll call on <strong>{{date}}</strong>.</p>
          <p>If this absence was pre-planned or medical, kindly submit a leave application through the mobile Parent Portal.</p>
          <p style="color: #64748b; font-size: 13px; margin-top: 20px;">For any discrepancy, please contact the class teacher or school administration office.</p>
        </div>
      `,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    },
    {
      schoolId: SCHOOL_ID,
      templateName: "Official School Announcement",
      templateType: "announcement",
      subject: "School Notice: {{announcement.title}}",
      styleTemplate: "modern",
      isActive: true,
      isDefault: true,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
          <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
            <span style="background: #dbeafe; color: #1e40af; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 999px; text-transform: uppercase;">Official Notice</span>
            <h2 style="color: #0f172a; margin: 10px 0 4px 0;">{{announcement.title}}</h2>
            <small style="color: #64748b;">Published on: {{announcement.date}}</small>
          </div>
          <p>Dear {{user.name || 'Member of School Community'}},</p>
          <div style="font-size: 15px; line-height: 1.6; color: #334155; margin: 16px 0;">
            {{announcement.content}}
          </div>
          <p style="margin-top: 24px;">Sincerely,<br/><strong>Administration Team</strong><br/>{{school.name}}</p>
        </div>
      `,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    },
    {
      schoolId: SCHOOL_ID,
      templateName: "Parent-Teacher Meeting (PTM) Invitation",
      templateType: "parent_teacher_meeting",
      subject: "Invitation: Parent-Teacher Meeting on {{ptm.date}}",
      styleTemplate: "professional",
      isActive: true,
      isDefault: true,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
          <h2 style="color: #4f46e5;">Parent-Teacher Meeting Invitation</h2>
          <p>Dear <strong>{{parent.father.name || parent.mother.name || 'Parent'}}</strong>,</p>
          <p>You are cordially invited to attend the Parent-Teacher Meeting for <strong>{{student.fullName}}</strong> ({{student.className}}).</p>
          <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>📅 Date:</strong> {{ptm.date}}</p>
            <p style="margin: 4px 0;"><strong>⏰ Time Slot:</strong> {{ptm.slotTime || '09:30 AM - 12:30 PM'}}</p>
            <p style="margin: 4px 0;"><strong>📍 Venue:</strong> Respective Classrooms</p>
          </div>
          <p>We look forward to meeting you and partnering in your child's academic and holistic growth.</p>
        </div>
      `,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    },
    {
      schoolId: SCHOOL_ID,
      templateName: "Exam Results & Performance Report",
      templateType: "exam_results",
      subject: "Published: Exam Report Card for {{student.firstName}} ({{exam.name}})",
      styleTemplate: "vibrant",
      isActive: true,
      isDefault: true,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
          <h2 style="color: #059669;">Exam Results Published! 🎓</h2>
          <p>Dear Parent,</p>
          <p>The academic evaluation results for <strong>{{student.fullName}}</strong> for <strong>{{exam.name}}</strong> have now been published.</p>
          <p>You can view the detailed subject-wise breakdown, marks obtained, grades, and teacher remarks directly on the school portal.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://demoschool.smsedusolutions.in/parent/exam/results" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">View Report Card</a>
          </div>
        </div>
      `,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    },
    {
      schoolId: SCHOOL_ID,
      templateName: "School Fee Payment Reminder",
      templateType: "fee_reminder",
      subject: "Fee Payment Reminder: Term Due for {{student.fullName}}",
      styleTemplate: "classic",
      isActive: true,
      isDefault: true,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
          <h3 style="color: #b45309;">Fee Payment Due Notice</h3>
          <p>Dear Parent,</p>
          <p>This is a gentle reminder regarding the upcoming fee installment for your ward <strong>{{student.fullName}}</strong> ({{student.className}}).</p>
          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Installment:</strong> {{fee.installmentLabel || 'Term 2'}}</p>
            <p style="margin: 4px 0;"><strong>Due Date:</strong> {{fee.dueDate || '10 December 2026'}}</p>
            <p style="margin: 4px 0;"><strong>Amount Due:</strong> ₹{{fee.balanceAmount || '7,550'}}</p>
          </div>
          <p>Payments can be made via UPI, Net Banking, or at the school accounts desk during working hours.</p>
        </div>
      `,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    },
    {
      schoolId: SCHOOL_ID,
      templateName: "Student Leave Request Approved",
      templateType: "leave_approval",
      subject: "Approved: Leave Request for {{student.firstName}}",
      styleTemplate: "modern",
      isActive: true,
      isDefault: true,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h3 style="color: #16a34a;">Leave Application Approved</h3>
          <p>Dear Parent,</p>
          <p>The leave application submitted for <strong>{{student.fullName}}</strong> from <strong>{{leave.startDate}}</strong> to <strong>{{leave.endDate}}</strong> has been <span style="color: #16a34a; font-weight: bold;">APPROVED</span> by the administration.</p>
          <p>Kindly ensure your child connects with classmates and subject teachers to complete missed classwork.</p>
        </div>
      `,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    },
    {
      schoolId: SCHOOL_ID,
      templateName: "Student Leave Request Rejected",
      templateType: "leave_rejection",
      subject: "Notice: Leave Request Update for {{student.firstName}}",
      styleTemplate: "modern",
      isActive: true,
      isDefault: true,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h3 style="color: #dc2626;">Leave Application Update</h3>
          <p>Dear Parent,</p>
          <p>The leave application submitted for <strong>{{student.fullName}}</strong> could not be approved due to the following reason:</p>
          <blockquote style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0; color: #991b1b;">
            {{leave.rejectionReason}}
          </blockquote>
          <p>If you have any queries, please contact the school administration office.</p>
        </div>
      `,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    }
  ];

  await EmailTemplate.insertMany(emailTemplates);
  console.log(`✅ Seeded ${emailTemplates.length} rich Email Templates (Welcome, Absence, Announcement, PTM, Results, Fees, Leave) in SuperAdmin DB!`);

  // -------------------------------------------------------------
  // 5. SEED FEES MANAGEMENT DATA (Payments, Receipts, Partial/Paid Ledgers)
  // -------------------------------------------------------------
  console.log("\n💰 [5/6] Seeding Fee Payments, Transactions, and Digital Receipts...");
  const StudentFeeAssignment = schoolDb.collection("studentfeeassignments");
  const FeeReceipt = schoolDb.collection("feereceipts");
  const FeeTransaction = schoolDb.collection("feetransactions");

  // Fetch all assignments for 2026-2027
  const allAssignments = await StudentFeeAssignment.find({ schoolId: SCHOOL_ID }).toArray();
  console.log(` -> Found ${allAssignments.length} student fee ledgers to update with realistic collections.`);

  // Reset receipts & transactions to create a coherent set
  await FeeReceipt.deleteMany({ schoolId: SCHOOL_ID });
  await FeeTransaction.deleteMany({ schoolId: SCHOOL_ID });

  const paymentModes = ["upi", "upi", "bank_transfer", "cash", "cheque"];
  const bankNames = ["State Bank of India", "HDFC Bank", "Canara Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank"];
  
  let receiptCounter = 1;
  const receiptsToInsert = [];
  const transactionsToInsert = [];

  let paidFullCount = 0;
  let paidTerm1Count = 0;
  let unpaidCount = 0;

  for (let i = 0; i < allAssignments.length; i++) {
    const assignment = allAssignments[i];
    const totalFees = assignment.totalOriginalFees || 15100;
    const term1Amount = assignment.installmentSchedule?.[0]?.totalAmount || Math.round(totalFees / 2);
    const term2Amount = assignment.installmentSchedule?.[1]?.totalAmount || (totalFees - term1Amount);

    const rand = Math.random();
    let paymentAmount = 0;
    let newInstallments = JSON.parse(JSON.stringify(assignment.installmentSchedule || []));
    let newBreakdown = JSON.parse(JSON.stringify(assignment.feeBreakdown || []));

    // Distribution: 45% Paid Full, 35% Paid Term 1 only, 20% Unpaid
    if (rand < 0.45) {
      // PAID IN FULL
      paymentAmount = totalFees;
      paidFullCount++;
      
      newInstallments.forEach(inst => {
        inst.paidAmount = inst.totalAmount;
        inst.balanceAmount = 0;
        inst.status = "paid";
      });

      newBreakdown.forEach(item => {
        item.paidAmount = item.netAmount;
        item.balanceAmount = 0;
        item.status = "paid";
      });
    } else if (rand < 0.80) {
      // PAID TERM 1 ONLY
      paymentAmount = term1Amount;
      paidTerm1Count++;

      if (newInstallments.length > 0) {
        newInstallments[0].paidAmount = term1Amount;
        newInstallments[0].balanceAmount = 0;
        newInstallments[0].status = "paid";
      }

      newBreakdown.forEach(item => {
        const half = Math.round(item.netAmount / 2);
        item.paidAmount = half;
        item.balanceAmount = item.netAmount - half;
        item.status = "partial";
      });
    } else {
      // UNPAID
      unpaidCount++;
      continue; // No payment/receipt to record
    }

    const mode = paymentModes[Math.floor(Math.random() * paymentModes.length)];
    const bank = mode !== "cash" ? bankNames[Math.floor(Math.random() * bankNames.length)] : "";
    const refNo = mode === "upi" ? `UPI${Date.now().toString().slice(-6)}${i}` : mode === "cheque" ? `CHQ${100000 + i}` : `TXN${Date.now().toString().slice(-6)}${i}`;
    const paymentDate = new Date(`2026-0${6 + (i % 5)}-${10 + (i % 18)}T11:00:00Z`);

    const receiptNum = `SMS/2026-27/${receiptCounter.toString().padStart(6, "0")}`;
    const receiptId = `RCP-${Date.now().toString(36).toUpperCase()}-${receiptCounter}`;
    const payId = `PAY-${Date.now().toString(36).toUpperCase()}-${receiptCounter}`;
    receiptCounter++;

    // Receipt Line Items
    const lineItems = newBreakdown.map(item => ({
      description: item.categoryName || "Tuition Fee",
      feeCategoryId: item.feeCategoryId || "CAT-DEFAULT",
      installmentLabel: paymentAmount === totalFees ? "Full Year" : "Term 1",
      feeAmount: paymentAmount === totalFees ? item.netAmount : Math.round(item.netAmount / 2),
      lateFeeAmount: 0,
      lineTotal: paymentAmount === totalFees ? item.netAmount : Math.round(item.netAmount / 2)
    }));

    const paymentItems = newBreakdown.map(item => ({
      feeCategoryId: item.feeCategoryId || "CAT-DEFAULT",
      categoryName: item.categoryName || "Tuition Fee",
      installmentNumber: paymentAmount === totalFees ? null : 1,
      installmentLabel: paymentAmount === totalFees ? "Full Year" : "Term 1",
      outstandingAmount: item.netAmount,
      lateFeeAmount: 0,
      paidAmount: paymentAmount === totalFees ? item.netAmount : Math.round(item.netAmount / 2)
    }));

    receiptsToInsert.push({
      receiptId,
      receiptNumber: receiptNum,
      schoolId: SCHOOL_ID,
      academicYear: "2026-2027",
      paymentId: payId,
      assignmentId: assignment.assignmentId,
      student: {
        studentId: assignment.studentId,
        studentName: assignment.studentName || "Student",
        className: assignment.className || "Class 1",
        sectionName: assignment.sectionName || "A",
        rollNumber: assignment.rollNumber || "1"
      },
      school: {
        schoolId: SCHOOL_ID,
        schoolName: "Bangalore International Public School",
        schoolAddress: "MG Road, Bangalore, Karnataka - 560001",
        schoolPhone: "+91 80 2345 6789",
        schoolEmail: "accounts@demoschool.smsedusolutions.in",
        schoolLogo: "https://demoschool.smsedusolutions.in/logo.png"
      },
      paymentDate,
      paymentMode: mode,
      referenceNumber: refNo,
      bankName: bank,
      lineItems,
      totalFeeAmount: paymentAmount,
      totalLateFeeIncluded: 0,
      totalAmountPaid: paymentAmount,
      totalFeesForYear: totalFees,
      totalPaidToDate: paymentAmount,
      balanceRemaining: totalFees - paymentAmount,
      isVoided: false,
      voidedAt: null,
      voidedBy: null,
      voidReason: null,
      pdfUrl: null,
      isDeleted: false,
      createdBy: "USR-55C28DEB",
      createdByName: "System Accounts Admin",
      createdAt: paymentDate,
      updatedAt: paymentDate,
      __v: 0
    });

    transactionsToInsert.push({
      paymentId: payId,
      schoolId: SCHOOL_ID,
      paymentType: "payment",
      studentId: assignment.studentId,
      studentName: assignment.studentName || "Student",
      assignmentId: assignment.assignmentId,
      academicYear: assignment.academicYear || "2026-2027",
      paymentMode: mode,
      paymentDate,
      referenceNumber: refNo,
      bankName: bank,
      remarks: paymentAmount === totalFees ? "Full academic year fee payment cleared" : "Term 1 installment cleared",
      paymentItems,
      totalFeeAmount: paymentAmount,
      totalLateFee: 0,
      totalAmountReceived: paymentAmount,
      balanceBefore: totalFees,
      balanceAfter: totalFees - paymentAmount,
      status: "completed",
      receiptId,
      receiptNumber: receiptNum,
      recordedBy: "USR-55C28DEB",
      recordedByName: "System Accounts Admin",
      isDeleted: false,
      createdAt: paymentDate,
      updatedAt: paymentDate,
      __v: 0
    });

    // Update assignment ledger in database
    await StudentFeeAssignment.updateOne(
      { _id: assignment._id },
      {
        $set: {
          totalPaid: paymentAmount,
          totalBalance: totalFees - paymentAmount,
          installmentSchedule: newInstallments,
          feeBreakdown: newBreakdown,
          lastTransactionDate: paymentDate,
          lastTransactionType: "payment",
          updatedAt: paymentDate
        }
      }
    );
  }

  // Insert receipts & transactions in batches
  for (let i = 0; i < receiptsToInsert.length; i += CHUNK_SIZE) {
    await FeeReceipt.insertMany(receiptsToInsert.slice(i, i + CHUNK_SIZE));
    await FeeTransaction.insertMany(transactionsToInsert.slice(i, i + CHUNK_SIZE));
  }

  console.log(`✅ Seeded Fee Ledgers:`);
  console.log(`   - Paid Full: ${paidFullCount} students`);
  console.log(`   - Paid Term 1 (Partial): ${paidTerm1Count} students`);
  console.log(`   - Unpaid: ${unpaidCount} students`);
  console.log(`   - Generated ${receiptsToInsert.length} official Fee Receipts and Transactions!`);

  // -------------------------------------------------------------
  // 6. SEED TRANSPORT MODULE (Vehicles, Drivers, Routes)
  // -------------------------------------------------------------
  console.log("\n🚌 [6/6] Seeding Transport Module (Buses, Drivers, Routes)...");
  const Vehicle = schoolDb.collection("vehicles");
  const Driver = schoolDb.collection("drivers");
  const TransportRoute = schoolDb.collection("transportroutes");

  await Vehicle.deleteMany({ schoolId: SCHOOL_ID });
  await Driver.deleteMany({ schoolId: SCHOOL_ID });
  await TransportRoute.deleteMany({ schoolId: SCHOOL_ID });

  const transportData = [
    {
      vehicleNumber: "KA-01-F-1204",
      model: "Tata Starbus 40-Seater",
      capacity: 40,
      driverName: "Ramesh Gowda",
      phone: "+91 98450 11223",
      license: "KA01-20150001234",
      routeName: "Route 1: Whitefield & Hoodi Express",
      stops: [
        { name: "ITPL Main Gate", time: "07:30 AM", fee: 1800 },
        { name: "Hope Farm Junction", time: "07:45 AM", fee: 1600 },
        { name: "Hoodi Circle", time: "08:00 AM", fee: 1500 },
        { name: "KR Puram Railway Station", time: "08:15 AM", fee: 1400 },
        { name: "School Campus", time: "08:35 AM", fee: 0 }
      ]
    },
    {
      vehicleNumber: "KA-04-E-3489",
      model: "Ashok Leyland 36-Seater",
      capacity: 36,
      driverName: "Suresh Kumar",
      phone: "+91 98450 22334",
      license: "KA04-20160002345",
      routeName: "Route 2: Koramangala & HSR Layout",
      stops: [
        { name: "Koramangala Sony World Signal", time: "07:25 AM", fee: 2000 },
        { name: "HSR Layout BDA Complex", time: "07:40 AM", fee: 1800 },
        { name: "Silk Board Flyover", time: "07:55 AM", fee: 1600 },
        { name: "BTM Layout 2nd Stage", time: "08:10 AM", fee: 1500 },
        { name: "School Campus", time: "08:35 AM", fee: 0 }
      ]
    },
    {
      vehicleNumber: "KA-05-AB-5612",
      model: "Force Traveller 26-Seater",
      capacity: 26,
      driverName: "Manjunath R",
      phone: "+91 98450 33445",
      license: "KA05-20170003456",
      routeName: "Route 3: Jayanagar & JP Nagar Line",
      stops: [
        { name: "Jayanagar 4th Block Complex", time: "07:30 AM", fee: 1800 },
        { name: "South End Circle", time: "07:45 AM", fee: 1600 },
        { name: "JP Nagar 6th Phase", time: "08:00 AM", fee: 1500 },
        { name: "Banashankari BDA", time: "08:15 AM", fee: 1400 },
        { name: "School Campus", time: "08:40 AM", fee: 0 }
      ]
    },
    {
      vehicleNumber: "KA-51-CD-7823",
      model: "Eicher Skyline Pro 32-Seater",
      capacity: 32,
      driverName: "Venkatesh B",
      phone: "+91 98450 44556",
      license: "KA51-20180004567",
      routeName: "Route 4: Indiranagar & Old Airport Road",
      stops: [
        { name: "Indiranagar 100ft Road", time: "07:35 AM", fee: 1900 },
        { name: "Domlur Flyover Junction", time: "07:50 AM", fee: 1700 },
        { name: "Manipal Hospital Old Airport Rd", time: "08:05 AM", fee: 1600 },
        { name: "Marathahalli Bridge", time: "08:20 AM", fee: 1500 },
        { name: "School Campus", time: "08:35 AM", fee: 0 }
      ]
    }
  ];

  for (let idx = 0; idx < transportData.length; idx++) {
    const td = transportData[idx];
    const vehicleId = `VEH-${idx + 1}`;
    const driverId = `DRV-${idx + 1}`;
    const routeId = `RTE-${idx + 1}`;

    await Vehicle.insertOne({
      vehicleId,
      schoolId: SCHOOL_ID,
      registrationNumber: td.vehicleNumber,
      capacity: td.capacity,
      model: td.model,
      status: "active",
      insuranceExpiry: new Date("2027-08-15"),
      fitnessCertificateExpiry: new Date("2027-10-20"),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await Driver.insertOne({
      driverId,
      schoolId: SCHOOL_ID,
      name: td.driverName,
      phone: td.phone,
      licenseNumber: td.license,
      assignedVehicleId: vehicleId,
      assignedRouteId: routeId,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await TransportRoute.insertOne({
      routeId,
      schoolId: SCHOOL_ID,
      name: td.routeName,
      vehicleId,
      driverId,
      stops: td.stops,
      totalStops: td.stops.length,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  console.log(`✅ Seeded 4 School Buses, 4 Drivers, and 4 Transport Routes!`);

  console.log("\n=================================================");
  console.log("🎉 ALL DEMO DATA SUCCESSFULLY SEEDED!");
  console.log("Ready for a stellar tomorrow morning school presentation!");
  console.log("=================================================");

  process.exit(0);
}

main().catch(err => {
  console.error("❌ Seeding Error:", err);
  process.exit(1);
});
