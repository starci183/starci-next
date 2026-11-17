"use client"

import { useTranslations } from "next-intl"
import { useLocalizedPathname } from "@/hooks/locale"
import { useSignInModalStore } from "@/hooks/zustand/signInModal"
import { SignInModalBase } from "./component"

/** The sign-in modal of the app chrome: opened by the header's sign-in entry, it keeps the reader on the page they are on. */
export const SignInModal = () => {
    const t = useTranslations("app.auth")
    const isOpen = useSignInModalStore((state) => state.isOpen)
    const setOpen = useSignInModalStore((state) => state.setOpen)
    const pathname = useLocalizedPathname()
    return (
        <SignInModalBase
            props={{ isOpen, title: t("modal.title"), closeLabel: t("modal.close"), returnTo: pathname }}
            on={{ openChange: setOpen }}
        />
    )
}
