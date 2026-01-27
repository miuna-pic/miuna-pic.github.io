/**
 * VNDB (Visual Novel Database) API utility
 * Uses VNDB API v2 (Kana) to fetch visual novel information
 */

/**
 * Extract VNDB ID from URL
 * Supported formats:
 * - https://vndb.org/v12345
 * - https://vndb.org/v12345/Name
 */
export function extractVNDBId(url: string): string | null {
    try {
        const match = url.match(/vndb\.org\/(v\d+)/i);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting VNDB ID:', error);
        return null;
    }
}

export interface VNDBVisualNovel {
    id: string;
    title: string;
    alttitle?: string;
    image?: {
        url: string;
        sexual: number;
        violence: number;
    };
    rating?: number;
    votecount?: number;
    released?: string;
    length?: number;
    length_minutes?: number;
    description?: string;
    developers?: Array<{
        id: string;
        name: string;
    }>;
}

/**
 * Fetch visual novel information from VNDB API v2
 */
export async function getVNDBInfo(vnId: string): Promise<VNDBVisualNovel | null> {
    try {
        const apiUrl = 'https://api.vndb.org/kana/vn';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filters: ['id', '=', vnId],
                fields: 'title, alttitle, image.url, image.sexual, image.violence, rating, votecount, released, length, length_minutes, description, developers.name'
            })
        });

        if (!response.ok) {
            console.warn(`VNDB API returned ${response.status} for VN ${vnId}`);
            return null;
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return null;
        }

        const vn = data.results[0];

        return {
            id: vnId,
            title: vn.title || 'Unknown Title',
            alttitle: vn.alttitle,
            image: vn.image ? {
                url: vn.image.url,
                sexual: vn.image.sexual || 0,
                violence: vn.image.violence || 0
            } : undefined,
            rating: vn.rating,
            votecount: vn.votecount,
            released: vn.released,
            length: vn.length,
            length_minutes: vn.length_minutes,
            description: vn.description,
            developers: vn.developers
        };
    } catch (error) {
        console.error('Error fetching VNDB info:', error);
        return null;
    }
}

/**
 * Get VNDB URL from ID
 */
export function getVNDBUrl(vnId: string): string {
    return `https://vndb.org/${vnId}`;
}

/**
 * Format VNDB rating (0-10 scale)
 */
export function formatVNDBRating(rating: number | undefined): string {
    if (!rating) return 'N/A';
    return rating.toFixed(2);
}

/**
 * Get length label from VNDB length code
 */
export function getVNDBLengthLabel(length: number | undefined): string {
    if (!length) return 'Unknown';

    const lengthMap: { [key: number]: string } = {
        1: 'Very Short (< 2h)',
        2: 'Short (2-10h)',
        3: 'Medium (10-30h)',
        4: 'Long (30-50h)',
        5: 'Very Long (> 50h)'
    };

    return lengthMap[length] || 'Unknown';
}
