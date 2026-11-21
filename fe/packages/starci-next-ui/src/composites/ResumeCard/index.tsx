import { Button, Heading, Meter, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { ArtImage, type lessonArt } from "../../leaves/Art"

/** The lesson under way as the cover card draws it. */
type ResumeCardData = {
    /** For example "API reliability · lesson 3/6". */
    readonly kicker: string
    readonly title: string
    readonly doneParts: number
    /** For example "Part 3 · 2 done". */
    readonly progressLabel: string
    readonly cta: string
    readonly href: string
}

/** Props of the cover card. */
type ResumeCardProps = {
    readonly resume: ResumeCardData
    readonly art: ReturnType<typeof lessonArt>
    readonly artBase: string
    /** How many parts a lesson has. */
    readonly partCount: 2 | 3 | 4 | 5 | 6
    readonly isLoading?: boolean
}

/** The cover card of the lesson to go on with: its picture, where it stands, the parts as a segment bar and the one way in. */
export const ResumeCard = (props: ResumeCardProps) => (
    <SurfaceCard {...(props.isLoading === true ? { isLoading: true } : {})}>
        <Stack gap="row">
            <ArtImage asset={props.art} base={props.artBase} />
            <Text as="span" size="xs" tone="muted">
                {props.resume.kicker}
            </Text>
            <Heading level={3}>{props.resume.title}</Heading>
            <Meter
                label={props.resume.progressLabel}
                value={props.resume.doneParts}
                minValue={0}
                maxValue={props.partCount}
                segments={props.partCount}
                size="sm"
                tone="foreground"
            />
            <Button intent="commit" href={props.resume.href}>
                {props.resume.cta}
            </Button>
        </Stack>
    </SurfaceCard>
)
