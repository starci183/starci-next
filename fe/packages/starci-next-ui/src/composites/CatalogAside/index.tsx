import { SurfaceCard } from "@starci/grammar/common"

/** One group of the aside with the number of published lessons in it. */
type CatalogAsideGroup = {
    readonly id: string
    readonly label: string
    readonly count: number
    readonly isSelected: boolean
}

/** The group navigator of the catalog: "all" first, then every group with its count. */
type CatalogAsideProps = {
    readonly label: string
    readonly groups: ReadonlyArray<CatalogAsideGroup>
    readonly emptyLabel: string
    readonly onSelect: (groupId: string) => void
}

/** The aside of the catalog: a list of groups, the selected one marked, each with its count of published lessons. */
export const CatalogAside = (props: CatalogAsideProps) => (
    <SurfaceCard
        kind="list"
        label={props.label}
        empty={props.emptyLabel}
        items={props.groups.map((group) => ({
            id: group.id,
            title: group.label,
            meta: { text: String(group.count) },
            state: group.isSelected ? "informative" : "neutral",
            onPress: () => props.onSelect(group.id),
        }))}
    />
)
