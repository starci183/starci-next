import { Badge, Cluster, Heading, Link, Page, Stack, SurfaceCard, Text, type BadgeTone } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** One row of the profile's experience list, in words. */
export type ProfileRowView = {
    readonly itemId: string
    readonly part: string
    readonly title: string
    readonly evidence: string
    readonly state: string
    readonly stateTone: BadgeTone
}

/** The profile as it is drawn. */
export type ProfileView = { readonly gate: string; readonly rows: ReadonlyArray<ProfileRowView> }

/** The fake profile with the geometry of a settled one. */
export const PROFILE_PLACEHOLDER: ProfileView = {
    gate: "xxxxxx",
    rows: [1, 2, 3].map((index) => ({
        itemId: `placeholder-${index}`,
        part: "xxxxxx",
        title: "xxxxxxxxxxxxxx",
        evidence: "xxxxxx",
        state: "xxxxxx",
        stateTone: "neutral" as const,
    })),
}

/** The fixed words of the profile. */
export type ProfileLabels = {
    readonly title: string
    readonly description: string
    readonly listTitle: string
    readonly seeAll: string
    readonly seeAllHref: string
    readonly publicNote: string
    readonly cvLater: string
}

/** Props for {@link ProfileExperienceBase}. */
export type ProfileExperienceBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProfileView>
        readonly placeholder: ProfileView
        readonly slotLabels: SlotLabels
        readonly labels: ProfileLabels
    }
    readonly on: { readonly retry: () => void }
}

/**
 * Draws Profile (Program screen profile, its experience list as states): the verified items first, the others for the learner only,
 * and the hiring-bridge count. The public profile and the CV export show verified items only; the CV export comes later.
 */
export const ProfileExperienceBase = (props: ProfileExperienceBaseProps) => (
    <Page>
        <Stack gap="region">
            <SurfaceCard ariaLabel={props.props.labels.title}>
                <Stack gap="identity">
                    <Heading level={1} scale="title">
                        {props.props.labels.title}
                    </Heading>
                    <Text tone="muted">{props.props.labels.description}</Text>
                </Stack>
            </SurfaceCard>
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(view) => (
                    <SurfaceCard label={props.props.labels.listTitle} note={props.props.labels.cvLater}>
                        <Stack gap="row">
                            <Cluster gap="inline" justify="between" wrap>
                                <Text size="sm" tone="muted">
                                    {props.props.labels.publicNote}
                                </Text>
                                <Link href={props.props.labels.seeAllHref}>{props.props.labels.seeAll}</Link>
                            </Cluster>
                            <Text isStrong>{view.gate}</Text>
                            {view.rows.map((row) => (
                                <Cluster key={row.itemId} gap="inline" wrap align="center" justify="between">
                                    <Cluster gap="inline" align="center">
                                        <Badge tone="neutral">{row.part}</Badge>
                                        <Text>{row.title}</Text>
                                    </Cluster>
                                    <Cluster gap="inline" align="center">
                                        <Text size="sm" tone="muted">
                                            {row.evidence}
                                        </Text>
                                        <Badge tone={row.stateTone} isDot>
                                            {row.state}
                                        </Badge>
                                    </Cluster>
                                </Cluster>
                            ))}
                        </Stack>
                    </SurfaceCard>
                )}
            />
        </Stack>
    </Page>
)
