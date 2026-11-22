import { Button, Section, Stack, Text } from "@starci/grammar/common"

/** The words of the locked state of a phase and its way out. */
type LockedNoticeProps = {
    readonly title: string
    readonly description: string
    readonly plansLabel: string
    /** The destination of the plans page. */
    readonly plansHref: string
    /** False when another command of the screen is the one primary button: the way to the plans is then a neutral button. */
    readonly isPrimary?: boolean
    /** The first read has no data yet: the words draw as skeleton geometry. */
    readonly isLoading?: boolean
}

/** A phase the reader's plan does not include: what Premium unlocks and the one link to the plans. */
export const LockedNotice = (props: LockedNoticeProps) => (
    <Section title={props.title} headingLevel={2} isLoading={props.isLoading === true}>
        <Stack gap="row">
            <Text as="p" isLoading={props.isLoading === true}>
                {props.description}
            </Text>
            <Button
                variant={props.isPrimary === false ? "border" : "primary"}
                href={props.plansHref}
                isLoading={props.isLoading === true}
            >
                {props.plansLabel}
            </Button>
        </Stack>
    </Section>
)
