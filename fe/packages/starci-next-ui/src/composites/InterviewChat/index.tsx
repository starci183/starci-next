import { Badge, MessageBubble, Stack } from "@starci/grammar/common"

/** One bubble of the conversation, already in words. */
export type InterviewBubble = {
    readonly id: string
    readonly isMine: boolean
    readonly author: string
    readonly text: string
    /** A neutral marker beside the author (a follow-up, a hint); empty draws none. */
    readonly badge: string
}

/** The conversation of an interview. */
type InterviewChatProps = { readonly bubbles: ReadonlyArray<InterviewBubble> }

/** The chat of the interview room: each turn of the interviewer and of the learner, in order, with a neutral marker on a follow-up. */
export const InterviewChat = (props: InterviewChatProps) => (
    <Stack gap="row">
        {props.bubbles.map((bubble) => (
            <MessageBubble
                key={bubble.id}
                side={bubble.isMine ? "outgoing" : "incoming"}
                author={bubble.author}
                body={bubble.text}
                {...(bubble.badge === "" ? {} : { status: <Badge tone="muted">{bubble.badge}</Badge> })}
            />
        ))}
    </Stack>
)
