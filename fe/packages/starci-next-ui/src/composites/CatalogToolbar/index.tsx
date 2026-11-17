import { SearchField, Section, Select, Tabs } from "@starci/grammar/common"

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

/** One select of the toolbar: a small field named and prefixed by its label, its empty choice meaning every option. */
const ToolbarSelect = (props: {
    readonly label: string
    readonly options: ReadonlyArray<CatalogOption>
    readonly value: string
    readonly onChange: (id: string) => void
}) => (
    <Select
        label={props.label}
        isLabelHidden
        size="sm"
        prefix={props.label}
        options={props.options}
        value={props.value}
        onValueChange={(id) => props.onChange(id ?? "")}
    />
)

/**
 * The toolbar of the catalog: a headless region named by the search label whose `filter` is one flat wrapping row on the surface, never a card.
 * The difficulty tabs, the search over title and description and the language and provider selects sit straight in the filter, with no wrapper.
 */
export const CatalogToolbar = (props: CatalogToolbarProps) => (
    <Section
        kind="region"
        ariaLabel={props.labels.search}
        filter={
            <>
                <Tabs
                    kind="filter"
                    label={props.labels.difficulty}
                    items={props.difficulties.map((each) => ({ id: each.id, label: each.label }))}
                    selectedKey={props.difficulty}
                    onSelect={props.onDifficulty}
                />
                <SearchField
                    label={props.labels.search}
                    isLabelHidden
                    size="sm"
                    placeholder={props.labels.searchPlaceholder}
                    clearLabel={props.labels.clearSearch}
                    value={props.query}
                    onValueChange={props.onQuery}
                    onClear={() => props.onQuery("")}
                />
                <ToolbarSelect
                    label={props.labels.language}
                    options={props.languages}
                    value={props.language}
                    onChange={props.onLanguage}
                />
                <ToolbarSelect
                    label={props.labels.provider}
                    options={props.providers}
                    value={props.provider}
                    onChange={props.onProvider}
                />
            </>
        }
    >
        {null}
    </Section>
)
