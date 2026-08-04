import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, "../../gh/data")

const fallbackData: Record<string, unknown> = {
    "leaderboard.json": { updated_at: "", repos: [] },
    "weekly-ranking.json": { updated_at: "", repos: [] },
    "star-count.json": { updated_at: "", tiers: [] },
    "repos.json": { min_stars: 0, repos: [] },
}

fs.mkdirSync(dataDir, { recursive: true })

for (const [filename, data] of Object.entries(fallbackData)) {
    const filePath = path.join(dataDir, filename)
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
        console.log(`Generated fallback gh/data/${filename}`)
    }
}
