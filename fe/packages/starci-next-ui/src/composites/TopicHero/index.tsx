import { Button, Grid, Icon as GlyphIcon, Image, MediaFrame, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { PlayGlyph } from "../../leaves/Icon"

/** The hero card at the head of a chapter page: its 3D cover, the one-line pitch, a muted line and the one primary command. */
type TopicHeroProps = {
    readonly title: string
    /** The decorative cover (empty `alt`): its path under `public/` and its intrinsic size. */
    readonly cover: { readonly src: string; readonly width: number; readonly height: number }
    /** The one-line pitch of the chapter; empty hides it. */
    readonly pitch: string
    /** The muted line under the pitch; empty hides it. */
    readonly note: string
    /** The one primary command (start or continue the next lesson); undefined hides it. */
    readonly action: { readonly label: string; readonly href: string } | undefined
}

/** The hero of a chapter: the cover left, the pitch, the muted line and the one purple command right. */
export const TopicHero = (props: TopicHeroProps) => (
    <SurfaceCard ariaLabel={props.title}>
        <Grid
            kind="pair"
            leading={
                <MediaFrame
                    aspect="landscape"
                    fit="cover"
                    assetSlot={`topic-cover-${props.title}`}
                    media={<Image src={props.cover.src} alt="" width={props.cover.width} height={props.cover.height} loading="eager" />}
                />
            }
            trailing={
                <Stack gap="row">
                    {props.pitch === "" ? null : (
                        <Text as="p" isStrong>
                            {props.pitch}
                        </Text>
                    )}
                    {props.note === "" ? null : (
                        <Text as="p" tone="muted">
                            {props.note}
                        </Text>
                    )}
                    {props.action === undefined ? null : (
                        <Button intent="commit" startContent={<GlyphIcon source={PlayGlyph} />} href={props.action.href}>
                            {props.action.label}
                        </Button>
                    )}
                </Stack>
            }
        />
    </SurfaceCard>
)
