interface VercelRequest {
    method?: string
    query: Record<string, string | string[] | undefined>
}

interface VercelResponse {
    setHeader(name: string, value: string): void
    status(code: number): VercelResponse
    json(body: unknown): VercelResponse
    send(body: string): VercelResponse
}

const GITHUB_API_URL = "https://api.github.com"
const REPO_PATTERN = /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i

function getQueryValue(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || ""
}

function parseAllowedRepos(value: string | undefined): string[] {
    return (value || "")
        .split(/[\s,]+/)
        .map((repo) => repo.trim().toLowerCase())
        .filter(Boolean)
}

function isRepoAllowed(repo: string, allowedRepos: string[]): boolean {
    const normalizedRepo = repo.toLowerCase()
    const owner = normalizedRepo.split("/")[0]

    return allowedRepos.includes("*")
        || allowedRepos.includes(normalizedRepo)
        || allowedRepos.includes(`${owner}/*`)
}

function copyHeader(response: Response, res: VercelResponse, name: string) {
    const value = response.headers.get(name)
    if (value) {
        res.setHeader(name, value)
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET")
        return res.status(405).json({ message: "Method not allowed" })
    }

    const token = process.env.GITHUB_TOKEN
    const allowedRepos = parseAllowedRepos(process.env.ALLOWED_REPOS)

    if (!token) {
        return res.status(500).json({ message: "GITHUB_TOKEN is not configured" })
    }
    if (allowedRepos.length === 0) {
        return res.status(500).json({ message: "ALLOWED_REPOS is not configured" })
    }

    const repo = getQueryValue(req.query.repo).trim()
    const resource = getQueryValue(req.query.resource) || "repo"

    if (!REPO_PATTERN.test(repo)) {
        return res.status(400).json({ message: "Invalid repository" })
    }
    if (!isRepoAllowed(repo, allowedRepos)) {
        return res.status(403).json({ message: `Repository ${repo} is not allowed` })
    }

    let targetUrl: URL
    if (resource === "repo") {
        targetUrl = new URL(`/repos/${repo}`, GITHUB_API_URL)
    } else if (resource === "stargazers") {
        const page = getQueryValue(req.query.page) || "1"
        if (!/^\d+$/.test(page) || Number(page) < 1) {
            return res.status(400).json({ message: "Invalid page" })
        }
        targetUrl = new URL(`/repos/${repo}/stargazers`, GITHUB_API_URL)
        targetUrl.searchParams.set("per_page", "100")
        targetUrl.searchParams.set("page", page)
    } else if (resource === "owner") {
        targetUrl = new URL(`/users/${repo.split("/")[0]}`, GITHUB_API_URL)
    } else {
        return res.status(400).json({ message: "Invalid resource" })
    }

    try {
        const githubResponse = await fetch(targetUrl, {
            headers: {
                Accept: "application/vnd.github.v3.star+json",
                Authorization: `Bearer ${token}`,
                "User-Agent": "star-history-self-hosted",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        })

        copyHeader(githubResponse, res, "content-type")
        copyHeader(githubResponse, res, "link")
        copyHeader(githubResponse, res, "x-ratelimit-limit")
        copyHeader(githubResponse, res, "x-ratelimit-remaining")
        copyHeader(githubResponse, res, "x-ratelimit-reset")

        if (githubResponse.ok) {
            res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600")
        } else {
            res.setHeader("Cache-Control", "no-store")
        }

        const body = await githubResponse.text()
        return res.status(githubResponse.status).send(body)
    } catch (error) {
        console.error("GitHub proxy request failed", error)
        return res.status(502).json({ message: "GitHub API request failed" })
    }
}
