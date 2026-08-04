import { FaEnvelope, FaRss } from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"
import { footerBranding } from "../helpers/branding"

const Footer = () => {
    const hasAttribution = footerBranding.maintainerName || footerBranding.originalAuthorName

    return (
        <footer className="relative w-full shrink-0 h-auto mt-6 flex flex-col justify-end items-center">
            <div className="w-full py-2 px-3 flex flex-row flex-wrap justify-between items-center text-neutral-700 border-t">
                <div className="text-sm leading-8 flex flex-row flex-wrap justify-start items-center">
                    <div className="h-full text-gray-600">{footerBranding.tagline}</div>
                    {footerBranding.contactEmail && (
                        <a className="h-full flex flex-row justify-center items-center ml-2 text-lg hover:opacity-80" href={`mailto:${footerBranding.contactEmail}`} target="_blank" rel="noopener noreferrer">
                            <FaEnvelope />
                        </a>
                    )}
                    {footerBranding.xUrl && (
                        <a className="h-full flex flex-row justify-center items-center ml-2 text-lg hover:opacity-80" href={footerBranding.xUrl} target="_blank" rel="noopener noreferrer">
                            <FaXTwitter />
                        </a>
                    )}
                    {footerBranding.rssUrl && (
                        <a className="h-full flex flex-row justify-center items-center ml-2 text-lg hover:opacity-80" href={footerBranding.rssUrl} target="_blank" rel="noopener noreferrer">
                            <FaRss />
                        </a>
                    )}
                </div>
                {footerBranding.links.length > 0 && (
                    <div className="flex flex-row flex-wrap items-center space-x-4">
                        {footerBranding.links.map((link) => (
                            <div key={`${link.label}-${link.url}`} className="flex flex-row link-footer">
                                {link.icon && <img className="h-4 mt-2 mr-1" src={link.icon} alt="" />}
                                <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
                            </div>
                        ))}
                    </div>
                )}
                {hasAttribution && <div className="text-xs leading-8 flex flex-row flex-nowrap justify-end items-center">
                    <span className="text-gray-600">
                        {footerBranding.maintainerName && <>
                            Maintained by{" "}
                            <a className="link" href={footerBranding.maintainerUrl || "#"} target="_blank" rel="noopener noreferrer">
                                {footerBranding.maintainerName}
                            </a>
                        </>}
                        {footerBranding.maintainerName && footerBranding.originalAuthorName && ", "}
                        {footerBranding.originalAuthorName && <>
                            originally built by{" "}
                            <a className="link" href={footerBranding.originalAuthorUrl || "#"} target="_blank" rel="noopener noreferrer">
                                {footerBranding.originalAuthorName}
                            </a>
                        </>}
                    </span>
                </div>}
            </div>
        </footer>
    )
}

export default Footer
