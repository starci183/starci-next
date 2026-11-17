import { Button, Cluster } from "@starci/grammar/common"

/** One way out of an interview screen. */
export type InterviewExitLink = {
    readonly label: string
    readonly href: string
}

/** The two ways out of an interview screen. */
type InterviewExitLinksProps = {
    /** The way on. */
    readonly first: InterviewExitLink
    /** The consequence of the way on: the view's one next action, or a neutral way on. */
    readonly firstIntent: "commit" | "neutral"
    /** The way back. */
    readonly second: InterviewExitLink
}

/** The links at the end of an interview screen (open the report or retake, then go back), each classified by what it does. */
export const InterviewExitLinks = (props: InterviewExitLinksProps) => (
    <Cluster gap="inline" wrap>
        <Button intent={props.firstIntent} href={props.first.href}>
            {props.first.label}
        </Button>
        <Button intent="dismiss" href={props.second.href}>
            {props.second.label}
        </Button>
    </Cluster>
)
