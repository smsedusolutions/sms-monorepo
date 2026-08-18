export interface AcademicYear {
    _id?: string;
    academicYearId: string;
    schoolId: string;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    status: 'active' | 'upcoming' | 'completed' | 'archived';
    description?: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAcademicYearRequest {
    name: string;
    code?: string;
    startDate: string;
    endDate: string;
    isCurrent?: boolean;
    status?: string;
    description?: string;
}

export interface UpdateAcademicYearRequest {
    name?: string;
    code?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    status?: string;
    description?: string;
}
