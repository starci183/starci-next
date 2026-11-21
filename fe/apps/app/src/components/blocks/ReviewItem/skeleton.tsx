import { Skeleton, Stack } from "@starci/grammar/common"

/** A heading bar over the given number of lines: one titled part of the panel while it loads. */
const SkeletonBlock = (props: { readonly lines: number }) => (
    <Stack gap="row">
        <Skeleton shape="text" lines={1} />
        <Skeleton shape="text" lines={props.lines} />
    </Stack>
)

/**
 * The review panel while its first read loads: no heading, label, button word or tone, only the geometry of the ready panel as
 * Skeleton bars (the item card with its line in both locales, the evidence, the AI grade, the note with its commands, the history).
 */
export const ReviewPanelSkeleton = () => (
    <Stack gap="region">
        <Stack gap="row">
            <Skeleton shape="text" lines={1} />
            <Skeleton shape="text" lines={2} />
            <Skeleton shape="text" lines={2} />
            <Skeleton shape="text" lines={1} />
        </Stack>
        <SkeletonBlock lines={1} />
        <SkeletonBlock lines={1} />
        <SkeletonBlock lines={4} />
        <SkeletonBlock lines={2} />
    </Stack>
)
