import type { ReactNode } from "react"
import { Link, TopBar, WorkspaceShell } from "@starci/grammar/common"

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
 * home), then the routed body in the shell's main landmark; each route page draws its own Page, which owns the measure.
 */
export const SiteShell = (props: SiteShellProps) => (
    <WorkspaceShell
        viewport="flow"
        primaryLabel={props.brand}
        header={<TopBar brand={<Link href={props.homeHref}>{props.brand}</Link>} />}
        primary={props.children}
    />
)
