import { ErrorNotice } from "@starci-next/ui"
import { LANDING_ROUTES } from "@/modules/routes"

/** The error page's resolved words and where its illustration is served from. */
type LandingErrorPageBaseProps = {
    readonly title: string
    readonly description: string
    readonly homeLabel: string
    readonly retryLabel: string
    readonly staticsBaseUrl: string
}

/** What the error page reads: its resolved words and its one command, retry the segment. */
type LandingErrorPageBaseContract = {
    readonly props: LandingErrorPageBaseProps
    readonly on: { readonly retry: () => void }
}

/** The pure error page of the landing: the page-level empty state a render failure shows, home as the primary and retry as the secondary. */
export const LandingErrorPageBase = (props: LandingErrorPageBaseContract) => (
    <ErrorNotice {...props.props} homeHref={LANDING_ROUTES.home} onRetry={props.on.retry} />
)
