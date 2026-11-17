import type { ReactNode } from "react"
import { Button, Cluster, Icon, Mascot, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { ART } from "../../leaves/Art"
import { PlayGlyph } from "../../leaves/Icon"

/** The active path of the learner, already in words. */
export type HubPathView = {
    readonly title: string
    /** The next steps of the path, each one a short phrase. */
    readonly next: ReadonlyArray<string>
}

/** The fixed words of the path card. */
export type HubPathLabels = {
    readonly eyebrow: string
    readonly nextLabel: string
    readonly continue: string
    readonly change: string
    readonly emptyTitle: string
    readonly emptyBody: string
    readonly choose: string
}

/** The path card: the active path with the way to continue it, or the invitation to choose a goal when there is none. */
type HubPathCardProps = {
    /** The active path, or undefined when the learner follows none. */
    readonly view: HubPathView | undefined
    readonly labels: HubPathLabels
    /** Where the picker of goals lives. */
    readonly chooseHref: string
    /** Where the learner continues the active path. */
    readonly continueHref: string
    readonly isLoading?: boolean
}

/** What the copy beside the artwork says: a title, one muted line and the commands. */
type PathCopy = {
    readonly title: string
    readonly line: string
    readonly commands: ReactNode
}

/** The first-run artwork at the card's start and the copy beside it. */
const PathBody = (props: PathCopy) => (
    <Cluster gap="section" align="center">
        <Mascot src={ART.journey.src} size="md" loading="eager" assetSlot="hub-path-journey" />
        <Stack gap="row">
            <Stack gap="identity">
                <Text isStrong>{props.title}</Text>
                {props.line === "" ? null : <Text tone="muted">{props.line}</Text>}
            </Stack>
            <Cluster gap="inline">{props.commands}</Cluster>
        </Stack>
    </Cluster>
)

/** The active-path card, or the invitation to choose a goal: ONE card, the artwork at its start. */
export const HubPathCard = (props: HubPathCardProps) => {
    const { view } = props
    const loading = props.isLoading === true ? { isLoading: true as const } : {}
    if (view === undefined) {
        return (
            <SurfaceCard label={props.labels.eyebrow} {...loading}>
                <PathBody
                    title={props.labels.emptyTitle}
                    line={props.labels.emptyBody}
                    commands={
                        <Button intent="commit" startContent={<Icon source={PlayGlyph} />} href={props.chooseHref}>
                            {props.labels.choose}
                        </Button>
                    }
                />
            </SurfaceCard>
        )
    }
    return (
        <SurfaceCard label={props.labels.eyebrow} {...loading}>
            <PathBody
                title={view.title}
                line={view.next.length === 0 ? "" : `${props.labels.nextLabel}: ${view.next.join(" / ")}`}
                commands={
                    <>
                        <Button intent="commit" startContent={<Icon source={PlayGlyph} />} href={props.continueHref}>
                            {props.labels.continue}
                        </Button>
                        <Button intent="neutral" href={props.chooseHref}>
                            {props.labels.change}
                        </Button>
                    </>
                }
            />
        </SurfaceCard>
    )
}
