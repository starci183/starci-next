import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { TrialCli } from "./trial.cli"

describe("TrialCli", () => {
    it("hands the trap and the flags to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        const moduleRef = await Test.createTestingModule({ providers: [TrialCli] })
            .useMocker(() => relay)
            .compile()
        const command = moduleRef.get(TrialCli)

        await expect(
            command.run(["red-test"], {
                tool: "codex",
                from: "d:/data",
                yes: true,
                maxBudgetUsd: 0.3,
                permissionMode: "plan",
                upload: false,
                keep: true,
            }),
        ).resolves.toBeUndefined()

        expect(relay.harnessTrial).toHaveBeenCalledWith("red-test", {
            tool: "codex",
            from: "d:/data",
            yes: true,
            maxBudgetUsd: 0.3,
            permissionMode: "plan",
            noUpload: true,
            keep: true,
        })
        expect(command.parseTool("claude")).toBe("claude")
        expect(command.parseFrom("x")).toBe("x")
        expect(command.parseYes()).toBe(true)
        expect(command.parseBudget("0.25")).toBe(0.25)
        expect(command.parsePermissionMode("plan")).toBe("plan")
        expect(command.parseNoUpload()).toBe(false)
        expect(command.parseKeep()).toBe(true)
    })

    it("drops a budget that is not a number and uploads by default", async () => {
        const relay = mock<RelayClientPort>()
        const moduleRef = await Test.createTestingModule({ providers: [TrialCli] })
            .useMocker(() => relay)
            .compile()
        const command = moduleRef.get(TrialCli)

        await command.run([], { yes: false, upload: true, keep: false, maxBudgetUsd: command.parseBudget("lots") })

        expect(relay.harnessTrial).toHaveBeenCalledWith("", {
            tool: undefined,
            from: undefined,
            yes: false,
            maxBudgetUsd: undefined,
            permissionMode: undefined,
            noUpload: false,
            keep: false,
        })
    })
})
