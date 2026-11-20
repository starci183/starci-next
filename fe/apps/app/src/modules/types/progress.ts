import type { ListRowData } from "@starci/grammar/common"

/** One figure of a ribbon or of a figures section. */
export type ProgressFigureView = {
    readonly id: string
    readonly term: string
    readonly value: number
    readonly unit?: string
    readonly meta?: string
}

/** A link that ends the head row of a section. */
export type ProgressLinkView = { readonly label: string; readonly href: string }

/** One row of a progress list; a row with a percent draws a thin meter at its end. */
export type ProgressRowView = ListRowData & { readonly percent?: number }

/** One list section: its words, its rows and the line under it. */
export type ProgressListView = {
    readonly id: string
    readonly title: string
    readonly fact?: string
    readonly caption?: string
    readonly link?: ProgressLinkView
    readonly rows: ReadonlyArray<ProgressRowView>
    readonly empty: string
}

/** One entry of the activity timeline, in words. */
export type ProgressActivityEntry = {
    readonly id: string
    readonly title: string
    readonly at: string
    readonly when: string
}

/** A part of the page: its figures and lists, or null when its source could not be read. */
export type ProgressBlockView = {
    readonly figures?: {
        readonly title: string
        readonly items: ReadonlyArray<ProgressFigureView>
        readonly link?: ProgressLinkView
    }
    readonly lists: ReadonlyArray<ProgressListView>
}

/** The progress page as it is drawn. */
export type ProgressPageView = {
    readonly ribbon: ReadonlyArray<ProgressFigureView>
    readonly essentials: ProgressBlockView | null
    readonly harness: ProgressBlockView | null
    readonly projects: ProgressBlockView | null
    readonly practice: ProgressBlockView | null
    readonly review: ProgressBlockView | null
    readonly activity: ReadonlyArray<ProgressActivityEntry>
    /** Set when nothing has been measured yet: the invitation rows stand in for the sections. */
    readonly firstVisit: ReadonlyArray<ListRowData> | null
    /** The plan line under the page title: "Gói miễn phí" for a free learner, nothing for a subscriber. */
    readonly isFree: boolean
}

/** The fixed words of the progress page. */
export type ProgressLabels = {
    readonly title: string
    /** The title and the words of the whole page failing to read. */
    readonly pageError: string
    readonly pageErrorText: string
    readonly description: string
    readonly descriptionFree: string
    readonly descriptionFirst: string
    readonly loading: string
    readonly crumbLabel: string
    readonly crumbProfile: string
    readonly crumbHref: string
    readonly crumbSelf: string
    readonly ribbonLabel: string
    readonly essentialsTitle: string
    readonly harnessTitle: string
    readonly projectsTitle: string
    readonly practiceTitle: string
    readonly reviewTitle: string
    readonly activityTitle: string
    readonly activityLabel: string
    readonly activityEmpty: string
    readonly unavailable: string
    readonly retry: string
    readonly firstVisitTitle: string
    readonly firstVisitText: string
}
