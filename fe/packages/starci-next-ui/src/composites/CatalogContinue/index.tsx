import { Button, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** The lesson a Premium learner left half way, worded by its block. */
type CatalogContinueProps = {
    readonly title: string
    readonly lessonTitle: string
    /** The phase the learner reached, already in words. */
    readonly phaseLine: string
    readonly action: string
    readonly href: string
}

/** The "continue" card of the catalog: the lesson in progress, the phase reached and the one way back into it. */
export const CatalogContinue = (props: CatalogContinueProps) => (
    <SurfaceCard label={props.title}>
        <Stack gap="row">
            <Text as="p" isStrong>
                {props.lessonTitle}
            </Text>
            <Text size="sm" tone="muted">
                {props.phaseLine}
            </Text>
            <Button intent="commit" href={props.href}>
                {props.action}
            </Button>
        </Stack>
    </SurfaceCard>
)
