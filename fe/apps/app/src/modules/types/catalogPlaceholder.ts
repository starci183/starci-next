import type { CatalogView } from "./catalog"

/** The fake catalog with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const CATALOG_PLACEHOLDER: CatalogView = {
    facts: "xxxxxxxxxxxxxxxxxxxxxxxx",
    primary: { label: "xxxxxxxxxxxxxxxxxxxxxx", href: "/" },
    counts: { all: 0, todo: 0, doing: 0, done: 0 },
    topics: [],
    groups: [1, 2].map((group) => ({
        id: `placeholder-${group}`,
        title: "…",
        progressLabel: "xxxxxxxxxx",
        done: 0,
        total: 1,
        href: "/",
        moreLabel: "",
        lessons: [1, 2, 3].map((index) => ({
            id: `placeholder-${group}-${index}`,
            title: "xxxxxxxxxxxxxxxx",
            problem: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            href: "/",
            minutes: "xxxxxxx",
            doneParts: 0,
            partsLabel: "xxxxxx",
            state: "todo" as const,
            badge: { label: "xxxxxxxx", tone: "neutral" as const },
            isCurrent: false,
            opener: "",
        })),
    })),
}
