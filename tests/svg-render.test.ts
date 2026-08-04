import assert from "node:assert/strict"
import test from "node:test"
import { renderSvg } from "../api/svg"

test("renders an embeddable star history SVG", () => {
    const svg = renderSvg([{
        repo: "TsinbeiLabs/example",
        logoUrl: "",
        starRecords: [
            { date: "2026-01-01", count: 1 },
            { date: "2026-02-01", count: 10 },
        ],
    }], {
        type: "Date",
        theme: "dark",
        transparent: false,
        useLogScale: false,
        legendPosition: "top-left",
        width: 800,
    })

    assert.match(svg, /^<svg/)
    assert.match(svg, /Star History/)
    assert.match(svg, /TsinbeiLabs\/example/)
    assert.match(svg, /#0d1117/)
    assert.match(svg, /width="800"/)
})
