import { Section, Stack, Text } from "@starci/grammar/common"
import type { SourceLabels, SourcePartView } from "./types"

/** What the right column needs. */
type EssentialSourceAsideProps = { readonly source: SourcePartView; readonly labels: SourceLabels }

/**
 * The right column of the source part: the files the archive holds, what it leaves out (the sample answers and the hidden tests
 * stay on the server) and what the machine needs.
 */
export const EssentialSourceAside = (props: EssentialSourceAsideProps) => (
    <Stack gap="section">
        {props.source.files.length === 0 ? null : (
            <Section title={props.labels.aside.inSource} headingLevel={2}>
                <Stack gap="identity">
                    {props.source.files.map((file) => (
                        <Text key={file.id} mono size="sm" tone="muted">
                            {file.path}
                        </Text>
                    ))}
                </Stack>
            </Section>
        )}
        <Section title={props.labels.aside.notIncludedTitle} headingLevel={2}>
            <Text tone="muted" size="sm">
                {props.labels.aside.notIncluded}
            </Text>
        </Section>
        <Section title={props.labels.aside.needsTitle} headingLevel={2}>
            <Text tone="muted" size="sm">
                {props.labels.aside.needs}
            </Text>
        </Section>
    </Stack>
)
