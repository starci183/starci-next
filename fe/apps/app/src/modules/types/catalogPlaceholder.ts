import type { CatalogView } from "./catalog"

/** Blank text of the width the skeleton needs: non-breaking spaces carry no readable word into the page or the accessibility tree. */
const blank = (width: number): string => " ".repeat(width)

/** The fake catalog with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const CATALOG_PLACEHOLDER: CatalogView = {
    facts: blank(24),
    primary: { label: blank(22), href: "/" },
    counts: { all: 0, todo: 0, doing: 0, done: 0 },
    topics: [],
    groups: [1, 2].map((group) => ({
        id: `placeholder-${group}`,
        title: "",
        progressLabel: blank(10),
        done: 0,
        total: 1,
        href: "/",
        moreLabel: "",
        lessons: [1, 2, 3].map((index) => ({
            id: `placeholder-${group}-${index}`,
            title: blank(16),
            problem: blank(32),
            href: "/",
            minutes: blank(7),
            doneParts: 0,
            partsLabel: blank(6),
            state: "todo" as const,
            badge: { label: blank(8), tone: "neutral" as const },
            isCurrent: false,
            opener: "",
        })),
    })),
}
