import type { PageHeaderContent } from "@starci/grammar/common"
import { HARNESS_ROUTES } from "@/modules/routes"
import type {
    HarnessE2eOutcome,
    HarnessOutlineEntry,
    HarnessPart,
    HarnessProbeView,
    HarnessStageView,
    HarnessSectionView,
    HarnessTool,
    HarnessVerdict,
} from "@/modules/types"

/** The tab of the harness band the reader is on: the hub or one of the three parts. */
export type HarnessTab = "overview" | HarnessPart

/** The words every harness page shares: the band, the tools and the names of the outcomes. */
export type HarnessCommonLabels = {
    readonly pageTitle: string
    readonly breadcrumbs: string
    readonly tabsLabel: string
    readonly tabs: Readonly<Record<HarnessTab, string>>
    readonly tools: Readonly<Record<HarnessTool, string>>
    readonly toolLabel: string
    readonly outcomes: Readonly<Record<HarnessE2eOutcome, string>>
    readonly proofs: Readonly<Record<HarnessStageView["proof"], string>>
    readonly probes: Readonly<Record<HarnessProbeView["outcome"], string>>
    readonly verdicts: Readonly<Record<HarnessVerdict, string>>
    readonly copy: { readonly copy: string; readonly copied: string; readonly copyError: string }
    readonly markdown: {
        readonly copy: string
        readonly copied: string
        readonly copyError: string
        readonly diagram: string
        readonly diagramError: string
        readonly table: string
    }
}

/** The tab hrefs of the band, in the order the band shows them. */
const TAB_HREFS: Readonly<Record<HarnessTab, string>> = {
    overview: HARNESS_ROUTES.hub,
    build: HARNESS_ROUTES.build,
    use: HARNESS_ROUTES.use,
    docs: HARNESS_ROUTES.docs,
}

/** What a page tells its band: its heading, its supporting line and the trail above it (the hub has none). */
type HeaderInput = {
    readonly active: HarnessTab
    readonly title: string
    readonly description?: string
    readonly meta?: string
    /** The crumbs between the harness and the page itself, as `[label, href]`; the last crumb of the page is its title. */
    readonly trail?: ReadonlyArray<readonly [string, string]>
}

/** The band of a harness page: the trail, the heading and the four tabs that link the hub and the three parts. */
export const harnessHeaderOf = (labels: HarnessCommonLabels, input: HeaderInput): PageHeaderContent => ({
    breadcrumbs:
        input.trail === undefined
            ? "root"
            : {
                  label: labels.breadcrumbs,
                  items: [
                      { id: "harness", label: labels.pageTitle, href: HARNESS_ROUTES.hub },
                      ...input.trail.map(([label, href], index) => ({ id: `crumb-${index}`, label, href })),
                      { id: "page", label: input.title },
                  ],
              },
    title: input.title,
    titleScale: "standard",
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.meta === undefined ? {} : { meta: input.meta }),
    tabs: {
        label: labels.tabsLabel,
        kind: "views",
        selectedKey: input.active,
        items: (Object.keys(TAB_HREFS) as ReadonlyArray<HarnessTab>).map((id) => ({
            id,
            label: labels.tabs[id],
            href: TAB_HREFS[id],
        })),
    },
})

/** The outline of a document: one line per section, each jumping to its anchor. */
export const outlineOf = (sections: ReadonlyArray<HarnessSectionView>): ReadonlyArray<HarnessOutlineEntry> =>
    sections.map((section) => ({ id: section.id, label: section.title, href: `#${section.id}` }))

/** The tone a badge takes for each e2e outcome. */
export const OUTCOME_TONES = {
    green: "success",
    red: "danger",
    untested: "muted",
    running: "accent",
} as const satisfies Readonly<Record<HarnessE2eOutcome, string>>

/** The tone a badge takes for each probe outcome. */
export const PROBE_TONES = {
    pass: "success",
    fail: "danger",
    skipped: "muted",
} as const satisfies Readonly<Record<HarnessProbeView["outcome"], string>>

/** The tone a badge takes for each verdict of a trial. */
export const VERDICT_TONES = {
    clean: "success",
    shortcut: "danger",
    incomplete: "warning",
    untested: "muted",
} as const satisfies Readonly<Record<HarnessVerdict, string>>
