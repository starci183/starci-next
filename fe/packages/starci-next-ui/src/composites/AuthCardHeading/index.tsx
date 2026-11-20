import { Heading, Stack, Text } from "@starci/grammar/common"
import type { ReactNode } from "react"

/** The title and the support line of a sign-in card. */
type AuthCardHeadingProps = {
    readonly title: string
    /** The support line; a node when part of it is set strong (the address the link went to). */
    readonly subtitle: ReactNode
    /** The heading level: 1 on a page of its own, 2 inside the sign-in dialog. */
    readonly level: 1 | 2
}

/** The head of every card of the entry pages: the title above its muted support line, held close together. */
export const AuthCardHeading = (props: AuthCardHeadingProps) => (
    <Stack gap="identity">
        <Heading level={props.level} scale="standard">
            {props.title}
        </Heading>
        <Text tone="muted">{props.subtitle}</Text>
    </Stack>
)
