import type { ApplyPartView, ScenariosPartView, SourcePartView } from "@starci-next/ui"

/** The three parts that run on the machine of the learner, as the lesson page holds them. */
export type RunParts = {
    readonly source: SourcePartView
    readonly scenarios: ScenariosPartView
    readonly apply: ApplyPartView
}

/** The parts the page draws before the lesson is read. */
export const EMPTY_RUN_PARTS: RunParts = {
    source: {
        machine: { isOnline: false, name: "" },
        pullCommand: "",
        upFailure: [],
        diagram: "",
        components: [],
        codeWalk: [],
        files: [],
        downloadHref: "",
    },
    scenarios: { rows: [], selected: undefined, summary: "", machine: "" },
    apply: { rungs: [], selectedId: "", challenge: undefined, cvLine: "" },
}
