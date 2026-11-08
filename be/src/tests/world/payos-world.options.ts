import type { ModuleFactory } from "@starci/test-world"
import { PayosModule } from "@modules/integrations/payos"
import { Secret } from "@modules/platform/config"
import { HttpModule } from "@modules/platform/http"

/** The modules of the payOS world: the bounded http client, then the rail pointed at the payOS fake with a short deadline so an outage ends fast. */
export const payosModules: ReadonlyArray<ModuleFactory> = [
    () => HttpModule.register({ isGlobal: true }),
    (w) =>
        PayosModule.register({
            isGlobal: true,
            channel: {
                checksumKey: new Secret(w.fake.payos?.values.checksumKey ?? ""),
                clientId: w.fake.payos?.values.clientId ?? "",
                apiKey: new Secret(w.fake.payos?.values.apiKey ?? ""),
                apiBase: w.fake.payos?.url ?? "",
                timeoutMs: 1000,
            },
        }),
]
