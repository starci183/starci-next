import { Cluster, Grid, Skeleton, Stack } from "@starci/grammar/common"

/** One block of a loading harness page: a bar for its title, then the lines its body will take. */
export const HarnessSkeletonBlock = (props: { readonly lines: number }) => (
    <Stack gap="row">
        <Skeleton shape="text" lines={1} />
        <Skeleton shape="text" lines={props.lines} />
    </Stack>
)

/** A bar for the title of a list, then rows of a mark and two lines each, as the ready list lays them out. */
export const HarnessSkeletonList = (props: { readonly rows: number; readonly isMarked?: boolean }) => (
    <Stack gap="section">
        <Skeleton shape="text" lines={1} />
        {Array.from({ length: props.rows }, (_, index) => (
            <Cluster key={index} gap="inline" align="center">
                {props.isMarked === true ? <Skeleton shape="circle" size="md" /> : null}
                <Skeleton shape="text" lines={2} />
            </Cluster>
        ))}
    </Stack>
)

/** A ribbon of figures: a bar for each term and one for its value. */
export const HarnessSkeletonFigures = (props: { readonly count: 2 | 3 | 4 }) => (
    <Grid kind="cards" columns={props.count} gap="inline" size="tile">
        {Array.from({ length: props.count }, (_, index) => (
            <Skeleton key={index} shape="text" lines={2} />
        ))}
    </Grid>
)
