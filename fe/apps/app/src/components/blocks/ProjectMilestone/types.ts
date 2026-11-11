/** One evidence chip of a concept, already in words. */
export type EvidenceChipView = {
    readonly id: string
    readonly label: string
    readonly state: string
    readonly tone: "success" | "warning" | "muted"
    /** `proved`, `practising` or empty: the grade of the latest passing result. */
    readonly mark: string
}

/** The failing result of a concept, already in words. */
export type FailureNoteView = {
    readonly text: string
    readonly question: string
    readonly relearnLabel: string
    readonly relearnHref: string
}

/** One concept of the milestone as it is drawn. */
export type ConceptCardView = {
    readonly id: string
    readonly label: string
    readonly stateLabel: string
    readonly stateTone: "success" | "warning" | "muted"
    readonly kindLabel: string
    /** The kinds of proof the concept needs, in words. */
    readonly proofLine: string
    /** The essentials lesson of the concept, or an empty href when it has none. */
    readonly lessonHref: string
    readonly lessonTitle: string
    readonly where: string
    readonly comingSoon: boolean
    readonly chips: ReadonlyArray<EvidenceChipView>
    /** The last failing result of the concept, or undefined when nothing failed. */
    readonly rejection: FailureNoteView | undefined
    readonly aiQuestion: string
    /** The words of the lesson to relearn when nothing failed yet, or empty. */
    readonly relearnLabel: string
    readonly relearnHref: string
    /** True when the concept needs the AI code read. */
    readonly needsCodeRead: boolean
}

/** One evidence run (one slot of one concept) as a row of the runs table, already in words. */
export type EvidenceRunView = {
    readonly id: string
    readonly concept: string
    readonly evidence: string
    readonly resultLabel: string
    readonly resultTone: "success" | "warning" | "muted"
    readonly levelLabel: string
    readonly when: string
}

/** The milestone as it is drawn. */
export type ProjectMilestoneView = {
    readonly title: string
    readonly projectName: string
    readonly intro: string
    readonly stateLabel: string
    readonly stateTone: "success" | "warning" | "muted"
    readonly runs: ReadonlyArray<EvidenceRunView>
    readonly concepts: ReadonlyArray<ConceptCardView>
}

/** The fixed words of the milestone page. */
export type ProjectMilestoneLabels = {
    readonly back: string
    readonly backHref: string
    readonly eyebrow: string
    readonly notFound: string
    readonly notFoundText: string
    readonly lockedTitle: string
    readonly lockedText: string
    readonly plans: string
    readonly plansHref: string
    readonly conceptsLabel: string
    readonly crumbRoot: string
    readonly crumbRootHref: string
    readonly crumbTrail: string
    readonly editTitle: string
    readonly lessonLink: string
    readonly runsLabel: string
    readonly runsEmpty: string
    readonly runsEmptyText: string
    readonly columns: {
        readonly concept: string
        readonly evidence: string
        readonly result: string
        readonly level: string
        readonly when: string
    }
    readonly howTitle: string
    readonly how: ReadonlyArray<string>
    readonly ciTitle: string
    readonly ciText: string
    readonly ciLink: string
    readonly ciHref: string
    readonly closeLabel: string
    readonly comingSoon: string
    readonly questionLabel: string
    readonly pointerTitle: string
    readonly location: string
    readonly endpoint: string
    readonly sampleBody: string
    readonly savePointer: string
    readonly savingPointer: string
    readonly explainTitle: string
    readonly explainText: string
    readonly excerpt: string
    readonly explanation: string
    readonly explain: string
    readonly explaining: string
}

/** What the learner typed for one concept. */
export type ConceptDraftView = {
    readonly location: string
    readonly endpoint: string
    readonly sampleBody: string
    readonly excerpt: string
    readonly explanation: string
}
