import { Skeleton } from "@heroui/react"
import { Cluster, Stack } from "@starci/grammar/common"

/** Text-line bones: a short title-height bar when `lines` is 1, otherwise a paragraph of lines with a shorter last one. */
export const SkeletonLines = (props: { readonly lines: number }) => (
    <Stack gap="row">
        {Array.from({ length: props.lines }, (_, index) => (
            <Skeleton
                key={index}
                className={
                    index === props.lines - 1 && props.lines > 1 ? "h-3 w-2/3 rounded-md" : "h-3 w-full rounded-md"
                }
            />
        ))}
    </Stack>
)

/** One block of a loading page: a bar for its title, then the lines its body will take. */
export const SkeletonBlock = (props: { readonly lines: number }) => (
    <Stack gap="row">
        <Skeleton className="h-5 w-40 rounded-md" />
        <SkeletonLines lines={props.lines} />
    </Stack>
)

/** A loading list under a title bar: each row is an optional round mark and two lines of text. */
export const SkeletonRows = (props: { readonly rows: number; readonly isMarked?: boolean }) => (
    <Stack gap="row">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Stack gap="section">
            {Array.from({ length: props.rows }, (_, index) => (
                <Cluster key={index} gap="inline" align="center">
                    {props.isMarked === true ? <Skeleton className="h-12 w-12 shrink-0 rounded-full" /> : null}
                    <div className="w-full">
                        <SkeletonLines lines={2} />
                    </div>
                </Cluster>
            ))}
        </Stack>
    </Stack>
)
