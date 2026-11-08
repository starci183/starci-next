import { Grid, Select, SurfaceCard } from "@starci/grammar/common"

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
 * The toolbar card of the catalog: Grammar's one toolbar row (the difficulty pills at the leading edge, the search over title and
 * description at the trailing edge) with the language and provider selects inline beside them as pills.
 */
export const CatalogToolbar = (props: CatalogToolbarProps) => (
    <SurfaceCard
        ariaLabel={props.labels.search}
        headers={[
            {
                kind: "toolbar",
                filter: {
                    label: props.labels.difficulty,
                    items: props.difficulties.map((each) => ({ id: each.id, label: each.label })),
                    selectedKey: props.difficulty,
                    onSelect: props.onDifficulty,
                },
                search: {
                    label: props.labels.search,
                    placeholder: props.labels.searchPlaceholder,
                    clearLabel: props.labels.clearSearch,
                    value: props.query,
                    onChange: props.onQuery,
                },
            },
        ]}
    >
        <Grid
            kind="pair"
            leading={
                <Select
                    label={props.labels.language}
                    isLabelHidden
                    appearance="pill"
                    prefix={props.labels.language}
                    options={props.languages}
                    value={props.language}
                    onValueChange={(id) => props.onLanguage(id ?? "")}
                />
            }
            trailing={
                <Select
                    label={props.labels.provider}
                    isLabelHidden
                    appearance="pill"
                    prefix={props.labels.provider}
                    options={props.providers}
                    value={props.provider}
                    onValueChange={(id) => props.onProvider(id ?? "")}
                />
            }
        />
    </SurfaceCard>
)
