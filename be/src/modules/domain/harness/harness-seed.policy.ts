import { createHash } from "node:crypto"
import { isRecord } from "@modules/platform/primitives"
import type { HarnessFile } from "./harness.contracts"
import type { HarnessStoredKind, HarnessStoreItem } from "./harness-store.policy"

/** The sets of a seed standard that hold harness content, and the stored kind each one becomes. */
export const HARNESS_SEED_KINDS: Readonly<Record<string, HarnessStoredKind>> = {
    "harness-builds": "build",
    "harness-guides": "guide",
    "harness-docs": "doc",
    "harness-probes": "probe",
    "harness-doctor-packs": "doctor-pack",
    "harness-traps": "trap",
}

const withoutKeys = (record: object, keys: ReadonlyArray<string>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)))

const text = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null)

const filesOf = (value: unknown): ReadonlyArray<HarnessFile> | null => {
    if (!Array.isArray(value)) return null
    const files: Array<HarnessFile> = []
    for (const item of value) {
        if (!isRecord(item) || text(item["path"]) === null || typeof item["text"] !== "string") return null
        files.push({ path: String(item["path"]), text: item["text"] })
    }
    return files
}

const orderOf = (record: Record<string, unknown>): number => {
    const order = record["order"]
    return typeof order === "number" && Number.isInteger(order) ? order : 0
}

/**
 * The item the database stores for one record of a harness set of the standard, or null when the record is not the shape that set
 * carries. The records are the converted shapes of `harness.contracts.ts`, so the item is built exactly as `storeItemsOf` builds it
 * for a tree read from disk: the same keys, hashes, content and tarball files, so the read side finds them unchanged.
 */
export const harnessItemOf = (set: string, record: unknown): HarnessStoreItem | null => {
    const kind = HARNESS_SEED_KINDS[set]
    if (kind === undefined || !isRecord(record)) return null
    const order = orderOf(record)
    if (kind === "build") {
        const id = text(record["id"])
        const hash = text(record["contentHash"])
        const pack = filesOf(record["packFiles"])
        if (id === null || hash === null || pack === null) return null
        const content = {
            ...withoutKeys(record, ["packFiles", "hiddenPaths"]),
            packPaths: pack.map((file) => file.path),
        }
        return { kind, key: id, order, hash, content, packFiles: pack }
    }
    if (kind === "guide" || kind === "doc") {
        const slug = text(record["slug"])
        const hash = text(record["contentHash"])
        const tool = text(record["tool"])
        if (slug === null || hash === null || (kind === "guide" && tool === null)) return null
        return {
            kind,
            key: kind === "guide" ? `${String(tool)}/${slug}` : slug,
            order,
            hash,
            content: { ...record },
            packFiles: null,
        }
    }
    if (kind === "probe") {
        const id = text(record["id"])
        const tool = text(record["tool"])
        const yaml = text(record["yaml"])
        if (id === null || tool === null || yaml === null) return null
        return {
            kind,
            key: `${tool}/${id}`,
            order,
            hash: createHash("sha256").update(yaml).digest("hex"),
            content: { ...record },
            packFiles: null,
        }
    }
    const hash = text(record["contentHash"])
    const files = filesOf(record["files"])
    if (hash === null || files === null) return null
    if (kind === "doctor-pack") {
        const tool = text(record["tool"])
        if (tool === null) return null
        return {
            kind,
            key: tool,
            order: 0,
            hash,
            content: { tool, paths: files.map((file) => file.path) },
            packFiles: files,
        }
    }
    const id = text(record["id"])
    if (id === null) return null
    return {
        kind,
        key: id,
        order,
        hash,
        content: { ...withoutKeys(record, ["files"]), paths: files.map((file) => file.path) },
        packFiles: files,
    }
}

/** The version label a standard's item is stored under: the head of its content hash, so equal content is the same version. */
export const harnessVersionOf = (item: HarnessStoreItem): string => item.hash.slice(0, 12)
