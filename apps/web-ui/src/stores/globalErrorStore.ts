import { create } from 'zustand';

export interface GlobalApiErrorInfo {
    message: string;
    status?: number;
    path?: string;
    timestamp: number;
}

interface GlobalErrorState {
    consecutiveFailures: number;
    isTriggered: boolean;
    lastError: GlobalApiErrorInfo | null;

    // Actions
    recordSuccess: () => void;
    recordFailure: (error: any, path?: string) => void;
    reset: () => void;
}

const FAILURE_THRESHOLD = 3;

export const useGlobalErrorStore = create<GlobalErrorState>((set) => ({
    consecutiveFailures: 0,
    isTriggered: false,
    lastError: null,

    recordSuccess: () => {
        set({
            consecutiveFailures: 0,
            isTriggered: false,
            lastError: null,
        });
    },

    recordFailure: (error: any, path?: string) => {
        // Skip auth/permission errors (401, 403, 404) from triggering full outage screen
        const status = error?.status || error?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
            return;
        }

        set((state) => {
            const nextFailures = state.consecutiveFailures + 1;
            const isTriggered = nextFailures >= FAILURE_THRESHOLD;

            return {
                consecutiveFailures: nextFailures,
                isTriggered: state.isTriggered || isTriggered,
                lastError: {
                    message: error?.message || 'Server connection failed',
                    status,
                    path,
                    timestamp: Date.now(),
                },
            };
        });
    },

    reset: () => {
        set({
            consecutiveFailures: 0,
            isTriggered: false,
            lastError: null,
        });
    },
}));
