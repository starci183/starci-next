import { Skeleton } from "@heroui/react"
import { Stack } from "@starci/grammar/common"

/** A heading bar over the given number of lines: one titled part of the panel while it loads. */
const SkeletonBlock = (props: { readonly lines: number }) => (
    <Stack gap="row">
        <Skeleton className="h-5 w-40 rounded-md" />
        {Array.from({ length: props.lines }, (_, index) => (
            <Skeleton key={index} className="h-4 w-2/3 rounded-md" />
        ))}
    </Stack>
)

/**
 * The review panel while its first read loads: no heading, label, button word or tone, only the geometry of the ready panel as
 * Skeleton bars (the item card with its line in both locales, the evidence, the AI grade, the note with its commands, the history).
 */
export const ReviewPanelSkeleton = () => (
    <Stack gap="region">
        <Stack gap="row">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-md" />
        </Stack>
        <SkeletonBlock lines={1} />
        <SkeletonBlock lines={1} />
        <SkeletonBlock lines={4} />
        <Skeleton className="h-10 w-28 rounded-full" />
        <SkeletonBlock lines={2} />
    </Stack>
)
