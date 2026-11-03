import type { ReactNode, ReactElement } from "react"
import { LocaleShell } from "@starci-next/ui"
import { LandingLayout, landingLayoutMetadata } from "@/features/layouts/LandingLayout"
import { landingI18n } from "@/modules/i18n"
import "../globals.css"
import type { Metadata } from "next"

type LayoutProps = {
    readonly children: ReactNode
    readonly params: Promise<{ readonly locale: string }>
}

/** The localized document title and description of the landing. */
export const generateMetadata = async (props: LayoutProps): Promise<Metadata> =>
    landingLayoutMetadata((await props.params).locale)

/** The locale segment's layout slot: the document of the address's language around the landing's chrome. */
const Layout = async (props: LayoutProps): Promise<ReactElement> => (
    <LocaleShell {...await landingI18n.readLocaleSegment(props.params)}>
        <LandingLayout content={props.children} />
    </LocaleShell>
)

export default Layout
