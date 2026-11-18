"use client"

import { useLocalizedPathname } from "@/hooks/locale"
import { useOrigin } from "@/hooks/profile"
import { usePublicCvLabels, usePublicCvView } from "@/hooks/publicCv"
import type { PublicCv as PublicCvRead } from "@/hooks/swr"
import { PUBLIC_CV_PLACEHOLDER, PublicCvBase, type PublicCvBaseProps } from "./component"

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
                address: cv.url,
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

/** The inert callbacks of a page that has nothing to act on. */
const NO_ACTIONS: PublicCvBaseProps["on"] = {
    retry: () => undefined,
    chooseSource: () => undefined,
    showMore: () => undefined,
    setShareOpen: () => undefined,
    shareNative: () => undefined,
}

/** The not-found page of a public CV: one sentence for a wrong link and a private CV alike, with the address that was opened. */
export const PublicCvMissing = () => {
    const labels = usePublicCvLabels()
    const origin = useOrigin()
    const pathname = useLocalizedPathname()
    return (
        <PublicCvBase
            shape="notFound"
            props={{
                slot: { isLoading: true },
                placeholder: PUBLIC_CV_PLACEHOLDER,
                slotLabels: { empty: labels.notFoundTitle, forbidden: "", error: "", retry: "" },
                labels,
                share: {
                    title: "",
                    closeLabel: "",
                    linkLabel: "",
                    previewTitle: "",
                    previewAlt: "",
                    other: "",
                    targets: [],
                },
                source: "all",
                isShareOpen: false,
                isPhone: false,
                canShare: false,
                url: "",
                previewSrc: "",
                address: `${origin}${pathname}`,
            }}
            on={NO_ACTIONS}
        />
    )
}
