import { IBM_Plex_Sans } from "next/font/google"
import type { NextFontWithVariable } from "next/dist/compiled/@next/font"

/**
 * The brand typeface, IBM Plex Sans (owner 2026-11-11: one font for the whole app, markdown included), served by next/font;
 * its class defines `--font-sans` directly (the stylesheets may alias no private token).
 */
export const brandFont: NextFontWithVariable = IBM_Plex_Sans({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600"],
    variable: "--font-sans",
    display: "swap",
})
