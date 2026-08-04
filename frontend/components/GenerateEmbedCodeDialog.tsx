import React, { useEffect, useState } from "react"
import toast from "../helpers/toast"
import utils from "@shared/common/utils"
import { useAppStore } from "../store"
import Dialog from "./Dialog"
import { FaTimesCircle } from "react-icons/fa"

interface State {
    embedCode: string
}

interface GenerateEmbedCodeDialogProps {
    show: boolean
    onClose: () => void
}

const GenerateEmbedCodeDialog: React.FC<GenerateEmbedCodeDialogProps> = ({ onClose }) => {
    const store = useAppStore() // Cast to the correct type
    const [state, setState] = useState<State>({
        embedCode: "",
    })
    const generateEmbedCode = React.useCallback(() => {
        const chartModeParam = store.chartMode === "Date" ? "type=date" : "type=timeline"
        const logScaleParam = store.useLogScale ? "&logscale" : ""
        const legendParam = `&legend=${store.legendPosition}`
        setState({
            embedCode: `<iframe style="width:100%;height:auto;min-width:600px;min-height:400px;" src="${window.location.origin}/embed#${store.repos.join("&")}&${chartModeParam}${logScaleParam}${legendParam}" frameBorder="0"></iframe>`
        })
    }, [store.repos, store.chartMode, store.useLogScale, store.legendPosition])

    useEffect(() => {
        generateEmbedCode()
    }, [generateEmbedCode])

    const handleCopyBtnClick = () => {
        utils.copyTextToClipboard(state.embedCode)
        toast.succeed("Embed code copied")
    }

    const handleCloseBtnClick = () => {
        onClose()
    }

    return (
        <Dialog>
            <div className="dialog-panel">
                <header className="dialog-header">
                    <span className="dialog-title">Embed Chart</span>
                    <FaTimesCircle className="dialog-close" onClick={handleCloseBtnClick} />
                </header>
                <main className="dialog-body">
                    <p className="leading-8 mb-1">Copy and paste the below code into your blog or website. The server-side token is never included in the embed URL.</p>
                    <div className="code-block pb-14">
                        <p className="code-text">{state.embedCode}</p>
                        <button className="absolute bottom-2 right-2 btn-primary" onClick={handleCopyBtnClick}>
                            Copy
                        </button>
                    </div>
                </main>
            </div>
        </Dialog>
    )
}

export default GenerateEmbedCodeDialog
