"use client"

import { useLocaleSwitch } from "@/hooks/locale"
import { LocaleSwitchBase } from "./component"

/** The language menu of the app chrome (the header and the sign-in screen): the language is part of the address. */
export const LocaleSwitch = () => {
    const language = useLocaleSwitch()
    return (
        <LocaleSwitchBase
            props={{
                label: language.label,
                locale: language.locale,
                isPending: language.isPending,
                options: language.options,
            }}
            on={{ choose: language.choose }}
        />
    )
}
