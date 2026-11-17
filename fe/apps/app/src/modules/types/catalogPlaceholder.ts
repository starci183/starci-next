import type { CatalogView } from "./catalog"

/** The fake catalog with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const CATALOG_PLACEHOLDER: CatalogView = {
    total: 3,
    facts: ["xxxxxx", "xxxxxxxx", "xxxxxxxxxx"],
    groups: [{ id: "placeholder", label: "xxxxxxxxxx", count: 0 }],
    languages: [{ id: "all", label: "xxxxxxa" }],
    providers: [{ id: "all", label: "xxxxxxb" }],
    cases: undefined,
    resume: undefined,
    tree: [
        {
            id: "placeholder",
            label: "xxxxxxxxxx",
            meta: "xxxxxx",
            topics: [],
            pending: "",
            cards: [1, 2, 3].map((index) => ({
                id: `placeholder-${index}`,
                title: "xxxxxxxxxx",
                description: "xxxxxxxxxxxxxxxx",
                difficulty: "xxxxxxc",
                status: "xxxxxxxx",
                facts: ["xxxxxxxxxx"],
                href: "/",
            })),
        },
    ],
}
