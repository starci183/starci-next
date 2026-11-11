import type { ReactNode } from "react"
import { Alert, EmptyNotice } from "@starci/grammar/common"

/** One read's exclusive status; only a settled ready slot carries items, and revalidation keeps its settled drawing. */
export type DataSlot<T> =
    | { readonly isLoading: true }
    | { readonly isForbidden: true }
    | { readonly isError: true }
    | { readonly isEmpty: true; readonly isValidating?: boolean }
    | { readonly items: T; readonly isValidating?: boolean }

/** Resolved copy of the data-status recipe for one slot. */
export type SlotLabels = {
    /** The notice of a read that settled with nothing to draw. */
    readonly empty: string
    /** The notice of a read the viewer may not see. */
    readonly forbidden: string
    /** The notice of a read that failed. */
    readonly error: string
    /** The words on the control that reads again after a failure. */
    readonly retry: string
}

/** A read folded into a region; errors remain unknown at the boundary. */
export type SlotRead<T> = {
    /** What the read yielded; undefined until it settles. */
    readonly data: T | undefined
    /** The failure of the read; undefined when it did not fail. */
    readonly error: unknown
    /** Whether the first run of the read is in flight. */
    readonly isLoading: boolean
    /** Whether the read runs again while its data shows. */
    readonly isValidating?: boolean
}

/** Props for {@link SlotView}. */
export type SlotViewProps<T> = {
    readonly slot: DataSlot<T>
    /** Fake data of the same shape: the skeleton reuses the ready tree. */
    readonly placeholder: T
    readonly labels: SlotLabels
    /** A secondary slot disappears on a refusal; a primary slot says so in place. */
    readonly forbidden?: "hide" | "notice"
    /** Drawn under the forbidden notice of a primary slot: the way out (a link to the plans). */
    readonly forbiddenAction?: ReactNode
    /** Resolved supporting copy for the primary forbidden notice. */
    readonly forbiddenDescription?: string
    /** Resolved supporting copy for the failure notice. */
    readonly errorDescription?: string
    /** Resolved supporting copy for the empty notice. */
    readonly emptyDescription?: string
    /** The picture of the empty notice (decorative), with the slot id it is requested under. */
    readonly emptyArtwork?: { readonly src: string; readonly assetSlot: string }
    /** Re-runs exactly the read that failed. */
    readonly onRetry?: () => void
    /** The ready tree, drawn once with the placeholder while the first read loads (`render(placeholder, true)`). */
    readonly render: (data: T, isLoading: boolean) => ReactNode
}

/** The words under a notice, when the block supplies them. */
const descriptionOf = (description: string | undefined): { readonly description?: string } =>
    description === undefined ? {} : { description }

/** The forbidden recipe either collapses the secondary region or keeps its exit action visible. */
const forbiddenNotice = (
    props: Pick<SlotViewProps<unknown>, "forbidden" | "forbiddenAction" | "forbiddenDescription" | "labels">,
): ReactNode => {
    if (props.forbidden === "hide") return null
    return (
        <>
            <EmptyNotice message={props.labels.forbidden} {...descriptionOf(props.forbiddenDescription)} />
            {props.forbiddenAction}
        </>
    )
}

/** The failed read keeps its own retry and supporting copy. */
const errorNotice = (props: Pick<SlotViewProps<unknown>, "errorDescription" | "labels" | "onRetry">): ReactNode => (
    <Alert
        tone="negative"
        title={props.labels.error}
        {...descriptionOf(props.errorDescription)}
        {...(props.onRetry === undefined ? {} : { action: { label: props.labels.retry, onAction: props.onRetry } })}
    />
)

/** The empty notice of a read that settled with nothing to draw. */
const emptyNotice = (
    props: Pick<SlotViewProps<unknown>, "emptyDescription" | "emptyArtwork" | "labels">,
): ReactNode =>
    props.emptyArtwork === undefined ? (
        <EmptyNotice message={props.labels.empty} {...descriptionOf(props.emptyDescription)} />
    ) : (
        <EmptyNotice
            message={props.labels.empty}
            {...descriptionOf(props.emptyDescription)}
            artwork={{ ...props.emptyArtwork, alt: "" }}
        />
    )

/**
 * The one recipe for a slot's data status. No block writes its own loading, forbidden, error or empty branch; each one
 * renders through here, in the region's own place.
 */
export const SlotView = <T,>(props: SlotViewProps<T>): ReactNode => {
    const { slot } = props
    if ("isLoading" in slot) return props.render(props.placeholder, true)
    if ("isForbidden" in slot) return forbiddenNotice(props)
    if ("isError" in slot) return errorNotice(props)
    if ("isEmpty" in slot) return emptyNotice(props)
    return props.render(slot.items, false)
}
