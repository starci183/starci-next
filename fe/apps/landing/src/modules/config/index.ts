/**
 * The only reader of `process.env` in the landing. A value is read when it is asked for, not when the file loads, and a missing
 * value stops the caller with a named error: there is no localhost fallback.
 */

const required = (name: string, value: string | undefined): string => {
    if (value === undefined || value === "") throw new Error(`${name} is not set`)
    return value
}

/** The public origin of the product app the landing hands the reader over to; throws when `NEXT_PUBLIC_APP_URL` is not set. */
export const appUrl = (): string => required("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL)

/** The public base of the repo-owned media: the full prefix of the statics in the project store; throws when `NEXT_PUBLIC_STATICS_URL` is not set. */
export const staticsBase = (): string =>
    required("NEXT_PUBLIC_STATICS_URL", process.env.NEXT_PUBLIC_STATICS_URL).replace(/\/+$/u, "")
