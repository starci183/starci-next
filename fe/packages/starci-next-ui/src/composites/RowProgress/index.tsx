import { Progress, type ProgressTone } from "@starci/grammar/common"

/** What a row's progress control needs. */
type RowProgressProps = {
    /** What the bar measures, for assistive technology. */
    readonly label: string
    /** Completion from 0 to 100. */
    readonly value: number
    readonly tone?: ProgressTone
}

/** The width a row gives its progress control: a row control has no width of its own, and a full-width bar would collapse to nothing. */
const ROW_PROGRESS_WIDTH = "7rem"

/** Grammar's `Progress` as the control at the end of a list row (`ListRowData.control`), at a fixed small width. */
export const RowProgress = (props: RowProgressProps) => (
    <span style={{ display: "block", width: ROW_PROGRESS_WIDTH }}>
        <Progress label={props.label} value={props.value} {...(props.tone === undefined ? {} : { tone: props.tone })} />
    </span>
)
