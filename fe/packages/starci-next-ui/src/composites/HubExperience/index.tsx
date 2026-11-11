import { Badge, Cluster, Link, Section, Stack, Text } from "@starci/grammar/common"

/** The experience of the learner at a glance, every word resolved. */
export type HubExperienceView = {
    readonly title: string
    readonly verifiedLabel: string
    readonly verified: number
    readonly pendingLabel: string
    readonly pending: number
    readonly moreLabel: string
    readonly moreHref: string
}

/** What one count row is given. */
type CountRowProps = { readonly label: string; readonly count: number }

/** One row of the section: a name and its grey count chip. */
const CountRow = (props: CountRowProps) => (
    <Cluster gap="row" justify="between" align="center">
        <Text>{props.label}</Text>
        <Badge tone="neutral">{String(props.count)}</Badge>
    </Cluster>
)

/** What the experience section is given. */
type HubExperienceProps = { readonly view: HubExperienceView; readonly isLoading?: boolean }

/** The experience section of the aside: verified and awaiting the teacher, with the way to the full list. */
export const HubExperience = (props: HubExperienceProps) => (
    <Section
        title={props.view.title}
        headingLevel={2}
        action={
            <Link href={props.view.moreHref} variant="head">
                {props.view.moreLabel}
            </Link>
        }
        {...(props.isLoading === true ? { isLoading: true } : {})}
    >
        <Stack gap="inline">
            <CountRow label={props.view.verifiedLabel} count={props.view.verified} />
            <CountRow label={props.view.pendingLabel} count={props.view.pending} />
        </Stack>
    </Section>
)
