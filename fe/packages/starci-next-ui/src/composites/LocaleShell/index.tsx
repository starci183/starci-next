import type { ReactNode } from "react"
import { documentClassName } from "./classNames"
import { Providers } from "../../branches/Providers"

/** What the app's locale layout resolves before mounting the shell (the i18n package's readLocaleSegment). */
type LocaleShellProps = {
    readonly locale: string
    readonly messages: Record<string, unknown>
    readonly timeZone: string
    readonly content: ReactNode
    /** The font-loader class that defines the app's typeface token on the document. */
    readonly typeface?: string
}

/** The document of one route language: `<html lang>` from the address and the provider stack; the app's own chrome is the content. */
export const LocaleShell = (props: LocaleShellProps) => (
    <html lang={props.locale} className={documentClassName(props.typeface)} suppressHydrationWarning>
        <body>
            <Providers
                locale={props.locale}
                messages={props.messages}
                timeZone={props.timeZone}
                content={props.content}
            />
        </body>
    </html>
)
