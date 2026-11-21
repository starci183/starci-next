/**
 * The only reader of `process.env` in this app. A value is read when it is asked for, not when the file loads, and a
 * missing value stops the caller with a named error: there is no localhost fallback.
 */

const required = (name: string, value: string | undefined): string => {
    if (value === undefined || value === "") throw new Error(`${name} is not set`)
    return value
}

/** The public origin of the app, the base of every absolute metadata URL; throws when `NEXT_PUBLIC_SITE_URL` is not set. */
export const siteUrl = (): string => required("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL)

/** The public base of the repo-owned media: the full prefix of the statics in the project store (`<storage origin>/<bucket>/<prefix>`); throws when `NEXT_PUBLIC_STATICS_URL` is not set. */
export const staticsBase = (): string =>
    required("NEXT_PUBLIC_STATICS_URL", process.env.NEXT_PUBLIC_STATICS_URL).replace(/\/+$/u, "")

/** The URL of one static from its staticsKey, the path under `statics/` (`art/topics/databases.webp`); code holds keys, never URLs. */
export const staticsUrl = (key: string): string => `${staticsBase()}/${key}`

/** True when the app is opened on a host of the local machine: the browser then reaches the local api, whose cookie is same-site there. */
const onLocalHost = (): boolean =>
    typeof window !== "undefined" && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)

/**
 * The origin of the back end api the browser calls directly (GraphQL at `/graphql`) and whose auth doors modules/auth calls; throws when
 * `NEXT_PUBLIC_API_URL` is not set. A dev stack served through a tunnel sets `NEXT_PUBLIC_LOCAL_API_URL` too: the app opened on localhost keeps its
 * local api (the refresh cookie stays same-site), the app opened on the tunnel origin calls the tunnel api.
 */
export const apiUrl = (): string => {
    const local = process.env.NEXT_PUBLIC_LOCAL_API_URL
    const origin =
        local !== undefined && local !== "" && onLocalHost()
            ? local
            : required("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL)
    return origin.endsWith("/") ? origin.slice(0, -1) : origin
}

/** The GraphQL endpoint of the back end api. */
export const graphqlUrl = (): string => `${apiUrl()}/graphql`

/** Whether the back end has Google sign-in configured (`NEXT_PUBLIC_AUTH_GOOGLE=true`, set with the back end GOOGLE_CLIENT_ID): the sign-in card draws its Google button only then, so no environment shows a dead button. */
export const googleSignInEnabled = (): boolean => process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true"
