import { hostname, platform } from "node:os"
import { join } from "node:path"
import { PassThrough } from "node:stream"
import { FakeClock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { TerminalClient } from "./terminal.client"

const build = async (): Promise<TerminalClient> => {
    const moduleRef = await Test.createTestingModule({
        providers: [TerminalClient, { provide: CLOCK, useValue: new FakeClock(0) }],
    }).compile()
    return moduleRef.get(TerminalClient)
}

const STDIN = Object.getOwnPropertyDescriptor(process, "stdin")

describe("TerminalClient", () => {
    afterEach(() => {
        jest.restoreAllMocks()
        process.exitCode = undefined
        if (STDIN !== undefined) Object.defineProperty(process, "stdin", STDIN)
    })

    it("prints lines to the standard streams and tells this machine apart", async () => {
        const out = jest.spyOn(process.stdout, "write").mockReturnValue(true)
        const err = jest.spyOn(process.stderr, "write").mockReturnValue(true)
        const terminal = await build()

        terminal.out("hello")
        terminal.err("oops")

        expect(out).toHaveBeenCalledWith("hello\n")
        expect(err).toHaveBeenCalledWith("oops\n")
        expect(terminal.hostName()).toBe(hostname())
        expect(terminal.platform()).toBe(platform())
    })

    it("sets the exit code of the process", async () => {
        const terminal = await build()

        terminal.exit(3)

        expect(process.exitCode).toBe(3)
    })
})

describe("TerminalClient runCommand", () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it("runs a command in a folder and answers its exit code and its output", async () => {
        jest.spyOn(process.stdout, "write").mockReturnValue(true)
        jest.spyOn(process.stderr, "write").mockReturnValue(true)
        const terminal = await build()
        const node = JSON.stringify(process.execPath)

        const passed = await terminal.runCommand(`${node} -e "console.log('ok')"`, process.cwd(), 30_000)
        const failed = await terminal.runCommand(
            `${node} -e "console.error('bad');process.exit(2)"`,
            process.cwd(),
            30_000,
        )

        expect(passed.exitCode).toBe(0)
        expect(passed.output).toContain("ok")
        expect(passed.durationMs).toBe(0)
        expect(failed.exitCode).toBe(2)
        expect(failed.output).toContain("bad")
    })

    it("answers -1 when the command cannot start in that folder", async () => {
        const terminal = await build()

        const run = await terminal.runCommand("node -v", join(process.cwd(), "no-such-folder"), 30_000)

        expect(run.exitCode).toBe(-1)
    })

    it("answers -1 when the command is stopped by a signal, after its timeout", async () => {
        jest.spyOn(process.stdout, "write").mockReturnValue(true)
        const terminal = await build()
        const node = JSON.stringify(process.execPath)

        const run = await terminal.runCommand(`${node} -e "setTimeout(() => {}, 4000)"`, process.cwd(), 300)

        expect(run.exitCode).toBe(-1)
    })
})

describe("TerminalClient confirm", () => {
    afterEach(() => {
        jest.restoreAllMocks()
        if (STDIN !== undefined) Object.defineProperty(process, "stdin", STDIN)
    })

    it.each([
        ["y", true],
        ["Yes", true],
        ["n", false],
        ["", false],
    ])("asks a question on the terminal and reads %j as %s", async (typed, expected) => {
        jest.spyOn(process.stdout, "write").mockReturnValue(true)
        const input = new PassThrough()
        Object.defineProperty(process, "stdin", { value: input, configurable: true })
        const terminal = await build()

        const asked = terminal.confirm("Run it?")
        input.write(`${typed}${String.fromCharCode(10)}`)

        await expect(asked).resolves.toBe(expected)
    })
})
