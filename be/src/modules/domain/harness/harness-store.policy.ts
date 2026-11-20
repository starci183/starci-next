import { createHash } from "node:crypto"
import type { HarnessConverted, HarnessFile } from "./harness.contracts"

/** The kinds a stored item may have. */
export type HarnessStoredKind = "build" | "guide" | "doc" | "probe" | "trap" | "doctor-pack"

/** One item of the converted tree as the database stores it. */
export interface HarnessStoreItem {
    /** The kind. */
    readonly kind: HarnessStoredKind
    /** The key inside the kind. */
    readonly key: string
    /** The position in its list. */
    readonly order: number
    /** The hash of every input file. */
    readonly hash: string
    /** The record as jsonb: no pack file text. */
    readonly content: Record<string, unknown>
    /** The files of the tarball a learner pulls, or null. */
    readonly packFiles: ReadonlyArray<HarnessFile> | null
}

/** The localized fields each stored kind must carry, as the read views index them by locale (harness.contracts.ts). */
const LOCALIZED_FIELDS: Readonly<Record<HarnessStoredKind, ReadonlyArray<string>>> = {
    build: ["title", "summary"],
    guide: ["title", "summary"],
    doc: ["title", "summary"],
    probe: ["title", "fix"],
    trap: ["title", "brief"],
    "doctor-pack": [],
}

const isLocalized = (value: unknown): boolean =>
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>)["vi"] === "string" &&
    typeof (value as Record<string, unknown>)["en"] === "string"

/** The localized fields a stored record of a kind lacks: empty when the record is the contract's shape. */
export const missingLocalizedOf = (kind: string, content: unknown): ReadonlyArray<string> => {
    const fields = LOCALIZED_FIELDS[kind as HarnessStoredKind] ?? []
    if (typeof content !== "object" || content === null) return fields
    return fields.filter((field) => !isLocalized((content as Record<string, unknown>)[field]))
}

const withoutKeys = (record: object, keys: ReadonlyArray<string>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)))

/**
 * The items to store for a converted tree: a build stores its record without the pack file text, with the pack paths and the
 * `source/` + `e2e/` files as its tarball; a trap and a doctor pack store their file paths and their files as the tarball;
 * guides, docs and probes store the record as it is. Hidden files of a build are never stored.
 */
export const storeItemsOf = (converted: HarnessConverted): ReadonlyArray<HarnessStoreItem> => [
    ...converted.builds.map((build): HarnessStoreItem => ({
        kind: "build",
        key: build.id,
        order: build.order,
        hash: build.contentHash,
        content: {
            ...withoutKeys(build, ["packFiles", "hiddenPaths"]),
            packPaths: build.packFiles.map((file) => file.path),
        },
        packFiles: build.packFiles,
    })),
    ...converted.guides.map((guide): HarnessStoreItem => ({
        kind: "guide",
        key: `${guide.tool}/${guide.slug}`,
        order: guide.order,
        hash: guide.contentHash,
        content: { ...guide },
        packFiles: null,
    })),
    ...converted.docs.map((doc): HarnessStoreItem => ({
        kind: "doc",
        key: doc.slug,
        order: doc.order,
        hash: doc.contentHash,
        content: { ...doc },
        packFiles: null,
    })),
    ...converted.probes.map((probe): HarnessStoreItem => ({
        kind: "probe",
        key: `${probe.tool}/${probe.id}`,
        order: probe.order,
        hash: createHash("sha256").update(probe.yaml).digest("hex"),
        content: { ...probe },
        packFiles: null,
    })),
    ...converted.doctorPacks.map((pack): HarnessStoreItem => ({
        kind: "doctor-pack",
        key: pack.tool,
        order: 0,
        hash: pack.contentHash,
        content: { tool: pack.tool, paths: pack.files.map((file) => file.path) },
        packFiles: pack.files,
    })),
    ...converted.traps.map((trap): HarnessStoreItem => ({
        kind: "trap",
        key: trap.id,
        order: trap.order,
        hash: trap.contentHash,
        content: { ...withoutKeys(trap, ["files"]), paths: trap.files.map((file) => file.path) },
        packFiles: trap.files,
    })),
]
