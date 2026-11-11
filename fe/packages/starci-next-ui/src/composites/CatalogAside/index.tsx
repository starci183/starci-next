import { Divider, Section } from "@starci/grammar/common"

/** One group of the aside with the number of published lessons in it. */
type CatalogAsideGroup = {
    readonly id: string
    readonly label: string
    readonly count: number
    readonly isSelected: boolean
}

/** The way to Premium for a reader without it: one row that opens the plans (a real anchor, 0.37.14: a navigation row draws a chevron, no arrow). */
type CatalogAsidePremium = {
    /** The name of the section. */
    readonly title: string
    /** The title of the row. */
    readonly label: string
    /** The line under it: what Premium opens, already in words. */
    readonly note: string
    readonly href: string
}

/** The group navigator of the catalog: "all" first, then every group with its count, then the Premium row when the reader has no Premium. */
type CatalogAsideProps = {
    readonly label: string
    readonly groups: ReadonlyArray<CatalogAsideGroup>
    readonly emptyLabel: string
    readonly premium: CatalogAsidePremium | undefined
    readonly onSelect: (groupId: string) => void
}

/** The aside of the catalog: sections between dividers, never cards. Groups first (the selected one marked), then Premium. */
export const CatalogAside = (props: CatalogAsideProps) => (
    <>
        <Section
            kind="list"
            title={props.label}
            empty={props.emptyLabel}
            items={props.groups.map((group) => ({
                id: group.id,
                title: group.label,
                meta: { text: String(group.count) },
                state: group.isSelected ? "informative" : "neutral",
                onPress: () => props.onSelect(group.id),
            }))}
        />
        {props.premium === undefined ? null : (
            <>
                <Divider />
                <Section
                    kind="list"
                    title={props.premium.title}
                    empty={props.premium.note}
                    items={[
                        {
                            id: "premium",
                            title: props.premium.label,
                            description: props.premium.note,
                            href: props.premium.href,
                        },
                    ]}
                />
            </>
        )}
    </>
)
