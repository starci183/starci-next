"use client"

import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"

/** What the bar's theme switch needs: its accessible name, whether the dark theme is on and the command that sets it. */
type ThemeSwitchHook = {
    readonly label: string
    readonly isDark: boolean
    readonly change: (isDark: boolean) => void
}

/**
 * The light and dark switch: the mode is the app's (`.dark` on `html`, as HeroUI reads it), kept by next-themes, which persists the
 * reader's choice in the browser and follows the system until one is made. Before the browser has resolved it the switch reads off.
 */
export const useThemeSwitch = (): ThemeSwitchHook => {
    const t = useTranslations("app.shell")
    const { resolvedTheme, setTheme } = useTheme()
    return {
        label: t("themeLabel"),
        isDark: resolvedTheme === "dark",
        change: (isDark) => setTheme(isDark ? "dark" : "light"),
    }
}
