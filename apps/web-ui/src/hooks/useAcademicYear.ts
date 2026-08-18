import { useMemo } from 'react';
import { useGetAcademicYears, useGetCurrentAcademicYear } from '../queries/AcademicYear';
import TokenService from '../queries/token/tokenService';

export const useAcademicYear = () => {
    const schoolId = TokenService.getSchoolId() || '';

    const { data: yearsData, isLoading: loadingYears } = useGetAcademicYears(schoolId);
    const { data: currentData, isLoading: loadingCurrent } = useGetCurrentAcademicYear(schoolId);

    const academicYears = useMemo(() => {
        const raw = yearsData?.data || [];
        // Ensure uniqueness by code
        const map = new Map();
        for (const yr of raw) {
            const key = yr.code || yr.name;
            if (!map.has(key)) {
                map.set(key, yr);
            }
        }
        return Array.from(map.values());
    }, [yearsData]);

    const currentAcademicYearObj = useMemo(() => {
        if (currentData?.data) return currentData.data;
        const found = academicYears.find(y => y.isCurrent);
        return found || academicYears.find(y => y.code === '2026-2027') || academicYears[0] || null;
    }, [currentData, academicYears]);

    const currentAcademicYear = useMemo(() => {
        return currentAcademicYearObj?.code || '2026-2027';
    }, [currentAcademicYearObj]);

    const academicYearOptions = useMemo(() => {
        const options = academicYears.map(y => ({
            label: y.isCurrent ? `${y.name} (Current)` : y.name,
            value: y.code,
            isCurrent: y.isCurrent,
            status: y.status
        }));
        return [
            ...options,
            { label: '+ Create Academic Year...', value: '__create_new__', status: 'action' }
        ];
    }, [academicYears]);

    const upcomingAcademicYears = useMemo(() => {
        return academicYears.filter(y => y.status === 'upcoming' || (!y.isCurrent && y.status !== 'completed' && y.status !== 'archived'));
    }, [academicYears]);

    const upcomingAcademicYearOptions = useMemo(() => {
        const options = upcomingAcademicYears.map(y => ({
            label: y.name,
            value: y.code,
            status: y.status
        }));
        return [
            ...options,
            { label: '+ Create Academic Year...', value: '__create_new__', status: 'action' }
        ];
    }, [upcomingAcademicYears]);

    const nextAcademicYear = useMemo(() => {
        const first = upcomingAcademicYears[0];
        if (first) return first.code;
        // Fallback next academic year calculated from current
        const parts = currentAcademicYear.split('-');
        if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
            return `${Number(parts[0]) + 1}-${Number(parts[1]) + 1}`;
        }
        return '2027-2028';
    }, [upcomingAcademicYears, currentAcademicYear]);

    return {
        academicYears,
        academicYearOptions,
        upcomingAcademicYears,
        upcomingAcademicYearOptions,
        currentAcademicYear,
        currentAcademicYearObj,
        nextAcademicYear,
        isLoading: loadingYears || loadingCurrent,
        schoolId
    };
};
