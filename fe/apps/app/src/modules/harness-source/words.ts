import type { HarnessLocale } from "@/modules/types"

/** The three backticks of a markdown code fence, so a fixture can hold fences inside a template string. */
export const FENCE = "```"

/** The words of one language out of a vi and en pair. */
export const pick = (locale: HarnessLocale, vi: string, en: string): string => (locale === "vi" ? vi : en)

/** A fenced code block: its language, its code and the blank line after it. */
export const fenced = (language: string, code: string): string => `${FENCE}${language}\n${code}\n${FENCE}\n`

/** The locale a request names, with Vietnamese as the fallback. */
export const harnessLocaleOf = (raw: string): HarnessLocale => (raw === "en" ? "en" : "vi")
