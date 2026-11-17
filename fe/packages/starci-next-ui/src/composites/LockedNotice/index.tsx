import { Button, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** The words of the locked state of a phase and its way out. */
type LockedNoticeProps = {
    readonly title: string
    readonly description: string
    readonly plansLabel: string
    /** The destination of the plans page. */
    readonly plansHref: string
}

/** A phase the reader's plan does not include: what Premium unlocks and the one link to the plans. */
export const LockedNotice = (props: LockedNoticeProps) => (
    <SurfaceCard treatment="soft" label={props.title}>
        <Stack gap="row">
            <Text as="p">{props.description}</Text>
            <Button intent="commit" href={props.plansHref}>
                {props.plansLabel}
            </Button>
        </Stack>
    </SurfaceCard>
)
