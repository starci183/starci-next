import { parse } from "yaml"
import type { z } from "zod"
import { LAB_MANIFEST, LAB_MANIFEST_SCHEMA_ID } from "./lab-manifest.schema"

/** A parsed and cross-checked lab@2 manifest. */
export type LabManifest = z.infer<typeof LAB_MANIFEST>

/** A happy case of a manifest. */
export type LabHappyCase = LabManifest["happy"][number]

/** An unhappy case of a manifest. */
export type LabUnhappyCase = LabManifest["unhappy"][number]

/**
 * One case in teaching order with its kind. Happy cases come first, then the unhappy ones in ladder order: a learner meets the
 * working flow before each way it breaks, and "run a case" always means that case plus every case before it in this order.
 */
export type LabCase = ({ readonly kind: "happy" } & LabHappyCase) | ({ readonly kind: "unhappy" } & LabUnhappyCase)

/** What reading a manifest came to: the manifest, or every problem found (a lab author fixes them all in one pass). */
export type LabManifestRead =
    | { readonly kind: "read"; readonly manifest: LabManifest }
    | { readonly kind: "invalid"; readonly problems: ReadonlyArray<string> }

/** The first characters of a YAML error kept in a problem line; a whole parser dump is noise to a learner. */
const YAML_ERROR_MAX = 300

/** Every id that appears twice in a list, once each. */
const duplicatesOf = (ids: ReadonlyArray<string>): ReadonlyArray<string> => [
    ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
]

/** The distinct rungs the happy cases name, in the order they first appear: the fix of the normal cases the starter breaks (`c0-naive`). */
const happyRefsOf = (manifest: LabManifest): ReadonlyArray<string> => [
    ...new Set(manifest.happy.flatMap((item) => (item.ref === undefined ? [] : [item.ref]))),
]

/**
 * The rules that tie the fields of a schema-valid manifest together. They are what makes the ladder usable: `case diff` and
 * `case reset-to` find a case's reference rung through its `ref`, so a ref missing from the ladder, or a ladder out of the cases'
 * order, would hand the learner the wrong fix.
 */
export const labManifestProblemsOf = (manifest: LabManifest): ReadonlyArray<string> => {
    const caseIds = [...manifest.happy.map((item) => item.id), ...manifest.unhappy.map((item) => item.id)]
    const inspectIds = manifest.mcp.inspect.map((item) => item.id)
    // The rungs the cases name, in teaching order: the normal cases' fix (several normal cases share it), then one per unhappy case.
    const caseRefs = [...happyRefsOf(manifest), ...manifest.unhappy.map((item) => item.ref)]
    const ladderRefs = manifest.ladder.refs
    const sameOrder =
        caseRefs.length === ladderRefs.length && caseRefs.every((ref, index) => ladderRefs[index] === ref)
    return [
        ...duplicatesOf(caseIds).map((id) => `case id ${id} is used twice`),
        ...duplicatesOf(manifest.stack.services.map((item) => item.id)).map((id) => `service id ${id} is used twice`),
        ...duplicatesOf(inspectIds).map((id) => `mcp.inspect id ${id} is used twice`),
        ...duplicatesOf(ladderRefs).map((ref) => `ladder ref ${ref} is used twice`),
        ...(sameOrder
            ? []
            : [
                  `ladder.refs must list the normal cases' fix, then the unhappy cases' refs in the same order (${caseRefs.join(", ")}), one per case`,
              ]),
        ...(ladderRefs.includes(manifest.ladder.base)
            ? [`ladder.base ${manifest.ladder.base} is also a case ref`]
            : []),
        ...(ladderRefs.at(-1) === manifest.ladder.main || manifest.ladder.main === "main"
            ? []
            : [`ladder.main ${manifest.ladder.main} must be the last ref or main`]),
        ...manifest.unhappy.flatMap((item) =>
            item.mcp.inspect
                .filter((id) => !inspectIds.includes(id))
                .map((id) => `case ${item.id} names mcp.inspect ${id}, which mcp.inspect does not declare`),
        ),
    ]
}

/** Reads the text of a `starci-lab.yaml`: YAML, then the lab@2 schema, then the cross rules. Never throws. */
export const labManifestOf = (text: string): LabManifestRead => {
    let raw: unknown
    try {
        raw = parse(text)
    } catch (error) {
        return { kind: "invalid", problems: [`not YAML: ${String(error).slice(0, YAML_ERROR_MAX)}`] }
    }
    const schema = typeof raw === "object" && raw !== null && "schema" in raw ? raw.schema : undefined
    if (schema !== LAB_MANIFEST_SCHEMA_ID)
        return {
            kind: "invalid",
            problems: [`schema is ${String(schema)}; this relay reads ${LAB_MANIFEST_SCHEMA_ID} only`],
        }
    const checked = LAB_MANIFEST.safeParse(raw)
    if (!checked.success)
        return {
            kind: "invalid",
            problems: checked.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
        }
    const problems = labManifestProblemsOf(checked.data)
    return problems.length === 0 ? { kind: "read", manifest: checked.data } : { kind: "invalid", problems }
}

/** Every case of a manifest in teaching order: the happy ones, then the unhappy ones in ladder order. */
export const casesOf = (manifest: LabManifest): ReadonlyArray<LabCase> => [
    ...manifest.happy.map((item) => ({ ...item, kind: "happy" as const })),
    ...manifest.unhappy.map((item) => ({ ...item, kind: "unhappy" as const })),
]

/** One case by id, or undefined. */
export const caseOf = (manifest: LabManifest, id: string): LabCase | undefined =>
    casesOf(manifest).find((item) => item.id === id)

/**
 * The cases a run of `id` covers: that case and every case before it. A fix that turns one case green must not turn an earlier
 * one red, so a run always re-checks everything the learner already made pass. Empty when the id is not a case.
 */
export const casesThroughOf = (manifest: LabManifest, id: string): ReadonlyArray<LabCase> => {
    const all = casesOf(manifest)
    const index = all.findIndex((item) => item.id === id)
    return index === -1 ? [] : all.slice(0, index + 1)
}

/** The marker of the cases command, replaced by the comma-joined case ids. */
export const CASE_IDS_MARKER = "{ids}"

/** The command that runs these cases: the manifest's template with the ids filled in (ids are slugs, so the shell reads them as is). */
export const casesCommandOf = (manifest: LabManifest, cases: ReadonlyArray<LabCase>): string =>
    manifest.test.cases.replaceAll(CASE_IDS_MARKER, cases.map((item) => item.id).join(","))

/**
 * The two rungs a case's reference diff spans: the rung before the case's fix and the case's own ref. A happy case the starter breaks
 * spans `base` → its ref (`c0-start` → `c0-naive`); the first unhappy case starts from the normal cases' fix (or `base` when the
 * starter breaks none), each later one from the previous case's ref. Undefined for a happy case the starter does not break.
 */
export const rungsOf = (
    manifest: LabManifest,
    id: string,
): { readonly from: string; readonly to: string } | undefined => {
    const happy = manifest.happy.find((item) => item.id === id)
    if (happy !== undefined) return happy.ref === undefined ? undefined : { from: manifest.ladder.base, to: happy.ref }
    const index = manifest.unhappy.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    const previous = index === 0 ? undefined : manifest.unhappy[index - 1]
    return { from: previous?.ref ?? happyRefsOf(manifest).at(-1) ?? manifest.ladder.base, to: manifest.unhappy[index]?.ref ?? "" }
}

/** The StarCi course of a lab: its declared `course`, else the lab id. */
export const courseOf = (manifest: LabManifest): string => manifest.course ?? manifest.lab

/**
 * The compose project of a lab, `starci-<course>-<lesson>`: the same name the server signs for the boot (`labProjectOf`), so a case run
 * on the learner's machine reaches the stack the boot started instead of a second one under the compose file's own `name:`.
 */
export const composeProjectOf = (manifest: LabManifest): string => `starci-${courseOf(manifest)}-${manifest.lessonId}`
