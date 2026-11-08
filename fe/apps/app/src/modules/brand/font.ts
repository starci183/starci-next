import localFont from "next/font/local"
import type { NextFontWithVariable } from "next/dist/compiled/@next/font"

/** The brand typeface, Be Vietnam Pro, served by next/font; its class defines `--font-sans`, the grammar's typeface token. */
export const brandFont: NextFontWithVariable = localFont({
    src: [
        { path: "./fonts/be-vietnam-pro-400.ttf", weight: "400", style: "normal" },
        { path: "./fonts/be-vietnam-pro-500.ttf", weight: "500", style: "normal" },
        { path: "./fonts/be-vietnam-pro-600.ttf", weight: "600", style: "normal" },
    ],
    variable: "--font-sans",
    display: "swap",
})
