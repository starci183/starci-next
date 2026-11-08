import { parse } from "yaml"
import { ContentError, ContentErrorCode } from "./errors/content.error"
import { manifestSchema, type ContentManifest, type ContentManifestKind } from "./content-manifest.schema"

/**
 * Reads `manifest.yaml` of the content repository. The text is parsed and validated here, at the boundary; a document that does
 * not match is refused CONTENT_MANIFEST_INVALID with the field paths in the error params, never a value.
 */
export const manifestOf = (text: string): ContentManifest => {
    let document: unknown
    try {
        document = parse(text)
    } catch (cause) {
        throw new ContentError({ code: ContentErrorCode.ManifestInvalid, params: { file: "manifest.yaml" }, cause })
    }
    const result = manifestSchema.safeParse(document)
    if (!result.success) {
        const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ")
        throw new ContentError({ code: ContentErrorCode.ManifestInvalid, params: { file: "manifest.yaml", fields } })
    }
    return result.data
}

/** The kinds of the repository that are YAML files this repository owns: the catalogs the sync records and does not import. */
export const catalogKindsOf = (manifest: ContentManifest): ReadonlyArray<ContentManifestKind> =>
    manifest.kinds.filter((kind) => kind.format === "yaml" && kind.source === "this-repo" && kind.files !== undefined)

/** The relative paths of `files` that a catalog kind matches. */
export const catalogFilesOf = (kind: ContentManifestKind, files: ReadonlyArray<string>): ReadonlyArray<string> => {
    const pattern = new RegExp(kind.files ?? "$^", "u")
    return files.filter((file) => pattern.test(file))
}
