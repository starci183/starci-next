import { SurfaceCard } from "@starci/grammar/common"

/** One choice of a filter. */
type CatalogOption = { readonly id: string; readonly label: string }

/** The words of the toolbar, resolved by its block. */
export type CatalogToolbarLabels = {
    readonly search: string
    readonly searchPlaceholder: string
    readonly clearSearch: string
    readonly difficulty: string
    readonly language: string
    readonly provider: string
}

/** The search box and filters of the catalog. */
type CatalogToolbarProps = {
    readonly query: string
    readonly difficulties: ReadonlyArray<CatalogOption>
    readonly difficulty: string
    readonly languages: ReadonlyArray<CatalogOption>
    readonly language: string
    readonly providers: ReadonlyArray<CatalogOption>
    readonly provider: string
    readonly labels: CatalogToolbarLabels
    readonly onQuery: (query: string) => void
    readonly onDifficulty: (id: string) => void
    readonly onLanguage: (id: string) => void
    readonly onProvider: (id: string) => void
}

/**
 * The toolbar card of the catalog, two header zones and no body: the filter zone (the difficulty tabs), then the search zone (the search
 * over title and description, with the language and provider as its trailing `filters` selects).
 */
export const CatalogToolbar = (props: CatalogToolbarProps) => (
    <SurfaceCard
        kind="list"
        ariaLabel={props.labels.search}
        items={[]}
        empty={null}
        headers={[
            {
                kind: "filter",
                label: props.labels.difficulty,
                items: props.difficulties.map((each) => ({ id: each.id, label: each.label })),
                selectedKey: props.difficulty,
                onSelect: props.onDifficulty,
            },
            {
                kind: "search",
                label: props.labels.search,
                placeholder: props.labels.searchPlaceholder,
                clearLabel: props.labels.clearSearch,
                value: props.query,
                onChange: props.onQuery,
                filters: [
                    {
                        label: props.labels.language,
                        prefix: props.labels.language,
                        options: props.languages,
                        value: props.language,
                        onChange: (id) => props.onLanguage(id ?? ""),
                    },
                    {
                        label: props.labels.provider,
                        prefix: props.labels.provider,
                        options: props.providers,
                        value: props.provider,
                        onChange: (id) => props.onProvider(id ?? ""),
                    },
                ],
            },
        ]}
    />
)
