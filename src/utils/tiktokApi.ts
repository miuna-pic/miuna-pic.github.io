/**
 * TikTok API utility
 * Uses TikTok oEmbed API to fetch video information
 */

/**
 * Extract TikTok video ID from URL
 * Supported formats:
 * - https://www.tiktok.com/@username/video/1234567890123456789
 * - https://vm.tiktok.com/ABCD1234/
 */
export function extractTikTokId(url: string): { type: 'video' | 'short', id: string, username?: string } | null {
    try {
        // Full video URL format
        const videoMatch = url.match(/tiktok\.com\/@([^\/]+)\/video\/(\d+)/i);
        if (videoMatch) {
            return {
                type: 'video',
                id: videoMatch[2],
                username: videoMatch[1]
            };
        }

        // Short URL format (vm.tiktok.com)
        const shortMatch = url.match(/vm\.tiktok\.com\/([A-Za-z0-9]+)/i);
        if (shortMatch) {
            return {
                type: 'short',
                id: shortMatch[1]
            };
        }

        return null;
    } catch (error) {
        console.error('Error extracting TikTok ID:', error);
        return null;
    }
}

export interface TikTokVideoInfo {
    title: string;
    author_name: string;
    author_url: string;
    thumbnail_url: string;
    html: string;
    width: number;
    height: number;
    provider_name: string;
}

/**
 * Fetch TikTok video information using oEmbed API
 */
export async function getTikTokVideoInfo(url: string): Promise<TikTokVideoInfo | null> {
    try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;

        const response = await fetch(oembedUrl);

        if (!response.ok) {
            console.warn(`TikTok oEmbed API returned ${response.status} for URL ${url}`);
            return null;
        }

        const data = await response.json();

        return {
            title: data.title || '',
            author_name: data.author_name || '',
            author_url: data.author_url || '',
            thumbnail_url: data.thumbnail_url || '',
            html: data.html || '',
            width: data.width || 325,
            height: data.height || 589,
            provider_name: data.provider_name || 'TikTok'
        };
    } catch (error) {
        console.error('Error fetching TikTok video info:', error);
        return null;
    }
}

/**
 * Get TikTok video URL from video info
 */
export function getTikTokUrl(username: string, videoId: string): string {
    return `https://www.tiktok.com/@${username}/video/${videoId}`;
}
