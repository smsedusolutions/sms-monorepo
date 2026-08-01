import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserStore, UserProfile, SchoolInfo } from '../types/user';
import useApi from '../queries/useApi';
import TokenService from '../queries/token/tokenService';

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            school: null,
            isLoading: false,
            error: null,

            // Actions
            setUser: (user) => set({ user }),

            setSchool: (school) => set({ school }),

            fetchProfile: async (force = false) => {
                if (!force && (get().user || get().isLoading)) return;
                set({ isLoading: true, error: null });

                try {
                    const role = TokenService.getRole();
                    const userId = TokenService.getUserId();
                    const schoolId = TokenService.getSchoolId();

                    if (!role || !userId) {
                        throw new Error('User not authenticated');
                    }

                    // Select the correct API path based on role
                    let path = '';
                    if (role === 'sch_admin') {
                        path = `/api/admin/user/get-user/${userId}`;
                    } else if (role === 'super_admin') {
                        // Super admin currently doesn't have a specific profile API in platform-service
                        // We rely on token data for name/email
                        set({ isLoading: false });
                        return;
                    } else if (role === 'student' && schoolId) {
                        path = `/api/school/${schoolId}/students/${userId}`;
                    } else if (role === 'teacher' && schoolId) {
                        path = `/api/school/${schoolId}/teachers/${userId}`;
                    } else if (role === 'parent' && schoolId) {
                        path = `/api/school/${schoolId}/parents/${userId}`;
                    } else if (role === 'driver' && schoolId) {
                        path = `/api/school/${schoolId}/drivers/${userId}`;
                    } else {
                        // If we don't have a path, just stop
                        set({ isLoading: false });
                        return;
                    }

                    // Fetch user profile and school info in parallel
                    const profilePromise = useApi<{
                        success: boolean;
                        data: any;
                    }>('GET', path);

                    const schoolPromise = schoolId
                        ? useApi<{ success: boolean; data: any }>('GET', `/api/admin/school/get-school/${schoolId}`).catch((err) => {
                            console.warn('Failed to fetch full school details:', err);
                            return null;
                        })
                        : Promise.resolve(null);

                    const [response, schoolResponse] = await Promise.all([profilePromise, schoolPromise]);

                    if (response.success && response.data) {
                        const userData = response.data;
                        const effectiveSchoolId = schoolId || userData.schoolId;

                        // Create unified user profile object with all extra data
                        const userProfile: UserProfile = {
                            ...userData, // Include all aggregated fields (className, subjectNames, etc.)
                            userId: userData.userId || userData.teacherId || userData.studentId || userData.parentId || userId,
                            firstName: userData.firstName || userData.username || 'User',
                            lastName: userData.lastName || '',
                            email: userData.email,
                            phone: userData.phone || userData.contactNumber || userData.phoneNumber,
                            role: role as any,
                            profileImage: userData.profileImage,
                        };

                        // Build school info from aggregated data + full school details
                        let schoolInfo: SchoolInfo | null = null;

                        if (userData.schoolName || effectiveSchoolId) {
                            schoolInfo = {
                                schoolId: effectiveSchoolId || '',
                                schoolName: userData.schoolName || '',
                                schoolLogo: userData.schoolLogo || '',
                                schoolAddress: userData.schoolAddress || '',
                            };
                        }

                        // Merge full school details if available
                        if (schoolResponse && schoolResponse.success && schoolResponse.data) {
                            schoolInfo = {
                                ...schoolInfo,
                                ...schoolResponse.data,
                            };
                        } else if (effectiveSchoolId && !schoolId) {
                            // schoolId wasn't available initially, try fetching now
                            try {
                                const lateFetchSchool = await useApi<{
                                    success: boolean;
                                    data: any;
                                }>('GET', `/api/admin/school/get-school/${effectiveSchoolId}`);
                                if (lateFetchSchool.success && lateFetchSchool.data) {
                                    schoolInfo = { ...schoolInfo, ...lateFetchSchool.data };
                                }
                            } catch (schoolError) {
                                console.warn('Failed to fetch full school details, using aggregated data:', schoolError);
                            }
                        }

                        set({
                            user: userProfile,
                            school: schoolInfo,
                            isLoading: false,
                            error: null,
                        });
                    } else {
                        throw new Error('Failed to fetch profile data');
                    }
                } catch (error: any) {
                    console.error('Error fetching profile detail:', {
                        message: error.message,
                        response: error.response?.data,
                        status: error.response?.status,
                        error // Log full error object for debugging
                    });
                    set({
                        error: error.message || 'Failed to fetch profile',
                        isLoading: false,
                    });
                }
            },

            clearStore: () => set({
                user: null,
                school: null,
                isLoading: false,
                error: null,
            }),
        }),
        {
            name: 'user-storage',
            partialize: (state) => ({
                user: state.user,
                school: state.school,
            }),
        }
    )
);
