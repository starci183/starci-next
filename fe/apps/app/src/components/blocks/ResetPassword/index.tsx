"use client"

import { useTranslations } from "next-intl"
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, useResetPassword } from "@/hooks/auth"
import { staticsBase } from "@/modules/config"
import { ArtImage, areaArt } from "@starci-next/ui"
import { ResetPasswordBase } from "./component"

/** What the reset page tells the card: the token the emailed link carried (when it did), where a finished reset goes and where the sign-in screen is. */
type ResetPasswordProps = {
    readonly token: string | undefined
    /** The sign-in screen with the "password was reset" notice. */
    readonly doneHref: string
    readonly signInHref: string
}

/** The reset card: the new password and its confirmation, sent with the emailed token; a success leaves for the sign-in screen. */
export const ResetPassword = (props: ResetPasswordProps) => {
    const t = useTranslations("app.auth")
    const reset = useResetPassword(props.token, props.doneHref)
    const bounds = { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH }
    return (
        <ResetPasswordBase
            props={{
                title: t("reset.title"),
                subtitle: t("reset.subtitle"),
                art: <ArtImage asset={areaArt("auth")} base={staticsBase()} />,
                notice: reset.problem === "unavailable" ? t("notice.unavailable") : undefined,
                invalid:
                    reset.problem === "invalid"
                        ? {
                              title: t("reset.expired.title"),
                              text: t("reset.expired.text"),
                              facts: {
                                  once: t("reset.expired.once"),
                                  expires: t("reset.expired.expires"),
                                  again: t("reset.expired.again"),
                              },
                              againLabel: t("reset.again"),
                              signInHref: props.signInHref,
                          }
                        : undefined,
                newPasswordLabel: t("field.newPassword"),
                confirmLabel: t("field.confirm"),
                passwordLength: {
                    label: t("field.passwordLength", bounds),
                    ...bounds,
                    reading: (count) => t("field.passwordReading", { count, max: bounds.max }),
                },
                passwordPlaceholder: t("field.passwordPlaceholder"),
                confirmPlaceholder: t("field.confirmPlaceholder"),
                reveal: t("field.reveal"),
                hide: t("field.hide"),
                submitLabel: t("reset.submit"),
                passwordError: reset.problem === "password" ? t("error.password", bounds) : undefined,
                confirmError: reset.problem === "mismatch" ? t("error.mismatch") : undefined,
                isPending: reset.pending,
            }}
            on={{ submit: reset.submit }}
        />
    )
}
