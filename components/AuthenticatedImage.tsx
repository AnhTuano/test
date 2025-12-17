import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { getRequestSignature, APP_ID } from '../utils/requestSignature';

interface AuthenticatedImageProps {
    imageId: string;
    alt?: string;
    className?: string;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({ imageId, alt = 'Hình ảnh', className = '' }) => {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        const fetchImage = async () => {
            if (!token || !imageId) {
                setError(true);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(false);

                // Use Edge Function proxy with all required headers
                const signature = getRequestSignature('GET', {});
                const response = await fetch(`/api/media/${imageId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-APP-ID': APP_ID,
                        'x-request-signature': signature,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to load image: ${response.status}`);
                }

                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                setImageSrc(objectUrl);
            } catch (err) {
                console.error('Error loading image:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchImage();

        // Cleanup blob URL
        return () => {
            if (imageSrc && imageSrc.startsWith('blob:')) {
                URL.revokeObjectURL(imageSrc);
            }
        };
    }, [imageId, token]);

    if (loading) {
        return (
            <div className={`bg-slate-100 animate-pulse rounded-lg ${className}`} style={{ minHeight: '100px' }}>
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    Đang tải...
                </div>
            </div>
        );
    }

    if (error || !imageSrc) {
        return (
            <div className={`bg-slate-50 border border-slate-200 rounded-lg p-4 ${className}`}>
                <div className="flex items-center justify-center text-slate-400 text-sm">
                    {alt || 'Không thể tải ảnh'}
                </div>
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            loading="lazy"
        />
    );
};

export default AuthenticatedImage;
