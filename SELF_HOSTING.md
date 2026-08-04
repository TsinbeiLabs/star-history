# Self-hosting on Vercel

This fork routes browser GitHub API requests through a Vercel Function. The GitHub token remains on the server, and a repository allowlist prevents public visitors from spending the token on arbitrary repositories.

The repository pins pnpm 10.28.2 in both package manifests so Vercel uses the same package manager version that generated the version 9 lockfiles.

## Environment variables

Configure these variables in Vercel for Production, Preview, and Development as needed:

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_TOKEN` | Yes | A GitHub fine-grained or classic personal access token. Public repository metadata only requires read access. |
| `ALLOWED_REPOS` | Yes | Comma or whitespace separated allowlist. Supports exact repositories such as `TsinbeiLabs/star-history`, organization or user wildcards such as `TsinbeiLabs/*`, and explicit global access with `*`. |
| `NEXT_PUBLIC_SITE_URL` | No | Public deployment origin used for canonical metadata and the sitemap. Defaults to `https://star-history.tsinbei.com`. |
| `NEXT_PUBLIC_SHOW_SPONSORS` | No | Set to `true` to show the upstream sponsor sidebar and banners. Defaults to `false`. |
| `NEXT_PUBLIC_SHOW_HEADER` | No | Set to `true` to render the top navigation header. Defaults to `false`. |
| `NEXT_PUBLIC_ENABLE_BLOG` | No | Set to `true` to build `/blog` pages and show blog links. Defaults to `false`. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | No | Plausible Analytics domain. The analytics script is not loaded when this is empty. |
| `NEXT_PUBLIC_FOOTER_TAGLINE` | No | Footer description. Defaults to `GitHub star history graph`. |
| `NEXT_PUBLIC_MAINTAINER_NAME` | No | Footer maintainer name. Defaults to `Tsinbei Labs`. Set an empty value only by changing the code default. |
| `NEXT_PUBLIC_MAINTAINER_URL` | No | Footer maintainer link. Defaults to the TsinbeiLabs GitHub organization. |
| `NEXT_PUBLIC_ORIGINAL_AUTHOR_NAME` | No | Optional original author attribution. Hidden when empty. |
| `NEXT_PUBLIC_ORIGINAL_AUTHOR_URL` | No | Optional original author link. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | Optional footer email icon. Hidden when empty. |
| `NEXT_PUBLIC_X_URL` | No | Optional footer X/Twitter icon. Hidden when empty. |
| `NEXT_PUBLIC_RSS_URL` | No | Optional footer RSS icon. Hidden when empty. |
| `NEXT_PUBLIC_FOOTER_LINKS` | No | JSON array of custom footer links. Hidden when empty. |

Do not prefix the token with `NEXT_PUBLIC_`. Public Next.js variables are included in browser assets.

Use a token that can only read public repository metadata unless the entire Vercel deployment is protected. The proxy URL is public, so allowlisting a private repository would expose its returned metadata and stargazer data to anyone who can reach the deployment.

## Deploy

1. Import the repository into Vercel.
2. Leave Root Directory at the repository root.
3. Vercel reads the static output and Function configuration from `vercel.json`.
4. Add `GITHUB_TOKEN` and `ALLOWED_REPOS` in Project Settings -> Environment Variables.
5. Deploy the project.

The build creates empty fallback ranking data when `gh/data` has not been generated. This keeps clean forks deployable; it only hides the optional weekly ranking, leaderboard, pyramid, and autocomplete datasets.

## Branding and sponsors

Self-hosted deployments hide Bytebase, Dify, SerpApi, pgconsole, pgschema, DBHub, and the upstream sponsor contact by default. To restore the upstream sponsor areas, set:

```text
NEXT_PUBLIC_SHOW_SPONSORS=true
```

The top header and blog are also disabled by default. Enable either feature independently:

```text
NEXT_PUBLIC_SHOW_HEADER=true
NEXT_PUBLIC_ENABLE_BLOG=true
```

When the blog is disabled, the build temporarily removes `pages/blog`, `public/blog`, `public/assets/blog`, and the generated blog index before `next build`, then restores the source afterward. No blog HTML, page bundles, Markdown, or blog image assets are included in `frontend/out`.

Footer links use a JSON array. The optional `icon` may be an absolute URL or a path under `frontend/public`:

```json
[
  {"label":"Tsinbei Labs","url":"https://github.com/TsinbeiLabs"},
  {"label":"Website","url":"https://tsinbei.com","icon":"/assets/logo-icon.png"}
]
```

Because `NEXT_PUBLIC_*` values are compiled into the static frontend, redeploy after changing any branding variable.

Set `NEXT_PUBLIC_SITE_URL` to the deployment origin without a path. Leave `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` empty unless the deployment has its own Plausible Analytics site.

Example private deployment configuration:

```text
GITHUB_TOKEN=github_pat_...
ALLOWED_REPOS=TsinbeiLabs/*,star-history/star-history
```

Every repository used by the web chart or `/svg` endpoint must match this allowlist. For example, `ClosedWHU/WHU-Calendar` requires:

```text
ALLOWED_REPOS=TsinbeiLabs/*,ClosedWHU/WHU-Calendar
```

`star-history/star-history` is included in the example because the header displays the upstream project's current star count. It can be omitted; only that count will fail to load.

## Security behavior

- The browser never receives `GITHUB_TOKEN`.
- Requests for repositories outside `ALLOWED_REPOS` return HTTP 403.
- Missing token or allowlist configuration fails closed with HTTP 500.
- Successful GitHub responses are cached by Vercel for 5 minutes and may be served stale for up to 1 hour while revalidating.
- Only the repository metadata, repository stargazers, and repository owner endpoints required by the chart are exposed.
- `/svg?repos=owner/repo&type=date` generates an embeddable SVG using the same token and repository allowlist.
