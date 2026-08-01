/**
 * Route Preloader Utility
 * Preloads page bundles on sidebar menu hover or menu render so route navigation is instant.
 */

export const routeImportMap: Record<string, () => Promise<unknown>> = {
  // Super Admin Pages
  '/super-admin/dashboard': () => import('../pages/SuperAdmin/Dashboard'),
  '/super-admin/schools': () => import('../pages/SuperAdmin/Schools'),
  '/super-admin/users': () => import('../pages/SuperAdmin/Users'),
  '/super-admin/menus': () => import('../pages/SuperAdmin/Menus'),
  '/super-admin/roles': () => import('../pages/SuperAdmin/RoleManagement'),

  // School Admin Pages
  '/school-admin/dashboard': () => import('../pages/SchoolAdmin/Dashboard'),
  '/school-admin/school': () => import('../pages/SchoolAdmin/School'),
  '/school-admin/classes': () => import('../pages/SchoolAdmin/Classes'),
  '/school-admin/subjects': () => import('../pages/SchoolAdmin/Subjects'),
  '/school-admin/teachers': () => import('../pages/SchoolAdmin/Teachers'),
  '/school-admin/students': () => import('../pages/SchoolAdmin/Students'),
  '/school-admin/parents': () => import('../pages/SchoolAdmin/Parents'),
  '/school-admin/requests': () => import('../pages/SchoolAdmin/Requests'),
  '/school-admin/attendance': () => import('../pages/SchoolAdmin/Attendance'),
  '/school-admin/leaverequest': () => import('../pages/SchoolAdmin/Leave/Requests'),
  '/school-admin/timetable/config': () => import('../pages/SchoolAdmin/Timetable/TimetableConfig'),
  '/school-admin/timetable/master': () => import('../pages/SchoolAdmin/Timetable/TimetableMaster'),
  '/school-admin/timetable/draft': () => import('../pages/SchoolAdmin/Timetable/TimetableDraftPreview'),
  '/school-admin/timetable/conflicts': () => import('../pages/SchoolAdmin/Timetable/ConflictManagement'),
  '/school-admin/timetable/substitutes': () => import('../pages/SchoolAdmin/Timetable/SubstituteManagement'),
  '/school-admin/exam/config': () => import('../pages/SchoolAdmin/Exam/ExamConfiguration'),
  '/school-admin/exam/scheduler': () => import('../pages/SchoolAdmin/Exam/ExamScheduler'),
  '/school-admin/announcements': () => import('../pages/SchoolAdmin/Announcements'),
  '/school-admin/email-templates': () => import('../pages/SchoolAdmin/EmailTemplates'),
  '/school-admin/notifications': () => import('../pages/SchoolAdmin/Notifications'),
  '/school-admin/transport': () => import('../pages/SchoolAdmin/Transport/TransportRoutes'),
  '/school-admin/transport/vehicles': () => import('../pages/SchoolAdmin/Transport/VehicleManagement'),
  '/school-admin/transport/drivers': () => import('../pages/SchoolAdmin/Transport/DriverManagement'),
  '/school-admin/location': () => import('../pages/SchoolAdmin/SchoolLocation'),
  '/school-admin/profile': () => import('../pages/SchoolAdmin/Profile'),
  '/school-admin/promotion': () => import('../pages/SchoolAdmin/Promotion'),

  // Fee Management Pages
  '/school-admin/fees/dashboard': () => import('../pages/SchoolAdmin/Fees/Dashboard'),
  '/school-admin/fees/categories': () => import('../pages/SchoolAdmin/Fees/Categories'),
  '/school-admin/fees/structures': () => import('../pages/SchoolAdmin/Fees/Structures'),
  '/school-admin/fees/assignments': () => import('../pages/SchoolAdmin/Fees/Assignments'),
  '/school-admin/fees/accounts': () => import('../pages/SchoolAdmin/Fees/Accounts'),
  '/school-admin/fees/payments': () => import('../pages/SchoolAdmin/Fees/PaymentCollection'),
  '/school-admin/fees/receipts': () => import('../pages/SchoolAdmin/Fees/Receipts'),
  '/school-admin/fees/reports': () => import('../pages/SchoolAdmin/Fees/Reports'),
  '/school-admin/fees/discounts': () => import('../pages/SchoolAdmin/Fees/Discounts'),

  // Teacher Pages
  '/teacher/dashboard': () => import('../pages/Teacher/Dashboard'),
  '/teacher/classes': () => import('../pages/Teacher/Classes'),
  '/teacher/students': () => import('../pages/Teacher/Students'),
  '/teacher/parents': () => import('../pages/Teacher/Parents'),
  '/teacher/attendance': () => import('../pages/Teacher/Attendance'),
  '/teacher/my-requests': () => import('../pages/Teacher/MyRequests'),
  '/teacher/leave/apply': () => import('../pages/Teacher/Leave/ApplyLeave'),
  '/teacher/leave/my': () => import('../pages/Teacher/Leave/MyLeaves'),
  '/teacher/leave/students': () => import('../pages/Teacher/Leave/StudentLeaves'),
  '/teacher/timetable': () => import('../pages/Teacher/Timetable/MyTimetable'),
  '/teacher/exam/marks': () => import('../pages/Teacher/Exam/MarksEntry'),
  '/teacher/exam/scheduler': () => import('../pages/Teacher/Exam/ExamScheduler'),
  '/teacher/homework': () => import('../pages/Teacher/Homework'),
  '/teacher/announcements': () => import('../pages/Teacher/Announcements'),
  '/teacher/notifications': () => import('../pages/Shared/Notifications'),
  '/teacher/chat': () => import('../pages/Shared/Chat/ChatPage'),
  '/teacher/profile': () => import('../pages/Teacher/Profile'),

  // Student Pages
  '/student/dashboard': () => import('../pages/Student/Dashboard'),
  '/student/classes': () => import('../pages/Student/Classes'),
  '/student/attendance': () => import('../pages/Student/Attendance'),
  '/student/attendance/history': () => import('../pages/Student/Attendance/History'),
  '/student/results': () => import('../pages/Student/Results'),
  '/student/my-requests': () => import('../pages/Student/MyRequests'),
  '/student/leave/apply': () => import('../pages/Student/Leave/ApplyLeave'),
  '/student/leave/my': () => import('../pages/Student/Leave/MyLeaves'),
  '/student/timetable': () => import('../pages/Student/Timetable/MyTimetable'),
  '/student/exam/my-exams': () => import('../pages/Student/Exam/MyExams'),
  '/student/homework': () => import('../pages/Student/Homework'),
  '/student/announcements': () => import('../pages/Student/Announcements'),
  '/student/notifications': () => import('../pages/Shared/Notifications'),
  '/student/profile': () => import('../pages/Student/Profile'),
  '/student/fees': () => import('../pages/Student/Fees'),

  // Parent Pages
  '/parent/dashboard': () => import('../pages/Parent/Dashboard'),
  '/parent/children': () => import('../pages/Parent/Children'),
  '/parent/announcements': () => import('../pages/Parent/Announcements'),
  '/parent/homework': () => import('../pages/Parent/Homework'),
  '/parent/attendance': () => import('../pages/Parent/Attendance'),
  '/parent/teachers': () => import('../pages/Parent/Teachers'),
  '/parent/timetable': () => import('../pages/Parent/Timetable'),
  '/parent/leave/apply': () => import('../pages/Parent/Leave/ApplyLeave'),
  '/parent/leave/history': () => import('../pages/Parent/Leave/History'),
  '/parent/exam/scheduler': () => import('../pages/Parent/Exam/Schedule'),
  '/parent/exam/results': () => import('../pages/Parent/Exam/Results'),
  '/parent/notifications': () => import('../pages/Shared/Notifications'),
  '/parent/transport': () => import('../pages/Parent/Transport/ParentTransport'),
  '/parent/fees': () => import('../pages/Parent/Fees'),
  '/parent/chat': () => import('../pages/Shared/Chat/ChatPage'),

  // Driver Pages
  '/driver/dashboard': () => import('../pages/Driver/DriverDashboard'),
  '/driver/profile': () => import('../pages/Teacher/Profile'),
  '/driver/notifications': () => import('../pages/Shared/Notifications'),
};

const preloadedPaths = new Set<string>();

/**
 * Preload a route component in the background.
 */
export const preloadRoute = (path?: string) => {
  if (!path || preloadedPaths.has(path)) return;
  const importer = routeImportMap[path];
  if (importer) {
    preloadedPaths.add(path);
    importer().catch(() => {
      preloadedPaths.delete(path);
    });
  }
};
