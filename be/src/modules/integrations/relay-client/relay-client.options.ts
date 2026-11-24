import type { ConfigEnv } from "./relay-client.config"
import type { ServiceHost } from "./service.policy"

/** What the app root hands the relay client: the learner CLI settings read once at boot. */
export interface RelayClientModuleOptions {
    /** Whether this capability is available app-wide; only an app composition root may pass `true`. */
    readonly isGlobal?: boolean
    /** The settings of this machine's environment (config folder, StarCi origin, manifest key). */
    readonly env: ConfigEnv
    /** The project folder `init` and `run` work in; the working directory of the process when absent. */
    readonly cwd?: string
    /** Where the start-at-login entry goes; this machine's own when absent (a spec passes a fake). */
    readonly serviceHost?: ServiceHost
}
