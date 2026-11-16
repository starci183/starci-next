import { z } from "zod"

const TEXT_MAX = 200
const PATTERN_MAX = 500
const KINDS_MAX = 100

/** One kind the content repository declares. */
export interface ContentManifestKind {
    /** The name of the kind. */
    readonly id: string
    /** The folder that holds it. */
    readonly folder: string
    /** How its files are written. */
    readonly format: "concept-v2" | "mount-md" | "yaml" | "files"
    /** The schema its YAML files follow. */
    readonly schema?: string | undefined
    /** Which repository owns the files. */
    readonly source: "this-repo" | "starci-lab/data" | "both"
    /** The pattern the paths of its files match. */
    readonly files?: string | undefined
    /** The importer that reads it. */
    readonly importer?: string | undefined
}

/**
 * The manifest formats the reader takes: the content repository is starci183/starci-next-seed-standard (renamed from
 * starci-next-data, owner 2026-11-17); a snapshot taken before the rename still names the old format.
 */
export const CONTENT_MANIFEST_SCHEMAS = ["starci-next-seed-standard/manifest@1", "starci-next-data/manifest@1"] as const

/** The manifest of the content repository: which kinds it holds, where, and in which format. */
export interface ContentManifest {
    /** The format of the manifest. */
    readonly schema: (typeof CONTENT_MANIFEST_SCHEMAS)[number]
    /** The name of the repository. */
    readonly name: string
    /** The version of its content. */
    readonly contentVersion: number
    /** The kinds it declares. */
    readonly kinds: ReadonlyArray<ContentManifestKind>
}

/** The shape of one kind of the manifest (private to this file). */
const kindSchema = z.object({
    id: z.string().min(1).max(TEXT_MAX),
    folder: z.string().min(1).max(TEXT_MAX),
    format: z.enum(["concept-v2", "mount-md", "yaml", "files"]),
    schema: z.string().max(TEXT_MAX).optional(),
    source: z.enum(["this-repo", "starci-lab/data", "both"]),
    files: z.string().max(PATTERN_MAX).optional(),
    importer: z.string().max(TEXT_MAX).optional(),
})

/** The shape of `manifest.yaml`. */
export const manifestSchema: z.ZodType<ContentManifest> = z.object({
    schema: z.enum(CONTENT_MANIFEST_SCHEMAS),
    name: z.string().min(1).max(TEXT_MAX),
    contentVersion: z.number().int().min(1),
    kinds: z.array(kindSchema).min(1).max(KINDS_MAX),
})
