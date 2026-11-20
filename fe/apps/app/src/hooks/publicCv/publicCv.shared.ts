import type { PublicCv } from "@/hooks/swr"
import type { PublicCvSourceView } from "@/modules/types"

/** The source chips appear from this many lines (below it a filter only hides what a short page already shows). */
export const PUBLIC_CV_FILTER_FROM = 3

/** How many lines show before "Xem thêm": ten, six on a phone. */
export const PUBLIC_CV_LIMIT = { wide: 10, phone: 6 } as const

/** A list this short, or shorter, says under it that the CV grows as the teacher signs more. */
export const PUBLIC_CV_SHORT_LIST = 2

/** The value of the chip that shows every source. */
export const ALL_SOURCES = "all"

/** The sources in the order the chips list them. */
export const PUBLIC_CV_SOURCES: ReadonlyArray<string> = ["essentials", "projects", "harness", "incidents", "practice"]

/** The kinds of proof the catalog words; any other kind reads as the generic proof. */
export const PUBLIC_CV_EVIDENCE: ReadonlySet<string> = new Set([
    "ci-attested",
    "cli-scenario",
    "server-probe",
    "proved-lesson",
    "practice-accepted",
])

/** One line of the read, as the API answers it. */
export type PublicCvLine = PublicCv["lines"][number]

/** The source chips of a CV with their counts, in catalog order, or none below the filter threshold. */
export const sourcesOf = (
    lines: ReadonlyArray<PublicCvLine>,
    labelOf: (source: string) => string,
): ReadonlyArray<PublicCvSourceView> => {
    if (lines.length < PUBLIC_CV_FILTER_FROM) return []
    return PUBLIC_CV_SOURCES.map((id) => ({
        id,
        label: labelOf(id),
        count: lines.filter((line) => line.source === id).length,
    })).filter((source) => source.count > 0)
}

/** The lines of one source, or all of them. */
export const linesOfSource = (lines: ReadonlyArray<PublicCvLine>, source: string): ReadonlyArray<PublicCvLine> =>
    source === ALL_SOURCES ? lines : lines.filter((line) => line.source === source)

/** The newest signing date of a CV: the lines come newest first. */
export const newestSignedAt = (lines: ReadonlyArray<PublicCvLine>): string | undefined => lines[0]?.signedAt
