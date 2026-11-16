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
    it("runs a lesson scenario with its guards, or a challenge tier, through the lesson door", async () => {
        const relay = mock<RelayClientPort>()
        const moduleRef = await Test.createTestingModule({ providers: [RunTaskCli] })
            .useMocker(() => relay)
            .compile()
        const command = moduleRef.get(RunTaskCli)

        await command.run(["outbox"], {
            yes: false,
            scenario: "dup-submit",
            guard: command.parseGuard("idempotency-key=off", command.parseGuard("a=off")),
        })
        await command.run(["outbox"], { yes: true, challenge: command.parseChallenge("easy") })

        expect(relay.lessonRun).toHaveBeenNthCalledWith(
            1,
            "outbox",
            { scenario: "dup-submit", guards: ["a=off", "idempotency-key=off"], challenge: undefined, yes: false },
            false,
        )
        expect(relay.lessonRun).toHaveBeenNthCalledWith(
            2,
            "outbox",
            { scenario: undefined, guards: [], challenge: "easy", yes: true },
            false,
        )
        expect(relay.run).not.toHaveBeenCalled()
    })
})
