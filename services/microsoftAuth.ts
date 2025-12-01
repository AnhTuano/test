/**
 * Microsoft OAuth Authentication Service
 * Handles Microsoft Sign-In with domain restriction to @ictu.edu.vn
 */

export interface MicrosoftUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
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
 * Check if Microsoft OAuth is configured
 */
export const isMicrosoftAuthConfigured = (): boolean => {
  const clientId = getEnv('VITE_MICROSOFT_CLIENT_ID');
  return !!clientId && clientId !== 'YOUR_MICROSOFT_CLIENT_ID';
};

/**
 * Initiate Microsoft OAuth login flow with popup
 * Opens Microsoft Account Chooser in a popup window
 */
export const initiateMicrosoftLogin = () => {
  const clientId = getEnv('VITE_MICROSOFT_CLIENT_ID');
  const tenantId = getEnv('VITE_MICROSOFT_TENANT_ID') || 'organizations'; // Use 'organizations' for work accounts
  // Redirect URI without hash - Microsoft doesn't allow # in URI
  const redirectUri = `${window.location.origin}/auth/callback`;
  
  if (!clientId) {
    throw new Error('Microsoft Client ID not configured');
  }

  // Generate nonce for security
  const nonce = Date.now().toString() + Math.random().toString(36).substring(2);
  sessionStorage.setItem('microsoft_oauth_nonce', nonce);

  // Microsoft OAuth 2.0 authorization endpoint
  // Use 'id_token token' for implicit flow with SPA
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'id_token token', // Request both id_token and access_token
    scope: 'openid email profile User.Read',
    response_mode: 'fragment',
    prompt: 'select_account', // Always show account chooser
    state: 'microsoft', // To distinguish from Google callback
    nonce: nonce, // Required for id_token
  });

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  
  
  
  // Open in popup window
  const width = 500;
  const height = 700;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  const popup = window.open(
    authUrl,
    'Microsoft Login',
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
 * Fetch user info from Microsoft Graph API using access token
 */
export const fetchMicrosoftUserInfo = async (accessToken: string): Promise<MicrosoftUser> => {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    
    throw new Error('Failed to fetch user info from Microsoft');
  }

  const data = await response.json();
  
  return {
    id: data.id,
    email: data.mail || data.userPrincipalName,
    name: data.displayName,
    picture: undefined, // Microsoft requires additional call for photo
  };
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
 * This helps provide better UX for Microsoft OAuth users
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
