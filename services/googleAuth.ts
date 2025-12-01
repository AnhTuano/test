/**
 * Google OAuth Authentication Service
 * Handles Google Sign-In with domain restriction to @ictu.edu.vn
 */

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

// Helper to get env vars
const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || '';
    }
  } catch (e) {}
  return '';
};

/**
 * Check if Google OAuth is configured
 */
export const isGoogleAuthConfigured = (): boolean => {
  const clientId = getEnv('VITE_GOOGLE_CLIENT_ID');
  return !!clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID';
};

/**
 * Initiate Google OAuth login flow with popup
 * Opens Google Account Chooser in a popup window
 */
export const initiateGoogleLogin = () => {
  const clientId = getEnv('VITE_GOOGLE_CLIENT_ID');
  // Redirect URI without hash - Google doesn't allow # in URI
  const redirectUri = `${window.location.origin}/auth/callback`;
  
  if (!clientId) {
    throw new Error('Google Client ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'email profile',
    hd: 'ictu.edu.vn', // Restrict to ICTU domain
    prompt: 'select_account', // Always show account chooser
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  // Open in popup window
  const width = 500;
  const height = 600;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  const popup = window.open(
    authUrl,
    'Google Login',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
  );
  
  if (!popup) {
    // Fallback to redirect if popup blocked
    
    window.location.href = authUrl;
  }
  
  // The popup will be handled by index.html script when it redirects back
  // That script will store token in sessionStorage and redirect main window
};

/**
 * Parse OAuth callback hash parameters
 */
export const parseOAuthCallback = (): { accessToken: string | null; error: string | null } => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  
  return {
    accessToken: params.get('access_token'),
    error: params.get('error'),
  };
};

/**
 * Fetch user info from Google using access token
 */
export const fetchGoogleUserInfo = async (accessToken: string): Promise<GoogleUser> => {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info from Google');
  }

  return response.json();
};

/**
 * Validate if email is from ICTU domain
 */
export const isValidICTUEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith('@ictu.edu.vn');
};

/**
 * Extract student code from ICTU email
 * Example: dtc245200672@ictu.edu.vn -> DTC245200672
 */
export const extractStudentCode = (email: string): string => {
  const username = email.split('@')[0];
  return username.toUpperCase();
};

/**
 * Infer student information from email and name
 * This helps provide better UX for Google OAuth users
 */
export const inferStudentInfo = (email: string, fullName: string) => {
  const studentCode = extractStudentCode(email);
  
  // Extract year from student code (e.g., DTC245200672 -> 24 -> 2024)
  const yearMatch = studentCode.match(/\d{2}/);
  const year = yearMatch ? `20${yearMatch[0]}` : '2024';
  
  // Infer department from prefix
  const departmentMap: Record<string, string> = {
    'DTC': 'Công nghệ thông tin',
    'KTMT': 'Kỹ thuật máy tính',
    'TMDT': 'Thương mại điện tử',
    'ATTT': 'An toàn thông tin',
    'KHMT': 'Khoa học máy tính',
  };
  
  const prefix = studentCode.match(/^[A-Z]+/)?.[0] || 'DTC';
  const department = departmentMap[prefix] || 'Công nghệ thông tin';
  
  // Infer class name
  const className = `${prefix}-K${year.slice(2)}`;
  
  // Infer course duration
  const startYear = parseInt(year);
  const course = `${startYear}-${startYear + 4}`;
  
  // Try to infer gender from name (basic heuristic)
  const maleNames = ['Văn', 'Đức', 'Minh', 'Hoàng', 'Tuấn', 'Hùng', 'Dũng'];
  const femaleNames = ['Thị', 'Hương', 'Linh', 'Anh', 'Ngọc', 'Mai'];
  
  let gender = 'Khác';
  if (maleNames.some(name => fullName.includes(name))) {
    gender = 'Nam';
  } else if (femaleNames.some(name => fullName.includes(name))) {
    gender = 'Nữ';
  }
  
  return {
    department,
    className,
    course,
    gender,
    birthday: '', // Cannot infer
  };
};
