/**
 * TMDB (The Movie Database) API Integration
 * Fetches movie and TV show information from TMDB API
 * Note: TMDB API requires an API key. You can get one at https://www.themoviedb.org/settings/api
 */

// You can set your TMDB API key here or use environment variable
const TMDB_API_KEY = import.meta.env.PUBLIC_TMDB_API_KEY || 'YOUR_API_KEY_HERE';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export interface TMDBMovieData {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genres: Array<{ id: number; name: string }>;
    runtime: number | null;
}

export interface TMDBTVData {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    genres: Array<{ id: number; name: string }>;
    number_of_seasons: number;
    number_of_episodes: number;
}

/**
 * Extract TMDB movie/TV ID from various URL formats
 * Supports:
 * - https://www.themoviedb.org/movie/123456
 * - https://www.themoviedb.org/tv/123456
 * - themoviedb.org/movie/123456-title
 */
export function extractTMDBId(url: string): { type: 'movie' | 'tv'; id: string } | null {
    // Movie pattern
    const moviePattern = /themoviedb\.org\/movie\/(\d+)/i;
    const movieMatch = url.match(moviePattern);
    if (movieMatch && movieMatch[1]) {
        return { type: 'movie', id: movieMatch[1] };
    }

    // TV pattern
    const tvPattern = /themoviedb\.org\/tv\/(\d+)/i;
    const tvMatch = url.match(tvPattern);
    if (tvMatch && tvMatch[1]) {
        return { type: 'tv', id: tvMatch[1] };
    }

    return null;
}

/**
 * Fetch movie information from TMDB API
 */
export async function getTMDBMovieInfo(movieId: string): Promise<TMDBMovieData | null> {
    try {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=zh-CN`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`TMDB API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: TMDBMovieData = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching TMDB movie info for ${movieId}:`, error);
        return null;
    }
}

/**
 * Fetch TV show information from TMDB API
 */
export async function getTMDBTVInfo(tvId: string): Promise<TMDBTVData | null> {
    try {
        const url = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&language=zh-CN`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`TMDB API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: TMDBTVData = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching TMDB TV info for ${tvId}:`, error);
        return null;
    }
}

/**
 * Get full image URL from TMDB path
 */
export function getTMDBImageUrl(path: string | null): string {
    if (!path) return '/favicon.svg'; // Fallback image
    return `${TMDB_IMAGE_BASE}${path}`;
}

/**
 * Format rating to one decimal place
 */
export function formatTMDBRating(rating: number): string {
    return rating.toFixed(1);
}

/**
 * Format runtime to hours and minutes
 */
export function formatRuntime(minutes: number | null): string {
    if (!minutes) return '未知';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
}
