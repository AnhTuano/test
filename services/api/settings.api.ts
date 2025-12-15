import { SystemSettings, PopupNotification } from '../../types';
import { checkRateLimit } from './rate-limiter';

/**
 * Settings API
 */
export const settingsApi = {
    /**
     * Get system settings (admin)
     */
    getSettings: async (): Promise<SystemSettings> => {
        const defaultSettings: SystemSettings = {
            maintenanceMode: false,
            socialLoginOnly: false,
            disableStandardLogin: false,
            disableLoginMessage: "Chức năng đăng nhập bằng tài khoản/mật khẩu đang tạm khóa.",
            portalName: "ICTU Student Portal",
            dashboardTitle: "ICTU Dashboard",
            loginTitle: "Chào mừng trở lại",
            loginSubtitle: "Cổng thông tin sinh viên ICTU",
            contactEmail: "support@ictu.edu.vn",
            contactZalo: "0987654321",
            appVersion: "v2.0.0",
            copyrightText: "© 2025 ICTU",
            aboutTitle: "ICTU Student Portal",
            aboutDescription: "Hệ thống theo dõi kết quả học tập.",
        };

        try {
            const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');

            if (isSupabaseConfigured()) {
                const { data, error } = await supabaseDb.supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'system_settings')
                    .single();

                if (data && data.value) {
                    return { ...defaultSettings, ...data.value as SystemSettings };
                }

                // If not in database, create it
                if (error?.code === 'PGRST116') {
                    await supabaseDb.supabase.from('app_settings').insert({
                        key: 'system_settings',
                        value: defaultSettings
                    });
                }
            }
        } catch (error) {
            // Fallback to localStorage
            const stored = localStorage.getItem('system_settings');
            if (stored) {
                try {
                    return { ...defaultSettings, ...JSON.parse(stored) };
                } catch (e) {
                    return defaultSettings;
                }
            }
        }

        return defaultSettings;
    },

    /**
     * Update system settings
     */
    updateSettings: async (settings: SystemSettings) => {
        checkRateLimit();

        try {
            const { isSupabaseConfigured, isAdminConfigured, supabaseAdmin, supabase } = await import('../supabase');

            if (isSupabaseConfigured()) {
                const client = isAdminConfigured() ? supabaseAdmin : supabase;

                const { error } = await client
                    .from('app_settings')
                    .upsert({
                        key: 'system_settings',
                        value: settings,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'key'
                    });

                if (error) {
                    throw error;
                }

                // Sync to localStorage as fallback
                localStorage.setItem('system_settings', JSON.stringify(settings));
                return;
            }
        } catch (error) {
            // Ignore errors
        }

        // Fallback to localStorage
        localStorage.setItem('system_settings', JSON.stringify(settings));
    },

    /**
     * Get public settings (no auth required)
     */
    getPublicSettings: async (): Promise<Partial<SystemSettings>> => {
        const settings = await settingsApi.getSettings();
        const {
            portalName, dashboardTitle, loginTitle, loginSubtitle, contactEmail, contactZalo,
            maintenanceMode, socialLoginOnly, copyrightText,
            disableStandardLogin, disableLoginMessage
        } = settings;
        return {
            portalName, dashboardTitle, loginTitle, loginSubtitle, contactEmail, contactZalo,
            maintenanceMode, socialLoginOnly, copyrightText,
            disableStandardLogin, disableLoginMessage
        };
    },

    /**
     * Verify admin secret key for maintenance mode login
     */
    verifyAdminSecretKey: async (key: string): Promise<boolean> => {
        try {
            const settings = await settingsApi.getSettings();
            const adminSecretKey = settings.adminSecretKey || 'ictu2025admin';
            return key === adminSecretKey;
        } catch (error) {
            return false;
        }
    },

    /**
     * Get popup notification
     */
    getPopupNotification: async (): Promise<PopupNotification> => {
        const defaultNotif: PopupNotification = {
            id: "notif-default",
            title: "Chào mừng",
            content: "Chào mừng bạn đến với ICTU Student Portal",
            isActive: false,
            type: "info"
        };

        try {
            const { isSupabaseConfigured, db: supabaseDb } = await import('../supabase');

            if (isSupabaseConfigured()) {
                const { data, error } = await supabaseDb.supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'popup_notification')
                    .single();

                if (data && data.value) {
                    return data.value as PopupNotification;
                }

                // If not in database, create it
                if (error?.code === 'PGRST116') {
                    await supabaseDb.supabase.from('app_settings').insert({
                        key: 'popup_notification',
                        value: defaultNotif
                    });
                }
            }
        } catch (error) {
            // Fallback to localStorage
            const stored = localStorage.getItem('popup_notification');
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    return defaultNotif;
                }
            }
        }

        return defaultNotif;
    },

    /**
     * Update popup notification
     */
    updatePopupNotification: async (notification: PopupNotification) => {
        checkRateLimit();

        try {
            const { isSupabaseConfigured, isAdminConfigured, supabaseAdmin, supabase } = await import('../supabase');

            if (isSupabaseConfigured()) {
                const client = isAdminConfigured() ? supabaseAdmin : supabase;

                const { error } = await client
                    .from('app_settings')
                    .upsert({
                        key: 'popup_notification',
                        value: notification,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'key'
                    });

                if (error) {
                    throw error;
                }

                // Sync to localStorage as fallback
                localStorage.setItem('popup_notification', JSON.stringify(notification));
                return;
            }
        } catch (error) {
            // Ignore errors
        }

        // Fallback to localStorage
        localStorage.setItem('popup_notification', JSON.stringify(notification));
    },
};
