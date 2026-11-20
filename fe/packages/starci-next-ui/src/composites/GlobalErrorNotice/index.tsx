import { GrammarRoot } from "@starci/grammar/common"
import { ErrorNotice } from "../ErrorNotice"

/** The document language, the words of the failure, its way home and its retry. */
type GlobalErrorNoticeProps = {
    readonly lang: string
    /** The catalog's words of the failure: the title, the description, the way home and the retry. */
    readonly words: {
        readonly title: string
        readonly description: string
        readonly home: string
        readonly retry: string
    }
    /** Re-render the whole app. */
    readonly onRetry: () => void
    /** Where the statics are served from (`statics/` at the repository root, mirrored to object storage). */
    readonly staticsBaseUrl: string
}

/** The last-resort failure: the shared error notice inside the whole document, drawn here because this boundary replaces the layout that would have drawn it. */
export const GlobalErrorNotice = (props: GlobalErrorNoticeProps) => (
    <html lang={props.lang}>
        <body>
            <GrammarRoot>
                <ErrorNotice
                    title={props.words.title}
                    description={props.words.description}
                    homeLabel={props.words.home}
                    homeHref="/"
                    retryLabel={props.words.retry}
                    onRetry={props.onRetry}
                    staticsBaseUrl={props.staticsBaseUrl}
                />
            </GrammarRoot>
        </body>
    </html>
)
