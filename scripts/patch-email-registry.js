require("dotenv").config({ path: "./apps/sm-user-service/.env" });
const mongoose = require("mongoose");
const {
  AdminModel,
  UserModel,
  EmailRegistryModel,
  TeacherSchema,
  StudentSchema,
  ParentSchema,
  PrincipalSchema
} = require("../packages/shared/models");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Please set MONGO_URI");
  process.exit(1);
}

const SCHOOL_DB_NAME = "school-db-demo";

async function patchEmails() {
  console.log("Connecting to MongoDB...");
  const mainConnection = await mongoose.connect(MONGO_URI);
  console.log("Connected to SuperAdmin DB");



  const registryEntries = [];

  // 2. Super Admins
  const admins = await AdminModel.find({});
  for (const admin of admins) {
    if (admin.email) {
      registryEntries.push({
        email: admin.email,
        role: "super_admin",
        schoolId: null,
        userId: admin.adminId,
        status: admin.status || "active"
      });
    }
  }

  // 3. School Admins
  const schAdmins = await UserModel.find({});
  for (const admin of schAdmins) {
    if (admin.email) {
      registryEntries.push({
        email: admin.email,
        role: "sch_admin",
        schoolId: admin.schoolId,
        userId: admin.userId,
        status: admin.status || "active"
      });
    }
  }

  // 4. School-specific users (Teachers, Students, Parents)
  const schoolDb = mainConnection.connection.useDb(SCHOOL_DB_NAME, { useCache: true });
  const Teacher = schoolDb.model("Teacher", TeacherSchema);
  const Student = schoolDb.model("Student", StudentSchema);
  const Parent = schoolDb.model("Parent", ParentSchema);
  const Principal = schoolDb.model("Principal", PrincipalSchema);

  const teachers = await Teacher.find({});
  for (const t of teachers) {
    if (t.email) {
      registryEntries.push({
        email: t.email,
        role: "teacher",
        schoolId: t.schoolId,
        userId: t.teacherId,
        status: t.status || "active"
      });
    }
  }

  const students = await Student.find({});
  for (const s of students) {
    if (s.email) {
      registryEntries.push({
        email: s.email,
        role: "student",
        schoolId: s.schoolId,
        userId: s.studentId,
        status: s.status || "active"
      });
    }
  }

  const parents = await Parent.find({});
  for (const p of parents) {
    if (p.email) {
      registryEntries.push({
        email: p.email,
        role: "parent",
        schoolId: p.schoolId,
        userId: p.parentId,
        status: p.status || "active"
      });
    }
  }

  const principals = await Principal.find({});
  for (const pr of principals) {
    if (pr.email) {
      registryEntries.push({
        email: pr.email,
        role: "principal",
        schoolId: pr.schoolId,
        userId: pr.principalId,
        status: pr.status || "active"
      });
    }
  }

  // Insert all in bulk
  console.log(`Inserting ${registryEntries.length} entries into EmailRegistry...`);
  // Remove duplicates just in case (e.g. students without emails might have generated empty strings or duplicates if schema wasn't strictly unique on nulls)
  const uniqueEntries = [];
  const seenEmails = new Set();
  
  for (const entry of registryEntries) {
    const email = entry.email.toLowerCase().trim();
    if (email && !seenEmails.has(email)) {
      seenEmails.add(email);
      uniqueEntries.push({ ...entry, email });
    }
  }

  // 1. Clear existing registry for demo safety (optional, but good to reset)
  console.log("Clearing EmailRegistry...");
  await EmailRegistryModel.deleteMany({});
  await EmailRegistryModel.insertMany(uniqueEntries);

  console.log("EmailRegistry patched successfully!");
  process.exit(0);
}

patchEmails().catch(err => {
  console.error(err);
  process.exit(1);
});
