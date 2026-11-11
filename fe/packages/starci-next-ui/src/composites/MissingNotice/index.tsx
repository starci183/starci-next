import type { ReactNode } from "react"
import { EmptyNotice, Link, Stack } from "@starci/grammar/common"

/** Props for {@link MissingNotice}: the words of a thing the back end said is not there, and the way back. */
export type MissingNoticeProps = {
    readonly message: string
    readonly description: string
    readonly backLabel: string
    readonly backHref: string
    /** Drawn between the notice and the way back, e.g. the way to the plans. */
    readonly action?: ReactNode
}

/** The notice drawn in place of a region whose thing is missing or closed to the viewer, with the way back. */
export const MissingNotice = (props: MissingNoticeProps) => (
    <Stack gap="row">
        <EmptyNotice message={props.message} description={props.description} />
        {props.action}
        <Link variant="plain" href={props.backHref}>{props.backLabel}</Link>
    </Stack>
)
