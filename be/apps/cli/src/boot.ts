import { Test } from "@nestjs/testing"
import { EnvSource } from "@modules/platform/config"
import { buildWiringProof } from "../../../src/tests/fixtures/builders/cli.builder"
import { AppModule } from "./app.module"
import { readCliEnv } from "./cli.env"
import { createCliAppOptions } from "./cli.options"

/**
 * The root every command boots, composed by `starci app check` (hfs.json sides.be.apps[].boot, R448): the real options read from the stub
 * environment of `boot.env`, the database doubled as the wiring proof doubles it, so only the wiring is judged. The check closes the context.
 */
export const bootRoot = async () => {
    const builder = Test.createTestingModule({
        imports: [AppModule.register(createCliAppOptions(readCliEnv(EnvSource.fromProcess())))],
    })
    for (const double of buildWiringProof().overrides)
        builder.overrideProvider(double.token as never).useValue(double.value)
    return builder.compile()
}
