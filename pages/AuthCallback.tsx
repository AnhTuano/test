/**
 * OAuth Callback Page
 * Handles the redirect from Google/Microsoft after authentication
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { useToast } from '../components/ToastProvider';
import { fetchGoogleUserInfo, isValidICTUEmail } from '../services/googleAuth';
import { fetchMicrosoftUserInfo, isValidICTUEmail as isValidMsEmail } from '../services/microsoftAuth';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Đang xử lý đăng nhập...');
  const { loginWithGoogleToken, loginWithMicrosoftToken } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    const processCallback = async () => {
      try {
        
        
        // Determine provider from sessionStorage
        const provider = sessionStorage.getItem('oauth_provider') || 'google';
        const isGoogle = provider === 'google';
        const isMicrosoft = provider === 'microsoft';
        
        
        
        // Check for error first
        const errorKey = provider + '_oauth_error';
        const storedError = sessionStorage.getItem(errorKey);
        if (storedError) {
          sessionStorage.removeItem(errorKey);
          sessionStorage.removeItem('oauth_provider');
          throw new Error(decodeURIComponent(storedError));
        }
        
        // Get token from sessionStorage (set by index.html script or popup)
        const tokenKey = provider + '_oauth_token';
        const accessToken = sessionStorage.getItem(tokenKey);

        if (!accessToken) {
          throw new Error(`Không nhận được token từ ${isGoogle ? 'Google' : 'Microsoft'}`);
        }
        
        // Clear stored token
        sessionStorage.removeItem(tokenKey);
        sessionStorage.removeItem('oauth_provider');

        
        setMessage('Đang lấy thông tin tài khoản...');

        if (isGoogle) {
          // Google OAuth flow
          const googleUser = await fetchGoogleUserInfo(accessToken);
          

          // Validate ICTU domain
          if (!isValidICTUEmail(googleUser.email)) {
            throw new Error('Chỉ chấp nhận email @ictu.edu.vn');
          }

          setMessage('Đang đăng nhập với Google...');

          // Login with Google token
          await loginWithGoogleToken(accessToken, googleUser);

          setStatus('success');
          setMessage('Đăng nhập Google thành công!');
          toast.success('Đăng nhập Google thành công!');
        } else if (isMicrosoft) {
          // Microsoft OAuth flow
          const msUser = await fetchMicrosoftUserInfo(accessToken);
          

          // Validate ICTU domain
          if (!isValidMsEmail(msUser.email)) {
            throw new Error('Chỉ chấp nhận email @ictu.edu.vn');
          }

          setMessage('Đang đăng nhập với Microsoft...');

          // Login with Microsoft token
          await loginWithMicrosoftToken(accessToken, msUser);

          setStatus('success');
          setMessage('Đăng nhập Microsoft thành công!');
          toast.success('Đăng nhập Microsoft thành công!');
        } else {
          throw new Error('Không xác định được provider OAuth');
        }

        // Redirect to grades page
        setTimeout(() => {
          navigate('/grades', { replace: true });
        }, 1000);

      } catch (err: any) {
        
        setStatus('error');
        setMessage(err.message || 'Đăng nhập thất bại');
        toast.error(err.message || 'Đăng nhập thất bại');

        // Redirect back to login after delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    processCallback();
  }, [loginWithGoogleToken, loginWithMicrosoftToken, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Đang xử lý
            </h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Thành công!
            </h2>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Có lỗi xảy ra
            </h2>
          </>
        )}

        <p className="text-slate-600 dark:text-slate-400">{message}</p>

        {status === 'error' && (
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Quay lại đăng nhập
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
