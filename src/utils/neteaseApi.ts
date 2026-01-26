/**
 * NetEase Cloud Music API Integration
 * Fetches song information from NetEase Cloud Music API
 */

export interface NeteaseSongData {
    id: number;
    name: string;
    artists: Array<{
        id: number;
        name: string;
    }>;
    album: {
        id: number;
        name: string;
        picUrl: string;
    };
    duration: number;
    publishTime?: number;
    fee?: number; // 0: free, 1: VIP, 4: paid, 8: low quality free
}

export interface NeteaseSongResponse {
    code: number;
    data?: NeteaseSongData[];
    songs?: NeteaseSongData[];
}

/**
 * Extract NetEase song ID from various URL formats
 * Supports:
 * - https://music.163.com/#/song?id=xxxxx
 * - https://y.music.163.com/m/song?id=xxxxx
 * - music.163.com/song?id=xxxxx
 */
export function extractNeteaseSongId(url: string): string | null {
    const patterns = [
        /music\.163\.com[^?]*\?[^#]*id=(\d+)/i,
        /y\.music\.163\.com[^?]*\?[^#]*id=(\d+)/i,
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
 * Fetch song information from NetEase Cloud Music API
 * @param songId - NetEase song ID
 * @returns Promise with song data or null if failed
 */
export async function getNeteaseSongInfo(
    songId: string
): Promise<NeteaseSongData | null> {
    try {
        // Using NeteaseCloudMusicApi service (you may need to deploy your own or use public endpoint)
        // For now, using a fallback approach with direct API
        const url = `https://music.163.com/api/song/detail/?id=${songId}&ids=[${songId}]`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://music.163.com/',
            },
        });

        if (!response.ok) {
            console.error(`NetEase API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: NeteaseSongResponse = await response.json();

        if (data.code !== 200 || !data.songs || data.songs.length === 0) {
            console.error(`NetEase song not found: ${songId}`);
            return null;
        }

        return data.songs[0];
    } catch (error) {
        console.error(`Error fetching NetEase song info for ${songId}:`, error);
        return null;
    }
}

/**
 * Check if a NetEase song ID is valid
 */
export function isValidNeteaseSongId(songId: string): boolean {
    return /^\d+$/.test(songId);
}

/**
 * Format duration from milliseconds to mm:ss
 */
export function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
