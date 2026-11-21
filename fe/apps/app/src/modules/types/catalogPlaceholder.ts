import type { CatalogView } from "./catalog"

/** Blank text of the width the skeleton needs: non-breaking spaces carry no readable word into the page or the accessibility tree. */
const blank = (width: number): string => " ".repeat(width)

/** The fake catalog with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const CATALOG_PLACEHOLDER: CatalogView = {
    facts: blank(24),
    primary: { label: blank(22), href: "/" },
    counts: { all: 0, todo: 0, doing: 0, done: 0 },
    topics: [],
    figures: [1, 2, 3, 4].map((figure) => ({ id: `placeholder-${figure}`, term: blank(10), value: blank(3) })),
    resume: undefined,
    groups: [1, 2, 3].map((group) => ({
        id: `placeholder-${group}`,
        title: blank(16),
        description: blank(40),
        metaLabel: blank(16),
        badge: { label: blank(8), tone: "neutral" as const },
        progressLabel: blank(10),
        done: 0,
        total: 1,
        href: "/",
        moreLabel: "",
        lessons: [],
    })),
}
