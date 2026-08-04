import assert from "node:assert/strict"
import test from "node:test"
import handler from "../api/github"

class MockResponse {
    statusCode = 200
    headers = new Map<string, string>()
    body: unknown

    setHeader(name: string, value: string) {
        this.headers.set(name.toLowerCase(), value)
    }

    status(code: number) {
        this.statusCode = code
        return this
    }

    json(body: unknown) {
        this.body = body
        return this
    }

    send(body: string) {
        this.body = body
        return this
    }
}

test("GitHub proxy enforces configuration and repository allowlist", async () => {
    const originalToken = process.env.GITHUB_TOKEN
    const originalAllowedRepos = process.env.ALLOWED_REPOS
    const originalFetch = global.fetch

    try {
        delete process.env.GITHUB_TOKEN
        delete process.env.ALLOWED_REPOS

        const missingConfigResponse = new MockResponse()
        await handler({ method: "GET", query: { repo: "TsinbeiLabs/star-history" } }, missingConfigResponse)
        assert.equal(missingConfigResponse.statusCode, 500)

        process.env.GITHUB_TOKEN = "server-secret"
        process.env.ALLOWED_REPOS = "TsinbeiLabs/*,star-history/star-history"

        const deniedResponse = new MockResponse()
        await handler({ method: "GET", query: { repo: "other/project" } }, deniedResponse)
        assert.equal(deniedResponse.statusCode, 403)

        let forwardedAuthorization = ""
        let forwardedUrl = ""
        global.fetch = async (input, init) => {
            forwardedUrl = String(input)
            forwardedAuthorization = new Headers(init?.headers).get("authorization") || ""
            return new Response(JSON.stringify([{ starred_at: "2026-01-01T00:00:00Z" }]), {
                status: 200,
                headers: {
                    "content-type": "application/json",
                    link: "<https://api.github.com/example?page=2>; rel=\"next\"",
                },
            })
        }

        const allowedResponse = new MockResponse()
        await handler({
            method: "GET",
            query: { repo: "TsinbeiLabs/star-history", resource: "stargazers", page: "2" },
        }, allowedResponse)

        assert.equal(allowedResponse.statusCode, 200)
        assert.match(forwardedUrl, /repos\/TsinbeiLabs\/star-history\/stargazers/)
        assert.match(forwardedUrl, /page=2/)
        assert.equal(forwardedAuthorization, "Bearer server-secret")
        assert.equal(allowedResponse.headers.get("cache-control"), "public, s-maxage=300, stale-while-revalidate=3600")
        assert.match(allowedResponse.headers.get("link") || "", /rel="next"/)
    } finally {
        global.fetch = originalFetch
        if (originalToken === undefined) delete process.env.GITHUB_TOKEN
        else process.env.GITHUB_TOKEN = originalToken
        if (originalAllowedRepos === undefined) delete process.env.ALLOWED_REPOS
        else process.env.ALLOWED_REPOS = originalAllowedRepos
    }
})
