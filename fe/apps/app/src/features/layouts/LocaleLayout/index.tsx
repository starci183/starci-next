import { LocaleShell } from "@starci-next/ui"
import { brandFont } from "@/modules/brand"
import { appI18n } from "@/modules/i18n"
import type { ReactNode, ReactElement } from "react"

/** Framework-layout boundary input: the locale segment of the address and the routed body. */
type LocaleLayoutProps = {
    readonly params: Promise<{ readonly locale: string }>
    readonly content: ReactNode
}

/** The document of the address's language with the brand typeface and the app's client providers; the route groups draw the chrome. */
export const LocaleLayout = async (props: LocaleLayoutProps): Promise<ReactElement> => (
    <LocaleShell
        {...await appI18n.readLocaleSegment(props.params)}
        typeface={brandFont.variable}
        content={props.content}
    />
)
