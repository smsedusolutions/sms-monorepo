# 📚 School Management System (SMS) — Complete Project Documentation

## 🏫 What Is This Project?

**School Management System (SMS)** is a full-stack, multi-tenant SaaS platform built to digitize and streamline every aspect of school operations — from academic management to transport, fees, communication, and compliance.

It is built as a **monorepo** with:

- **Frontend**: React + TypeScript + Vite (PWA-ready, push notifications)
- **Backend Microservices**: Node.js services for auth, academics, payments, notifications, chat, transport, users, and the platform itself
- **Architecture**: Turborepo monorepo with shared packages
- **Compliance**: DPDP (India's Digital Personal Data Protection Act) compliant

The system supports **multiple schools** under a single platform (multi-tenant), each with its own isolated data, staff, students, and configuration.

---

## 👥 Roles in the System

The system has **7 roles**, each with its own dashboard, pages, and permissions:

| Role | Description |
|------|-------------|
| 🔴 **Super Admin** | Platform owner — manages all schools across the system |
| 🟠 **School Admin** | Manages a specific school's full operations |
| 🟡 **Principal** | Oversight role — approves, reviews, and monitors |
| 🟢 **Teacher** | Classroom-level operations — attendance, homework, exams |
| 🔵 **Student** | Views own academics, attendance, fees, homework |
| 🟣 **Parent** | Monitors child's academics, fees, transport, communicates with school |
| ⚫ **Driver** | Views assigned transport route and student list |

---

## 🔴 Role 1 — Super Admin

> The highest authority in the platform. Manages all schools and platform-level configuration.

### Features:

- **Dashboard** — Platform-wide analytics and overview
- **School Management**
  - View all registered schools
  - Add / activate / deactivate schools
- **User Management**
  - View all users across all schools
  - Manage platform-level users
- **Menu Management**
  - Configure navigation menus per role
  - Enable / disable menu items dynamically
- **Role Management**
  - Create and manage roles
  - Assign permissions to roles
- **Super Admin Secret Setup**
  - Secure one-time setup endpoint for creating the first super admin

---

## 🟠 Role 2 — School Admin

> Manages the complete day-to-day operations of a single school.

### Features:

### 🏠 Dashboard
- School-wide stats (students, teachers, attendance, fees)
- Quick action shortcuts

### 🏫 School Settings
- Update school profile (name, logo, contact, etc.)
- Manage school location (geo-coordinates / address)

### 🧑‍🏫 Staff Management
- **Teachers** — Add, view, edit, deactivate teachers
- **Principal** — Assign / manage principal for the school
- **Driver Management** — Add and manage bus drivers

### 👨‍🎓 Student Management
- Add, view, search, and manage students
- View student discipline records
- Student promotion to next class/year

### 👪 Parent Management
- View and manage parent accounts
- Link parents to students

### 🏛️ Classes & Subjects
- Create and manage classes (e.g., Class 6A, 7B)
- Add subjects and assign them to classes

### 📅 Timetable Management
- **Timetable Config** — Set periods, timings, working days
- **Timetable Master** — Build the master timetable
- **Draft Preview** — Preview before publishing
- **Conflict Management** — Detect and resolve scheduling conflicts
- **Substitute Management** — Assign substitute teachers for absent staff

### 📝 Exam Management
- **Exam Configuration** — Set exam types, grading rules
- **Exam Scheduler** — Schedule exams for classes
- **Gradebook** — View and manage student grades
- **Results** — View published exam results

### ✅ Attendance Management
- View school-wide attendance
- Monitor daily attendance trends
- Handle leave requests from teachers and students

### 📋 Leave Management
- View and manage all leave requests (teacher + student)
- Approve / reject leave applications

### 💰 Fee Management
- **Fee Dashboard** — Overview of collections and dues
- **Fee Categories** — Define fee types (tuition, transport, misc)
- **Fee Structures** — Create fee structures per class
- **Fee Assignments** — Assign fees to individual students
- **Payment Collection** — Record manual payments
- **Receipts** — Generate and view payment receipts
- **Fee Discounts** — Apply discounts to students
- **Fee Reports** — Collection reports, summaries
- **Defaulter List** — View students with pending dues
- **Fee Accounts** — Manage bank/account details

### 🚌 Transport Management
- **Transport Routes** — Create and manage bus routes
- **Vehicle Management** — Add and manage school vehicles
- **Driver Management** — Assign drivers to routes

### 📣 Announcements
- Post announcements visible to teachers, students, parents

### 📧 Email Templates
- Create and edit email notification templates
- Template editor with rich text support

### 🔔 Notifications
- View and manage all school notifications / activity logs

### 📆 School Calendar
- Add school events, holidays, exams, parent meetings

### 🤝 PTM (Parent-Teacher Meeting)
- Schedule and manage PTM sessions
- View parent bookings

### 📚 Syllabus
- Manage and publish syllabus per class/subject

### 📊 Requests
- View pending requests from teachers and staff

### 👤 Profile
- View and edit admin's own profile

---

## 🟡 Role 3 — Principal

> Oversight and approval authority for academic and staff matters.

### Features:

### 🏠 Dashboard
- School overview with key metrics
- Pending approvals summary

### 👨‍🏫 Teacher Management
- View all teachers and their status

### 👨‍🎓 Student Management
- View all students and their academic status

### ✅ Attendance
- View school-wide attendance data

### 📋 Leave Approvals
- **Teacher Leave Requests** — Review and approve/reject teacher leave applications

### 🕐 Timetable Review
- Review timetables before they go live
- Approve / send back timetable drafts

### 📝 Exam Management
- **Exam Approval** — Approve exam schedules submitted by teachers/admin
- **Exam Results** — View final results across classes

### 📆 Academic Calendar
- View school calendar and events

### 📣 Announcements
- View and create school-wide announcements

### 🔔 Notifications
- View all platform notifications

### 💬 Chat
- Chat with teachers and admin

### 👤 Profile
- View and edit own profile

---

## 🟢 Role 4 — Teacher

> Classroom-level role. Handles day-to-day teaching operations.

### Features:

### 🏠 Dashboard
- Today's classes, attendance summary, homework due, upcoming exams

### 🏛️ My Classes
- View assigned classes and sections
- View class-wise student list

### 👨‍🎓 My Students
- View students in assigned classes
- View student details and contact info

### 👪 My Students' Parents
- View parent contact information for their students

### ✅ Attendance
- Mark daily attendance for each class
- View and edit previous attendance records

### 📋 Leave Management
- **Apply Leave** — Submit personal leave application
- **My Leaves** — View own leave history and status
- **Student Leaves** — Review and approve student leave requests

### 📖 Homework
- View all assigned homework
- **Create Homework** — Assign new homework with subject, description, due date

### 📝 Exam Management
- **Marks Entry** — Enter student marks for conducted exams
- **Exam Scheduler** — View exam schedule for assigned subjects

### 🕐 Timetable
- View own class timetable / teaching schedule

### 📆 Academic Calendar
- View school events, holidays, exam dates

### 🤝 PTM Schedule
- View own PTM slots and parent bookings

### 📣 Announcements
- Read school-wide announcements

### 🔔 Notifications
- Receive and view push/in-app notifications

### 💬 Chat
- Chat with parents of their students

### 📑 My Requests
- View status of submitted requests (leave, etc.)

### 👤 Profile
- View and edit own teacher profile

---

## 🔵 Role 5 — Student

> Academic self-service portal for the student.

### Features:

### 🏠 Dashboard
- Today's classes, attendance %, upcoming exams, recent homework, announcements

### 🏛️ My Classes
- View class details, classmates, subject teachers

### ✅ Attendance
- View own attendance summary
- **Attendance History** — Day-by-day attendance record

### 📖 Homework
- View assigned homework (subject, description, due date, status)

### 📝 Exam Management
- **My Exams** — View upcoming exam schedule

### 📊 Results
- View marks and results for completed exams

### 💰 Fees
- View own fee dues and payment history

### 📋 Leave Management
- **Apply Leave** — Submit leave application
- **My Leaves** — View leave history and approval status

### 🕐 Timetable
- View weekly class timetable

### 📆 Academic Calendar
- View school events, holidays, exam calendar

### 📣 Announcements
- View school-wide and class-specific announcements

### 🔔 Notifications
- In-app and push notification inbox

### 📑 My Requests
- Track submitted requests

### 👤 Profile
- View and edit own student profile

---

## 🟣 Role 6 — Parent

> Monitor and engage with the child's school life.

### Features:

### 🏠 Dashboard
- Child's attendance %, upcoming exams, recent homework, fee dues, announcements

### 👧 My Children
- View list of all linked children
- **Child Profile** — View detailed profile of each child

### ✅ Attendance
- View child's attendance records and history

### 📖 Homework
- View homework assigned to the child

### 📝 Exam Management
- **Exam Schedule** — View child's upcoming exam timetable
- **Exam Results** — View marks and results per exam

### 💰 Fee Management
- View fee dues and payment history
- **Fee Statement** — Detailed fee account statement

### 📋 Leave Management
- **Apply Leave** — Apply leave on behalf of child
- **Leave History** — View all leave applications and status

### 🕐 Timetable
- View child's class timetable

### 📆 Academic Calendar
- View school events and holidays

### 📣 Announcements
- View all school and class announcements

### 👩‍🏫 Teachers
- View teachers assigned to the child's class with contact info

### 🚌 Transport
- View child's bus route, vehicle, and driver details
- Track route information

### 🤝 PTM Booking
- View available PTM slots
- Book a meeting with teacher

### 🔔 Notifications
- Push and in-app notification inbox

### 💬 Chat
- Direct chat with the child's teachers

### 👤 Profile
- View and edit own parent profile

---

## ⚫ Role 7 — Driver

> Minimal role focused on transport duties.

### Features:

### 🏠 Dashboard
- View assigned route details
- View list of students on the route
- Route start / end status

### 🔔 Notifications
- Receive transport-related notifications

### 👤 Profile
- View and edit own driver profile

---

## 🌐 Shared Features (All / Multiple Roles)

These features are accessible across multiple roles:

| Feature | Roles |
|---------|-------|
| 💬 **Real-time Chat** | Teacher ↔ Parent, Principal ↔ Admin |
| 🔔 **Push Notifications** (PWA) | All roles |
| 📆 **Academic Calendar** | Teacher, Student, Parent, Principal |
| 📜 **Privacy Policy** | Public |
| 📜 **Terms of Service** | Public |
| 📝 **Data Rights Request** (DPDP) | Public |

---

## 🏗️ Backend Microservices

The backend is split into independent microservices:

| Service | Responsibility |
|---------|----------------|
| `sm-auth-services` | Login, JWT, role-based auth |
| `sm-user-service` | User CRUD, profiles |
| `sm-academics-service` | Classes, subjects, timetable, exams, homework, syllabus |
| `sm-payment-service` | Fees, receipts, payment records |
| `sm-notification-service` | Push notifications, in-app alerts |
| `sm-chat-service` | Real-time chat between roles |
| `sm-transport-service` | Routes, vehicles, driver assignments |
| `sm-platform-service` | Multi-tenant school config, menus, roles |

---

## 🔮 Phase 2 — Planned Features

Features planned for the next phase of development:

- **Lost & Found Module** — Lost items, found items, claimed status tracking
- **Student Health Records** — Blood group, allergies, medical history, vaccinations, emergency contacts
- **Visitor Management** — Gate entry register for parents, vendors, deliveries
- **Library Module** — Book issuance, returns, fines, reports
- **Inventory Module** — Track computers, benches, lab equipment, sports items
- **SMS / WhatsApp Integration** — Auto notifications for attendance, homework, fees, results, holidays
- **AI Features (USP)**:
  - AI Report Analysis (e.g., "Rahul's Math score dropped 12% vs last exam")
  - AI Question Paper Generator
  - AI Homework Generator
  - AI Lesson Planner
  - AI Timetable Optimizer

---

## ⚖️ Compliance

- **DPDP Act (India)** compliant — Privacy Policy, Terms of Service, and Data Rights Request pages are publicly accessible
- Role-based access control (RBAC) — every route is protected by role
- JWT-based authentication with token refresh

---

*Last Updated: August 2026*

