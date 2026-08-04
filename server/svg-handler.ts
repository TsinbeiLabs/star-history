import type { ChartMode, LegendPosition } from "../shared/types/chart"
import { getGitHubConfig, isRepoAllowed, isValidRepo } from "./github-config"

interface VercelRequest {
    method?: string
    query: Record<string, string | string[] | undefined>
}

interface VercelResponse {
    setHeader(name: string, value: string): void
    status(code: number): VercelResponse
    send(body: string): VercelResponse
}

const CHART_WIDTHS: Record<string, number> = {
    mobile: 600,
    laptop: 800,
    desktop: 1000,
}

function getQueryValue(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || ""
}

async function toDataUrl(url: string): Promise<string> {
    try {
        const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}size=22`, {
            signal: AbortSignal.timeout(10000),
        })
        if (!response.ok) return ""

        const contentType = response.headers.get("content-type") || "image/png"
        const data = Buffer.from(await response.arrayBuffer()).toString("base64")
        return `data:${contentType};base64,${data}`
    } catch {
        return ""
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET")
        return res.status(405).send("Method not allowed")
    }

    const { token, allowedRepos } = getGitHubConfig()
    if (!token) return res.status(500).send("GITHUB_TOKEN is not configured")
    if (allowedRepos.length === 0) return res.status(500).send("ALLOWED_REPOS is not configured")

    const repos = getQueryValue(req.query.repos)
        .split(",")
        .map((repo) => repo.trim())
        .filter(Boolean)

    if (repos.length === 0) return res.status(400).send("Repo name required")
    if (repos.length > 10) return res.status(400).send("Too many repos: max 10 per request")

    for (const repo of repos) {
        if (!isValidRepo(repo)) return res.status(400).send(`Invalid repository: ${repo}`)
        if (!isRepoAllowed(repo, allowedRepos)) return res.status(403).send(`Repository ${repo} is not allowed`)
    }

    const type: ChartMode = getQueryValue(req.query.type).toLowerCase() === "timeline" ? "Timeline" : "Date"
    const theme = getQueryValue(req.query.theme) === "dark" ? "dark" : "light"
    const transparent = getQueryValue(req.query.transparent).toLowerCase() === "true"
    const useLogScale = req.query.logscale !== undefined && getQueryValue(req.query.logscale) !== "false"
    const legendPosition: LegendPosition = getQueryValue(req.query.legend) === "bottom-right" ? "bottom-right" : "top-left"
    const width = CHART_WIDTHS[getQueryValue(req.query.size)] || CHART_WIDTHS.laptop

    try {
        const [{ getRepoData }, { renderSvg }] = await Promise.all([
            import("../shared/common/chart"),
            import("./svg-render"),
        ])
        const repoData = await getRepoData(repos, token, 15)
        await Promise.all(repoData.map(async (repo) => {
            repo.logoUrl = await toDataUrl(repo.logoUrl)
        }))

        const output = renderSvg(repoData, { type, theme, transparent, useLogScale, legendPosition, width })
        res.setHeader("Content-Type", "image/svg+xml; charset=utf-8")
        res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800")
        return res.status(200).send(output)
    } catch (error: any) {
        console.error("SVG generation failed", error)
        return res.status(error?.status || 500).send(error?.message || "Failed to generate chart")
    }
}
