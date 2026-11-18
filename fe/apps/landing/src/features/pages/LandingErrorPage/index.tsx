import { useTranslations } from "next-intl"
import { staticsBase } from "@/modules/config"
import { LandingErrorPageBase } from "./component"

/** The public props of the landing's locale error page: the boundary hands it the retry. */
type LandingErrorPageProps = { readonly onRetry: () => void }

/** A render failure in the landing shows the page-level empty state instead of a blank page; retry re-renders the segment. */
export const LandingErrorPage = (props: LandingErrorPageProps) => {
    const t = useTranslations("landing.errors.page")
    return (
        <LandingErrorPageBase
            props={{
                title: t("title"),
                description: t("description"),
                homeLabel: t("home"),
                retryLabel: t("retry"),
                staticsBaseUrl: staticsBase(),
            }}
            on={{ retry: props.onRetry }}
        />
    )
}
