import assert from "node:assert/strict"
import test from "node:test"
import { renderSvg } from "../server/svg-render"

test("renders an embeddable star history SVG", () => {
    const data = [{
        repo: "TsinbeiLabs/example",
        logoUrl: "",
        starRecords: [
            { date: "2026-01-01", count: 1 },
            { date: "2026-02-01", count: 10 },
        ],
    }]
    const options = {
        type: "Date",
        theme: "dark",
        transparent: false,
        useLogScale: false,
        legendPosition: "top-left",
        width: 800,
        watermarkText: "star-history.tsinbei.com",
    } as const
    const svg = renderSvg(data, options)
    const shortDomainSvg = renderSvg(data, { ...options, watermarkText: "star-history.com" })

    assert.match(svg, /^<svg/)
    assert.match(svg, /Star History/)
    assert.match(svg, /TsinbeiLabs\/example/)
    assert.match(svg, /#0d1117/)
    assert.match(svg, /star-history\.tsinbei\.com/)
    assert.match(svg, /text-anchor="end"/)
    assert.match(svg, /width="800"/)

    const watermarkIcon = /<image[^>]*transform="translate\(([-\d.]+)[ ,][-\d.]+\)"\/?>/
    const longDomainIconX = Number(svg.match(watermarkIcon)?.[1])
    const shortDomainIconX = Number(shortDomainSvg.match(watermarkIcon)?.[1])
    assert.ok(Number.isFinite(longDomainIconX))
    assert.ok(Number.isFinite(shortDomainIconX))
    assert.ok(longDomainIconX < shortDomainIconX)
    assert.ok(longDomainIconX > 510)
})
