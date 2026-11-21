/** One signed line of a public CV as it is drawn: the sentence, where it came from and the trail of trust under it. */
export type PublicCvLineView = {
    /** The public verification code, also the key of the row. */
    readonly id: string
    /** The signed sentence, without markdown marks. */
    readonly title: string
    /** The source id the filter chips select by: essentials, projects, harness, incidents or practice. */
    readonly sourceId: string
    /** The words of the source. */
    readonly sourceLabel: string
    /** What the line is about; empty when the catalog names no subject. */
    readonly subject: string
    /** The first signal: the kinds of proof the line rests on, in words. */
    readonly proofText: string
    /** The last signal: who signed and when, in words; never a name. */
    readonly signText: string
    /** The code shown beside the link. */
    readonly code: string
    /** The verification page of the code. */
    readonly verifyHref: string
}

/** One source chip with the number of lines it holds. */
export type PublicCvSourceView = {
    readonly id: string
    readonly label: string
    readonly count: number
}

/** One key figure of the CV: its words and its count. */
export type PublicCvFigureView = {
    readonly id: string
    readonly term: string
    readonly value: number
}

/** The public CV as it is drawn: whose it is, the event line and the lines that show now. */
export type PublicCvScreenView = {
    readonly name: string
    readonly avatarUrl: string | null
    /** The event line under the name: the signed count and the newest signing date. */
    readonly facts: string
    /** How many lines the CV holds in all. */
    readonly total: number
    /** The key figures: the signed lines, then the lines of each source group; never a score. */
    readonly figures: ReadonlyArray<PublicCvFigureView>
    /** The source chips, only from the count the screen filters at; empty below it. */
    readonly sources: ReadonlyArray<PublicCvSourceView>
    /** The lines that show now: the chosen source, up to the limit. */
    readonly lines: ReadonlyArray<PublicCvLineView>
    /** How many matching lines the limit still hides. */
    readonly hidden: number
    /** The words of the button that shows more, with the hidden count. */
    readonly moreLabel: string
    /** The line under a short list that says the CV grows as lines are signed, or empty when the list is not short. */
    readonly growNote: string
}

/** The fixed words of the public CV page. */
export type PublicCvLabels = {
    readonly brand: string
    readonly logoSrc: string
    readonly homeHref: string
    readonly signIn: string
    readonly signInHref: string
    readonly verifiedBy: string
    readonly share: string
    readonly linesTitle: string
    readonly note: string
    readonly empty: string
    readonly allSources: string
    readonly sourcesLabel: string
    readonly figuresLabel: string
    readonly verify: string
    readonly aiText: string
    readonly whyTitle: string
    readonly steps: ReadonlyArray<{ readonly id: string; readonly label: string; readonly description: string }>
    readonly whyNote: string
    readonly footNote: string
    readonly footCta: string
    readonly notFoundTitle: string
    readonly notFoundDescription: string
    readonly notFoundHome: string
    readonly copy: string
    readonly copied: string
    readonly copyError: string
}

/** The words and the targets of the share sheet. */
export type PublicCvShareLabels = {
    readonly title: string
    readonly closeLabel: string
    readonly linkLabel: string
    readonly previewTitle: string
    readonly previewAlt: string
    readonly other: string
    readonly targets: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href: string }>
}
