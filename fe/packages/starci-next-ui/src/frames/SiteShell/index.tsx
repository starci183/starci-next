import type { ReactNode } from "react"
import { TopBar, WorkspaceShell } from "@starci/grammar/common"

/** What a site's chrome hands the shell: the brand and the routed body. */
type SiteShellProps = {
    /** The wordmark; it also names the page's main landmark. */
    readonly brand: string
    /** The routed page body. */
    readonly children: ReactNode
}

/**
 * The generic site chrome (inside the providers' Grammar root): the plain brand bar over the routed body in the shell's main landmark, a flow
 * shell whose document scrolls. A product app that has a workspace frame (a side navigation, an account cluster) composes its own fixed
 * WorkspaceShell with its own header, so this shell carries no header slot; each route page draws its own Page, which owns the measure.
 */
export const SiteShell = (props: SiteShellProps) => (
    <WorkspaceShell
        viewport="flow"
        primaryLabel={props.brand}
        header={<TopBar brand={props.brand} />}
        primary={props.children}
    />
)
