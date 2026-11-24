import { join } from "node:path"
import { labStartCommand } from "./lab-start.cli"
import { readLabFolder, writeLabFolder } from "./lab-workspace.adapter"
import { labWorld, type LabWorld } from "./lab.testing"
import type { CliIo } from "./relay-client.contracts"

/** A learner machine whose device socket closes at once, so `lab start` returns after it has said where the lab goes. */
const starting = (): { readonly machine: LabWorld; readonly io: CliIo } => {
    const machine = labWorld()
    const io: CliIo = {
        ...machine.io,
        listen: () => ({ ended: Promise.resolve("closed"), close: () => undefined }),
    }
    return { machine, io }
}

describe("labStartCommand", () => {
    it("records --dir, resolves it from the shell's folder and shows it in the lines", async () => {
        const { machine, io } = starting()
        const shown = join(machine.world.cwd, "labs", "orders")

        const code = await labStartCommand(
            io,
            "backend/orders",
            { dir: join("labs", "orders"), autoConfirm: false },
            machine.world.cwd,
        )

        expect(code).toBe(0)
        expect(readLabFolder(io.env, "backend", "orders")).toBe(shown)
        const said = machine.world.out.join("\n")
        expect(said).toContain(`sẽ ở: ${shown} (--dir)`)
        expect(said).toContain(`goes in: ${shown} (--dir)`)
    })

    it("expands ~ in --dir to the home folder", async () => {
        const { machine, io } = starting()

        await labStartCommand(io, "backend/orders", { dir: "~/saga", autoConfirm: false }, machine.world.cwd)

        expect(readLabFolder(io.env, "backend", "orders")).toBe(join(machine.home, "saga"))
    })

    it("refuses a --dir that is the home folder, in both languages, and records nothing", async () => {
        const { machine, io } = starting()

        const code = await labStartCommand(io, "backend/orders", { dir: "~", autoConfirm: false }, machine.world.cwd)

        expect(code).toBe(2)
        const err = machine.world.err.join("\n")
        expect(err).toContain("Không dùng thư mục --dir")
        expect(err).toContain("Not using the --dir folder")
        expect(readLabFolder(io.env, "backend", "orders")).toBeNull()
    })

    it("clears an earlier --dir when none is given, so the web's learnerDir (else the default) applies, and says both places", async () => {
        const { machine, io } = starting()
        writeLabFolder(io.env, "backend", "orders", join(machine.home, "old"))

        const code = await labStartCommand(io, "backend/orders", { autoConfirm: false }, machine.world.cwd)

        expect(code).toBe(0)
        expect(readLabFolder(io.env, "backend", "orders")).toBeNull()
        const said = machine.world.out.join("\n")
        expect(said).toContain("thư mục bạn chọn trên web")
        expect(said).toContain(
            `the folder you chose on the web, else ${join(machine.home, "starci", "backend", "orders")}`,
        )
    })

    it("refuses a lab that is not <course>/<lesson>", async () => {
        const { machine, io } = starting()

        expect(await labStartCommand(io, "orders", { autoConfirm: false }, machine.world.cwd)).toBe(2)
    })
})
