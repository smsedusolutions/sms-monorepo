import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRoleStore } from '../stores/roleStore';
import TokenService from '../queries/token/tokenService';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isCurrent?: boolean;
}

// Known custom human-friendly titles for route paths
const ROUTE_LABELS: Record<string, string> = {
  // Super Admin Routes
  '/super-admin/dashboard': 'Dashboard',
  '/super-admin/schools': 'Schools',
  '/super-admin/users': 'Users',
  '/super-admin/menus': 'Menu Management',
  '/super-admin/roles': 'Role Management',

  // School Admin Routes
  '/school-admin/dashboard': 'Dashboard',
  '/school-admin/school': 'School Info',
  '/school-admin/classes': 'Classes',
  '/school-admin/subjects': 'Subjects',
  '/school-admin/teachers': 'Teachers',
  '/school-admin/students': 'Students',
  '/school-admin/parents': 'Parents',
  '/school-admin/requests': 'Requests',
  '/school-admin/attendance': 'Attendance',
  '/school-admin/leaverequest': 'Leave Requests',
  '/school-admin/announcements': 'Announcements',
  '/school-admin/email-templates': 'Email Templates',
  '/school-admin/notifications': 'Notifications',
  '/school-admin/location': 'School Location',
  '/school-admin/profile': 'My Profile',
  '/school-admin/promotion': 'Student Promotion',
  '/school-admin/ptm': 'PTM',
  '/school-admin/calendar': 'Calendar',

  // Timetable
  '/school-admin/timetable': 'Timetable',
  '/school-admin/timetable/config': 'Timetable Setup',
  '/school-admin/timetable/master': 'Master Timetable',
  '/school-admin/timetable/draft': 'Draft Preview',
  '/school-admin/timetable/conflicts': 'Conflict Management',
  '/school-admin/timetable/substitutes': 'Substitute Management',

  // Transport
  '/school-admin/transport': 'Transport',
  '/school-admin/transport/vehicles': 'Vehicles',
  '/school-admin/transport/drivers': 'Drivers',

  // Exam
  '/school-admin/exam': 'Exam Management',
  '/school-admin/exam/config': 'Exam Configuration',
  '/school-admin/exam/scheduler': 'Exam Scheduler',

  // Fee Management
  '/school-admin/fees': 'Fee Management',
  '/school-admin/fees/dashboard': 'Fee Dashboard',
  '/school-admin/fees/categories': 'Fee Categories',
  '/school-admin/fees/structures': 'Fee Structures',
  '/school-admin/fees/assignments': 'Student Assignments',
  '/school-admin/fees/accounts': 'Fee Accounts',
  '/school-admin/fees/payments': 'Payment Collection',
  '/school-admin/fees/receipts': 'Receipts',
  '/school-admin/fees/reports': 'Fee Reports',
  '/school-admin/fees/discounts': 'Discounts',

  // Teacher Routes
  '/teacher/dashboard': 'Dashboard',
  '/teacher/classes': 'My Classes',
  '/teacher/students': 'My Students',
  '/teacher/parents': 'Parents',
  '/teacher/attendance': 'Attendance',
  '/teacher/my-requests': 'My Requests',
  '/teacher/leave': 'Leave',
  '/teacher/leave/apply': 'Apply Leave',
  '/teacher/leave/my': 'My Leaves',
  '/teacher/leave/students': 'Student Leaves',
  '/teacher/timetable': 'My Timetable',
  '/teacher/exam': 'Exam',
  '/teacher/exam/marks': 'Marks Entry',
  '/teacher/exam/scheduler': 'Exam Schedule',
  '/teacher/homework': 'Homework',
  '/teacher/homework/create': 'Create Homework',
  '/teacher/ptm': 'PTM',
  '/teacher/calendar': 'Calendar',
  '/teacher/announcements': 'Announcements',
  '/teacher/notifications': 'Notifications',
  '/teacher/profile': 'My Profile',

  // Student Routes
  '/student/dashboard': 'Dashboard',
  '/student/classes': 'My Classes',
  '/student/attendance': 'Attendance',
  '/student/attendance/history': 'Attendance History',
  '/student/results': 'Exam Results',
  '/student/my-requests': 'My Requests',
  '/student/leave': 'Leave',
  '/student/leave/apply': 'Apply Leave',
  '/student/leave/my': 'My Leaves',
  '/student/timetable': 'My Timetable',
  '/student/calendar': 'Calendar',
  '/student/exam': 'Exam',
  '/student/exam/my-exams': 'My Exams',
  '/student/homework': 'Homework',
  '/student/announcements': 'Announcements',
  '/student/notifications': 'Notifications',
  '/student/profile': 'My Profile',
  '/student/fees': 'Fee Details',

  // Parent Routes
  '/parent/dashboard': 'Dashboard',
  '/parent/children': 'My Children',
  '/parent/announcements': 'Announcements',
  '/parent/homework': 'Homework',
  '/parent/attendance': 'Attendance',
  '/parent/teachers': 'Teachers',
  '/parent/timetable': 'Timetable',
  '/parent/calendar': 'Calendar',
  '/parent/ptm': 'PTM',
  '/parent/leave': 'Leave',
  '/parent/leave/apply': 'Apply Leave',
  '/parent/leave/history': 'Leave History',
  '/parent/exam': 'Exam',
  '/parent/exam/scheduler': 'Exam Schedule',
  '/parent/exam/results': 'Exam Results',
  '/parent/notifications': 'Notifications',
  '/parent/transport': 'Transport Info',
  '/parent/fees': 'Fees',

  // Principal Routes
  '/principal/dashboard': 'Dashboard',
  '/principal/teachers': 'Teachers',
  '/principal/students': 'Students',
  '/principal/attendance': 'Attendance',
  '/principal/timetable': 'Timetable',
  '/principal/timetable/review': 'Timetable Review',
  '/principal/calendar': 'Calendar',
  '/principal/exam': 'Exam',
  '/principal/exam/approval': 'Exam Approval',
  '/principal/exam/results': 'Exam Results',
  '/principal/leave': 'Leave',
  '/principal/leave/teacher-requests': 'Teacher Leave Requests',
  '/principal/announcements': 'Announcements',
  '/principal/notifications': 'Notifications',
  '/principal/profile': 'My Profile',

  // Driver Routes
  '/driver/dashboard': 'Dashboard',
  '/driver/profile': 'My Profile',
  '/driver/notifications': 'Notifications',
};

// Paths that are purely collapsible sidebar menu headers (not standalone page routes)
const NON_LINKABLE_CATEGORY_PATHS = new Set([
  // School Admin
  '/school-admin/timetable',
  '/school-admin/transport',
  '/school-admin/exam',
  '/school-admin/fees',

  // Teacher
  '/teacher/exam',
  '/teacher/leave',
  '/teacher/homework',

  // Student
  '/student/exam',
  '/student/leave',

  // Parent
  '/parent/exam',
  '/parent/leave',
]);

/**
 * Reusable hook to generate breadcrumbs dynamically based on the current location.
 * Provides breadcrumbs array and helper metadata.
 */
export const useBreadcrumbs = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { getBasePath } = useRoleStore();

  const userRole = user?.role || TokenService.getRole() || '';

  // Determine role base path
  let basePath = getBasePath(userRole);
  if (!basePath) {
    const defaultPaths: Record<string, string> = {
      super_admin: '/super-admin',
      sch_admin: '/school-admin',
      teacher: '/teacher',
      student: '/student',
      parent: '/parent',
      driver: '/driver',
    };
    basePath = defaultPaths[userRole] || '';
  }

  const dashboardPath = `${basePath}/dashboard`;
  const pathname = location.pathname;

  const items: BreadcrumbItem[] = [];

  const isDashboard =
    pathname === dashboardPath ||
    pathname === `${basePath}` ||
    pathname === `${basePath}/`;

  // Always start breadcrumbs with "Dashboard"
  items.push({
    label: 'Dashboard',
    path: dashboardPath,
    isCurrent: isDashboard,
  });

  if (isDashboard) {
    return { items, isDashboard: true, dashboardPath, currentPath: pathname };
  }

  // Split current pathname into segments
  const rawSegments = pathname.split('/').filter(Boolean);

  let currentAccumulatedPath = '';

  for (let i = 0; i < rawSegments.length; i++) {
    currentAccumulatedPath += `/${rawSegments[i]}`;

    // Skip role prefix (e.g. /school-admin)
    if (currentAccumulatedPath === basePath) {
      continue;
    }

    // Skip dashboard path as it's already added as root
    if (currentAccumulatedPath === dashboardPath) {
      continue;
    }

    const isLast = i === rawSegments.length - 1;

    // Resolve human-readable label
    let label = ROUTE_LABELS[currentAccumulatedPath];

    if (!label) {
      const raw = rawSegments[i];
      if (raw.toLowerCase() === 'ptm') {
        label = 'PTM';
      } else {
        label = raw
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
      }
    }

    // If it's the current page (isLast) or a non-linkable menu folder (e.g. /teacher/exam), don't provide a clickable path
    const isCategoryHeader = NON_LINKABLE_CATEGORY_PATHS.has(currentAccumulatedPath);
    const itemPath = (isLast || isCategoryHeader) ? undefined : currentAccumulatedPath;

    items.push({
      label,
      path: itemPath,
      isCurrent: isLast,
    });
  }

  return { items, isDashboard: false, dashboardPath, currentPath: pathname };
};
