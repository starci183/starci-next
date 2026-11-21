import { Skeleton, Stack } from "@starci/grammar/common"

/** One block of a loading page: a bar for its title, then the lines its body will take; no word, mark or tone. */
export const SkeletonBlock = (props: { readonly lines: number }) => (
    <Stack gap="row">
        <Skeleton shape="text" lines={1} />
        <Skeleton shape="text" lines={props.lines} />
    </Stack>
)
