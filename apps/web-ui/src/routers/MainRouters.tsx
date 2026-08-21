import { lazy, Suspense } from "react";
import { Route, Routes, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./RouterProtect";
import { ChildSelectorProvider } from "../context/ChildSelectorContext";
import PageSkeleton from "../components/shared/PageSkeleton";
import { useRoleStore } from "../stores/roleStore";
import TokenService from "../queries/token/tokenService";

// Public Pages
const LoginPage = lazy(() => import("../pages/LoginPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("../pages/UnauthorizedPage"));
const CreateSuperAdminSecret = lazy(() => import("../pages/SuperAdmin/CreateSuperAdminSecret"));

// Legal / DPDP Compliance Pages
const PrivacyPolicy = lazy(() => import("../pages/Legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("../pages/Legal/TermsOfService"));
const DataRightsRequest = lazy(() => import("../pages/Legal/DataRightsRequest"));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import("../pages/SuperAdmin/Dashboard"));
const Schools = lazy(() => import("../pages/SuperAdmin/Schools"));
const Users = lazy(() => import("../pages/SuperAdmin/Users"));
const Menus = lazy(() => import("../pages/SuperAdmin/Menus"));
const RoleManagement = lazy(() => import("../pages/SuperAdmin/RoleManagement"));

// School Admin Pages
const SchoolAdminDashboard = lazy(() => import("../pages/SchoolAdmin/Dashboard"));
const School = lazy(() => import("../pages/SchoolAdmin/School"));
const Teachers = lazy(() => import("../pages/SchoolAdmin/Teachers"));
const SchoolAdminStudents = lazy(() => import("../pages/SchoolAdmin/Students"));
const SchoolAdminNotificationsPage = lazy(() => import("../pages/SchoolAdmin/Notifications"));
const Parents = lazy(() => import("../pages/SchoolAdmin/Parents"));
const SchoolLocation = lazy(() => import("../pages/SchoolAdmin/SchoolLocation"));
const SchoolAdminProfile = lazy(() => import("../pages/SchoolAdmin/Profile"));
const Requests = lazy(() => import("../pages/SchoolAdmin/Requests"));
const SchoolAdminClasses = lazy(() => import("../pages/SchoolAdmin/Classes"));
const SchoolAdminSubjects = lazy(() => import("../pages/SchoolAdmin/Subjects"));
const SchoolAdminAttendance = lazy(() => import("../pages/SchoolAdmin/Attendance"));
const SchoolAdminLeaveRequests = lazy(() => import("../pages/SchoolAdmin/Leave/Requests"));
const SchoolAdminTransport = lazy(() => import("../pages/SchoolAdmin/Transport/TransportRoutes"));
const VehicleManagement = lazy(() => import("../pages/SchoolAdmin/Transport/VehicleManagement"));
const DriverManagement = lazy(() => import("../pages/SchoolAdmin/Transport/DriverManagement"));
const SchoolAdminPromotion = lazy(() => import("../pages/SchoolAdmin/Promotion"));
const SchoolAdminPrincipal = lazy(() => import("../pages/SchoolAdmin/Principal"));

// Fee Management Pages
const FeeDashboard = lazy(() => import("../pages/SchoolAdmin/Fees/Dashboard"));
const FeeCategories = lazy(() => import("../pages/SchoolAdmin/Fees/Categories"));
const FeeStructures = lazy(() => import("../pages/SchoolAdmin/Fees/Structures"));
const StudentFeeAssignment = lazy(() => import("../pages/SchoolAdmin/Fees/Assignments"));
const FeeAccounts = lazy(() => import("../pages/SchoolAdmin/Fees/Accounts"));
const PaymentCollection = lazy(() => import("../pages/SchoolAdmin/Fees/PaymentCollection"));
const Receipts = lazy(() => import("../pages/SchoolAdmin/Fees/Receipts"));
const FeeReports = lazy(() => import("../pages/SchoolAdmin/Fees/Reports"));
const FeeDiscounts = lazy(() => import("../pages/SchoolAdmin/Fees/Discounts"));

// Student / Parent Portal Fees
const ParentFees = lazy(() => import("../pages/Parent/Fees"));
const StudentFees = lazy(() => import("../pages/Student/Fees"));

// Driver Pages
const DriverDashboard = lazy(() => import("../pages/Driver/DriverDashboard"));


const TimetableConfig = lazy(() => import("../pages/SchoolAdmin/Timetable/TimetableConfig"));
const TimetableMaster = lazy(() => import("../pages/SchoolAdmin/Timetable/TimetableMaster"));
const TimetableDraftPreview = lazy(() => import("../pages/SchoolAdmin/Timetable/TimetableDraftPreview"));
const ConflictManagement = lazy(() => import("../pages/SchoolAdmin/Timetable/ConflictManagement"));
const SubstituteManagement = lazy(() => import("../pages/SchoolAdmin/Timetable/SubstituteManagement"));

const SchoolAdminAnnouncements = lazy(() => import("../pages/SchoolAdmin/Announcements"));
const EmailTemplateList = lazy(() => import("../pages/SchoolAdmin/EmailTemplates"));
const EmailTemplateEditor = lazy(() => import("../pages/SchoolAdmin/EmailTemplates/Editor"));
const ExamConfiguration = lazy(() => import("../pages/SchoolAdmin/Exam/ExamConfiguration"));
const ExamScheduler = lazy(() => import("../pages/SchoolAdmin/Exam/ExamScheduler"));
const Gradebook = lazy(() => import("../pages/SchoolAdmin/Exam/Gradebook"));
const FeeDefaulterList = lazy(() => import("../pages/SchoolAdmin/Fees/Reports/DefaulterList"));
const SchoolCalendar = lazy(() => import("../pages/SchoolAdmin/Calendar/SchoolCalendar"));
const AcademicCalendar = lazy(() => import("../pages/Shared/Calendar/AcademicCalendar"));
const PTMManagement = lazy(() => import("../pages/SchoolAdmin/PTM/PTMManagement"));
const DisciplineRecord = lazy(() => import("../pages/SchoolAdmin/Students/DisciplineRecord"));

// Teacher Pages
const TeacherDashboard = lazy(() => import("../pages/Teacher/Dashboard"));
const TeacherClasses = lazy(() => import("../pages/Teacher/Classes"));
const TeacherStudents = lazy(() => import("../pages/Teacher/Students"));
const TeacherParents = lazy(() => import("../pages/Teacher/Parents"));
const TeacherAttendance = lazy(() => import("../pages/Teacher/Attendance"));
const TeacherProfile = lazy(() => import("../pages/Teacher/Profile"));
const TeacherMyRequests = lazy(() => import("../pages/Teacher/MyRequests"));
const TeacherHomework = lazy(() => import("../pages/Teacher/Homework"));
const CreateHomework = lazy(() => import("../pages/Teacher/Homework/CreateHomework"));
const TeacherPTMSchedule = lazy(() => import("../pages/Teacher/PTM/MyPTMSchedule"));
const TeacherAnnouncements = lazy(() => import("../pages/Teacher/Announcements"));
const TeacherApplyLeave = lazy(() => import("../pages/Teacher/Leave/ApplyLeave"));
const TeacherMyLeaves = lazy(() => import("../pages/Teacher/Leave/MyLeaves"));
const TeacherStudentLeaves = lazy(() => import("../pages/Teacher/Leave/StudentLeaves"));
const TeacherTimetable = lazy(() => import("../pages/Teacher/Timetable/MyTimetable"));
const MarksEntry = lazy(() => import("../pages/Teacher/Exam/MarksEntry"));
const TeacherExamScheduler = lazy(() => import("../pages/Teacher/Exam/ExamScheduler"));

// Principal Pages
const PrincipalDashboard = lazy(() => import("../pages/Principal/Dashboard"));
const PrincipalTeacherLeaveApprovals = lazy(() => import("../pages/Principal/Leave/TeacherLeaveApprovals"));
const PrincipalTimetableReview = lazy(() => import("../pages/Principal/Timetable/TimetableReview"));
const PrincipalExamApproval = lazy(() => import("../pages/Principal/Exam/ExamApproval"));
const PrincipalExamResults = lazy(() => import("../pages/Principal/Exam/ExamResults"));
const PrincipalAttendance = lazy(() => import("../pages/Principal/Attendance"));
const PrincipalTeachers = lazy(() => import("../pages/Principal/Teachers"));
const PrincipalStudents = lazy(() => import("../pages/Principal/Students"));
const PrincipalAnnouncements = lazy(() => import("../pages/Principal/Announcements"));
const PrincipalProfile = lazy(() => import("../pages/Principal/Profile"));

// Student Pages
const StudentDashboard = lazy(() => import("../pages/Student/Dashboard"));
const StudentClasses = lazy(() => import("../pages/Student/Classes"));
const StudentAttendance = lazy(() => import("../pages/Student/Attendance"));
const StudentAttendanceHistory = lazy(() => import("../pages/Student/Attendance/History"));
const StudentResults = lazy(() => import("../pages/Student/Results"));
const StudentProfile = lazy(() => import("../pages/Student/Profile"));
const StudentMyRequests = lazy(() => import("../pages/Student/MyRequests"));
const StudentApplyLeave = lazy(() => import("../pages/Student/Leave/ApplyLeave"));
const StudentMyLeaves = lazy(() => import("../pages/Student/Leave/MyLeaves"));
const StudentHomework = lazy(() => import("../pages/Student/Homework"));
const StudentAnnouncements = lazy(() => import("../pages/Student/Announcements"));
const StudentTimetable = lazy(() => import("../pages/Student/Timetable/MyTimetable"));
const MyExams = lazy(() => import("../pages/Student/Exam/MyExams"));

// Parent Pages
const ParentDashboard = lazy(() => import("../pages/Parent/Dashboard"));
const ParentChildren = lazy(() => import("../pages/Parent/Children"));
const ChildProfile = lazy(() => import("../pages/Parent/Children/Profile"));
const ParentAnnouncements = lazy(() => import("../pages/Parent/Announcements"));
const ParentHomework = lazy(() => import("../pages/Parent/Homework"));
const ParentAttendance = lazy(() => import("../pages/Parent/Attendance"));
const ParentTeachers = lazy(() => import("../pages/Parent/Teachers"));
const ParentTimetable = lazy(() => import("../pages/Parent/Timetable"));
const ParentApplyLeave = lazy(() => import("../pages/Parent/Leave/ApplyLeave"));
const ParentLeaveHistory = lazy(() => import("../pages/Parent/Leave/History"));
const ParentExamSchedule = lazy(() => import("../pages/Parent/Exam/Schedule"));
const ParentExamResults = lazy(() => import("../pages/Parent/Exam/Results"));
const ParentTransport = lazy(() => import("../pages/Parent/Transport/ParentTransport"));
const PTMBooking = lazy(() => import("../pages/Parent/PTM/PTMBooking"));
const ParentFeeStatement = lazy(() => import("../pages/Parent/Fees/FeeStatement"));

// Shared Pages
const NotificationsPage = lazy(() => import("../pages/Shared/Notifications"));
const ChatPage = lazy(() => import("../pages/Shared/Chat/ChatPage"));

const MainRouters = () => {
  const { getBasePath } = useRoleStore();
  const userRole = TokenService.getRole();

  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route
          path="/"
          element={
            (() => {
              if (!userRole) return <Navigate to="/login" replace />;

              const basePath = getBasePath(userRole);
              if (basePath) {
                return <Navigate to={`${basePath}/dashboard`} replace />;
              }

              // Hardcoded fallback for standard roles if store is not yet initialized
              const standardPaths: Record<string, string> = {
                'super_admin': '/super-admin',
                'sch_admin': '/school-admin',
                'teacher': '/teacher',
                'student': '/student',
                'parent': '/parent',
                'driver': '/driver',
                'principal': '/principal',
              };

              const fallback = standardPaths[userRole];
              if (fallback) {
                return <Navigate to={`${fallback}/dashboard`} replace />;
              }

              // If we have a role but still no path, roles might be loading
              return <PageSkeleton />;
            })()
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/secret-setup-super-admin" element={<CreateSuperAdminSecret />} />

        {/* Legal / DPDP Compliance Routes — public, no authentication required */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/data-rights" element={<DataRightsRequest />} />
        <Route path="/dataright" element={<DataRightsRequest />} />
        <Route path="/datarights" element={<DataRightsRequest />} />

        {/* Super Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
          <Route
            path="/super-admin/dashboard"
            element={<SuperAdminDashboard />}
          />
          <Route path="/super-admin/schools" element={<Schools />} />
          <Route path="/super-admin/users" element={<Users />} />
          <Route path="/super-admin/menus" element={<Menus />} />
          <Route path="/super-admin/roles" element={<RoleManagement />} />
        </Route>

        {/* School Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["sch_admin"]} />}>
          <Route
            path="/school-admin/dashboard"
            element={<SchoolAdminDashboard />}
          />
          <Route path="/school-admin/school" element={<School />} />
          <Route path="/school-admin/classes" element={<SchoolAdminClasses />} />
          <Route
            path="/school-admin/subjects"
            element={<SchoolAdminSubjects />}
          />
          <Route path="/school-admin/teachers" element={<Teachers />} />
          <Route
            path="/school-admin/students"
            element={<SchoolAdminStudents />}
          />
          <Route path="/school-admin/parents" element={<Parents />} />
          <Route path="/school-admin/requests" element={<Requests />} />
          <Route
            path="/school-admin/attendance"
            element={<SchoolAdminAttendance />}
          />
          <Route
            path="/school-admin/leaverequest"
            element={<SchoolAdminLeaveRequests />}
          />
          <Route
            path="/school-admin/timetable/config"
            element={<TimetableConfig />}
          />
          <Route
            path="/school-admin/timetable/master"
            element={<TimetableMaster />}
          />
          <Route
            path="/school-admin/timetable/draft"
            element={<TimetableDraftPreview />}
          />
          <Route
            path="/school-admin/timetable/conflicts"
            element={<ConflictManagement />}
          />
          <Route
            path="/school-admin/timetable/substitutes"
            element={<SubstituteManagement />}
          />

          {/* Exam Management Routes (Admin) */}
          <Route path="/school-admin/exam/config" element={<ExamConfiguration />} />
          <Route path="/school-admin/exam/scheduler" element={<ExamScheduler />} />
          <Route path="/school-admin/exam/results" element={<PrincipalExamResults />} />

          {/* Announcements Routes (Admin) */}
          <Route path="/school-admin/announcements" element={<SchoolAdminAnnouncements />} />

          {/* Email Templates Routes (Admin) */}
          <Route path="/school-admin/email-templates" element={<EmailTemplateList />} />
          <Route path="/school-admin/email-templates/:id" element={<EmailTemplateEditor />} />

          {/* Notifications & Activity Logs */}
          <Route path="/school-admin/notifications" element={<SchoolAdminNotificationsPage />} />

          {/* Transport Management */}
          <Route path="/school-admin/transport" element={<SchoolAdminTransport />} />
          <Route path="/school-admin/transport/vehicles" element={<VehicleManagement />} />
          <Route path="/school-admin/transport/drivers" element={<DriverManagement />} />

          <Route path="/school-admin/location" element={<SchoolLocation />} />
          <Route path="/school-admin/profile" element={<SchoolAdminProfile />} />
          <Route path="/school-admin/promotion" element={<SchoolAdminPromotion />} />
          <Route path="/school-admin/principal" element={<SchoolAdminPrincipal />} />

          {/* Fee Management Routes */}
          <Route path="/school-admin/fees/dashboard" element={<FeeDashboard />} />
          <Route path="/school-admin/fees/categories" element={<FeeCategories />} />
          <Route path="/school-admin/fees/structures" element={<FeeStructures />} />
          <Route path="/school-admin/fees/assignments" element={<StudentFeeAssignment />} />
          <Route path="/school-admin/fees/accounts" element={<FeeAccounts />} />
          <Route path="/school-admin/fees/payments" element={<PaymentCollection />} />
          <Route path="/school-admin/fees/receipts" element={<Receipts />} />
          <Route path="/school-admin/fees/reports" element={<FeeReports />} />
          <Route path="/school-admin/fees/discounts" element={<FeeDiscounts />} />
          <Route path="/school-admin/fees/defaulters" element={<FeeDefaulterList />} />

          {/* Calendar */}
          <Route path="/school-admin/calendar" element={<SchoolCalendar />} />

          {/* PTM Management */}
          <Route path="/school-admin/ptm" element={<PTMManagement />} />

          {/* Discipline Records */}
          <Route path="/school-admin/students/discipline" element={<DisciplineRecord />} />

          {/* Gradebook */}
          <Route path="/school-admin/exam/gradebook" element={<Gradebook />} />
        </Route>

        {/* Teacher Routes */}
        <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/classes" element={<TeacherClasses />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/parents" element={<TeacherParents />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/my-requests" element={<TeacherMyRequests />} />
          <Route path="/teacher/leave/apply" element={<TeacherApplyLeave />} />
          <Route path="/teacher/leave/my" element={<TeacherMyLeaves />} />
          <Route path="/teacher/leave/students" element={<TeacherStudentLeaves />} />
          <Route path="/teacher/timetable" element={<TeacherTimetable />} />
          <Route path="/teacher/exam/marks" element={<MarksEntry />} />
          <Route path="/teacher/exam/scheduler" element={<TeacherExamScheduler />} />

          {/* Homework Routes (Teacher) */}
          <Route path="/teacher/homework" element={<TeacherHomework />} />
          <Route path="/teacher/homework/create" element={<CreateHomework />} />

          {/* PTM Schedule (Teacher) */}
          <Route path="/teacher/ptm" element={<TeacherPTMSchedule />} />

          {/* Academic Calendar (Teacher) */}
          <Route path="/teacher/calendar" element={<AcademicCalendar />} />

          {/* Announcements Routes (Teacher) */}
          <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />

          {/* Notifications */}
          <Route path="/teacher/notifications" element={<NotificationsPage />} />

          {/* Chat Route */}
          <Route path="/teacher/chat" element={<ChatPage />} />

          <Route path="/teacher/profile" element={<TeacherProfile />} />
        </Route>

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/classes" element={<StudentClasses />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route
            path="/student/attendance/history"
            element={<StudentAttendanceHistory />}
          />
          <Route path="/student/results" element={<StudentResults />} />
          <Route path="/student/my-requests" element={<StudentMyRequests />} />
          <Route path="/student/leave/apply" element={<StudentApplyLeave />} />
          <Route path="/student/leave/my" element={<StudentMyLeaves />} />
          <Route path="/student/timetable" element={<StudentTimetable />} />
          <Route path="/student/calendar" element={<AcademicCalendar />} />
          <Route path="/student/exam/my-exams" element={<MyExams />} />
          <Route path="/student/homework" element={<StudentHomework />} />
          <Route path="/student/announcements" element={<StudentAnnouncements />} />
          <Route path="/student/notifications" element={<NotificationsPage />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/fees" element={<StudentFees />} />
        </Route>

        {/* Parent Routes */}
        <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
          <Route element={<ChildSelectorProvider><Outlet /></ChildSelectorProvider>}>
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/parent/children" element={<ParentChildren />} />
            <Route path="/parent/children/:studentId" element={<ChildProfile />} />
            <Route path="/parent/announcements" element={<ParentAnnouncements />} />
            <Route path="/parent/homework" element={<ParentHomework />} />
            <Route path="/parent/attendance" element={<ParentAttendance />} />
            <Route path="/parent/teachers" element={<ParentTeachers />} />
            <Route path="/parent/timetable" element={<ParentTimetable />} />
            <Route path="/parent/calendar" element={<AcademicCalendar />} />
            <Route path="/parent/leave/apply" element={<ParentApplyLeave />} />
            <Route path="/parent/leave/history" element={<ParentLeaveHistory />} />
            <Route path="/parent/exam/scheduler" element={<ParentExamSchedule />} />
            <Route path="/parent/exam/results" element={<ParentExamResults />} />
            <Route path="/parent/notifications" element={<NotificationsPage />} />
            <Route path="/parent/transport" element={<ParentTransport />} />
            <Route path="/parent/fees" element={<ParentFees />} />
            <Route path="/parent/fees/statement" element={<ParentFeeStatement />} />
            <Route path="/parent/ptm" element={<PTMBooking />} />
            <Route path="/parent/chat" element={<ChatPage />} />
          </Route>
        </Route>

        {/* Principal Routes */}
        <Route element={<ProtectedRoute allowedRoles={["principal"]} />}>
          <Route path="/principal" element={<Navigate to="/principal/dashboard" replace />} />
          <Route path="/principal/dashboard" element={<PrincipalDashboard />} />
          <Route path="/principal/leave/teacher-requests" element={<PrincipalTeacherLeaveApprovals />} />
          <Route path="/principal/timetable/review" element={<PrincipalTimetableReview />} />
          <Route path="/principal/exam/approval" element={<PrincipalExamApproval />} />
          <Route path="/principal/exam/results" element={<PrincipalExamResults />} />
          <Route path="/principal/attendance" element={<PrincipalAttendance />} />
          <Route path="/principal/calendar" element={<AcademicCalendar />} />
          <Route path="/principal/teachers" element={<PrincipalTeachers />} />
          <Route path="/principal/students" element={<PrincipalStudents />} />
          <Route path="/principal/announcements" element={<PrincipalAnnouncements />} />
          <Route path="/principal/notifications" element={<NotificationsPage />} />
          <Route path="/principal/chat" element={<ChatPage />} />
          <Route path="/principal/profile" element={<PrincipalProfile />} />
        </Route>

        {/* Driver Routes */}
        <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/profile" element={<TeacherProfile />} /> {/* Reuse profile for now */}
          <Route path="/driver/notifications" element={<NotificationsPage />} />
        </Route>

        {/* 404 Not Found - Catch All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default MainRouters;
