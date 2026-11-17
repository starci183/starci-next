import { Input, Textarea } from "@starci/grammar/common"
import type { ConceptDraftView } from "../ConceptDrawer/types"

/** What one text field of a concept form needs; a `rows` makes it a text area of that height. */
type DraftFieldProps = {
    readonly conceptId: string
    readonly field: keyof ConceptDraftView
    readonly label: string
    readonly value: string
    readonly isDisabled: boolean
    readonly rows?: number | undefined
    readonly onWrite: (value: string) => void
}

/** One text field of a concept form: a line, or a text area when it has rows. */
export const DraftField = (props: DraftFieldProps) =>
    props.rows === undefined ? (
        <Input
            id={`concept-${props.conceptId}-${props.field}`}
            name={props.field}
            label={props.label}
            kind="text"
            value={props.value}
            isDisabled={props.isDisabled}
            onValueChange={props.onWrite}
        />
    ) : (
        <Textarea
            id={`concept-${props.conceptId}-${props.field}`}
            name={props.field}
            label={props.label}
            rows={props.rows}
            value={props.value}
            isDisabled={props.isDisabled}
            onValueChange={props.onWrite}
        />
    )
