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
    /** The sentence under the failure notice: what happened and what the learner still has. */
    readonly errorDescription?: string
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

/**
 * Props for {@link SlotView}. `H` and `A` are what the header and the aside are made of: a node by default, or data a frame hands on (the
 * `header` of a `Page`).
 */
export type SlotViewProps<T, H = ReactNode, A = ReactNode> = {
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
    /**
     * The page header of the same read: drawn with the settled view, or with the placeholder and `isLoading` true while the first read
     * loads, so the block never branches on the slot itself. Any other status draws `headerFallback`.
     */
    readonly header?: (data: T, isLoading: boolean) => H
    /** The header of a read that is forbidden, failed or settled empty (the title alone, usually). */
    readonly headerFallback?: H
    /** The aside of the same read, drawn like `header`; any other status draws `asideFallback`. */
    readonly aside?: (data: T, isLoading: boolean) => A
    /** The aside of a read that is forbidden, failed or settled empty. */
    readonly asideFallback?: A
    /** Puts the header, the aside and the status body into the page (`Page`, `Grid`): without it they are returned side by side. */
    readonly frame?: (parts: SlotParts<H, A>) => ReactNode
}

/** What `frame` receives: the header and aside of the read, the body its status draws and whether the first read is loading. */
export type SlotParts<H = ReactNode, A = ReactNode> = {
    /** The header of the read; without a `headerFallback` a status that has no settled view leaves it undefined, so give one when `H` is not a node. */
    readonly header: H
    readonly aside: A
    readonly body: ReactNode
    /** True while the first read loads (the header, aside and body then draw the placeholder): hand it to `Page isLoading`. */
    readonly isLoading: boolean
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
        {...descriptionOf(props.errorDescription ?? props.labels.errorDescription)}
        {...(props.onRetry === undefined ? {} : { action: { label: props.labels.retry, onAction: props.onRetry } })}
    />
)

/** The empty notice of a read that settled with nothing to draw. */
const emptyNotice = (props: Pick<SlotViewProps<unknown>, "emptyDescription" | "emptyArtwork" | "labels">): ReactNode =>
    props.emptyArtwork === undefined ? (
        <EmptyNotice message={props.labels.empty} {...descriptionOf(props.emptyDescription)} />
    ) : (
        <EmptyNotice
            scope="page"
            message={props.labels.empty}
            {...descriptionOf(props.emptyDescription)}
            media={{ illustration: props.emptyArtwork }}
        />
    )

/**
 * The one recipe for a slot's data status. No block writes its own loading, forbidden, error or empty branch; each one
 * renders through here, in the region's own place.
 */
export const SlotView = <T, H = ReactNode, A = ReactNode>(props: SlotViewProps<T, H, A>): ReactNode => {
    const { slot } = props
    const part = <P,>(
        make: ((data: T, isLoading: boolean) => P) | undefined,
        fallback: P | undefined,
        data: T | undefined,
        isLoading: boolean,
    ): P => (data === undefined || make === undefined ? fallback : make(data, isLoading)) as P
    const parts = (body: ReactNode, data: T | undefined, isLoading: boolean): ReactNode => {
        const header = part(props.header, props.headerFallback, data, isLoading)
        const aside = part(props.aside, props.asideFallback, data, isLoading)
        return props.frame === undefined ? (
            <>
                {header as ReactNode}
                {body}
                {aside as ReactNode}
            </>
        ) : (
            props.frame({ header, aside, body, isLoading })
        )
    }
    if ("isLoading" in slot) return parts(props.render(props.placeholder, true), props.placeholder, true)
    if ("isForbidden" in slot) return parts(forbiddenNotice(props), undefined, false)
    if ("isError" in slot) return parts(errorNotice(props), undefined, false)
    if ("isEmpty" in slot) return parts(emptyNotice(props), undefined, false)
    return parts(props.render(slot.items, false), slot.items, false)
}
