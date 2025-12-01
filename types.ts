

export interface ClassStudent {
  namhoc: string;
  hocky: number;
  class_id: number;
}

export interface Manager {
  display_name: string;
  email: string;
  username: string;
}

export interface ClassDetails {
  id: number;
  name: string;
  kyhieu: string;
  sotinchi: number;
  namhoc: string;
  hocky: number;
  managers: Manager[];
}

export interface CoursePlan {
  id: number;
  class_id: number;
  week: number;
  title: string;
  date_start_of_week: string;
  date_end_of_week: string;
  teaching_day: string;
}

export interface QuestionAnswer {
  id: string;
  value: string;
}

export interface Question {
  id: number;
  question_number: number;
  question_direction: string;
  question_type: string;
  number_answer_correct: number;
  answer_option: QuestionAnswer[];
}

export interface TestResultData {
  id: number;
  class_id: number;
  week: number;
  av: number;
  tong_diem: number;
  time: number;
  passed: number;
  submit_at: string;
  questions?: number[];
  test?: Question[]; // Optional detailed data
}

export interface WeekData {
  week: number;
  title: string;
  dateRange: string;
  testResults: TestResultData[];
  isLoading: boolean;
}

// --- Auth & Admin Types ---

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface UserProfile {
  id: number;
  username: string;
  student_code?: string;
  full_name: string;
  email?: string;
  class_name?: string;
  department?: string;
  role: UserRole;
  status: 'active' | 'blocked';
  blocked_reason?: string;
  avatar?: string;
  birthday?: string;
  gender?: string;
  tenlop_quanly?: string;
  tenkhoa?: string;
  khoadaotao?: string;
  phone?: string;
  address?: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  socialLoginOnly: boolean;
  disableStandardLogin: boolean; 
  disableLoginMessage: string;   
  portalName: string;      // Tiêu đề chính (VD: Student Portal)
  dashboardTitle: string;  // Tiêu đề phụ (VD: ICTU Dashboard)
  loginTitle: string;
  loginSubtitle: string;
  contactEmail: string;
  contactZalo?: string; // Added for appeals
  contactDeveloper?: string;
  contactDepartment?: string;
  appVersion: string;
  copyrightText: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutIntroTitle?: string;
  aboutIntroContent?: string;
  broadcastMessage?: string;
}

export interface PopupNotification {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface LoginActivity {
  id: string;
  username: string;
  studentName?: string;
  className?: string;
  department?: string;
  ip_address: string;
  device: string;
  browser?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  timestamp: string;
  status: 'success' | 'failed';
  sessionId?: string;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
}

export interface DeviceFingerprint {
  deviceId: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  timestamp: number;
}

export interface DeviceInfoType {
  userAgent: string;
  platform: string;
  language: string;
}

export interface StudentProgress {
  classId: number;
  className: string;
  teacherName: string;
  year: string;
  semester: number;
  latestWeek: number;
  totalWeeks: number;
  status: 'on-track' | 'behind' | 'ahead';
  hasTest: boolean;
  bestScore: number;
  testCount: number;
}

// --- Admin Drill Down Types ---
export interface AdminUserDetailedStats {
  user: UserProfile;
  loginHistory: LoginActivity[];
  academicOverview: {
    gpa: number;
    totalTests: number;
    passRate: number; // percentage
    recentGrades: { subject: string, score: number, week: number }[];
  };
}

// --- Security Types ---

export interface SecurityLog {
  id: string;
  ip: string;
  location: string;
  type: 'ddos' | 'spam' | 'sql_injection' | 'brute_force';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  status: 'blocked' | 'monitored';
  details: string;
}

export interface SecurityStats {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  requestsPerSecond: number;
  blockedIPsCount: number;
  totalAttacks24h: number;
  activeConnections: number;
}