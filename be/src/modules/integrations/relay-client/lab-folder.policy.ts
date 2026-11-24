import { join, posix, win32, type PlatformPath } from "node:path"
import type { LabSection } from "./lab.contracts"

/** Where the folder of a lab came from, the first that is set winning: the local `--dir` flag, the folder the server signed, the default. */
export type LabFolderSource = "flag" | "learnerDir" | "default"

/** Why a folder was refused. */
export type UnsafeFolderReason = "empty" | "relative" | "root" | "home" | "system"

/** The folder of a lab, or why it was refused. */
export type LabFolderChoice =
    | { readonly kind: "ok"; readonly path: string; readonly from: LabFolderSource }
    | { readonly kind: "unsafe"; readonly value: string; readonly reason: UnsafeFolderReason; readonly from: LabFolderSource }

/** What a choice is made from. */
export interface LabFolderInput {
    /** The folder `lab start --dir` recorded, already absolute, or null when the learner gave none. */
    readonly flagged: string | null
    /** The `learnerDir` of the verified manifest. */
    readonly learnerDir: string | undefined
    /** The learner's home folder. */
    readonly home: string
    /** The path rules of the machine; a spec passes `posix` or `win32` to judge a path of the other kind. */
    readonly flavor?: PlatformPath
}

/** The folders no lab may be unpacked into or under: the system's own, in lower case because case is no part of these names. */
const SYSTEM_TREES_POSIX: ReadonlyArray<string> = [
    "/bin",
    "/boot",
    "/dev",
    "/etc",
    "/lib",
    "/lib64",
    "/proc",
    "/run",
    "/sbin",
    "/sys",
    "/usr",
    "/var",
    "/system",
    "/library",
    "/applications",
]
const SYSTEM_TREES_WIN: ReadonlyArray<string> = [
    "windows",
    "program files",
    "program files (x86)",
    "programdata",
    "$recycle.bin",
    "system volume information",
]

/** True when `child` is `parent` or lies under it. */
const isWithin = (flavor: PlatformPath, child: string, parent: string): boolean => {
    const rel = flavor.relative(parent, child)
    return rel === "" || (rel !== ".." && !rel.startsWith(`..${flavor.sep}`) && !flavor.isAbsolute(rel))
}

/** True when the path is, or is under, a system folder of its kind. */
const inSystemTree = (flavor: PlatformPath, path: string): boolean => {
    const { root } = flavor.parse(path)
    if (flavor === win32) {
        // Case is not part of a Windows name, and the drive is any drive: `D:\Windows` is as much a system folder as `C:\Windows`.
        return SYSTEM_TREES_WIN.some((name) => isWithin(flavor, path, flavor.join(root, name)))
    }
    return SYSTEM_TREES_POSIX.some((tree) => isWithin(flavor, path.toLowerCase(), tree))
}

/**
 * Judges an absolute, resolved folder: a drive or filesystem root, the home folder or any folder that holds it (`/home`, `C:\Users`) and
 * a system folder are refused, because the lab's `.git`, its compose project and its test run would then own a folder the learner did not
 * mean to give; a folder under home is fine.
 */
const verdictOf = (flavor: PlatformPath, path: string, home: string): UnsafeFolderReason | null => {
    if (flavor.parse(path).root === path) return "root"
    if (isWithin(flavor, flavor.resolve(home), path)) return "home"
    return inSystemTree(flavor, path) ? "system" : null
}

/** `~`, `~/x` and `~\x` as the learner's home (cmd.exe does not expand it); anything else untouched. */
const expandedOf = (value: string, home: string): string =>
    value === "~" || value.startsWith("~/") || value.startsWith("~\\") ? `${home}${value.slice(1)}` : value

/**
 * One typed or signed folder made absolute and judged. `relativeFrom` is where a relative path starts (`lab start --dir` was typed in a
 * shell, so it starts there); without it a relative path is refused, because a folder the server signed has no working folder to be
 * relative to and `lab start` could otherwise unpack into whichever folder the relay was run from.
 */
export const safeFolderOf = (
    value: string,
    home: string,
    relativeFrom: string | undefined,
    from: LabFolderSource,
    flavor: PlatformPath = process.platform === "win32" ? win32 : posix,
): LabFolderChoice => {
    const text = value.trim()
    if (text === "" || text.includes("\0")) return { kind: "unsafe", value, reason: "empty", from }
    const expanded = expandedOf(text, home)
    if (!flavor.isAbsolute(expanded) && relativeFrom === undefined) return { kind: "unsafe", value, reason: "relative", from }
    const path = flavor.resolve(relativeFrom ?? home, expanded)
    const reason = verdictOf(flavor, path, home)
    return reason === null ? { kind: "ok", path, from } : { kind: "unsafe", value, reason, from }
}

/** The default folder of a lab on a machine: `<home>/starci/<course>/<lesson>`. */
export const defaultLabRootOf = (home: string, courseId: string, lessonId: string): string =>
    join(home, "starci", courseId, lessonId)

/**
 * The folder of a lab: the local `--dir` flag first, because the learner typed it on this machine, then the `learnerDir` the server
 * signed from what the learner chose on the web, then the default. A signed folder that is unsafe is never replaced by the default:
 * the learner chose somewhere, so the run stops and says why instead of unpacking elsewhere.
 */
export const labFolderChoiceOf = (
    lab: Pick<LabSection, "courseId" | "lessonId">,
    input: LabFolderInput,
): LabFolderChoice => {
    if (input.flagged !== null) return { kind: "ok", path: input.flagged, from: "flag" }
    if (input.learnerDir !== undefined)
        return safeFolderOf(input.learnerDir, input.home, undefined, "learnerDir", input.flavor)
    return { kind: "ok", path: defaultLabRootOf(input.home, lab.courseId, lab.lessonId), from: "default" }
}

/** The refusal of a folder in Vietnamese and in English, the Vietnamese first. */
export const unsafeFolderLines = (choice: Extract<LabFolderChoice, { kind: "unsafe" }>): readonly [string, string] => {
    const where = choice.from === "learnerDir" ? "thư mục StarCi gửi xuống" : "thư mục --dir"
    const whence = choice.from === "learnerDir" ? "the folder StarCi sent" : "the --dir folder"
    const why = {
        empty: ["trống", "empty"],
        relative: ["không phải đường dẫn tuyệt đối", "not an absolute path"],
        root: ["là thư mục gốc của ổ đĩa", "a drive or filesystem root"],
        home: ["là thư mục home hoặc chứa nó", "your home folder or a folder that holds it"],
        system: ["nằm trong thư mục hệ thống", "inside a system folder"],
    }[choice.reason]
    const shown = JSON.stringify(choice.value)
    return [
        `Không dùng ${where} ${shown}: ${why[0]}. Hãy chọn một thư mục riêng cho lab, ví dụ ~/starci/<khoá>/<bài>.`,
        `Not using ${whence} ${shown}: ${why[1]}. Pick a folder of its own for the lab, e.g. ~/starci/<course>/<lesson>.`,
    ]
}
