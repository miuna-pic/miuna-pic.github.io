/**
 * Bilibili Video API Integration
 * Fetches video information from Bilibili API
 */

export interface BilibiliVideoData {
    bvid: string;
    aid: number;
    title: string;
    desc: string;
    pic: string; // cover image
    owner: {
        mid: number;
        name: string;
        face: string;
    };
    stat: {
        view: number;
        danmaku: number;
        reply: number;
        favorite: number;
        coin: number;
        share: number;
        like: number;
    };
    duration: number; // in seconds
    pubdate: number;
    ctime: number;
}

export interface BilibiliVideoResponse {
    code: number;
    message: string;
    data?: BilibiliVideoData;
}

/**
 * Extract Bilibili video ID (BV or AV) from various URL formats
 * Supports:
 * - https://www.bilibili.com/video/BVxxxxxxxxx
 * - https://b23.tv/xxxxxxx (short link)
 * - bilibili.com/video/avxxxxxx
 */
export function extractBilibiliVideoId(url: string): { type: 'bv' | 'av', id: string } | null {
    // BV ID pattern
    const bvPattern = /bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/i;
    const bvMatch = url.match(bvPattern);
    if (bvMatch && bvMatch[1]) {
        return { type: 'bv', id: bvMatch[1] };
    }

    // AV ID pattern
    const avPattern = /bilibili\.com\/video\/av(\d+)/i;
    const avMatch = url.match(avPattern);
    if (avMatch && avMatch[1]) {
        return { type: 'av', id: avMatch[1] };
    }

    return null;
}

/**
 * Fetch video information from Bilibili API
 * @param videoId - Object with type ('bv' or 'av') and id
 * @returns Promise with video data or null if failed
 */
export async function getBilibiliVideoInfo(
    videoId: { type: 'bv' | 'av', id: string }
): Promise<BilibiliVideoData | null> {
    try {
        const param = videoId.type === 'bv' ? `bvid=${videoId.id}` : `aid=${videoId.id}`;
        const url = `https://api.bilibili.com/x/web-interface/view?${param}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com/',
            },
        });

        if (!response.ok) {
            console.error(`Bilibili API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: BilibiliVideoResponse = await response.json();

        if (data.code !== 0 || !data.data) {
            console.error(`Bilibili video not found: ${videoId.id}`);
            return null;
        }

        return data.data;
    } catch (error) {
        console.error(`Error fetching Bilibili video info for ${videoId.id}:`, error);
        return null;
    }
}

/**
 * Format view count to human-readable string (e.g., 1.2万, 3.5亿)
 */
export function formatViewCount(count: number): string {
    if (count >= 100000000) {
        return (count / 100000000).toFixed(1) + '亿';
    } else if (count >= 10000) {
        return (count / 10000).toFixed(1) + '万';
    }
    return count.toString();
}

/**
 * Format duration from seconds to mm:ss or HH:mm:ss
 */
export function formatVideoDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
