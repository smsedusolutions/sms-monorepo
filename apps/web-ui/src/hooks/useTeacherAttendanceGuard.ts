import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TokenService from '../queries/token/tokenService';
import { useGetSchoolById } from '../queries/School';
import { useGetTeacherStatus } from '../queries/Attendance';
import { checkIsWithinWorkingHours, checkIsTeacherCheckedIn } from '../utils/timeUtils';
import type { AppNoticeDialogProps } from '../components/shared/AppNoticeDialog';

export function useTeacherAttendanceGuard(schoolId?: string, onGoToCheckInTab?: () => void) {
  const navigate = useNavigate();
  const effectiveSchoolId = schoolId || TokenService.getSchoolId() || '';
  const { data: schoolData } = useGetSchoolById(effectiveSchoolId);
  const { data: statusData } = useGetTeacherStatus(effectiveSchoolId);

  const [noticeState, setNoticeState] = useState<AppNoticeDialogProps>({
    open: false,
    onClose: () => setNoticeState((prev) => ({ ...prev, open: false })),
    title: '',
    message: '',
  });

  const validateAction = (onSuccessAction?: () => void): boolean => {
    const role = TokenService.getRole();
    // Enforce strict checks specifically for teachers
    if (role !== 'teacher') {
      if (onSuccessAction) onSuccessAction();
      return true;
    }

    // Condition 1: Teacher Self Check-in Check
    const isCheckedIn = checkIsTeacherCheckedIn(statusData?.data);
    if (!isCheckedIn) {
      setNoticeState({
        open: true,
        onClose: () => setNoticeState((prev) => ({ ...prev, open: false })),
        type: 'warning',
        title: 'Teacher Check-in Required',
        message: 'You must check-in to school first before marking or updating student attendance.',
        primaryActionLabel: 'Check-in Now',
        onPrimaryAction: () => {
          setNoticeState((prev) => ({ ...prev, open: false }));
          if (onGoToCheckInTab) {
            onGoToCheckInTab();
          } else {
            navigate('/teacher/attendance?tab=my-attendance');
          }
        },
        secondaryActionLabel: 'Cancel',
      });
      return false;
    }

    // Condition 2: Working Hours Check (e.g. 08:00 - 16:00 -> 8 AM - 4 PM)
    const start = schoolData?.data?.attendanceSettings?.workingHours?.start || '08:00';
    const end = schoolData?.data?.attendanceSettings?.workingHours?.end || '16:00';
    const { isWithin, formattedRange } = checkIsWithinWorkingHours(start, end);

    if (!isWithin) {
      setNoticeState({
        open: true,
        onClose: () => setNoticeState((prev) => ({ ...prev, open: false })),
        type: 'warning',
        title: 'Outside School Working Hours',
        message: 'Student attendance can only be marked or updated during school working hours.',
        badgeText: `Working Hours: ${formattedRange}`,
        primaryActionLabel: 'Understood',
        onPrimaryAction: () => setNoticeState((prev) => ({ ...prev, open: false })),
      });
      return false;
    }

    if (onSuccessAction) {
      onSuccessAction();
    }
    return true;
  };

  return {
    validateAction,
    noticeState,
    setNoticeState,
  };
}

export default useTeacherAttendanceGuard;
