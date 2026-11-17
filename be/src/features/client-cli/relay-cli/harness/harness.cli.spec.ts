import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { HarnessCiReportCli } from "./subs/ci-report.cli"
import { HarnessE2eCli } from "./subs/e2e.cli"
import { HarnessPullCli } from "./subs/pull.cli"

const commandOf = async <T>(type: new (...args: never[]) => T, relay: RelayClientPort): Promise<T> => {
    const moduleRef = await Test.createTestingModule({ providers: [type] })
        .useMocker(() => relay)
        .compile()
    return moduleRef.get(type)
}

describe("harness commands", () => {
    it("pull delegates the named build to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        const command = await commandOf(HarnessPullCli, relay)

        await command.run(["agent-cli"])

        expect(relay.harnessPull).toHaveBeenCalledWith("agent-cli")
    })

    it("e2e delegates the optional build, the stage and the flags", async () => {
        const relay = mock<RelayClientPort>()
        const command = await commandOf(HarnessE2eCli, relay)

        await command.run([], {
            install: command.parseInstall(),
            yes: command.parseYes(),
            stage: command.parseStage("2"),
        })
        await command.run(["agent-cli"], { install: false, yes: false })

        expect(relay.harnessE2e).toHaveBeenNthCalledWith(1, undefined, { stage: "2", install: true, yes: true })
        expect(relay.harnessE2e).toHaveBeenNthCalledWith(2, "agent-cli", {
            stage: undefined,
            install: false,
            yes: false,
        })
    })

    it("ci-report delegates the report path and the stage", async () => {
        const relay = mock<RelayClientPort>()
        const command = await commandOf(HarnessCiReportCli, relay)

        await command.run([], { report: command.parseReport("r.xml"), stage: command.parseStage("s1") })

        expect(relay.harnessCiReport).toHaveBeenCalledWith({ report: "r.xml", stage: "s1" })
    })
})
