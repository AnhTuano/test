import { getRequestSignature, APP_ID } from '../../utils/requestSignature';
import { API_TIMEOUT } from './config';

/**
 * Get default headers with request signature
 */
export const getDefaultHeaders = (token?: string, method: string = 'GET', body: any = {}): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'X-APP-ID': APP_ID,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const signature = getRequestSignature(method, body);
    headers['x-request-signature'] = signature;

    return headers;
};

/**
 * Robust timeout wrapper for fetch requests
 */
export async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();

    const fetchPromise = fetch(url, {
        ...options,
        signal: controller.signal
    });

    const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => {
            controller.abort();
            reject(new Error('TIMEOUT'));
        }, API_TIMEOUT);
    });

    try {
        return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
        if (error instanceof Error && (error.message === 'TIMEOUT' || error.name === 'AbortError')) {
            throw new Error('Kết nối đến máy chủ ICTU bị quá hạn (15s). Vui lòng kiểm tra mạng.');
        }
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
        }
        throw error;
    }
}

/**
 * Handle API response with error checking
 */
export async function handleResponse<T>(response: Response, context: string): Promise<T> {
    if (!response.ok) {
        if (response.status === 403) throw new Error(`Lỗi 403 Forbidden tại ${context}.`);
        if (response.status === 401) {
            // Dispatch auth expired event
            const event = new CustomEvent('auth:expired', {
                detail: { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }
            });
            window.dispatchEvent(event);

            throw new Error("Phiên đăng nhập hết hạn.");
        }
        if (response.status === 404) throw new Error(`Không tìm thấy API (404) tại ${context}.`);
        if (response.status >= 500) throw new Error(`Lỗi máy chủ ICTU (${response.status}).`);
        throw new Error(`HTTP Error ${response.status} tại ${context}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.code && data.code !== 'success' && data.code !== 200 && data.code !== '200') {
            throw new Error(data.message || `API Error: ${data.code}`);
        }
        return data as T;
    }

    throw new Error("Máy chủ phản hồi định dạng không hợp lệ.");
}
