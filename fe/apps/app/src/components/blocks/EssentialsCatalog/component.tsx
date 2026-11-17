import {
    Badge,
    Cluster,
    EmptyNotice,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    Stack,
    SurfaceCard,
} from "@starci/grammar/common"
import {
    ART,
    CatalogAside,
    CatalogContinue,
    CatalogSection,
    CatalogToolbar,
    SlotView,
    type CatalogNode,
} from "@starci-next/ui"
import type { CatalogFilters, CatalogLabels, CatalogView, DataSlot, SlotLabels } from "@/modules/types"

/** What the reader does on the catalog; every argument is an atom. */
type EssentialsCatalogActions = {
    readonly retry: () => void
    readonly choose: (change: Partial<CatalogFilters>) => void
    readonly clear: () => void
}

/** Props for {@link EssentialsCatalogBase}. */
export type EssentialsCatalogBaseProps = {
    readonly props: {
        readonly slot: DataSlot<CatalogView>
        readonly placeholder: CatalogView
        readonly slotLabels: SlotLabels
        readonly labels: CatalogLabels
        readonly filters: CatalogFilters
        /** The destination of the plans page. */
        readonly plansHref: string
    }
    readonly on: EssentialsCatalogActions
}

/** The name of the plan, the same in every language: a product name, not a sentence. */
const PREMIUM_NAME = "Premium"

/** What the well is drawn from. */
type WellProps = {
    readonly view: CatalogView
    readonly isLoading: boolean
    readonly labels: CatalogLabels
    readonly filters: CatalogFilters
    readonly on: EssentialsCatalogActions
}

/** What the aside is drawn from. */
type RailProps = {
    readonly view: CatalogView
    readonly labels: CatalogLabels
    readonly filters: CatalogFilters
    readonly plansHref: string
    readonly choose: EssentialsCatalogActions["choose"]
}

/** What the facts chips of the band are drawn from. */
type FactChipsProps = { readonly facts: ReadonlyArray<string> }

/** The case studies as one more group of the well: a row per announced case, none of them open yet. */
const casesNodeOf = (cases: NonNullable<CatalogView["cases"]>): CatalogNode => ({
    id: "casestudy",
    label: cases.title,
    meta: cases.meta,
    topics: [],
    pending: cases.pending,
    cards: cases.cards.map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description,
        difficulty: card.kind,
        status: card.status,
        facts: [],
        href: undefined,
    })),
})

/** The card that says nothing matches the filters, with the way to clear them. */
const NoResult = (props: Pick<WellProps, "labels" | "on">) => (
    <SurfaceCard
        kind="list"
        ariaLabel={props.labels.noResult.title}
        items={[]}
        empty={
            <EmptyNotice
                message={props.labels.noResult.title}
                description={props.labels.noResult.text}
                actionIntent="neutral"
                actionLabel={props.labels.noResult.clear}
                onAction={props.on.clear}
            />
        }
    />
)

/** The groups of the well, one list card each (its name on the well above it); when nothing matches, the notice card. */
const CatalogGroups = (props: Omit<WellProps, "filters">) => {
    const nodes: ReadonlyArray<CatalogNode> = [
        ...(props.view.cases === undefined ? [] : [casesNodeOf(props.view.cases)]),
        ...props.view.tree,
    ].map((node) => ({ ...node, isLoading: props.isLoading }))
    return (
        <>
            {nodes.length === 0 ? <NoResult labels={props.labels} on={props.on} /> : null}
            {nodes.map((node) => (
                <CatalogSection key={node.id} node={node} />
            ))}
        </>
    )
}

/** The middle well: the lesson in progress, the search and filters, then every group. */
const CatalogWell = (props: WellProps) => (
    <Stack gap="region">
        {props.view.resume === undefined ? null : (
            <CatalogContinue
                variant="card"
                title={props.labels.resumeTitle}
                lessonTitle={props.view.resume.title}
                phaseLine={props.view.resume.phaseLine}
                action={props.labels.resumeAction}
                href={props.view.resume.href}
            />
        )}
        <CatalogToolbar
            query={props.filters.query}
            difficulties={props.labels.difficulties}
            difficulty={props.filters.difficulty}
            languages={props.view.languages}
            language={props.filters.language}
            providers={props.view.providers}
            provider={props.filters.provider}
            labels={props.labels.toolbar}
            onQuery={(query) => props.on.choose({ query })}
            onDifficulty={(difficulty) => props.on.choose({ difficulty })}
            onLanguage={(language) => props.on.choose({ language })}
            onProvider={(provider) => props.on.choose({ provider })}
        />
        <CatalogGroups view={props.view} isLoading={props.isLoading} labels={props.labels} on={props.on} />
    </Stack>
)

/** The premium row of the aside for a reader without Premium; undefined for one who has it. */
const premiumOf = (props: RailProps) =>
    props.labels.upsell === undefined
        ? undefined
        : {
              title: PREMIUM_NAME,
              label: props.labels.upsell.label,
              note: props.labels.upsell.note,
              href: props.plansHref,
          }

/** The aside: the groups of the approved tree with their counts, then (without Premium) the one way to Premium; sections between dividers. */
const CatalogRail = (props: RailProps) => (
    <PaneSection>
        <CatalogAside
            label={props.labels.asideLabel}
            emptyLabel={props.labels.asideEmpty}
            groups={[{ id: "all", label: props.labels.all, count: props.view.total }, ...props.view.groups].map(
                (group) => ({ ...group, isSelected: group.id === props.filters.group }),
            )}
            premium={premiumOf(props)}
            onSelect={(group) => props.choose({ group })}
        />
    </PaneSection>
)

/** The facts of the catalog as grey chips beside the title. */
const FactChips = (props: FactChipsProps) => (
    <Cluster gap="inline" wrap>
        {props.facts.map((fact) => (
            <Badge key={fact} tone="neutral">
                {fact}
            </Badge>
        ))}
    </Cluster>
)

/** The settled catalog, or undefined while the first read runs or after it failed (the well says why). */
const settledOf = (slot: DataSlot<CatalogView>): CatalogView | undefined => ("items" in slot ? slot.items : undefined)

/** The band props the catalog adds to its title once it has data: the facts as chips and the one primary "continue". */
const bandOf = (view: CatalogView | undefined, labels: CatalogLabels) => ({
    ...(view === undefined ? {} : { status: <FactChips facts={view.facts} /> }),
    ...(view?.resume === undefined
        ? {}
        : {
              actions: (
                  <CatalogContinue
                      variant="command"
                      title={labels.resumeTitle}
                      lessonTitle={view.resume.title}
                      phaseLine={view.resume.phaseLine}
                      action={labels.resumeAction}
                      href={view.resume.href}
                  />
              ),
          }),
})

/**
 * Draws the Essentials catalog the way the approved pages are drawn: the white band (title, the facts as chips, the one primary
 * "continue" for a learner mid lesson), the well with the filters and one list card per group, and the white aside with the group
 * navigator and the Premium row. The catalog is never locked.
 */
export const EssentialsCatalogBase = (props: EssentialsCatalogBaseProps) => {
    const { slot, placeholder, labels, filters } = props.props
    const settled = settledOf(slot)
    return (
        <Page
            chrome="panes"
            header={{
                title: labels.title,
                breadcrumbs: "root",
                meta: labels.eyebrow,
                ...bandOf(settled, labels),
            }}
        >
            <PaneGrid
                label={labels.title}
                areas={{ base: ["aside", "main"], wide: ["main aside"] }}
                columns={{ base: ["fill"], wide: ["fill", "standard"] }}
                rows={{ base: ["auto", "fill"], wide: ["fill"] }}
            >
                <Pane area="main" scroll label={labels.title} content="cards">
                    <PaneSection>
                        <SlotView
                            slot={slot}
                            placeholder={placeholder}
                            labels={props.props.slotLabels}
                            emptyArtwork={{ src: ART.remember.src, assetSlot: "essentials-empty" }}
                            onRetry={props.on.retry}
                            render={(view, isLoading) => (
                                <CatalogWell
                                    view={view}
                                    isLoading={isLoading}
                                    labels={labels}
                                    filters={filters}
                                    on={props.on}
                                />
                            )}
                        />
                    </PaneSection>
                </Pane>
                <Pane area="aside" surface scroll label={labels.asideLabel}>
                    {settled === undefined ? (
                        <PaneSection isLoading>{null}</PaneSection>
                    ) : (
                        <CatalogRail
                            view={settled}
                            labels={labels}
                            filters={filters}
                            plansHref={props.props.plansHref}
                            choose={props.on.choose}
                        />
                    )}
                </Pane>
            </PaneGrid>
        </Page>
    )
}
