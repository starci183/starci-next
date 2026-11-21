import { Cluster, Skeleton, Stack } from "@starci/grammar/common"

/** One block of a loading page: a bar for its title, then the lines its body will take. */
export const SkeletonBlock = (props: { readonly lines: number }) => (
    <Stack gap="row">
        <Skeleton shape="text" lines={1} />
        <Skeleton shape="text" lines={props.lines} />
    </Stack>
)

/** A loading list under a title bar: each row is an optional round mark and two lines of text. */
export const SkeletonRows = (props: { readonly rows: number; readonly isMarked?: boolean }) => (
    <Stack gap="row">
        <Skeleton shape="text" lines={1} />
        <Stack gap="section">
            {Array.from({ length: props.rows }, (_, index) => (
                <Cluster key={index} gap="inline" align="center">
                    {props.isMarked === true ? <Skeleton shape="circle" size="md" /> : null}
                    <Skeleton shape="text" lines={2} />
                </Cluster>
            ))}
        </Stack>
    </Stack>
)
