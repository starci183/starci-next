import { Badge, Button, Divider, Section, Stack, Text } from "@starci/grammar/common"
import type { ProjectsAsideLabels } from "./types"

/** What the aside pane is given. */
type ProjectsAsideProps = { readonly labels: ProjectsAsideLabels }

/** The aside pane: the learner's machine, then the two levels of proof, as sections with a divider between. */
export const ProjectsAside = (props: ProjectsAsideProps) => {
    const { device, levels } = props.labels
    return (
        <Stack gap="region">
            <Section title={device.title} headingLevel={2}>
                <Stack gap="inline">
                    <Badge isDot tone="neutral">
                        {device.status}
                    </Badge>
                    <Text size="xs" tone="muted">
                        {device.text}
                    </Text>
                    <div>
                        <Button intent="neutral" size="sm" href={device.connectHref}>
                            {device.connect}
                        </Button>
                    </div>
                </Stack>
            </Section>
            <Divider />
            <Section
                kind="list"
                title={levels.title}
                headingLevel={2}
                empty={null}
                items={[
                    {
                        id: "practice",
                        title: levels.practice,
                        description: levels.practiceNote,
                    },
                    {
                        id: "proof",
                        title: levels.proof,
                        description: levels.proofNote,
                    },
                ]}
            />
        </Stack>
    )
}
