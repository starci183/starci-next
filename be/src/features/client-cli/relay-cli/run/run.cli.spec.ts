import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { RunTaskCli } from "./run.cli"

describe("RunTaskCli", () => {
    it("delegates the named task and the --yes flag to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        const moduleRef = await Test.createTestingModule({
            providers: [RunTaskCli],
        })
            .useMocker(() => relay)
            .compile()
        const command = moduleRef.get(RunTaskCli)

        await expect(command.run(["task-1"], { yes: true })).resolves.toBeUndefined()

        expect(relay.run).toHaveBeenCalledWith(["task-1"], true)
        expect(command.parseYes()).toBe(true)
    })
})
