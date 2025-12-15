import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Stale time: 5 minutes
            staleTime: 5 * 60 * 1000,

            // Cache time: 10 minutes
            gcTime: 10 * 60 * 1000,

            // Retry failed requests 2 times
            retry: 2,

            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Refetch on window focus (good for real-time data)
            refetchOnWindowFocus: true,

            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
        },
        mutations: {
            // Retry mutations once
            retry: 1,
        },
    },
});

/**
 * Query Keys for consistent cache management
 */
export const queryKeys = {
    // Auth
    profile: (token: string) => ['profile', token] as const,
    session: (username: string, sessionId: string) => ['session', username, sessionId] as const,

    // Student
    classes: (token: string, studentId: number) => ['classes', token, studentId] as const,
    classDetails: (token: string, classId: number) => ['classDetails', token, classId] as const,
    coursePlan: (token: string, classId: number) => ['coursePlan', token, classId] as const,
    testResults: (token: string, classId: number) => ['testResults', token, classId] as const,
    testDetails: (token: string, testId: number) => ['testDetails', token, testId] as const,
    studentProgress: (token: string, studentId: number) => ['studentProgress', token, studentId] as const,

    // Admin
    users: () => ['users'] as const,
    userDetails: (username: string) => ['userDetails', username] as const,
    loginActivities: (limit: number) => ['loginActivities', limit] as const,
    systemMetrics: () => ['systemMetrics'] as const,
    databaseStats: () => ['databaseStats'] as const,
    securityMetrics: (simulateAttack: boolean) => ['securityMetrics', simulateAttack] as const,

    // Settings
    settings: () => ['settings'] as const,
    publicSettings: () => ['publicSettings'] as const,
    popupNotification: () => ['popupNotification'] as const,
};
