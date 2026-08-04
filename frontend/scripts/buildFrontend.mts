import { spawnSync } from "node:child_process"
import * as fs from "node:fs"
import * as path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const frontendDir = path.resolve(__dirname, "..")
const enableBlog = process.env.NEXT_PUBLIC_ENABLE_BLOG === "true"

const blogDirectories = [
    [path.join(frontendDir, "pages", "blog"), path.join(frontendDir, ".disabled-blog-pages")],
    [path.join(frontendDir, "public", "blog"), path.join(frontendDir, ".disabled-blog-content")],
    [path.join(frontendDir, "public", "assets", "blog"), path.join(frontendDir, ".disabled-blog-assets")],
] as const

const blogDataPath = path.join(frontendDir, "helpers", "blog.json")
const disabledBlogDataPath = path.join(frontendDir, ".disabled-blog-data.json")

function run(script: string, args: string[] = []) {
    const result = spawnSync(process.execPath, [script, ...args], {
        cwd: frontendDir,
        env: process.env,
        stdio: "inherit",
    })

    if (result.status !== 0) {
        process.exitCode = result.status || 1
        throw new Error(`${script} ${args.join(" ")} failed`)
    }
}

if (!enableBlog) {
    for (const [source, destination] of blogDirectories) {
        if (!fs.existsSync(source)) continue
        if (fs.existsSync(destination)) {
            throw new Error(`Temporary blog directory already exists: ${destination}`)
        }
        fs.renameSync(source, destination)
    }

    if (fs.existsSync(disabledBlogDataPath)) {
        throw new Error(`Temporary blog data already exists: ${disabledBlogDataPath}`)
    }
    if (fs.existsSync(blogDataPath)) fs.renameSync(blogDataPath, disabledBlogDataPath)
    fs.writeFileSync(blogDataPath, "[]\n")
}

try {
    run(require.resolve("next/dist/bin/next"), ["build"])
    const sitemapEntry = require.resolve("next-sitemap")
    run(path.resolve(path.dirname(sitemapEntry), "../../bin/next-sitemap.mjs"))
} finally {
    if (!enableBlog) {
        if (fs.existsSync(blogDataPath)) fs.rmSync(blogDataPath)
        if (fs.existsSync(disabledBlogDataPath)) fs.renameSync(disabledBlogDataPath, blogDataPath)

        for (const [source, destination] of [...blogDirectories].reverse()) {
            if (fs.existsSync(destination)) fs.renameSync(destination, source)
        }
    }
}
