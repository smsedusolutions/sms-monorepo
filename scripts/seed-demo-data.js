require("dotenv").config({ path: "./apps/sm-user-service/.env" });
const mongoose = require("mongoose");
const crypto = require("crypto");

const {
  SchoolModel,
  AdminModel,
  ClassSchema,
  SubjectSchema,
  TeacherSchema,
  StudentSchema,
  ParentSchema,
  FeeStructureSchema,
  TimetableConfigSchema,
} = require("../packages/shared/models");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Please set MONGO_URI in apps/sm-user-service/.env");
  process.exit(1);
}

const SCHOOL_DB_NAME = "school-db-demo";
const SCHOOL_ID = "DEMO101";

// Helper function to generate IDs
const generateId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

// Realistic Indian Names (focus on Karnataka)
const maleFirstNames = ["Aarav", "Aryan", "Darshan", "Ganesh", "Harsha", "Karthik", "Manish", "Nitin", "Praveen", "Rahul", "Sandeep", "Tarun", "Varun", "Yash", "Aditya", "Basava", "Chetan", "Deepak", "Guru", "Kiran"];
const femaleFirstNames = ["Aadhya", "Bhavya", "Chaitra", "Divya", "Kavya", "Meghana", "Nandini", "Pooja", "Ramya", "Shreya", "Sneha", "Tejaswini", "Varsha", "Ananya", "Bhoomika", "Deepa", "Gowri", "Jyothi", "Kruthi", "Lakshmi"];
const lastNames = ["Patil", "Desai", "Gowda", "Hegde", "Bhat", "Shenoy", "Rao", "Nayak", "Kamat", "Prabhu", "Shetty", "Reddy", "Kulkarni", "Joshi", "Deshpande"];
const parentMaleNames = ["Ramesh", "Suresh", "Mahesh", "Prakash", "Ravi", "Anand", "Rajesh", "Girish", "Venkatesh", "Srinivas"];
const parentFemaleNames = ["Saraswati", "Geetha", "Sujatha", "Roopa", "Savitha", "Latha", "Shobha", "Meena", "Radha", "Kusuma"];

const getRandomName = (gender) => {
  const firstNames = gender === "male" ? maleFirstNames : femaleFirstNames;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { firstName, lastName };
};

const getRandomParentName = (gender) => {
  const firstNames = gender === "male" ? parentMaleNames : parentFemaleNames;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { firstName, lastName };
};

const subjectsList = [
  { name: "English", code: "ENG1", isLang: true },
  { name: "Kannada", code: "KAN2", isLang: true },
  { name: "Hindi", code: "HIN3", isLang: true },
  { name: "Mathematics", code: "MAT", isLang: false },
  { name: "Science (Physics)", code: "PHY", isLang: false },
  { name: "Science (Chemistry)", code: "CHE", isLang: false },
  { name: "Science (Biology)", code: "BIO", isLang: false },
  { name: "Social Science", code: "SOC", isLang: false },
  { name: "Physical Education", code: "PE", isLang: false },
  { name: "Computer Science", code: "CS", isLang: false },
  { name: "Drawing", code: "ART", isLang: false },
];

async function seedData() {
  console.log("Connecting to MongoDB...");
  const mainConnection = await mongoose.connect(MONGO_URI);
  console.log("Connected to SuperAdmin DB");

  const schoolDb = mainConnection.connection.useDb(SCHOOL_DB_NAME, { useCache: true });
  console.log(`Connected to School DB: ${SCHOOL_DB_NAME}`);

  // Register Models
  const Class = schoolDb.model("Class", ClassSchema);
  const Subject = schoolDb.model("Subject", SubjectSchema);
  const Teacher = schoolDb.model("Teacher", TeacherSchema);
  const Student = schoolDb.model("Student", StudentSchema);
  const Parent = schoolDb.model("Parent", ParentSchema);
  const FeeStructure = schoolDb.model("FeeStructure", FeeStructureSchema);
  const TimetableConfig = schoolDb.model("TimetableConfig", TimetableConfigSchema);

  // 1. Clear Existing Data
  console.log("Clearing existing demo data...");
  await SchoolModel.deleteOne({ schoolId: SCHOOL_ID });
  await AdminModel.deleteMany({ email: "admin@demoschool.com" });
  await Class.deleteMany({});
  await Subject.deleteMany({});
  await Teacher.deleteMany({});
  await Student.deleteMany({});
  await Parent.deleteMany({});
  await FeeStructure.deleteMany({});
  await TimetableConfig.deleteMany({});

  // 2. Create School and Admin
  console.log("Creating School & Admin...");
  const school = await SchoolModel.create({
    schoolId: SCHOOL_ID,
    schoolName: "SMS Demo School",
    schoolDbName: SCHOOL_DB_NAME,
    status: "active",
    schoolAddress: "MG Road, Bangalore, Karnataka",
    schoolEmail: "info@demoschool.com",
    schoolContact: "+919876543210",
    currentAcademicYear: "2026-2027",
  });

  await AdminModel.create({
    adminId: generateId("ADM"),
    username: "demoadmin",
    email: "admin@demoschool.com",
    password: "password123", // Simple plain text for demo
    role: "super_admin",
  });

  // 3. Create Subjects
  console.log("Creating Subjects...");
  const subjectMap = {}; // Name to ID
  for (const sub of subjectsList) {
    const createdSub = await Subject.create({
      subjectId: generateId("SUB"),
      schoolId: SCHOOL_ID,
      name: sub.name,
      code: sub.code,
      description: sub.isLang ? `Language - ${sub.name}` : `Core Subject - ${sub.name}`,
    });
    subjectMap[sub.name] = createdSub.subjectId;
  }

  // 4. Create Classes and Sections (1 to 10)
  console.log("Creating Classes & Sections...");
  const classes = [];

  for (let i = 1; i <= 10; i++) {
    const secAId = generateId("SEC");
    const secBId = generateId("SEC");

    const newClass = await Class.create({
      classId: generateId("CLS"),
      schoolId: SCHOOL_ID,
      name: `Class ${i}`,
      sections: [
        { sectionId: secAId, name: "A", classTeacherId: null },
        { sectionId: secBId, name: "B", classTeacherId: null }
      ]
    });
    classes.push(newClass);
  }

  // 5. Create Teachers
  console.log("Creating Teachers...");
  const teachers = [];
  const subjectKeys = Object.keys(subjectMap);

  // 30 teachers to ensure plenty for assignments
  for (let i = 0; i < 30; i++) {
    const gender = Math.random() > 0.5 ? "male" : "female";
    const { firstName, lastName } = getRandomName(gender);

    // Assign 2 random subjects to a teacher
    const tSubjects = [
      subjectMap[subjectKeys[i % subjectKeys.length]],
      subjectMap[subjectKeys[(i + 3) % subjectKeys.length]]
    ];

    const teacher = await Teacher.create({
      teacherId: generateId("TCH"),
      schoolId: SCHOOL_ID,
      firstName,
      lastName,
      email: `teacher${i + 1}@demoschool.com`,
      password: "password123",
      phone: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
      subjects: tSubjects,
      classes: [],
      classTeacherSectionId: null,
      status: "active"
    });
    teachers.push(teacher);
  }

  // Assign class teachers to sections
  let tIndex = 0;
  for (const c of classes) {
    for (const sec of c.sections) {
      if (tIndex < teachers.length) {
        sec.classTeacherId = teachers[tIndex].teacherId;
        teachers[tIndex].classTeacherSectionId = sec.sectionId;
        await teachers[tIndex].save();
        tIndex++;
      }
    }
    await c.save();
  }

  // 6. Create Students and Parents
  console.log("Creating Students and Parents (This may take a minute)...");
  let sIndex = 1;
  let pIndex = 1;

  for (const c of classes) {
    for (const sec of c.sections) {
      // 20-40 students per section
      const numStudents = Math.floor(Math.random() * 21) + 20;

      for (let s = 0; s < numStudents; s++) {
        const gender = Math.random() > 0.5 ? "male" : "female";
        const { firstName, lastName } = getRandomName(gender);

        // Generate a Parent for the student
        const parentGender = Math.random() > 0.5 ? "male" : "female";
        const pName = getRandomParentName(parentGender);
        const pRelation = parentGender === "male" ? "father" : "mother";

        const parent = await Parent.create({
          parentId: generateId("PAR"),
          schoolId: SCHOOL_ID,
          firstName: pName.firstName,
          lastName: lastName,
          email: `parent${pIndex}@demoschool.com`,
          password: "password123",
          phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
          relationship: pRelation,
          studentIds: [], // Will update
          status: "active"
        });
        pIndex++;

        const student = await Student.create({
          studentId: generateId("STU"),
          schoolId: SCHOOL_ID,
          firstName,
          lastName,
          email: `student${sIndex}@demoschool.com`,
          password: "password123",
          class: c.classId,
          section: sec.sectionId,
          rollNumber: `${s + 1}`,
          parentId: parent.parentId,
          gender,
          academicYear: "2026-2027",
          status: "active"
        });
        sIndex++;

        // Update Parent with Student ID
        parent.studentIds.push(student.studentId);
        await parent.save();
      }
    }
  }

  // 7. Create Fee Structure
  console.log("Creating Fee Structure...");
  await FeeStructure.create({
    feeStructureId: generateId("FEE"),
    schoolId: SCHOOL_ID,
    name: "Standard Academic Fee 2026-2027",
    academicYear: "2026-2027",
    applicableClasses: classes.map(c => c.classId),
    status: "published",
    publishedAt: new Date(),
    createdBy: "demoadmin",
    feeItems: [
      {
        feeCategoryId: generateId("FCAT"),
        categoryName: "Admission Fee",
        amount: 15000,
        frequency: "one_time",
        displayOrder: 1
      },
      {
        feeCategoryId: generateId("FCAT"),
        categoryName: "Tuition Fee",
        amount: 3000,
        frequency: "monthly",
        displayOrder: 2
      },
      {
        feeCategoryId: generateId("FCAT"),
        categoryName: "Library & Lab Fee",
        amount: 2500,
        frequency: "annually",
        displayOrder: 3
      }
    ],
    totalFeeAmount: 20500
  });

  // 8. Timetable Config
  console.log("Creating Timetable Config...");
  await TimetableConfig.create({
    configId: generateId("TTC"),
    schoolId: SCHOOL_ID,
    academicYear: "2026-2027",
    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    periods: [
      { periodNumber: 1, name: "Period 1", startTime: "08:30", endTime: "09:15", duration: 45, type: "regular" },
      { periodNumber: 2, name: "Period 2", startTime: "09:15", endTime: "10:00", duration: 45, type: "regular" },
      { periodNumber: 3, name: "Break", startTime: "10:00", endTime: "10:15", duration: 15, type: "break" },
      { periodNumber: 4, name: "Period 3", startTime: "10:15", endTime: "11:00", duration: 45, type: "regular" },
      { periodNumber: 5, name: "Period 4", startTime: "11:00", endTime: "11:45", duration: 45, type: "regular" },
      { periodNumber: 6, name: "Lunch", startTime: "11:45", endTime: "12:30", duration: 45, type: "lunch" },
      { periodNumber: 7, name: "Period 5", startTime: "12:30", endTime: "13:15", duration: 45, type: "regular" },
      { periodNumber: 8, name: "Period 6", startTime: "13:15", endTime: "14:00", duration: 45, type: "regular" },
    ]
  });

  console.log("=========================================");
  console.log("Demo Data Seeded Successfully!");
  console.log(`School ID: ${SCHOOL_ID}`);
  console.log(`Classes: ${classes.length} (with 2 sections each)`);
  console.log(`Teachers: ${teachers.length}`);
  console.log(`Students Generated: ${sIndex - 1}`);
  console.log(`Parents Generated: ${pIndex - 1}`);
  console.log("=========================================");

  process.exit(0);
}

seedData().catch(err => {
  console.error("Error seeding data:", err);
  process.exit(1);
});
