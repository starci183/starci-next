import { Cluster, Progress, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** One dimension of the report, already in words. */
export type InterviewAttribute = {
    readonly id: string
    readonly label: string
    readonly score: number
}

/** The bars of the dimensions. */
type InterviewAttributeBarsProps = {
    readonly title: string
    readonly attributes: ReadonlyArray<InterviewAttribute>
}

/** The tone of a dimension bar. */
const barToneOf = (score: number): "success" | "warning" | "danger" => {
    if (score >= 70) return "success"
    return score >= 50 ? "warning" : "danger"
}

/** The score of each dimension of an interview as a bar with its number. */
export const InterviewAttributeBars = (props: InterviewAttributeBarsProps) =>
    props.attributes.length === 0 ? null : (
        <SurfaceCard label={props.title}>
            <Stack gap="row">
                {props.attributes.map((each) => (
                    <Stack key={each.id} gap="inline">
                        <Cluster gap="inline" align="center">
                            <Text size="sm">{each.label}</Text>
                            <Text size="sm" isStrong>
                                {each.score}
                            </Text>
                        </Cluster>
                        <Progress
                            label={each.label}
                            value={each.score}
                            valueText={`${each.label}: ${each.score}`}
                            tone={barToneOf(each.score)}
                        />
                    </Stack>
                ))}
            </Stack>
        </SurfaceCard>
    )
