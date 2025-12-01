
import { ClassStudent, ClassDetails, CoursePlan, TestResultData, UserProfile, UserRole, SystemSettings, PopupNotification } from '../types';

export const MOCK_CLASSES: ClassStudent[] = [
  { namhoc: "2023-2024", hocky: 2, class_id: 101 },
  { namhoc: "2023-2024", hocky: 2, class_id: 102 },
  { namhoc: "2023-2024", hocky: 1, class_id: 201 },
  { namhoc: "2022-2023", hocky: 2, class_id: 301 },
];

export const MOCK_CLASS_DETAILS: Record<number, ClassDetails> = {
  101: {
    id: 101,
    name: "Lập trình Web nâng cao",
    kyhieu: "WEB_ADV",
    sotinchi: 3,
    namhoc: "2023-2024",
    hocky: 2,
    managers: [{ display_name: "ThS. Phạm Văn A", email: "a@ictu.edu.vn", username: "pva" }]
  },
  102: {
    id: 102,
    name: "Trí tuệ nhân tạo",
    kyhieu: "AI_BAS",
    sotinchi: 3,
    namhoc: "2023-2024",
    hocky: 2,
    managers: [{ display_name: "TS. Nguyễn Thị B", email: "b@ictu.edu.vn", username: "ntb" }]
  },
  201: {
    id: 201,
    name: "Cấu trúc dữ liệu",
    kyhieu: "DSA",
    sotinchi: 4,
    namhoc: "2023-2024",
    hocky: 1,
    managers: [{ display_name: "ThS. Trần Văn C", email: "c@ictu.edu.vn", username: "tvc" }]
  },
  301: {
    id: 301,
    name: "Cơ sở dữ liệu",
    kyhieu: "DB_BAS",
    sotinchi: 3,
    namhoc: "2022-2023",
    hocky: 2,
    managers: [{ display_name: "ThS. Lê Văn D", email: "d@ictu.edu.vn", username: "lvd" }]
  }
};

export const MOCK_COURSE_PLANS: Record<number, CoursePlan[]> = {
  101: [
    { id: 1001, class_id: 101, week: 1, title: "Tuần 1: Giới thiệu React", date_start_of_week: "2024-01-15", date_end_of_week: "2024-01-21", teaching_day: "Monday" },
    { id: 1002, class_id: 101, week: 2, title: "Tuần 2: Components & Props", date_start_of_week: "2024-01-22", date_end_of_week: "2024-01-28", teaching_day: "Monday" },
    { id: 1003, class_id: 101, week: 3, title: "Tuần 3: State & Lifecycle", date_start_of_week: "2024-01-29", date_end_of_week: "2024-02-04", teaching_day: "Monday" },
    { id: 1004, class_id: 101, week: 4, title: "Tuần 4: Hooks cơ bản", date_start_of_week: "2024-02-05", date_end_of_week: "2024-02-11", teaching_day: "Monday" },
    { id: 1005, class_id: 101, week: 5, title: "Tuần 5: Routing", date_start_of_week: "2024-02-19", date_end_of_week: "2024-02-25", teaching_day: "Monday" },
  ],
  102: [
    { id: 2001, class_id: 102, week: 1, title: "Tuần 1: Tổng quan AI", date_start_of_week: "2024-01-15", date_end_of_week: "2024-01-21", teaching_day: "Tuesday" },
    { id: 2002, class_id: 102, week: 2, title: "Tuần 2: Tìm kiếm không gian", date_start_of_week: "2024-01-22", date_end_of_week: "2024-01-28", teaching_day: "Tuesday" },
  ]
};

export const MOCK_TEST_RESULTS: TestResultData[] = [
  // Class 101
  { id: 5001, class_id: 101, week: 1, av: 8.5, tong_diem: 85, time: 45, passed: 1, submit_at: "2024-01-20T14:30:00Z" },
  { id: 5002, class_id: 101, week: 2, av: 9.0, tong_diem: 90, time: 30, passed: 1, submit_at: "2024-01-27T09:15:00Z" },
  // Updated: Score 7.5 is now failed (passed: 0) based on new rule < 8 is fail
  { id: 5003, class_id: 101, week: 2, av: 7.5, tong_diem: 75, time: 25, passed: 0, submit_at: "2024-01-26T10:00:00Z" }, // Multiple attempt
  // Class 101 - Week 3 has no tests
  // Class 101 - Week 4
  { id: 5004, class_id: 101, week: 4, av: 4.5, tong_diem: 45, time: 40, passed: 0, submit_at: "2024-02-10T14:00:00Z" },
  
  // Class 102
  { id: 6001, class_id: 102, week: 1, av: 9.5, tong_diem: 95, time: 50, passed: 1, submit_at: "2024-01-20T15:00:00Z" },
];

export const MOCK_USERS: UserProfile[] = [
  {
    id: 1,
    username: "admin",
    full_name: "Quản Trị Viên",
    role: UserRole.ADMIN,
    status: "active",
    email: "admin@ictu.edu.vn",
    student_code: "ADMIN",
    birthday: "1990-01-01"
  },
  {
    id: 12345,
    username: "demo",
    full_name: "Nguyễn Văn Demo",
    student_code: "DTC245200672",
    class_name: "CNTT K20",
    department: "Công nghệ thông tin",
    role: UserRole.USER,
    status: "active",
    email: "demo@student.ictu.edu.vn",
    birthday: "2002-05-15"
  },
  {
    id: 12346,
    username: "blocked_user",
    full_name: "Trần Văn Chặn",
    student_code: "DTC245200673",
    class_name: "CNTT K20",
    department: "Công nghệ thông tin",
    role: UserRole.USER,
    status: "blocked",
    blocked_reason: "Vi phạm quy định thi ngày 10/11",
    email: "blocked@student.ictu.edu.vn",
    birthday: "2002-08-20"
  }
];

export const MOCK_SETTINGS: SystemSettings = {
  maintenanceMode: false,
  socialLoginOnly: false,
  disableStandardLogin: false,
  disableLoginMessage: "Chức năng đăng nhập bằng tài khoản/mật khẩu đang tạm khóa. Vui lòng sử dụng Google/Microsoft hoặc liên hệ quản trị viên.",
  portalName: "Student Portal",
  dashboardTitle: "ICTU Dashboard",
  loginTitle: "Chào mừng trở lại",
  loginSubtitle: "Cổng thông tin sinh viên ICTU",
  contactEmail: "dtc245200672@ictu.edu.vn",
  contactZalo: "0987654321",
  appVersion: "v1.0.0-beta",
  copyrightText: "© 2025 ICTU",
  aboutTitle: "ICTU Student Portal",
  aboutDescription: "Hệ thống theo dõi kết quả học tập và tiến độ hàng tuần.",
};

export const MOCK_NOTIFICATION: PopupNotification = {
  id: "notif-001",
  title: "Thông báo bảo trì",
  content: "Hệ thống sẽ bảo trì vào 22:00 hôm nay. Vui lòng lưu lại công việc của bạn.",
  isActive: true,
  type: "info"
};