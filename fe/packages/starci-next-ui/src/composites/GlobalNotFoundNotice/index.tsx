import { EmptyNotice, GrammarRoot, StaticsProvider } from "@starci/grammar/common"

/** The document language, the words of the missing address and its way home. */
type GlobalNotFoundNoticeProps = {
    readonly lang: string
    /** The catalog's words of the missing address: the title, the description and the way home. */
    readonly words: {
        readonly title: string
        readonly description: string
        readonly home: string
    }
    /** The app's front door. */
    readonly homeHref: string
    /** Where the statics are served from (`statics/` at the repository root, mirrored to object storage). */
    readonly staticsBaseUrl: string
}

/** An address no locale segment caught: the whole document, drawn here because the root has no layout that would have drawn it. */
export const GlobalNotFoundNotice = (props: GlobalNotFoundNoticeProps) => (
    <html lang={props.lang}>
        <body>
            <GrammarRoot>
                <StaticsProvider baseUrl={props.staticsBaseUrl}>
                    <EmptyNotice
                        scope="page"
                        message={props.words.title}
                        description={props.words.description}
                        media={{ illustration: { staticsKey: "illustrations/errors/not-found.png" } }}
                        actionLabel={props.words.home}
                        actionHref={props.homeHref}
                    />
                </StaticsProvider>
            </GrammarRoot>
        </body>
    </html>
)
