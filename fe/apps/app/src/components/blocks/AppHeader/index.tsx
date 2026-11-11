"use client"

import { navigation } from "@starci-next/i18n/navigation"
import { useTranslations } from "next-intl"
import { useViewerPlan } from "@/hooks/plan"
import { useSession, useSignOut } from "@/hooks/auth"
import { useLocaleSwitch, useLocalizedPathname } from "@/hooks/locale"
import { useThemeSwitch } from "@/hooks/theme"
import { useSignInModalStore } from "@/hooks/zustand/signInModal"
import { APP_ROUTES, signInSearch } from "@/modules/routes"
import { AppHeaderBase, type AppHeaderAccountShape } from "./component"

/** The addresses the top bar needs: the account menu's Premium page, the profile page and the sign-in screen (the bar is hidden there). */
type AppHeaderProps = {
    readonly brand: string
    readonly logoSrc: string
    readonly premiumHref: string
    readonly profileHref: string
    readonly signInHref: string
}

/** True when the reader is on `href` or below it. */
const isOn = (pathname: string, href: string): boolean => pathname === href || pathname.startsWith(`${href}/`)

/** The drawing the session selects. */
const shapeOf = (status: "unknown" | "signed-in" | "signed-out"): AppHeaderAccountShape => {
    if (status === "unknown") return "unknown"
    return status === "signed-in" ? "signedIn" : "signedOut"
}

/** The muted line under the brand: the role and the plan of a signed-in reader, the guest word of a signed-out one, nothing while unknown. */
const roleLineOf = (status: "unknown" | "signed-in" | "signed-out", learner: string, guest: string, plan: string): string => {
    if (status === "signed-in") return `${learner} · ${plan}`
    return status === "signed-out" ? guest : ""
}

/**
 * The shell's top bar (as NIVO's ConsoleHeader): the lockup with the role and plan line, the language and theme switches and the account menu (sign out) or, for a
 * signed-out reader, the guest avatar whose entry opens the sign-in modal. Hidden on the sign-in screens, which draw their own centred brand.
 */
export const AppHeader = (props: AppHeaderProps) => {
    const pathname = useLocalizedPathname()
    const session = useSession()
    const language = useLocaleSwitch()
    const theme = useThemeSwitch()
    const router = navigation.useRouter()
    const plan = useViewerPlan()
    const t = useTranslations("app.shell")
    const out = useTranslations("app.signOut")
    const { pending, signOut } = useSignOut()
    const setSignInOpen = useSignInModalStore((state) => state.setOpen)
    if (isOn(pathname, props.signInHref)) return null
    const planName = plan === "premium" ? t("planPremium") : t("planFree")
    const roleLine = roleLineOf(session.status, t("roleLearner"), t("roleGuest"), planName)
    return (
        <AppHeaderBase
            shape={shapeOf(session.status)}
            props={{
                customButtons: [],
                brand: { name: props.brand, logoSrc: props.logoSrc, roleLine },
                language: {
                    label: language.label,
                    locale: language.locale,
                    isPending: language.isPending,
                    options: language.options,
                },
                theme: { label: theme.label, isDark: theme.isDark },
                accountName: session.session?.displayName ?? session.session?.email ?? t("account"),
                accountLabel: t("account"),
                identity: { title: session.session?.email ?? session.session?.displayName ?? t("account"), subtitle: planName },
                plan: { label: plan === "premium" ? t("yourPlan") : t("upgradePremium"), href: props.premiumHref },
                profileLabel: t("profile"),
                profileHref: props.profileHref,
                signOutLabel: pending ? out("working") : out("submit"),
                signInLabel: out("signIn"),
                signOutPending: pending,
            }}
            on={{
                chooseLanguage: language.choose,
                themeChange: theme.change,
                goHome: () => router.push(APP_ROUTES.home),
                signOut: () => signOut(props.signInHref + signInSearch({ signedOut: true })),
                signIn: () => setSignInOpen(true),
            }}
        />
    )
}
