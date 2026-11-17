import { Page } from "@starci/grammar/common"
import { PracticeBrowse, type PracticeBrowseProps, type PracticeBrowseView } from "@starci-next/ui"

/** The problems of one pattern as they are drawn: every word is already resolved. */
export type PracticePatternView = PracticeBrowseView

/** The fake pattern with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PRACTICE_PATTERN_PLACEHOLDER: PracticePatternView = {
    lines: ["xxxxxxxxxxxxxx"],
    rows: [1, 2, 3, 4].map((index) => ({
        id: `placeholder-${index}`,
        title: "xxxxxxxxxx",
        description: "xxxxxxxx",
        badge: "xxxxxx",
        badgeTone: "muted",
        href: "/",
        cta: "xxxx",
        isCurrent: false,
    })),
}

/** The fixed words of the pattern header. */
export type PracticePatternLabels = {
    /** The title of the pattern; the page title until the first read names it. */
    readonly title: string
    readonly breadcrumbs: string
    readonly catalog: string
}

/** Props for {@link PracticePatternBase}. */
export type PracticePatternBaseProps = {
    readonly props: {
        readonly labels: PracticePatternLabels
        readonly catalogHref: string
        /** The card and the list, with the status of the read. */
        readonly browse: Omit<PracticeBrowseProps, "onRetry">
    }
    readonly on: { readonly retry: () => void }
}

/** Draws one pattern: its progress and its problems in the order of the teacher, each with where the learner stands. */
export const PracticePatternBase = (props: PracticePatternBaseProps) => (
    <Page
        header={{
            title: props.props.labels.title,
            titleScale: "standard",
            breadcrumbs: {
                label: props.props.labels.breadcrumbs,
                items: [
                    { id: "practice", label: props.props.labels.catalog, href: props.props.catalogHref },
                    { id: "pattern", label: props.props.labels.title },
                ],
            },
        }}
    >
        <PracticeBrowse {...props.props.browse} onRetry={props.on.retry} />
    </Page>
)
