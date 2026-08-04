# Self-hosting on Vercel

This fork routes browser GitHub API requests through a Vercel Function. The GitHub token remains on the server, and a repository allowlist prevents public visitors from spending the token on arbitrary repositories.

## Environment variables

Configure these variables in Vercel for Production, Preview, and Development as needed:

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_TOKEN` | Yes | A GitHub fine-grained or classic personal access token. Public repository metadata only requires read access. |
| `ALLOWED_REPOS` | Yes | Comma or whitespace separated allowlist. Supports exact repositories such as `TsinbeiLabs/star-history`, organization or user wildcards such as `TsinbeiLabs/*`, and explicit global access with `*`. |

Do not prefix the token with `NEXT_PUBLIC_`. Public Next.js variables are included in browser assets.

Use a token that can only read public repository metadata unless the entire Vercel deployment is protected. The proxy URL is public, so allowlisting a private repository would expose its returned metadata and stargazer data to anyone who can reach the deployment.

## Deploy

1. Import the repository into Vercel.
2. Leave Root Directory at the repository root.
3. Vercel reads the static output and Function configuration from `vercel.json`.
4. Add `GITHUB_TOKEN` and `ALLOWED_REPOS` in Project Settings -> Environment Variables.
5. Deploy the project.

The build creates empty fallback ranking data when `gh/data` has not been generated. This keeps clean forks deployable; it only hides the optional weekly ranking, leaderboard, pyramid, and autocomplete datasets.

Example private deployment configuration:

```text
GITHUB_TOKEN=github_pat_...
ALLOWED_REPOS=TsinbeiLabs/*,star-history/star-history
```

`star-history/star-history` is included in the example because the header displays the upstream project's current star count. It can be omitted; only that count will fail to load.

## Security behavior

- The browser never receives `GITHUB_TOKEN`.
- Requests for repositories outside `ALLOWED_REPOS` return HTTP 403.
- Missing token or allowlist configuration fails closed with HTTP 500.
- Successful GitHub responses are cached by Vercel for 5 minutes and may be served stale for up to 1 hour while revalidating.
- Only the repository metadata, repository stargazers, and repository owner endpoints required by the chart are exposed.
