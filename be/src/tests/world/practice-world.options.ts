import type { ModuleFactory } from "@starci/test-world"
import { Judge0Module } from "@modules/integrations/judge0"
import { Secret } from "@modules/platform/config"
import { HttpModule } from "@modules/platform/http"

/** The modules of the Judge0 world: the bounded http client, then the judge pointed at the Judge0 fake with short deadlines so an outage ends fast. */
export const judge0Modules: ReadonlyArray<ModuleFactory> = [
    () => HttpModule.register({ isGlobal: true }),
    (w) =>
        Judge0Module.register({
            isGlobal: true,
            judge0: {
                baseUrl: w.fake.judge0?.url ?? "",
                authToken: new Secret(w.fake.judge0?.values.authToken ?? ""),
                timeoutMs: 1000,
                pollIntervalMs: 20,
                deadlineMs: 2000,
            },
        }),
]
