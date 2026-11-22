require("dotenv").config({ path: "./apps/sm-user-service/.env" });
const mongoose = require("mongoose");
const crypto = require("crypto");
const {
  ClassSchema,
  SubjectSchema,
  TeacherSchema
} = require("../packages/shared/models");
const ExamTermSchema = require("../packages/shared/models/exam-term.model");
const ExamTypeSchema = require("../packages/shared/models/exam-type.model");
const GradingSystemSchema = require("../packages/shared/models/grading-system.model");
const RoomSchema = require("../packages/shared/models/room.model");
const ExamSchema = require("../packages/shared/models/exam.model");
const ExamScheduleSchema = require("../packages/shared/models/exam-schedule.model");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Please set MONGO_URI");
  process.exit(1);
}

const SCHOOL_DB_NAME = "school-db-demo";
const SCHOOL_ID = "DEMO101";

const generateId = (prefix) =>
  `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

async function seedExams() {
  console.log("Connecting to MongoDB...");
  const mainConnection = await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");
  const schoolDb = mainConnection.connection.useDb(SCHOOL_DB_NAME, { useCache: true });

  const Class = schoolDb.model("Class", ClassSchema);
  const Subject = schoolDb.model("Subject", SubjectSchema);
  const Teacher = schoolDb.model("Teacher", TeacherSchema);
  
  const ExamTerm = schoolDb.model("ExamTerm", ExamTermSchema);
  const ExamType = schoolDb.model("ExamType", ExamTypeSchema);
  const GradingSystem = schoolDb.model("GradingSystem", GradingSystemSchema);
  const Room = schoolDb.model("Room", RoomSchema);
  const Exam = schoolDb.model("Exam", ExamSchema);
  const ExamSchedule = schoolDb.model("ExamSchedule", ExamScheduleSchema);

  // 1. Grading Systems
  await GradingSystem.deleteMany({});
  const gradingSystem = await GradingSystem.create({
    schoolId: SCHOOL_ID,
    name: "CBSE Standard 10-Point Scale",
    isDefault: true,
    grades: [
      { name: "A1", minPercentage: 91, maxPercentage: 100, points: 10, description: "Outstanding" },
      { name: "A2", minPercentage: 81, maxPercentage: 90, points: 9, description: "Excellent" },
      { name: "B1", minPercentage: 71, maxPercentage: 80, points: 8, description: "Very Good" },
      { name: "B2", minPercentage: 61, maxPercentage: 70, points: 7, description: "Good" },
      { name: "C1", minPercentage: 51, maxPercentage: 60, points: 6, description: "Above Average" },
      { name: "C2", minPercentage: 41, maxPercentage: 50, points: 5, description: "Average" },
      { name: "D", minPercentage: 33, maxPercentage: 40, points: 4, description: "Pass" },
      { name: "E", minPercentage: 0, maxPercentage: 32, points: 0, description: "Needs Improvement" },
    ]
  });
  console.log("Seeded Grading System");

  // 2. Exam Terms
  await ExamTerm.deleteMany({});
  const term1 = await ExamTerm.create({
    schoolId: SCHOOL_ID,
    name: "Term 1 (Half Yearly)",
    academicYear: "2026-2027",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-10-31"),
    status: "active"
  });
  const term2 = await ExamTerm.create({
    schoolId: SCHOOL_ID,
    name: "Term 2 (Finals)",
    academicYear: "2026-2027",
    startDate: new Date("2026-11-01"),
    endDate: new Date("2027-03-31"),
    status: "active"
  });
  console.log("Seeded Exam Terms");

  // 3. Exam Types
  await ExamType.deleteMany({});
  const midTermType = await ExamType.create({
    schoolId: SCHOOL_ID,
    name: "Mid-Term Examination",
    termId: term1._id,
    weightage: 40,
    description: "First half of the syllabus"
  });
  const finalsType = await ExamType.create({
    schoolId: SCHOOL_ID,
    name: "Annual Examination",
    termId: term2._id,
    weightage: 60,
    description: "Full syllabus evaluation"
  });
  console.log("Seeded Exam Types");

  // 4. Rooms
  await Room.deleteMany({});
  const roomsData = [];
  for (let i = 1; i <= 15; i++) {
    roomsData.push({
      roomId: generateId("RM"),
      schoolId: SCHOOL_ID,
      name: `Exam Hall ${i}`,
      code: `EH-${i}`,
      type: "hall",
      capacity: 40,
      floor: `Floor ${Math.ceil(i/5)}`,
      building: "Main Block"
    });
  }
  const rooms = await Room.insertMany(roomsData);
  console.log("Seeded Rooms");

  // 5. Exam
  await Exam.deleteMany({});
  const classes = await Class.find({ status: 'active' });
  const subjects = await Subject.find({});
  const teachers = await Teacher.find({ status: 'active' });

  const midTermExam = await Exam.create({
    schoolId: SCHOOL_ID,
    examId: generateId("EXM"),
    name: "Mid-Term Exams 2026",
    typeId: midTermType._id,
    termId: term1._id,
    academicYear: "2026-2027",
    classes: classes.map(c => c.classId),
    startDate: new Date("2026-09-15"),
    endDate: new Date("2026-09-25"),
    resultPublishDate: new Date("2026-10-05"),
    gradingSystemId: gradingSystem._id,
    status: "completed"
  });

  const finalExam = await Exam.create({
    schoolId: SCHOOL_ID,
    examId: generateId("EXM"),
    name: "Annual Exams 2027",
    typeId: finalsType._id,
    termId: term2._id,
    academicYear: "2026-2027",
    classes: classes.map(c => c.classId),
    startDate: new Date("2027-03-10"),
    endDate: new Date("2027-03-22"),
    gradingSystemId: gradingSystem._id,
    status: "draft"
  });
  console.log("Seeded Exams");

  // 6. Exam Schedules (just for Mid-Terms)
  await ExamSchedule.deleteMany({});
  const schedules = [];
  
  let currentRoomIndex = 0;
  
  for (const classDoc of classes) {
    let dateObj = new Date("2026-09-15T00:00:00Z");
    
    // Core subjects to schedule
    const coreSubjects = subjects.slice(0, 5); 
    
    for (let i = 0; i < coreSubjects.length; i++) {
        const subject = coreSubjects[i];
        
        // Find a random teacher to invigilate
        const invigilator = teachers[Math.floor(Math.random() * teachers.length)];
        
        schedules.push({
            schoolId: SCHOOL_ID,
            examId: midTermExam.examId,
            classId: classDoc.classId,
            subjectId: subject.subjectId,
            date: new Date(dateObj),
            startTime: "09:30",
            endTime: "12:30",
            durationMinutes: 180,
            roomId: rooms[currentRoomIndex % rooms.length].roomId,
            invigilators: [invigilator.teacherId],
            maxMarksTheory: 80,
            passingMarks: 33,
            syllabus: "Chapters 1 to 5"
        });
        
        currentRoomIndex++;
        
        // increment date by 2 days for next exam
        dateObj.setDate(dateObj.getDate() + 2);
    }
  }
  
  await ExamSchedule.insertMany(schedules);
  console.log(`Seeded ${schedules.length} Exam Schedules`);

  console.log("Done!");
  process.exit(0);
}

seedExams().catch(err => {
  console.error(err);
  process.exit(1);
});
