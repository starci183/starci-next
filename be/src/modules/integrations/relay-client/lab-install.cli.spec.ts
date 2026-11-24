import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DEFAULT_INSTALL, installCommandOf, installDeps } from "./lab-install.cli"
import { labWorld, type Answer, type LabWorld } from "./lab.testing"

const ENV = { COMPOSE_PROJECT_NAME: "starci-shop-giay-saga" }

/** A project folder, with a lockfile when asked. */
const folder = (lock: string | null): string => {
    const dir = mkdtempSync(join(tmpdir(), "starci-install-"))
    if (lock !== null) writeFileSync(join(dir, "package-lock.json"), lock)
    return dir
}

const install = (machine: LabWorld, work: string, declared?: string) =>
    installDeps(machine.io, work, declared, { env: ENV, quiet: false, say: machine.io.out })

const commands = (machine: LabWorld): Array<string> => machine.ran.map((ran) => ran.command)

describe("installCommandOf", () => {
    it("takes the declared command, else npm ci when a lockfile is there, else none", () => {
        expect(installCommandOf("pnpm i --frozen-lockfile", folder(null))).toBe("pnpm i --frozen-lockfile")
        expect(installCommandOf(undefined, folder("{}"))).toBe(DEFAULT_INSTALL)
        expect(installCommandOf(undefined, folder(null))).toBeNull()
    })
})

describe("installDeps", () => {
    it("installs once with the compose env, says so in both languages, and skips while the lockfile is the same", async () => {
        const machine = labWorld()
        const work = folder('{"lockfileVersion":3}')

        await expect(install(machine, work)).resolves.toEqual({ ok: true, detail: "dependencies installed" })
        await expect(install(machine, work)).resolves.toEqual({ ok: true, detail: "dependencies already installed" })

        expect(commands(machine)).toEqual([DEFAULT_INSTALL])
        expect(machine.ran[0]?.env).toEqual(ENV)
        expect(machine.world.out.join("\n")).toContain("Đang cài thư viện")
        expect(machine.world.out.join("\n")).toContain("Installing the lab's dependencies")
    })

    it("installs again once the lockfile changed", async () => {
        const machine = labWorld()
        const work = folder('{"a":1}')
        await install(machine, work)
        writeFileSync(join(work, "package-lock.json"), '{"a":2}')

        await install(machine, work)

        expect(commands(machine)).toEqual([DEFAULT_INSTALL, DEFAULT_INSTALL])
    })

    it("reports a failed install and tries again next time instead of trusting it", async () => {
        const failing = (command: string): Answer => (command === DEFAULT_INSTALL ? { exitCode: 1 } : undefined)
        const machine = labWorld(failing)
        const work = folder("{}")

        const first = await install(machine, work)
        await install(machine, work)

        expect(first.ok).toBe(false)
        expect(machine.world.err.join("\n")).toContain("The install failed (exit 1)")
        expect(commands(machine)).toEqual([DEFAULT_INSTALL, DEFAULT_INSTALL])
    })

    it("runs nothing for a project with no lockfile and no declared command", async () => {
        const machine = labWorld()

        await expect(install(machine, folder(null))).resolves.toMatchObject({ ok: true })

        expect(machine.ran).toEqual([])
    })
})
