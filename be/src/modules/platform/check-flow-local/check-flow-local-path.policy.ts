import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { isRecord } from "@modules/platform/primitives"

/** Whether a path is an existing file. */
const isFile = (path: string): boolean => existsSync(path) && statSync(path).isFile()

const wildcard = (part: string): RegExp =>
    new RegExp(`^${part.split("*").map((piece) => piece.replace(/[.+?^${}()|[\]\\]/gu, "\\$&")).join(".*")}$`, "u")

/**
 * Expands one path pattern into the files that exist: project relative, or `~/` for the home folder, and one segment may use `*`
 * as a wildcard (`.claude/skills/*` then `/SKILL.md` as the next segment).
 */
export const expandPattern = (pattern: string, project: string, home: string): ReadonlyArray<string> => {
    const underHome = pattern.startsWith("~/")
    let level: ReadonlyArray<string> = [underHome ? home : project]
    for (const part of (underHome ? pattern.slice(2) : pattern).split("/")) {
        level = level.flatMap((base) => {
            if (!part.includes("*")) return [join(base, part)]
            if (!existsSync(base) || !statSync(base).isDirectory()) return []
            return readdirSync(base)
                .filter((name) => wildcard(part).test(name))
                .map((name) => join(base, name))
        })
    }
    return level.filter(isFile)
}

/** The files of a `path` value: one pattern or a list of patterns. */
export const filesOf = (spec: unknown, project: string, home: string): ReadonlyArray<string> =>
    (Array.isArray(spec) ? (spec as ReadonlyArray<unknown>) : [spec]).flatMap((pattern) =>
        typeof pattern === "string" ? expandPattern(pattern, project, home) : [],
    )

/** Whether a `path` value is a text or a non-empty list of texts. */
export const isPathSpec = (value: unknown): boolean =>
    (typeof value === "string" && value !== "") ||
    (Array.isArray(value) &&
        value.length > 0 &&
        (value as ReadonlyArray<unknown>).every((item) => typeof item === "string" && item !== ""))

/** The value at a dotted key path (`permissions.deny`), or undefined. */
export const valueAt = (data: unknown, path: string): unknown =>
    path.split(".").reduce<unknown>((node, key) => (isRecord(node) ? node[key] : undefined), data)

/** Whether a value counts as filled: a non-empty list, map or text, or any other defined value. */
export const isNonEmpty = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.length > 0
    if (isRecord(value)) return Object.keys(value).length > 0
    if (typeof value === "string") return value.trim() !== ""
    return value !== undefined && value !== null
}
