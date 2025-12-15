/**
 * Unified API Export
 * 
 * This file re-exports all API modules as a single `api` object
 * to maintain backward compatibility with existing code.
 */

import { authApi } from './auth.api';
import { studentApi } from './student.api';
import { adminApi } from './admin.api';
import { settingsApi } from './settings.api';
import { triggerSecurityLockout, resetSecurityLockout } from './rate-limiter';

/**
 * Unified API object
 * Combines all domain APIs into a single export
 */
export const api = {
    // === Auth APIs ===
    login: authApi.login,
    loginWithGoogle: authApi.loginWithGoogle,
    loginWithMicrosoft: authApi.loginWithMicrosoft,
    logout: authApi.logout,
    getProfile: authApi.getProfile,
    checkSessionValidity: authApi.checkSessionValidity,
    checkBlockedUser: authApi.checkBlockedUser,
    logLoginActivity: authApi.logLoginActivity,

    // === Student APIs ===
    getAllClasses: studentApi.getAllClasses,
    getClassDetails: studentApi.getClassDetails,
    getCoursePlan: studentApi.getCoursePlan,
    getAllTestResultsForClass: studentApi.getAllTestResultsForClass,
    getTestDetails: studentApi.getTestDetails,
    getStudentProgress: studentApi.getStudentProgress,

    // === Admin APIs ===
    adminGetUsers: adminApi.getUsers,
    adminGetUserDetails: adminApi.getUserDetails,
    adminToggleBlockUser: adminApi.toggleBlockUser,
    getLoginActivities: adminApi.getLoginActivities,
    adminClearLoginActivities: adminApi.clearLoginActivities,
    getSystemMetrics: adminApi.getSystemMetrics,
    getDatabaseStats: adminApi.getDatabaseStats,
    getSecurityMetrics: adminApi.getSecurityMetrics,

    // === Settings APIs ===
    adminGetSettings: settingsApi.getSettings,
    adminUpdateSettings: settingsApi.updateSettings,
    getPublicSettings: settingsApi.getPublicSettings,
    verifyAdminSecretKey: settingsApi.verifyAdminSecretKey,
    getPopupNotification: settingsApi.getPopupNotification,
    adminUpdatePopup: settingsApi.updatePopupNotification,

    // === Rate Limiter Controls ===
    triggerSecurityLockout,
    resetSecurityLockout,
};

// Also export individual modules for direct access if needed
export { authApi, studentApi, adminApi, settingsApi };
