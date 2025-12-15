import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { queryKeys } from '../lib/queryClient';

/**
 * Custom hooks for React Query
 * Provides type-safe, cached API calls
 */

// ============ Student Hooks ============

export const useClasses = (token: string, studentId: number) => {
    return useQuery({
        queryKey: queryKeys.classes(token, studentId),
        queryFn: () => api.getAllClasses(token, studentId),
        enabled: !!token && !!studentId,
    });
};

export const useClassDetails = (token: string, classId: number) => {
    return useQuery({
        queryKey: queryKeys.classDetails(token, classId),
        queryFn: () => api.getClassDetails(token, classId),
        enabled: !!token && !!classId,
    });
};

export const useTestResults = (token: string, classId: number) => {
    return useQuery({
        queryKey: queryKeys.testResults(token, classId),
        queryFn: () => api.getAllTestResultsForClass(token, classId),
        enabled: !!token && !!classId,
    });
};

export const useTestDetails = (token: string, testId: number) => {
    return useQuery({
        queryKey: queryKeys.testDetails(token, testId),
        queryFn: () => api.getTestDetails(token, testId),
        enabled: !!token && !!testId,
    });
};

// ============ Admin Hooks ============

export const useUsers = () => {
    return useQuery({
        queryKey: queryKeys.users(),
        queryFn: () => api.adminGetUsers(),
    });
};

export const useUserDetails = (username: string) => {
    return useQuery({
        queryKey: queryKeys.userDetails(username),
        queryFn: () => api.adminGetUserDetails(username),
        enabled: !!username,
    });
};

export const useLoginActivities = (limit: number = 50) => {
    return useQuery({
        queryKey: queryKeys.loginActivities(limit),
        queryFn: () => api.getLoginActivities(limit),
    });
};

export const useSystemMetrics = () => {
    return useQuery({
        queryKey: queryKeys.systemMetrics(),
        queryFn: () => api.getSystemMetrics(),
        refetchInterval: 30000, // Refetch every 30s
    });
};

// ============ Settings Hooks ============

export const useSettings = () => {
    return useQuery({
        queryKey: queryKeys.settings(),
        queryFn: () => api.adminGetSettings(),
    });
};

export const usePublicSettings = () => {
    return useQuery({
        queryKey: queryKeys.publicSettings(),
        queryFn: () => api.getPublicSettings(),
    });
};

export const usePopupNotification = () => {
    return useQuery({
        queryKey: queryKeys.popupNotification(),
        queryFn: () => api.getPopupNotification(),
    });
};

// ============ Mutations ============

export const useUpdateSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: api.adminUpdateSettings,
        onSuccess: () => {
            // Invalidate and refetch settings
            queryClient.invalidateQueries({ queryKey: queryKeys.settings() });
        },
    });
};

export const useToggleBlockUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ username, reason }: { username: string; reason: string }) =>
            api.adminToggleBlockUser(username, reason),
        onSuccess: () => {
            // Invalidate users list
            queryClient.invalidateQueries({ queryKey: queryKeys.users() });
        },
    });
};

export const useUpdatePopupNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: api.adminUpdatePopup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.popupNotification() });
        },
    });
};
