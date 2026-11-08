import type { DataSlot } from "@starci-next/ui"

/** The header of a Page whose trail runs from the catalog through the subject to the page: the title and its breadcrumbs. */
export type TrailHeaderPart = {
    readonly header?: {
        readonly title: string
        readonly titleScale: "standard"
        readonly breadcrumbs: {
            readonly label: string
            readonly items: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href?: string }>
        }
    }
}

/** What a trail needs of the subject: its title and the trail items. */
export type Trail = {
    readonly title: string
    readonly items: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href?: string }>
}

/** The page header of a slot: the settled subject's trail, the placeholder's while the first read runs, none for any other status. */
export const trailHeaderOf = <T>(
    slot: DataSlot<T>,
    placeholder: T,
    label: string,
    trailOf: (subject: T) => Trail,
): TrailHeaderPart => {
    if (!("items" in slot) && !("isLoading" in slot)) return {}
    const trail = trailOf("items" in slot ? slot.items : placeholder)
    return {
        header: { title: trail.title, titleScale: "standard" as const, breadcrumbs: { label, items: trail.items } },
    }
}
