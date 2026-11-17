import type { ConceptDraftView, DataSlot, ProjectConceptLabels, ProjectConceptView, SlotLabels } from "@/modules/types"

/** Props for {@link ProjectConceptBase}. */
export type ProjectConceptBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProjectConceptView>
        readonly placeholder: ProjectConceptView
        readonly slotLabels: SlotLabels
        readonly labels: ProjectConceptLabels
        /** True when the project, the milestone or the concept is not there. */
        readonly isNotFound: boolean
        readonly draft: ConceptDraftView
        /** True while the pointer or the code read runs. */
        readonly isBusy: boolean
        readonly isProbing: boolean
        /** The words of the last refusal of a command; empty for none. */
        readonly issueWords: string
    }
    readonly on: {
        readonly retry: () => void
        readonly write: (key: keyof ConceptDraftView, value: string) => void
        readonly savePointer: () => void
        readonly explain: () => void
        readonly runProbes: () => void
    }
}

/** What a section of the body needs: the page props, the concept and whether it is the skeleton. */
export type BodyProps = ProjectConceptBaseProps & { readonly view: ProjectConceptView; readonly isLoading: boolean }
