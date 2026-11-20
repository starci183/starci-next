/** The machine of the learner as the page names it: online by its name, or none seen yet. */
export type SourceMachineView = { readonly isOnline: boolean; readonly name: string }

/** A component of the architecture with the rules it keeps, in words. */
export type ComponentRowView = {
    readonly id: string
    readonly name: string
    readonly port: string
    readonly rules: string
}

/** One entry of the code walk. */
export type CodeWalkView = {
    readonly id: string
    readonly title: string
    /** The rule the snippet keeps, in words; empty when the lesson does not name it. */
    readonly rule: string
    /** The place of the snippet, for example "wallet.service.ts:41". */
    readonly location: string
    readonly snippet: string
    readonly why: string
}

/** One line of the file tree of the source. */
export type SourceFileView = { readonly id: string; readonly path: string }

/** The source part: the machine, the commands, the architecture, the rules per component and the code walk. */
export type SourcePartView = {
    readonly machine: SourceMachineView
    /** The commands that pull and start the source, one per line. */
    readonly pullCommand: string
    /** What the up command reported when it failed, line by line; empty when it did not fail or has not run. */
    readonly upFailure: ReadonlyArray<string>
    readonly diagram: string
    readonly components: ReadonlyArray<ComponentRowView>
    readonly codeWalk: ReadonlyArray<CodeWalkView>
    readonly files: ReadonlyArray<SourceFileView>
    /** The archive of the source, or empty when the back end serves none for the lesson. */
    readonly downloadHref: string
}

/** The words of the right column of the source part. */
export type SourceAsideLabels = {
    readonly inSource: string
    readonly notIncludedTitle: string
    readonly notIncluded: string
    readonly needsTitle: string
    readonly needs: string
}

/** Every word of the source part. */
export type SourceLabels = {
    readonly pullTitle: string
    readonly pullNote: string
    /** The chip of the online machine: its name is the only argument. */
    readonly machineOnline: (name: string) => string
    readonly machineNone: string
    readonly machineNoneNote: string
    readonly upFailed: string
    /** What to do after a failed up: fix the cause the lines name, then run the command again. */
    readonly upFix: string
    readonly architecture: string
    readonly diagram: string
    readonly diagramError: string
    readonly components: string
    readonly component: string
    readonly port: string
    readonly rules: string
    readonly why: string
    readonly empty: string
    readonly download: string
    readonly copy: string
    readonly aside: SourceAsideLabels
}
