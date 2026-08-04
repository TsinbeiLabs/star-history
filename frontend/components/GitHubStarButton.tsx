import React, { useEffect, useState } from "react"
import { SketchGitHubIcon } from "./SketchIcons"
import api from "@shared/common/api"

const GitHubStarButton = () => {
    const [starCount, setStarCount] = useState<number | null>(null)

    useEffect(() => {
        const getRepoStarCount = async () => {
            try {
                setStarCount(await api.getRepoStargazersCount("star-history/star-history"))
            } catch (error) {
                console.error('Failed to fetch GitHub star', error)
            }
        }

        getRepoStarCount()
    }, [])

    return (
        <a
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            href="https://github.com/star-history/star-history"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Star star-history/star-history on GitHub"
            style={{ fontFamily: '"xkcd", cursive' }}
        >
            <SketchGitHubIcon />
            {starCount !== null && (
                <span className="text-lg">{starCount.toLocaleString()}</span>
            )}
        </a>
    )
}

export default GitHubStarButton
