import type { PageHeaderContent } from "@starci/grammar/common"

/** The page header of the room: the title and the trail back to the interviews. */
export const roomHeaderOf = (title: string, back: string, homeHref: string): PageHeaderContent => ({
    title,
    titleScale: "standard",
    breadcrumbs: {
        label: back,
        items: [
            { id: "interview", label: back, href: homeHref },
            { id: "room", label: title },
        ],
    },
})
