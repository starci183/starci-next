import type { ReactNode } from "react"
import { TopBar, WorkspaceShell } from "@starci/grammar/common"

/** What a site chrome hands the shell: the brand, the actions at the end of the bar and the routed body. */
type SiteShellProps = {
    /** The wordmark; it also names the main landmark of the page. */
    readonly brand: string
    /** The brand as the bar draws it (a lockup with the logo); the plain wordmark when omitted. */
    readonly brandMark?: ReactNode
    /** The controls at the end of the bar (the language menu, the way into the app). */
    readonly actions?: ReactNode
    /** The routed page body. */
    readonly children: ReactNode
}

/**
 * The generic site chrome (inside the Grammar root of the providers): the brand bar over the routed body in the main landmark of the shell, a flow
 * shell whose document scrolls. A product app that has a workspace frame (a side navigation, an account cluster) composes its own fixed
 * WorkspaceShell with its own header; each route page draws its own Page, which owns the measure.
 */
export const SiteShell = (props: SiteShellProps) => (
    <WorkspaceShell
        viewport="flow"
        primaryLabel={props.brand}
        header={
            <TopBar
                brand={props.brandMark ?? props.brand}
                {...(props.actions === undefined ? {} : { actions: props.actions })}
            />
        }
        primary={props.children}
    />
)
