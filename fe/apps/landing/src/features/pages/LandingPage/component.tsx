import { Button, Page, Text } from "@starci/grammar/common"

/** Props for {@link LandingPageBase}. */
export type LandingPageBaseProps = {
    /** The words and the link the page shows, already resolved. */
    readonly props: {
        readonly title: string
        readonly lede: string
        readonly openApp: string
        /** The product app's origin: the landing hands the reader over to it. */
        readonly appHref: string
    }
}

/** Draw the public front door: the welcome, one sentence about the product and the way into the product app. */
export const LandingPageBase = (props: LandingPageBaseProps) => (
    <Page header={{ title: props.props.title }}>
        <Text tone="muted">{props.props.lede}</Text>
        <Button href={props.props.appHref} intent="commit">
            {props.props.openApp}
        </Button>
    </Page>
)
