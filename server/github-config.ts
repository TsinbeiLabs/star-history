const REPO_PATTERN = /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i

export function parseAllowedRepos(value: string | undefined): string[] {
    return (value || "")
        .split(/[\s,]+/)
        .map((repo) => repo.trim().toLowerCase())
        .filter(Boolean)
}

export function isValidRepo(repo: string): boolean {
    return REPO_PATTERN.test(repo)
}

export function isRepoAllowed(repo: string, allowedRepos: string[]): boolean {
    const normalizedRepo = repo.toLowerCase()
    const owner = normalizedRepo.split("/")[0]

    return allowedRepos.includes("*")
        || allowedRepos.includes(normalizedRepo)
        || allowedRepos.includes(`${owner}/*`)
}

export function getGitHubConfig() {
    return {
        token: process.env.GITHUB_TOKEN || "",
        allowedRepos: parseAllowedRepos(process.env.ALLOWED_REPOS),
    }
}
