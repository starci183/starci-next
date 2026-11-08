import type { OptionalReturnTo } from "./challenge.contracts"

const LONGEST_PATH = 2048
const SIGN_IN_PATH = /^\/sign-in(?:[/?#]|$)/iu

const hasForbiddenCharacter = (raw: string): boolean =>
    [...raw].some((char) => char < " " || char === "\u007f" || char === "\\")

/**
 * A same-origin relative path the learner may be sent back to: one leading `/`, no scheme, no `//` (or `/\`), no
 * control characters, and not the sign-in screen itself. Anything else, or nothing, is the app home `/`.
 */
export const safeReturnTo = (raw: OptionalReturnTo): string => {
    if (raw === undefined || raw.length === 0 || raw.length > LONGEST_PATH) return "/"
    if (!raw.startsWith("/") || raw.startsWith("//") || hasForbiddenCharacter(raw) || SIGN_IN_PATH.test(raw)) return "/"
    return raw
}
