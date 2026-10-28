import type { ReactNode } from "react"
import { PageContainer, TextAction, TopBar, WorkspaceShell } from "@starci/grammar/common"
import { siteShellClassNames } from "./classNames"

/** What an app's chrome hands the shell: the brand, its home link and the routed body. */
type SiteShellProps = {
    /** The wordmark; it also names the page's main landmark. */
    readonly brand: string
    /** The destination of the wordmark: the app's front door. */
    readonly homeHref: string
    /** The routed page body. */
    readonly children: ReactNode
}

/**
 * The document chrome both apps share (inside the providers' Grammar root): the brand header (the top bar carrying the wordmark that links
 * home), then the routed body in the shell's main landmark at reading measure.
 */
export const SiteShell = (props: SiteShellProps) => (
    <WorkspaceShell
        viewport="flow"
        className={siteShellClassNames.frame}
        primaryLabel={props.brand}
        header={<TopBar brand={<TextAction href={props.homeHref}>{props.brand}</TextAction>} />}
        primary={<PageContainer measure="reading">{props.children}</PageContainer>}
    />
)
