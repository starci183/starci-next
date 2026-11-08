import type { ReactNode, ReactElement } from "react"
import { AppProviders } from "@/components/providers/AppProviders"
import { appLayoutMetadata } from "@/features/layouts/AppLayout"
import { LocaleLayout } from "@/features/layouts/LocaleLayout"
import "../globals.css"
import type { Metadata } from "next"

type LayoutProps = {
    readonly children: ReactNode
    readonly params: Promise<{ readonly locale: string }>
}

/** The localized document title of this route segment. */
export const generateMetadata = async (props: LayoutProps): Promise<Metadata> =>
    appLayoutMetadata((await props.params).locale)

/** The locale segment's layout slot: it mounts the locale layout around the client providers. */
const Layout = (props: LayoutProps): ReactElement => (
    <LocaleLayout params={props.params} content={<AppProviders>{props.children}</AppProviders>} />
)

export default Layout
