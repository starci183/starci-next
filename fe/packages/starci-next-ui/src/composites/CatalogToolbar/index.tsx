import { SearchField, Section, Select, Tabs } from "@starci/grammar/common"

/** One choice of a select or one status tab. */
type ToolbarOption = { readonly id: string; readonly label: string }

/** The words of the toolbar, resolved by its block. */
export type CatalogToolbarLabels = {
    readonly statusLabel: string
    readonly search: string
    readonly searchPlaceholder: string
    readonly clearSearch: string
    readonly topicSelect: string
    readonly planSelect: string
}

/** The status tabs, search and the two selects of the catalog. */
type CatalogToolbarProps = {
    readonly labels: CatalogToolbarLabels
    readonly statuses: ReadonlyArray<ToolbarOption & { readonly count: number }>
    readonly status: string
    readonly query: string
    readonly topics: ReadonlyArray<ToolbarOption>
    readonly topic: string
    readonly plans: ReadonlyArray<ToolbarOption>
    readonly plan: string
    readonly onStatus: (id: string) => void
    readonly onQuery: (query: string) => void
    readonly onTopic: (id: string) => void
    readonly onPlan: (id: string) => void
}

/** What one select of the toolbar needs. */
type ToolbarSelectProps = {
    readonly label: string
    readonly options: ReadonlyArray<ToolbarOption>
    readonly value: string
    readonly onChange: (id: string) => void
}

/** One select of the toolbar: a field named and prefixed by what it filters, its first option meaning every value. */
const ToolbarSelect = (props: ToolbarSelectProps) => (
    <Select
        label={props.label}
        isLabelHidden
        prefix={props.label}
        options={props.options}
        value={props.value}
        onValueChange={(id) => props.onChange(id ?? "")}
    />
)

/**
 * The toolbar of the catalog: a headless region named by the search label whose `filter` is one flat wrapping row on the surface, never a
 * card. The status tabs with their counts, the search over the title and the problem and the topic and plan selects sit straight in it.
 */
export const CatalogToolbar = (props: CatalogToolbarProps) => (
    <Section
        kind="region"
        ariaLabel={props.labels.search}
        filter={
            <>
                <Tabs
                    kind="filter"
                    label={props.labels.statusLabel}
                    items={props.statuses.map((each) => ({ id: each.id, label: each.label, count: each.count }))}
                    selectedKey={props.status}
                    onSelect={props.onStatus}
                />
                <SearchField
                    label={props.labels.search}
                    isLabelHidden
                    placeholder={props.labels.searchPlaceholder}
                    clearLabel={props.labels.clearSearch}
                    value={props.query}
                    onValueChange={props.onQuery}
                    onClear={() => props.onQuery("")}
                />
                <ToolbarSelect
                    label={props.labels.topicSelect}
                    options={props.topics}
                    value={props.topic}
                    onChange={props.onTopic}
                />
                <ToolbarSelect
                    label={props.labels.planSelect}
                    options={props.plans}
                    value={props.plan}
                    onChange={props.onPlan}
                />
            </>
        }
    >
        {null}
    </Section>
)
