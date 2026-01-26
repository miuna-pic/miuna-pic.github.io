/**
 * GitHub Repository API Integration
 * Fetches repository information from GitHub API
 */

export interface GitHubRepoData {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    homepage: string | null;
    owner: {
        login: string;
        avatar_url: string;
        html_url: string;
    };
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    language: string | null;
    topics: string[];
    license: {
        name: string;
        spdx_id: string;
    } | null;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    size: number;
    open_issues_count: number;
}

export interface GitHubRepoResponse {
    message?: string;
}

/**
 * Extract GitHub repository owner and name from various URL formats
 * Supports:
 * - https://github.com/owner/repo
 * - github.com/owner/repo
 * - https://github.com/owner/repo/issues
 * - https://github.com/owner/repo/pulls
 */
export function extractGitHubRepo(url: string): { owner: string; repo: string } | null {
    const pattern = /github\.com\/([^\/]+)\/([^\/\?#]+)/i;
    const match = url.match(pattern);

    if (match && match[1] && match[2]) {
        return {
            owner: match[1],
            repo: match[2]
        };
    }

    return null;
}

/**
 * Fetch repository information from GitHub API
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @returns Promise with repository data or null if failed
 */
export async function getGitHubRepoInfo(
    owner: string,
    repo: string
): Promise<GitHubRepoData | null> {
    try {
        const url = `https://api.github.com/repos/${owner}/${repo}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            console.error(`GitHub API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: GitHubRepoData = await response.json();

        if ((data as any).message) {
            console.error(`GitHub repository not found: ${owner}/${repo}`);
            return null;
        }

        return data;
    } catch (error) {
        console.error(`Error fetching GitHub repo info for ${owner}/${repo}:`, error);
        return null;
    }
}

/**
 * Format star/fork count to human-readable string (e.g., 1.2k, 3.5k)
 */
export function formatGitHubCount(count: number): string {
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
}

/**
 * Get programming language color
 */
export function getLanguageColor(language: string | null): string {
    const colors: Record<string, string> = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'Python': '#3572A5',
        'Java': '#b07219',
        'C++': '#f34b7d',
        'C': '#555555',
        'C#': '#178600',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'Ruby': '#701516',
        'PHP': '#4F5D95',
        'Swift': '#ffac45',
        'Kotlin': '#A97BFF',
        'Dart': '#00B4AB',
        'Vue': '#41b883',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Shell': '#89e051',
    };

    return language ? (colors[language] || '#858585') : '#858585';
}
