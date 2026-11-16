import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { DoctorCli } from "./doctor.cli"

describe("DoctorCli", () => {
    it("hands the flags to the relay client once", async () => {
        const relay = mock<RelayClientPort>()
        const moduleRef = await Test.createTestingModule({ providers: [DoctorCli] })
            .useMocker(() => relay)
            .compile()
        const command = moduleRef.get(DoctorCli)

        await expect(
            command.run([], { tool: "claude", from: "d:/data", yes: true, json: true, upload: false, lang: "vi" }),
        ).resolves.toBeUndefined()

        expect(relay.harnessDoctor).toHaveBeenCalledWith({
            tool: "claude",
            from: "d:/data",
            yes: true,
            json: true,
            noUpload: true,
            lang: "vi",
        })
        expect(command.parseTool("codex")).toBe("codex")
        expect(command.parseFrom("x")).toBe("x")
        expect(command.parseYes()).toBe(true)
        expect(command.parseJson()).toBe(true)
        expect(command.parseNoUpload()).toBe(false)
        expect(command.parseLang("en")).toBe("en")
    })

    it("uploads by default", async () => {
        const relay = mock<RelayClientPort>()
        const moduleRef = await Test.createTestingModule({ providers: [DoctorCli] })
            .useMocker(() => relay)
            .compile()

        await moduleRef.get(DoctorCli).run([], { yes: false, json: false, upload: true })

        expect(relay.harnessDoctor).toHaveBeenCalledWith(expect.objectContaining({ noUpload: false, yes: false }))
    })
})
