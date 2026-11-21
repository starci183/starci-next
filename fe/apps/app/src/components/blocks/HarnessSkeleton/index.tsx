import { Skeleton } from "@heroui/react"
import { Cluster, Grid, Stack } from "@starci/grammar/common"

const Lines = (props: { readonly lines: number }) => (
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

/** One block of a loading harness page: a bar for its title, then the lines its body will take. */
export const HarnessSkeletonBlock = (props: { readonly lines: number }) => (
    <Stack gap="row">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Lines lines={props.lines} />
    </Stack>
)

/** A bar for the title of a list, then rows of a mark and two lines each, as the ready list lays them out. */
export const HarnessSkeletonList = (props: { readonly rows: number; readonly isMarked?: boolean }) => (
    <Stack gap="section">
        <Skeleton className="h-5 w-40 rounded-md" />
        {Array.from({ length: props.rows }, (_, index) => (
            <Cluster key={index} gap="inline" align="center">
                {props.isMarked === true ? <Skeleton className="h-12 w-12 shrink-0 rounded-full" /> : null}
                <div className="w-full">
                    <Lines lines={2} />
                </div>
            </Cluster>
        ))}
    </Stack>
)

/** A ribbon of figures: a bar for each term and one for its value. */
export const HarnessSkeletonFigures = (props: { readonly count: 2 | 3 | 4 }) => (
    <Grid kind="cards" columns={props.count} gap="inline" size="tile">
        {Array.from({ length: props.count }, (_, index) => (
            <Stack key={index} gap="row">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
            </Stack>
        ))}
    </Grid>
)
