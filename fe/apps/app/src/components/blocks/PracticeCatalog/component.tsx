import { Page } from "@starci/grammar/common"
import { PracticeBrowse, type PracticeBrowseProps, type PracticeBrowseView } from "@starci-next/ui"

/** The catalog of Practice code as it is drawn: every word is already resolved. */
export type PracticeCatalogView = PracticeBrowseView

/** The fake catalog with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PRACTICE_CATALOG_PLACEHOLDER: PracticeCatalogView = {
    lines: ["xxxxxxxxxxxxxx", "xxxxxxxxxxxxxx"],
    rows: [1, 2, 3, 4, 5].map((index) => ({
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

/** Props for {@link PracticeCatalogBase}. */
export type PracticeCatalogBaseProps = {
    readonly props: {
        /** The page title. */
        readonly title: string
        /** The card and the list, with the status of the read. */
        readonly browse: Omit<PracticeBrowseProps, "onRetry">
    }
    readonly on: { readonly retry: () => void }
}

/** Draws Practice code: the intro with what the free plan opens, then the patterns with the progress of the learner in each. */
export const PracticeCatalogBase = (props: PracticeCatalogBaseProps) => (
    <Page header={{ title: props.props.title, titleScale: "standard" }}>
        <PracticeBrowse {...props.props.browse} onRetry={props.on.retry} />
    </Page>
)
