import { Skeleton } from "@heroui/react"
import { Stack } from "@starci/grammar/common"

/** One block of a loading page: a bar for its title, then the lines its body will take; no word, mark or tone. */
export const SkeletonBlock = (props: { readonly lines: number }) => (
    <Stack gap="row">
        <Skeleton className="h-5 w-40 rounded-md" />
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
