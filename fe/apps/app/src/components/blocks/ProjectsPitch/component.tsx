import { Button, Cluster, Grid, Heading, Page, Section, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { areaArt, ArtImage, type AreaArtName } from "@starci-next/ui"

/** One titled line of a list of the pitch: the step or the thing Premium opens. */
export type PitchLine = { readonly id: string; readonly title: string; readonly text: string }

/** The fixed words of the pitch. */
export type ProjectsPitchLabels = {
    readonly title: string
    readonly description: string
    readonly subscribe: string
    readonly subscribeHref: string
    readonly premiumNote: string
    readonly stepsTitle: string
    readonly steps: ReadonlyArray<PitchLine>
    readonly includedTitle: string
    readonly included: ReadonlyArray<PitchLine>
}

/** Props for {@link ProjectsPitchBase}. */
export type ProjectsPitchBaseProps = {
    readonly props: {
        readonly labels: ProjectsPitchLabels
        /** Where the statics are served from: the pictures of the hero and of the three steps. */
        readonly staticsBaseUrl: string
    }
}

/** The picture of each of the three steps, in order: the repo, the proof, the CV line. */
const STEP_ART: ReadonlyArray<AreaArtName> = ["projects", "milestone", "cv"]

/**
 * Draws the Projects pitch a reader without Premium sees: the hero with its one Subscribe action, the three steps from the repo to the
 * CV line as three picture cards, and the four things Premium opens. No tool is shown in a reduced form.
 */
export const ProjectsPitchBase = (props: ProjectsPitchBaseProps) => {
    const { labels, staticsBaseUrl } = props.props
    return (
        <Page>
            <Stack gap="region">
                <Grid
                    kind="main-rail"
                    primary={
                        <Stack gap="row">
                            <Heading level={1}>{labels.title}</Heading>
                            <Text tone="muted">{labels.description}</Text>
                            <Cluster gap="row" align="center" wrap>
                                <Button variant="primary" href={labels.subscribeHref}>
                                    {labels.subscribe}
                                </Button>
                                <Text tone="muted">{labels.premiumNote}</Text>
                            </Cluster>
                        </Stack>
                    }
                    rail={<ArtImage asset={areaArt("projects")} base={staticsBaseUrl} />}
                    railWidth="standard"
                    align="start"
                    collapsedOrder="primary-first"
                    railPosition="trailing"
                />
                <Section title={labels.stepsTitle} headingLevel={2}>
                    <Grid kind="cards" columns={3}>
                        {labels.steps.map((step, index) => (
                            <SurfaceCard
                                key={step.id}
                                kind="tile"
                                name={step.title}
                                description={step.text}
                                badge={{ label: String(index + 1), tone: "accent" }}
                                poster={{
                                    aspect: "landscape",
                                    fit: "contain",
                                    image: {
                                        src: `${staticsBaseUrl}/${areaArt(STEP_ART[index] ?? "projects").key}`,
                                        alt: "",
                                    },
                                }}
                            />
                        ))}
                    </Grid>
                </Section>
                <Section title={labels.includedTitle} headingLevel={2}>
                    <Grid kind="cards" columns={4}>
                        {labels.included.map((each) => (
                            <SurfaceCard key={each.id} kind="tile" name={each.title} description={each.text} />
                        ))}
                    </Grid>
                </Section>
            </Stack>
        </Page>
    )
}
