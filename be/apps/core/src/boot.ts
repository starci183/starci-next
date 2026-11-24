import { Test, type TestingModule } from "@nestjs/testing"
import { EnvSource } from "@modules/platform/config"
import { buildWiringProof } from "../../../src/tests/fixtures/builders/core.builder"
import { AppModule } from "./app.module"
import { readCoreEnv } from "./core.env"

/**
 * The root the server boots, composed by `starci app check` (hfs.json sides.be.apps[].boot, R448): the real options read from the stub
 * environment of `boot.env`, the infrastructure doubled as the wiring proof doubles it, so only the wiring is judged. The check closes the context.
 */
export const bootRoot = async (): Promise<TestingModule> => {
    const builder = Test.createTestingModule({ imports: [AppModule.register(readCoreEnv(EnvSource.fromProcess()))] })
    for (const double of buildWiringProof().overrides)
        builder.overrideProvider(double.token as never).useValue(double.value)
    return builder.compile()
}
