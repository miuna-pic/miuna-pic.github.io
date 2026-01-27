/**
 * YouTube Video API Integration
 * Fetches video information from YouTube Data API v3
 * Note: YouTube API requires an API key. Get one at https://console.cloud.google.com/apis/credentials
 */

const YOUTUBE_API_KEY = import.meta.env.PUBLIC_YOUTUBE_API_KEY || 'YOUR_API_KEY_HERE';

export interface YouTubeVideoData {
    id: string;
    snippet: {
        title: string;
        description: string;
        channelTitle: string;
        publishedAt: string;
        thumbnails: {
            default: { url: string; width: number; height: number };
            medium: { url: string; width: number; height: number };
            high: { url: string; width: number; height: number };
            maxres?: { url: string; width: number; height: number };
        };
    };
    statistics: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
    };
    contentDetails: {
        duration: string; // ISO 8601 format like PT15M33S
    };
}

export interface YouTubeVideoResponse {
    items: YouTubeVideoData[];
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/i,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

/**
 * Fetch video information from YouTube Data API
 */
export async function getYouTubeVideoInfo(videoId: string): Promise<YouTubeVideoData | null> {
    try {
        const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,statistics,contentDetails`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`YouTube API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: YouTubeVideoResponse = await response.json();

        if (!data.items || data.items.length === 0) {
            console.error(`YouTube video not found: ${videoId}`);
            return null;
        }

        return data.items[0];
    } catch (error) {
        console.error(`Error fetching YouTube video info for ${videoId}:`, error);
        return null;
    }
}

/**
 * Format view count to human-readable string
 */
export function formatYouTubeCount(count: string): string {
    const num = parseInt(count);
    if (num >= 100000000) {
        return (num / 100000000).toFixed(1) + '亿';
    } else if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
}

/**
 * Parse ISO 8601 duration to readable format
 * PT15M33S -> 15:33
 * PT1H2M10S -> 1:02:10
 */
export function parseYouTubeDuration(duration: string): string {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '未知';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get best available thumbnail URL
 */
export function getYouTubeThumbnail(thumbnails: YouTubeVideoData['snippet']['thumbnails']): string {
    return thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;
}
