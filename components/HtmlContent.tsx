import React from 'react';
import AuthenticatedImage from './AuthenticatedImage';

interface HtmlContentProps {
    html: string;
    className?: string;
}

// Helper to extract image ID from various patterns
const extractImageId = (imgTag: string): string | null => {
    // Try data-src first
    const dataSrcMatch = imgTag.match(/data-src="(\d+)"/);
    if (dataSrcMatch) return dataSrcMatch[1];

    // Try numeric src
    const srcMatch = imgTag.match(/src="(\d+)"/);
    if (srcMatch) return srcMatch[1];

    return null;
};

const HtmlContent: React.FC<HtmlContentProps> = ({ html, className = '' }) => {
    if (!html) return null;

    // Split HTML by img tags
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    const imgRegex = /<img\s+([^>]*?)>/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
        // Add text before image
        if (match.index > lastIndex) {
            const textBefore = html.substring(lastIndex, match.index);
            if (textBefore.trim()) {
                parts.push(
                    <span
                        key={`text-${lastIndex}`}
                        dangerouslySetInnerHTML={{ __html: textBefore }}
                    />
                );
            }
        }

        // Extract image ID
        const imageId = extractImageId(match[0]);

        if (imageId) {
            parts.push(
                <AuthenticatedImage
                    key={`img-${match.index}`}
                    imageId={imageId}
                    alt="Hình ảnh câu hỏi"
                    className="max-w-full h-auto rounded-lg my-2"
                />
            );
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < html.length) {
        const remainingText = html.substring(lastIndex);
        if (remainingText.trim()) {
            parts.push(
                <span
                    key={`text-${lastIndex}`}
                    dangerouslySetInnerHTML={{ __html: remainingText }}
                />
            );
        }
    }

    // If no images found, just render HTML
    if (parts.length === 0) {
        return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
    }

    return <div className={className}>{parts}</div>;
};

export default HtmlContent;
