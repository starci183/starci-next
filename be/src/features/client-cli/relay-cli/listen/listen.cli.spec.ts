import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { type RelayClientPort } from "@modules/integrations/relay-client"
import { ListenCli } from "./listen.cli"

describe("ListenCli", () => {
    it.each([
        ["asks by default", false],
        ["skips the question only with --auto-confirm", true],
    ])("%s", async (_name, autoConfirm) => {
        const relay = mock<RelayClientPort>()
        const moduleRef = await Test.createTestingModule({ providers: [ListenCli] })
            .useMocker(() => relay)
            .compile()
        const command = moduleRef.get(ListenCli)

        await command.run([], { autoConfirm })

        expect(relay.listen).toHaveBeenCalledWith({ autoConfirm })
        expect(command.parseAutoConfirm()).toBe(true)
    })
})
