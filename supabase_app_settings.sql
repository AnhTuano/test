-- Tạo bảng app_settings để lưu cấu hình ứng dụng (thông báo, settings, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index cho key
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Tắt RLS để admin có thể đọc/ghi (hoặc bạn có thể thêm policy)
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- Insert thông báo mặc định
INSERT INTO app_settings (key, value) 
VALUES (
  'popup_notification',
  '{"id": "notif-default", "title": "Chào mừng", "content": "Chào mừng bạn đến với ICTU Student Portal", "isActive": false, "type": "info"}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Insert system settings mặc định
INSERT INTO app_settings (key, value) 
VALUES (
  'system_settings',
  '{
    "maintenanceMode": false,
    "socialLoginOnly": false,
    "disableStandardLogin": false,
    "disableLoginMessage": "Chức năng đăng nhập bằng tài khoản/mật khẩu đang tạm khóa.",
    "portalName": "ICTU Student Portal",
    "dashboardTitle": "ICTU Dashboard",
    "loginTitle": "Chào mừng trở lại",
    "loginSubtitle": "Cổng thông tin sinh viên ICTU",
    "contactEmail": "support@ictu.edu.vn",
    "contactZalo": "0987654321",
    "appVersion": "v2.0.0",
    "copyrightText": "© 2025 ICTU",
    "aboutTitle": "ICTU Student Portal",
    "aboutDescription": "Hệ thống theo dõi kết quả học tập."
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Kiểm tra kết quả
SELECT * FROM app_settings;
