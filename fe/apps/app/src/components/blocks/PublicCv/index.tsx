"use client"

import { NotFoundNotice } from "@starci-next/ui"
import { usePublicCvLabels, usePublicCvView } from "@/hooks/publicCv"
import type { PublicCv as PublicCvRead } from "@/hooks/swr"
import { staticsBase } from "@/modules/config"
import { PUBLIC_CV_PLACEHOLDER, PublicCvBase } from "./component"

/** What the route hands the block: the slug of the address and what the server already read, when it could. */
type PublicCvProps = { readonly slug: string; readonly initial?: PublicCvRead | undefined }

/** The public CV: reads one slug without a session, filters and folds its signed lines, and holds the share sheet. */
export const PublicCv = (props: PublicCvProps) => {
    const cv = usePublicCvView(props)
    return (
        <PublicCvBase
            shape={cv.shape}
            props={{
                slot: cv.slot,
                placeholder: PUBLIC_CV_PLACEHOLDER,
                slotLabels: cv.slotLabels,
                labels: cv.labels,
                share: cv.shareLabels,
                source: cv.source,
                isShareOpen: cv.isShareOpen,
                isPhone: cv.isPhone,
                canShare: cv.canShare,
                url: cv.url,
                previewSrc: cv.previewSrc,
                staticsBaseUrl: staticsBase(),
            }}
            on={{
                retry: cv.retry,
                chooseSource: cv.chooseSource,
                showMore: cv.showMore,
                setShareOpen: cv.setShareOpen,
                shareNative: cv.shareNative,
            }}
        />
    )
}

/** The not-found page of a public CV: one sentence for a wrong link and a private CV alike, in the shared not-found notice. */
export const PublicCvMissing = () => {
    const labels = usePublicCvLabels()
    return (
        <NotFoundNotice
            title={labels.notFoundTitle}
            description={labels.notFoundDescription}
            homeLabel={labels.notFoundHome}
            homeHref={labels.homeHref}
            staticsBaseUrl={staticsBase()}
        />
    )
}
