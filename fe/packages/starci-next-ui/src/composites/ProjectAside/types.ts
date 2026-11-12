/** The tone of a state chip. */
export type ChipTone = "success" | "accent" | "warning" | "neutral" | "muted"

/** One state chip: its words and its tone. */
export type ChipView = { readonly label: string; readonly tone: ChipTone }

/** One probe of the last run, already in words. */
export type ProbeLineView = { readonly id: string; readonly text: string; readonly chip: ChipView }

/** One milestone row: name, the proved count in words, a bar from 0 to 100 and its state chip. */
export type MilestoneRowView = {
    readonly id: string
    readonly title: string
    readonly meta: string
    readonly percent: number
    readonly chip: ChipView
    readonly href: string
}

/** One row of the latest runs: what ran, its detail, the verdict (none before a verdict) and when. */
export type RunRowView = {
    readonly id: string
    readonly kind: string
    readonly detail: string
    readonly verdict: ChipView | undefined
    /** An RFC 3339 timestamp, or empty when the server sent none. */
    readonly at: string
}

/** One experience item the project earned so far: its name and how many. */
export type ExperienceRowView = { readonly id: string; readonly title: string; readonly count: number }

/** The project as it is drawn: every word is already resolved. */
export type ProjectDetailView = {
    readonly title: string
    /** The muted line under the title: repo, stack, language joined by dots. */
    readonly meta: string
    readonly state: ChipView
    readonly repo: string
    /** The repo as text without the scheme. */
    readonly repoLabel: string
    readonly milestones: ReadonlyArray<MilestoneRowView>
    readonly runs: ReadonlyArray<RunRowView>
    readonly experience: ReadonlyArray<ExperienceRowView>
    readonly probes: ReadonlyArray<ProbeLineView>
    readonly ci: ChipView
    readonly ciLine: string
    readonly deployedUrl: string
}

/** The fixed words of the project page. */
export type ProjectDetailLabels = {
    readonly pageTitle: string
    readonly pageHref: string
    readonly breadcrumbs: string
    readonly experienceHref: string
    readonly devicesHref: string
    readonly notFound: string
    readonly notFoundText: string
    readonly back: string
    readonly noRepo: string
    readonly milestones: string
    readonly runsTitle: string
    readonly colKind: string
    readonly colDetail: string
    readonly colResult: string
    readonly colAt: string
    readonly runsEmpty: string
    readonly expTitle: string
    readonly expLink: string
    readonly expEmpty: string
    readonly probesTitle: string
    readonly deployTitle: string
    readonly deployText: string
    readonly deployedLabel: string
    readonly saveDeployed: string
    readonly runProbes: string
    readonly runningProbes: string
    readonly sync: string
    readonly syncing: string
    readonly asideRepo: string
    readonly asideCi: string
    readonly ciNote: string
    readonly deviceTitle: string
    readonly deviceBadge: string
    readonly deviceNote: string
    readonly deviceConnect: string
    readonly secretTitle: string
    readonly secretText: string
    readonly rotate: string
    readonly rotating: string
    readonly newSecret: string
    readonly copy: string
    readonly copied: string
    readonly layoutTitle: string
    readonly layoutTree: string
    readonly layoutTests: string
    readonly layoutTestsText: string
    readonly layoutFlow: string
    readonly emptyMilestones: string
}

/** What the learner typed or was handed on the page, apart from the read. */
export type ProjectDetailFields = {
    /** The deployed address in the field. */
    readonly deployed: string
    readonly secret: string | undefined
    readonly issueWords: string
    /** The active language, for the times of the runs. */
    readonly locale: string
}

/** Which commands of the page are running; each flag is the pending prop of its own button. */
export type ProjectDetailBusy = {
    readonly isSaving: boolean
    readonly isProbing: boolean
    readonly isSyncing: boolean
    readonly isRotating: boolean
}

/** The data every card of the well reads: the settled project, the words, and whether the first read is still running. */
export type CardProps = {
    readonly view: ProjectDetailView
    readonly labels: ProjectDetailLabels
    readonly isLoading: boolean
}

/** The commands of the deployed-address card. */
export type DeployCommands = {
    readonly deployed: (value: string) => void
    readonly saveDeployed: () => void
    readonly runProbes: () => void
}

/** What the deployed-address card needs: the field, the busy flags and the commands. */
export type DeployCardProps = CardProps & {
    readonly fields: ProjectDetailFields
    readonly busy: ProjectDetailBusy
    readonly on: DeployCommands
}
