import { ErrorNotice } from "@starci-next/ui"
import { APP_ROUTES } from "@/modules/routes"

/** Props for {@link AppErrorPageBase}. */
export type AppErrorPageBaseProps = {
    /** The words the failure shows, already resolved, and where its illustration is served from. */
    readonly props: {
        readonly title: string
        readonly description: string
        readonly homeLabel: string
        readonly retryLabel: string
        readonly staticsBaseUrl: string
    }
    /** What the surface reports upward. */
    readonly on: {
        readonly retry: () => void
    }
}

/** Draw the failure of the product app's locale segment as the page-level empty state: home as the primary, retry as the secondary. */
export const AppErrorPageBase = (props: AppErrorPageBaseProps) => (
    <ErrorNotice {...props.props} homeHref={APP_ROUTES.home} onRetry={props.on.retry} />
)
