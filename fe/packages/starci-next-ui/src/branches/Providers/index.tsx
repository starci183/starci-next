"use client"

import { I18nProvider } from "@heroui/react"
import { GrammarRoot } from "@starci/grammar/common"
import { NextIntlClientProvider } from "next-intl"
import type { ReactNode } from "react"

/** What the provider stack takes: the locale resolved on the server, its catalog, the product time zone and the tree it wraps (`content`). */
type ProvidersProps = {
    readonly locale: string
    readonly messages: Record<string, unknown>
    readonly timeZone: string
    readonly content: ReactNode
}

/**
 * The contexts above every route: next-intl's copy context, React Aria's locale for the grammar's controls and Grammar's Common
 * boundary (its root holds React Aria's router context, so it renders on the client). Both locales are the same, so the sentences
 * and the controls of a page speak one language.
 */
export const Providers = (props: ProvidersProps) => (
    <NextIntlClientProvider locale={props.locale} messages={props.messages} timeZone={props.timeZone}>
        <I18nProvider locale={props.locale}>
            <GrammarRoot>{props.content}</GrammarRoot>
        </I18nProvider>
    </NextIntlClientProvider>
)
