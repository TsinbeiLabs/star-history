import { JSDOM } from "jsdom"
import { optimize } from "svgo"
import XYChart from "../shared/packages/xy-chart"
import { convertDataToChartData } from "../shared/common/chart"
import type { ChartMode, LegendPosition, RepoData } from "../shared/types/chart"

interface SvgOptions {
    type: ChartMode
    theme: "light" | "dark"
    transparent: boolean
    useLogScale: boolean
    legendPosition: LegendPosition
    width: number
    watermarkText?: string
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
        watermarkText: options.watermarkText,
    })

    return optimize(fixJsdomSvgCasing(svg.outerHTML), { multipass: true }).data
}
