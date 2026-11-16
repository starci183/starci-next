import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { InitProjectCli } from "./init.cli"

describe("InitProjectCli", () => {
    it("hands the flags to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        const moduleRef = await Test.createTestingModule({ providers: [InitProjectCli] })
            .useMocker(() => relay)
            .compile()
        const command = moduleRef.get(InitProjectCli)

        await expect(
            command.run([], { from: "d:/data", project: "p-1", language: "go", force: true }),
        ).resolves.toBeUndefined()

        expect(relay.init).toHaveBeenCalledWith({
            from: "d:/data",
            project: "p-1",
            language: "go",
            milestone: undefined,
            force: true,
        })
        expect(command.parseFrom("x")).toBe("x")
        expect(command.parseProject("p")).toBe("p")
        expect(command.parseLanguage("go")).toBe("go")
        expect(command.parseForce()).toBe(true)
    })

    it("takes the project id as the argument and the milestone as a flag", async () => {
        const relay = mock<RelayClientPort>()
        const moduleRef = await Test.createTestingModule({ providers: [InitProjectCli] })
            .useMocker(() => relay)
            .compile()
        const command = moduleRef.get(InitProjectCli)

        await command.run(["p-9"], { milestone: command.parseMilestone("bf-data-and-cache"), force: false })

        expect(relay.init).toHaveBeenCalledWith(
            expect.objectContaining({ project: "p-9", milestone: "bf-data-and-cache", force: false }),
        )
    })

    it("does not force by default", async () => {
        const relay = mock<RelayClientPort>()
        const moduleRef = await Test.createTestingModule({ providers: [InitProjectCli] })
            .useMocker(() => relay)
            .compile()

        await moduleRef.get(InitProjectCli).run([], { force: false })

        expect(relay.init).toHaveBeenCalledWith(expect.objectContaining({ force: false }))
    })
})
