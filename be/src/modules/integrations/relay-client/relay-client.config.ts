import type { EnvSource } from "@modules/platform/config"

/** The StarCi app the CLI talks to when nothing else is configured. */
export const DEFAULT_BASE_URL = "https://starci-next.example.invalid"

/** What the CLI keeps between runs: where StarCi is and, once paired, this device's token. */
export interface CliConfig {
    /** The StarCi app origin (doors under /api, the relay under /relay). */
    readonly baseUrl: string
    /** This device's bearer token, once paired. */
    readonly deviceToken?: string
}

/** The environment the CLI reads its settings from. */
export interface ConfigEnv {
    /** `STARCI_NEXT_HOME`: the folder of the config file; defaults to `~/.starci-next`. */
    readonly STARCI_NEXT_HOME?: string | undefined
    /** `STARCI_NEXT_URL`: the StarCi app origin; overrides the stored one. */
    readonly STARCI_NEXT_URL?: string | undefined
    /** `STARCI_NEXT_MANIFEST_KEY`: the SPKI PEM of the StarCi key manifests are verified with. */
    readonly STARCI_NEXT_MANIFEST_KEY?: string | undefined
    /** `STARCI_NEXT_DATA_DIR`: a checkout of starci-next-data, where `init` reads the kit when `--from` is not given. */
    readonly STARCI_NEXT_DATA_DIR?: string | undefined
}

/** Reads the learner CLI settings of an environment source: all optional, so a bare machine runs with the defaults. */
export const parseRelayClientConfig = (env: EnvSource): ConfigEnv => ({
    STARCI_NEXT_HOME: env.optional("STARCI_NEXT_HOME"),
    STARCI_NEXT_URL: env.optional("STARCI_NEXT_URL"),
    STARCI_NEXT_MANIFEST_KEY: env.optional("STARCI_NEXT_MANIFEST_KEY"),
    STARCI_NEXT_DATA_DIR: env.optional("STARCI_NEXT_DATA_DIR"),
})
