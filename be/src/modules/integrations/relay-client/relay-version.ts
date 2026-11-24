/** The package version the bundler writes into the build (`define`); a plain `tsc` build has none. */
declare const __RELAY_VERSION__: string | undefined

/** The version of this `@starci/next-relay` build, `dev` when it did not come from the bundle. */
export const RELAY_VERSION: string = typeof __RELAY_VERSION__ === "string" ? __RELAY_VERSION__ : "dev"
