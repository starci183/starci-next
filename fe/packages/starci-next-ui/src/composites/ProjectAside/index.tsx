import { FencedCodeBlock, Section, Stack, Text } from "@starci/grammar/common"
import type { CardProps } from "./types"

/** What the aside needs: the project and the words. */
type ProjectAsideProps = CardProps

/** The starci/ layout section: the tree, where tests live and how practice differs from proof. */
const LayoutSection = (props: CardProps) => (
    <Section title={props.labels.layoutTitle} headingLevel={2} isLoading={props.isLoading}>
        <Stack gap="inline">
            <FencedCodeBlock label={props.labels.layoutTitle} code={props.labels.layoutTree} />
            <Text>{props.labels.layoutTests}</Text>
            <Text tone="muted">{props.labels.layoutTestsText}</Text>
            <Text tone="muted">{props.labels.layoutFlow}</Text>
        </Stack>
    </Section>
)

/** The aside: the starci/ layout. The repository, CI, machine and secret moved to the status tiles. */
export const ProjectAside = (props: ProjectAsideProps) => <LayoutSection {...props} />
