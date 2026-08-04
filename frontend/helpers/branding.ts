export interface FooterLink {
    label: string
    url: string
    icon?: string
}

function parseFooterLinks(value: string | undefined): FooterLink[] {
    if (!value) return []

    try {
        const links = JSON.parse(value)
        if (!Array.isArray(links)) return []

        return links.filter((link): link is FooterLink => (
            typeof link?.label === "string"
            && typeof link?.url === "string"
            && (link.icon === undefined || typeof link.icon === "string")
        ))
    } catch {
        return []
    }
}

export const showSponsors = process.env.NEXT_PUBLIC_SHOW_SPONSORS === "true"
export const showHeader = process.env.NEXT_PUBLIC_SHOW_HEADER === "true"
export const enableBlog = process.env.NEXT_PUBLIC_ENABLE_BLOG === "true"
export const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || ""

export const footerBranding = {
    tagline: process.env.NEXT_PUBLIC_FOOTER_TAGLINE || "GitHub star history graph",
    maintainerName: process.env.NEXT_PUBLIC_MAINTAINER_NAME || "Tsinbei Labs",
    maintainerUrl: process.env.NEXT_PUBLIC_MAINTAINER_URL || "https://github.com/TsinbeiLabs",
    originalAuthorName: process.env.NEXT_PUBLIC_ORIGINAL_AUTHOR_NAME || "",
    originalAuthorUrl: process.env.NEXT_PUBLIC_ORIGINAL_AUTHOR_URL || "",
    contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
    xUrl: process.env.NEXT_PUBLIC_X_URL || "",
    rssUrl: process.env.NEXT_PUBLIC_RSS_URL || "",
    links: parseFooterLinks(process.env.NEXT_PUBLIC_FOOTER_LINKS),
}
