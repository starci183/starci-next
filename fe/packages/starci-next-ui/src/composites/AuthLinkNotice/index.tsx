import { Button, Cluster, IconTile, Stack, Text } from "@starci/grammar/common"
import { ArrowPathIcon, ClockIcon, EnvelopeIcon } from "@heroicons/react/24/outline"
import type { ReactNode } from "react"
import { AuthCardHeading } from "../AuthCardHeading"

/** The three facts of a link that no longer works. */
type AuthLinkFacts = { readonly once: string; readonly expires: string; readonly again: string }

/** Props for {@link AuthLinkNotice}. */
type AuthLinkNoticeProps = {
    readonly art: ReactNode
    readonly title: string
    readonly text: string
    /** The three facts as icon tiles; omitted when the card only reports an outcome. */
    readonly facts: AuthLinkFacts | undefined
    readonly actionLabel: string
    readonly actionHref: string
}

/** The glyph and key of each fact, in reading order. */
const FACT_GLYPHS = [
    { id: "once", source: ArrowPathIcon },
    { id: "expires", source: ClockIcon },
    { id: "again", source: EnvelopeIcon },
] as const

/** The card of a link that was used, has expired or is incomplete: the picture, the verdict, three icon facts and the way back. */
export const AuthLinkNotice = (props: AuthLinkNoticeProps) => (
    <Stack gap="section">
        {props.art}
        <AuthCardHeading title={props.title} subtitle={props.text} level={1} />
        {props.facts === undefined ? null : (
            <Cluster gap="row" justify="center">
                {FACT_GLYPHS.map((fact) => (
                    <Stack key={fact.id} gap="identity">
                        <IconTile source={fact.source} tone="neutral" />
                        <Text size="sm" tone="muted">
                            {props.facts?.[fact.id]}
                        </Text>
                    </Stack>
                ))}
            </Cluster>
        )}
        <Button intent="commit" width="fill" href={props.actionHref}>
            {props.actionLabel}
        </Button>
    </Stack>
)
