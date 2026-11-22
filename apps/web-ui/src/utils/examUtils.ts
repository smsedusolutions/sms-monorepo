/**
 * Exam Utilities
 * Dynamic date-based status evaluation and categorization for all roles.
 */

export const getEffectiveExamStatus = (
    exam: any,
    now: Date = new Date()
): 'completed' | 'ongoing' | 'scheduled' | 'draft' | 'published' => {
    if (!exam) return 'draft';
    const rawStatus = (exam.status || 'draft').toLowerCase();

    // Explicitly published or closed exams remain published / closed
    if (rawStatus === 'published' || rawStatus === 'closed') {
        return rawStatus;
    }

    if (rawStatus === 'completed') {
        return 'completed';
    }

    const nowTime = now.getTime();

    // 1. Check End Date - if past, it's completed
    if (exam.endDate) {
        const end = new Date(exam.endDate);
        if (!isNaN(end.getTime())) {
            // End of the day (23:59:59.999) of the end date
            const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
            if (nowTime > endOfDay.getTime()) {
                return 'completed';
            }
        }
    }

    // 2. Check Start Date
    if (exam.startDate) {
        const start = new Date(exam.startDate);
        if (!isNaN(start.getTime())) {
            const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
            if (nowTime < startOfDay.getTime()) {
                return rawStatus === 'draft' ? 'draft' : 'scheduled';
            }
            // If now >= startOfDay and now <= endOfDay:
            return 'ongoing';
        }
    }

    return rawStatus as any;
};

/**
 * Categorizes a list of exams into ongoing, upcoming, and completed based on their effective statuses.
 * Also attaches `status: effStatus` to each returned exam object.
 */
export const categorizeExams = (exams: any[]) => {
    const sortByStartDate = (a: any, b: any) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
    };

    const ongoing: any[] = [];
    const upcoming: any[] = [];
    const completed: any[] = [];

    (exams || []).forEach((e) => {
        const effStatus = getEffectiveExamStatus(e);
        const examWithEff = { ...e, status: effStatus, rawStatus: e.status };

        if (effStatus === 'ongoing') {
            ongoing.push(examWithEff);
        } else if (['completed', 'published', 'closed'].includes(effStatus)) {
            completed.push(examWithEff);
        } else {
            // 'scheduled', 'draft'
            upcoming.push(examWithEff);
        }
    });

    return {
        ongoing: ongoing.sort(sortByStartDate),
        upcoming: upcoming.sort(sortByStartDate),
        completed: completed.sort(sortByStartDate),
    };
};

/**
 * Returns the appropriate MUI color for an exam status.
 */
export const getExamStatusColor = (
    status: string
): 'success' | 'warning' | 'info' | 'default' | 'primary' => {
    switch (status?.toLowerCase()) {
        case 'ongoing':
            return 'success';
        case 'completed':
            return 'info';
        case 'published':
            return 'success';
        case 'scheduled':
            return 'warning';
        case 'draft':
            return 'warning';
        default:
            return 'default';
    }
};
