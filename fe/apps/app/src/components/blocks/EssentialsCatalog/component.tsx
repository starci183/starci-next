import { EmptyNotice, Grid, Page, Stack } from "@starci/grammar/common"
import {
    ART,
    ArtImage,
    CaseStudyBlock,
    CatalogAside,
    CatalogContinue,
    CatalogIntro,
    CatalogSection,
    CatalogToolbar,
    SlotView,
} from "@starci-next/ui"
import type { CatalogFilters, CatalogLabels, CatalogView, DataSlot, SlotLabels } from "@/modules/types"

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

/** The catalog with the words, the choices and the actions it is drawn with. */
type CatalogBodyProps = {
    readonly view: CatalogView
    readonly labels: CatalogLabels
    readonly filters: CatalogFilters
    readonly plansHref: string
    readonly on: EssentialsCatalogActions
}

/** The case studies first while nothing hides them, then the sections of the lessons that match the filters, or the notice that none does with the way to clear them. */
const CatalogResults = (props: Pick<CatalogBodyProps, "view" | "labels" | "on">) =>
    props.view.tree.length === 0 && props.view.cases === undefined ? (
        <EmptyNotice
            artwork={{ src: ART.remember.src, alt: "", assetSlot: "essentials-no-result" }}
            message={props.labels.noResult.title}
            description={props.labels.noResult.text}
            actionLabel={props.labels.noResult.clear}
            onAction={props.on.clear}
        />
    ) : (
        <Stack gap="region">
            {props.view.cases === undefined ? null : <CaseStudyBlock {...props.view.cases} />}
            {props.view.tree.map((node) => (
                <CatalogSection key={node.id} node={node} openLabel={props.labels.open} />
            ))}
        </Stack>
    )

/** The primary column: the intro, the toolbar and the results. */
const CatalogMain = (props: CatalogBodyProps) => (
    <Stack gap="region">
        <CatalogIntro
            eyebrow={props.labels.eyebrow}
            title={props.labels.title}
            description={props.labels.description}
            facts={props.view.facts}
            art={<ArtImage asset={ART.map} />}
            upsell={props.labels.upsell === undefined ? undefined : { ...props.labels.upsell, href: props.plansHref }}
        />
        {props.view.resume === undefined ? null : (
            <CatalogContinue
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
        <CatalogResults view={props.view} labels={props.labels} on={props.on} />
    </Stack>
)

/** The aside: "all" first, then the groups of the approved tree, each with its count of published lessons. */
const CatalogNav = (props: Pick<CatalogBodyProps, "view" | "labels" | "filters" | "on">) => (
    <CatalogAside
        label={props.labels.asideLabel}
        emptyLabel={props.labels.asideEmpty}
        groups={[{ id: "all", label: props.labels.all, count: props.view.total }, ...props.view.groups].map(
            (group) => ({
                ...group,
                isSelected: group.id === props.filters.group,
            }),
        )}
        onSelect={(group) => props.on.choose({ group })}
    />
)

/**
 * Draws the Essentials catalog the way the canvas does: the group aside, the intro with the Premium upsell for a reader without
 * Premium, the search and filters, the lesson sections and the case-study collection. The catalog is never locked.
 */
export const EssentialsCatalogBase = (props: EssentialsCatalogBaseProps) => (
    <Page>
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            emptyArtwork={{ src: ART.remember.src, assetSlot: "essentials-empty" }}
            onRetry={props.on.retry}
            render={(view) => {
                const body = {
                    view,
                    labels: props.props.labels,
                    filters: props.props.filters,
                    plansHref: props.props.plansHref,
                    on: props.on,
                }
                return (
                    <Grid
                        kind="main-rail"
                        railPosition="leading"
                        rail={<CatalogNav {...body} />}
                        primary={<CatalogMain {...body} />}
                    />
                )
            }}
        />
    </Page>
)
