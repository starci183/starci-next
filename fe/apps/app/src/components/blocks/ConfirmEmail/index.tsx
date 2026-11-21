"use client"

import { useTranslations } from "next-intl"
import { useConfirmEmail } from "@/hooks/auth"
import { ConfirmEmailBase } from "./component"

/** What the confirm page tells the card: the token the emailed link carried (when it did) and where the sign-in screen is. */
type ConfirmEmailProps = {
    readonly token: string | undefined
    readonly signInHref: string
}

/** The confirm card: spends the emailed link once when the page opens, then says in words whether the account is active. */
export const ConfirmEmail = (props: ConfirmEmailProps) => {
    const t = useTranslations("app.auth.confirm")
    const verdict = useConfirmEmail(props.token)
    return (
        <ConfirmEmailBase
            props={{
                title: t(`${verdict}.title`),
                text: t(`${verdict}.text`),
                isWorking: verdict === "working",
                failureTitle: verdict === "unavailable" ? t("unavailable.title") : undefined,
                signInLabel: t("signIn"),
                signInHref: props.signInHref,
            }}
        />
    )
}
