import { JSDOM } from "jsdom"
import { optimize } from "svgo"
import XYChart from "../shared/packages/xy-chart"
import { convertDataToChartData, getRepoData } from "../shared/common/chart"
import type { ChartMode, LegendPosition, RepoData } from "../shared/types/chart"
import { getGitHubConfig, isRepoAllowed, isValidRepo } from "../server/github-config"

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

interface SvgOptions {
    type: ChartMode
    theme: "light" | "dark"
    transparent: boolean
    useLogScale: boolean
    legendPosition: LegendPosition
    width: number
}

function getQueryValue(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] || "" : value || ""
}

function fixJsdomSvgCasing(svg: string): string {
    return svg
        .replace(/feturbulence/g, "feTurbulence")
        .replace(/fedisplacementmap/g, "feDisplacementMap")
        .replace(/filterunits/g, "filterUnits")
        .replace(/basefrequency/g, "baseFrequency")
        .replace(/xchannelselector/g, "xChannelSelector")
        .replace(/ychannelselector/g, "yChannelSelector")
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

export function renderSvg(repoData: RepoData[], options: SvgOptions): string {
    const dom = new JSDOM("<!DOCTYPE html><body></body>")
    const svg = dom.window.document.createElement("svg") as unknown as SVGSVGElement
    svg.setAttribute("width", String(options.width))
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    dom.window.document.body.append(svg as unknown as Node)

    XYChart(svg, {
        title: "Star History",
        xLabel: options.type === "Date" ? "Date" : "Timeline",
        yLabel: "GitHub Stars",
        data: convertDataToChartData(repoData, options.type),
        showDots: false,
        transparent: options.transparent,
        theme: options.theme,
    }, {
        envType: "node",
        xTickLabelType: options.type === "Date" ? "Date" : "Number",
        chartWidth: options.width,
        useLogScale: options.useLogScale,
        legendPosition: options.legendPosition,
    })

    return optimize(fixJsdomSvgCasing(svg.outerHTML), { multipass: true }).data
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
