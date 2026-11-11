import { workspaceDownloadOf } from "@/modules/lesson-view"
import type { WorkspaceVariantView } from "@/modules/types"

/** The variants of a lab, each with the door that serves its zip. */
export const withDownloads = (
    variants: ReadonlyArray<WorkspaceVariantView>,
    lessonId: string,
): ReadonlyArray<WorkspaceVariantView> =>
    variants.map((variant) => {
        const downloadHref = workspaceDownloadOf(lessonId, variant.id)
        return downloadHref === undefined ? variant : { ...variant, downloadHref }
    })
