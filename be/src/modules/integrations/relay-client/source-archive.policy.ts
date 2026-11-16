import { createHash } from "node:crypto"

/** The most a lesson tarball may weigh. */
export const ARCHIVE_MAX_BYTES = 50 * 1024 * 1024

/** True when the bytes hash to the sha256 the signed manifest named. */
export const hashHolds = (bytes: Buffer, sha256: string): boolean =>
    createHash("sha256").update(bytes).digest("hex") === sha256

const linesOf = (text: string): ReadonlyArray<string> => text.split(/\r?\n/u).filter((line) => line.trim() !== "")

/**
 * The reason a tarball is refused, or null when it is safe to unpack. `names` is `tar -tzf` (one path per line) and `types` is
 * `tar -tvzf` (its first column starts with the entry type): only plain files and folders of `source/` are allowed, nothing
 * absolute, nothing above the folder, no link and nothing under `hidden/`.
 */
export const archiveRefusal = (names: string, types: string): string | null => {
    const paths = linesOf(names).map((line) => line.trim().replace(/^\.\//u, ""))
    if (paths.length === 0) return "the tarball is empty"
    if (linesOf(types).some((line) => /^[^-d]/u.test(line.trim()))) return "the tarball holds a link or a special file"
    const bad = paths.find(
        (path) =>
            path.startsWith("/") ||
            /^[A-Za-z]:/u.test(path) ||
            path.includes("\\") ||
            path.split("/").includes("..") ||
            path.split("/")[0] === "hidden",
    )
    return bad === undefined ? null : `the tarball holds a path that is not allowed (${bad})`
}
