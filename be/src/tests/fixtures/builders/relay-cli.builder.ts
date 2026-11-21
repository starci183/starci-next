import { EnvSource } from "@modules/platform/config"
import { createRelayCliAppOptions } from "../../../../apps/relay-cli/src/relay-cli.options"
import { readRelayCliEnv } from "../../../../apps/relay-cli/src/relay-cli.env"

/** What a wiring proof hands the compiled root: public options and the infrastructure doubles. */
export interface WiringProof {
    readonly options: Readonly<Record<string, unknown>>
    readonly overrides: ReadonlyArray<{ readonly token: unknown; readonly value: unknown }>
}

/** Compiles the real learner CLI root over a bare machine environment; the app has no database and no network to double. */
export const buildWiringProof = (): WiringProof => ({
    options: { ...createRelayCliAppOptions(readRelayCliEnv(new EnvSource({}))) },
    overrides: [],
})
