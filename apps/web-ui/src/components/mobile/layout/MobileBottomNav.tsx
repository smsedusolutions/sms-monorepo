import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import {
  Home,
  Users,
  CalendarCheck,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  FileCheck,
  School,
  Car,
  Bell,
  MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import TokenService from '../../../queries/token/tokenService';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  isMoreTrigger?: boolean;
}

interface MobileBottomNavProps {
  onOpenMore: () => void;
  isMoreOpen?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMore, isMoreOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = TokenService.getRole();

  const getNavItems = (): NavItem[] => {
    switch (userRole) {
      case 'parent':
        return [
          { id: 'home', label: 'Home', icon: Home, path: '/parent/dashboard' },
          { id: 'children', label: 'Children', icon: Users, path: '/parent/children' },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/parent/attendance' },
          { id: 'homework', label: 'Homework', icon: BookOpen, path: '/parent/homework' },
          { id: 'more', label: 'More', icon: MoreHorizontal, isMoreTrigger: true },
        ];
      case 'student':
        return [
          { id: 'home', label: 'Home', icon: Home, path: '/student/dashboard' },
          { id: 'timetable', label: 'Timetable', icon: Calendar, path: '/student/timetable' },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/student/attendance' },
          { id: 'homework', label: 'Homework', icon: BookOpen, path: '/student/homework' },
          { id: 'more', label: 'More', icon: MoreHorizontal, isMoreTrigger: true },
        ];
      case 'teacher':
        return [
          { id: 'home', label: 'Home', icon: Home, path: '/teacher/dashboard' },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/teacher/attendance' },
          { id: 'timetable', label: 'Timetable', icon: Calendar, path: '/teacher/timetable' },
          { id: 'homework', label: 'Homework', icon: BookOpen, path: '/teacher/homework' },
          { id: 'more', label: 'More', icon: MoreHorizontal, isMoreTrigger: true },
        ];
      case 'principal':
        return [
          { id: 'home', label: 'Home', icon: Home, path: '/principal/dashboard' },
          { id: 'approvals', label: 'Approvals', icon: FileCheck, path: '/principal/leave/teacher-requests' },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/principal/attendance' },
          { id: 'teachers', label: 'Teachers', icon: Users, path: '/principal/teachers' },
          { id: 'more', label: 'More', icon: MoreHorizontal, isMoreTrigger: true },
        ];
      case 'sch_admin':
        return [
          { id: 'home', label: 'Home', icon: Home, path: '/school-admin/dashboard' },
          { id: 'students', label: 'Students', icon: GraduationCap, path: '/school-admin/students' },
          { id: 'teachers', label: 'Teachers', icon: Users, path: '/school-admin/teachers' },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/school-admin/attendance' },
          { id: 'more', label: 'More', icon: MoreHorizontal, isMoreTrigger: true },
        ];
      case 'driver':
        return [
          { id: 'home', label: 'Home', icon: Home, path: '/driver/dashboard' },
          { id: 'routes', label: 'Bus Trip', icon: Car, path: '/driver/dashboard' },
          { id: 'notifications', label: 'Alerts', icon: Bell, path: '/driver/notifications' },
          { id: 'more', label: 'More', icon: MoreHorizontal, isMoreTrigger: true },
        ];
      case 'super_admin':
        return [
          { id: 'home', label: 'Home', icon: Home, path: '/super-admin/dashboard' },
          { id: 'schools', label: 'Schools', icon: School, path: '/super-admin/schools' },
          { id: 'users', label: 'Users', icon: Users, path: '/super-admin/users' },
          { id: 'roles', label: 'Roles', icon: Layers, path: '/super-admin/roles' },
          { id: 'more', label: 'More', icon: MoreHorizontal, isMoreTrigger: true },
        ];
      default:
        return [
          { id: 'home', label: 'Home', icon: Home, path: '/' },
          { id: 'more', label: 'More', icon: MoreHorizontal, isMoreTrigger: true },
        ];
    }
  };

  const navItems = getNavItems();

  const isItemActive = (item: NavItem): boolean => {
    if (item.isMoreTrigger) {
      return Boolean(isMoreOpen);
    }
    if (!item.path) return false;
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  };

  return (
    <nav className="mobile-glass-nav fixed bottom-0 left-0 right-0 z-40 w-full pb-safe">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
          height: '60px',
          alignItems: 'center',
          px: 1,
        }}
      >
        {navItems.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isMoreTrigger) {
                  onOpenMore();
                } else if (item.path) {
                  navigate(item.path);
                }
              }}
              className="relative flex flex-col items-center justify-center py-1 outline-none touch-active group"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
              aria-label={item.label}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 2,
                  py: 0.4,
                  borderRadius: '20px',
                  bgcolor: active ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                  transition: 'background-color 0.2s ease, transform 0.2s ease',
                  mb: 0.3,
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  color={active ? '#4f46e5' : '#64748b'}
                />
              </Box>

              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#4f46e5' : '#64748b',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                  transition: 'color 0.2s ease',
                  fontFamily: '"Outfit", sans-serif',
                }}
              >
                {item.label}
              </Typography>
            </button>
          );
        })}
      </Box>
    </nav>
  );
};

export default MobileBottomNav;
