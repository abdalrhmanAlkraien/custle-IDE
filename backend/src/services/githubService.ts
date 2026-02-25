import db from '../db/database';

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  language: string | null;
  updated_at: string;
  stargazers_count: number;
  fork: boolean;
}

/**
 * Validate token by calling GET https://api.github.com/user
 * Returns user profile if valid, throws if invalid
 */
export async function validateToken(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Custle-IDE'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid GitHub token');
    }
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const user: any = await response.json();
  return {
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url
  };
}

/**
 * Save validated token + user profile to github_credentials (upsert on id=1)
 */
export function saveCredentials(token: string, user: GitHubUser): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO github_credentials (id, token, username, avatar_url, name, connected_at)
    VALUES (1, ?, ?, ?, ?, ?)
  `);

  stmt.run(token, user.login, user.avatar_url, user.name, new Date().toISOString());
}

/**
 * Retrieve saved credentials. Returns null if not connected.
 */
export function getCredentials(): { token: string; username: string; avatar_url: string; name: string | null } | null {
  const stmt = db.prepare(`
    SELECT token, username, avatar_url, name
    FROM github_credentials
    WHERE id = 1
  `);

  const row = stmt.get() as any;
  return row || null;
}

/**
 * Delete credentials and repos (disconnect)
 */
export function deleteCredentials(): void {
  db.prepare('DELETE FROM github_credentials').run();
  db.prepare('DELETE FROM github_repos').run();
}

/**
 * Fetch all repos from GitHub API (handles pagination, max 500 repos)
 * GET https://api.github.com/user/repos?per_page=100&page=N&sort=updated
 * Saves to github_repos table, replacing previous cache
 * Returns saved repo count
 */
export async function fetchAndSaveRepos(token: string): Promise<number> {
  // Clear existing repos
  db.prepare('DELETE FROM github_repos').run();

  const allRepos: GitHubRepo[] = [];
  const maxPages = 5; // Stop after 5 pages (500 repos max)

  for (let page = 1; page <= maxPages; page++) {
    const response = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Custle-IDE'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const repos = await response.json() as any[];

    // If no more repos, stop pagination
    if (repos.length === 0) {
      break;
    }

    allRepos.push(...repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url,
      html_url: repo.html_url,
      language: repo.language,
      updated_at: repo.updated_at,
      stargazers_count: repo.stargazers_count || 0,
      fork: repo.fork || false
    })));

    // If we got less than 100 repos, we've reached the end
    if (repos.length < 100) {
      break;
    }
  }

  // Save all repos to database
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO github_repos
    (id, name, full_name, description, private, clone_url, ssh_url, html_url, language, updated_at, stargazers, fork)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((repos: GitHubRepo[]) => {
    for (const repo of repos) {
      stmt.run(
        repo.id,
        repo.name,
        repo.full_name,
        repo.description,
        repo.private ? 1 : 0,
        repo.clone_url,
        repo.ssh_url,
        repo.html_url,
        repo.language,
        repo.updated_at,
        repo.stargazers_count,
        repo.fork ? 1 : 0
      );
    }
  });

  insertMany(allRepos);

  return allRepos.length;
}

/**
 * Get all cached repos from DB, ordered by updated_at DESC
 */
export function getCachedRepos(): GitHubRepo[] {
  const stmt = db.prepare(`
    SELECT id, name, full_name, description, private, clone_url, ssh_url, html_url, language, updated_at, stargazers, fork
    FROM github_repos
    ORDER BY updated_at DESC
  `);

  const rows = stmt.all() as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    full_name: row.full_name,
    description: row.description,
    private: Boolean(row.private),
    clone_url: row.clone_url,
    ssh_url: row.ssh_url,
    html_url: row.html_url,
    language: row.language,
    updated_at: row.updated_at,
    stargazers_count: row.stargazers,
    fork: Boolean(row.fork)
  }));
}
