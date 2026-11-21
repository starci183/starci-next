import { Meter } from "@starci/grammar/common"

/** The length rule of a new password and how much of it the reader has typed. */
type AuthPasswordLengthProps = {
    /** The rule in words, e.g. "8-72 characters"; the meter's name. */
    readonly label: string
    readonly count: number
    readonly min: number
    readonly max: number
    /** The reading beside the bar, e.g. "10/72". */
    readonly reading: string
}

/** The length gauge under a new-password field: neutral while empty, negative outside the bounds, affirmative inside them. */
export const AuthPasswordLength = (props: AuthPasswordLengthProps) => (
    <Meter
        label={props.label}
        value={Math.min(props.count, props.max)}
        minValue={0}
        maxValue={props.max}
        valueLabel={props.reading}
        tone={
            props.count === 0
                ? "neutral"
                : props.count < props.min || props.count > props.max
                  ? "negative"
                  : "affirmative"
        }
    />
)
