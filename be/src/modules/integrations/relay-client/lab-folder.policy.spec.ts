import { posix, win32 } from "node:path"
import { labFolderChoiceOf, safeFolderOf, unsafeFolderLines, type LabFolderChoice } from "./lab-folder.policy"

const LAB = { courseId: "backend", lessonId: "orders" }
const HOME = "/home/ana"
const WIN_HOME = "C:\\Users\\Ana"

const pathOf = (choice: LabFolderChoice): string => (choice.kind === "ok" ? choice.path : `unsafe:${choice.reason}`)

/** A signed folder judged on a posix machine. */
const signed = (value: string): string => pathOf(safeFolderOf(value, HOME, undefined, "learnerDir", posix))

/** A signed folder judged on a Windows machine. */
const signedWin = (value: string): string => pathOf(safeFolderOf(value, WIN_HOME, undefined, "learnerDir", win32))

describe("safeFolderOf for a signed folder", () => {
    it("expands ~ to the home folder and resolves the rest", () => {
        expect(signed("~/work/../work/saga")).toBe("/home/ana/work/saga")
        expect(signedWin("~\\work\\saga")).toBe("C:\\Users\\Ana\\work\\saga")
        expect(signedWin("D:\\labs\\saga")).toBe("D:\\labs\\saga")
    })

    it("refuses a relative path, an empty one and a ~user form, because nothing says what they are relative to", () => {
        expect(signed("work/saga")).toBe("unsafe:relative")
        expect(signed("../saga")).toBe("unsafe:relative")
        expect(signed("~bob/saga")).toBe("unsafe:relative")
        expect(signedWin("%USERPROFILE%\\saga")).toBe("unsafe:relative")
        expect(signedWin("D:saga")).toBe("unsafe:relative")
        expect(signed("   ")).toBe("unsafe:empty")
        expect(signed("/tmp/a\0b")).toBe("unsafe:empty")
    })

    it("refuses a filesystem root, the home folder and the folders that hold it", () => {
        expect(signed("/")).toBe("unsafe:root")
        expect(signedWin("C:\\")).toBe("unsafe:root")
        expect(signedWin("\\\\nas\\share")).toBe("unsafe:root")
        expect(signed("~")).toBe("unsafe:home")
        expect(signed("/home/ana/")).toBe("unsafe:home")
        expect(signed("/home")).toBe("unsafe:home")
        expect(signedWin("c:\\users\\ana")).toBe("unsafe:home")
        expect(signedWin("C:\\Users")).toBe("unsafe:home")
    })

    it("refuses system folders and everything under them, on any drive and in any case on Windows", () => {
        expect(signed("/etc")).toBe("unsafe:system")
        expect(signed("/usr/local/saga")).toBe("unsafe:system")
        expect(signedWin("C:\\Windows\\System32")).toBe("unsafe:system")
        expect(signedWin("d:\\program files (x86)\\saga")).toBe("unsafe:system")
        expect(signedWin("C:\\ProgramData")).toBe("unsafe:system")
    })

    it("accepts a folder under home, and a folder whose name only starts like a system one", () => {
        expect(signed("~/starci/saga")).toBe("/home/ana/starci/saga")
        expect(signed("/srv/labs")).toBe("/srv/labs")
        expect(signed("/etcetera/saga")).toBe("/etcetera/saga")
        expect(signedWin("D:\\Windows-labs\\saga")).toBe("D:\\Windows-labs\\saga")
    })
})

describe("safeFolderOf for a typed --dir", () => {
    it("starts a relative path at the shell's folder, but still refuses a system folder", () => {
        expect(pathOf(safeFolderOf("labs/saga", HOME, "/work", "flag", posix))).toBe("/work/labs/saga")
        expect(pathOf(safeFolderOf("..", HOME, "/home/ana/work", "flag", posix))).toBe("unsafe:home")
        expect(pathOf(safeFolderOf("/", HOME, "/work", "flag", posix))).toBe("unsafe:root")
    })
})

describe("labFolderChoiceOf", () => {
    const input = { flagged: null, learnerDir: undefined, booted: null, home: HOME, flavor: posix }

    it("takes the local --dir flag first, then the signed learnerDir, then the default", () => {
        const flagged = labFolderChoiceOf(LAB, { ...input, flagged: "/flag/dir", learnerDir: "~/signed" })
        expect(flagged).toEqual({ kind: "ok", path: "/flag/dir", from: "flag" })

        const given = labFolderChoiceOf(LAB, { ...input, learnerDir: "~/signed" })
        expect(given).toEqual({ kind: "ok", path: "/home/ana/signed", from: "learnerDir" })

        const kept = labFolderChoiceOf(LAB, input)
        expect(kept.kind === "ok" && kept.from).toBe("default")
        expect(kept.kind === "ok" && kept.path).toMatch(/starci[\\/]backend[\\/]orders$/u)
    })

    it("finds a lab again where it booted when the manifest signs no learnerDir, below --dir and the signed folder", () => {
        const booted = { ...input, booted: "/home/ana/work/saga" }

        expect(labFolderChoiceOf(LAB, booted)).toEqual({ kind: "ok", path: "/home/ana/work/saga", from: "booted" })
        expect(labFolderChoiceOf(LAB, { ...booted, learnerDir: "~/signed" })).toEqual({
            kind: "ok",
            path: "/home/ana/signed",
            from: "learnerDir",
        })
        expect(labFolderChoiceOf(LAB, { ...booted, flagged: "/flag/dir" })).toEqual({
            kind: "ok",
            path: "/flag/dir",
            from: "flag",
        })
    })

    it("never swaps an unsafe learnerDir for the default: the learner chose somewhere, so it is refused", () => {
        const choice = labFolderChoiceOf(LAB, { ...input, learnerDir: "relative/dir" })

        expect(choice).toEqual({ kind: "unsafe", value: "relative/dir", reason: "relative", from: "learnerDir" })
    })
})

describe("unsafeFolderLines", () => {
    it("says it in Vietnamese then English and names the refused value and the reason", () => {
        const choice = safeFolderOf("/", HOME, undefined, "learnerDir", posix)
        if (choice.kind !== "unsafe") throw new Error("expected a refusal")

        const [vi, en] = unsafeFolderLines(choice)

        expect(vi).toContain("thư mục gốc")
        expect(vi).toContain('"/"')
        expect(en).toContain("Not using the folder StarCi sent")
        expect(en).toContain("root")
    })
})
