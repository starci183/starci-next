import { Button, Heading, Page, Section, Stack, Text } from "@starci/grammar/common"

/** One of the areas of the product as the landing names it. */
export type LandingArea = { readonly id: string; readonly title: string; readonly description: string }

/** Props for {@link LandingPageBase}. */
export type LandingPageBaseProps = {
    /** The words and the link the page shows, already resolved. */
    readonly props: {
        readonly title: string
        readonly lede: string
        readonly openApp: string
        readonly areasTitle: string
        readonly areas: ReadonlyArray<LandingArea>
        /** The origin of the product app: the landing hands the reader over to it. */
        readonly appHref: string
    }
}

/** Draw the public front door: what the product is and for whom, the one way into the product app, and its three areas. */
export const LandingPageBase = (props: LandingPageBaseProps) => (
    <Page>
        <Stack gap="region">
            <Stack gap="row">
                <Heading level={1} scale="display">
                    {props.props.title}
                </Heading>
                <Text as="p" tone="muted">
                    {props.props.lede}
                </Text>
                <div>
                    <Button href={props.props.appHref} intent="commit">
                        {props.props.openApp}
                    </Button>
                </div>
            </Stack>
            <Section
                kind="list"
                title={props.props.areasTitle}
                headingLevel={2}
                empty={null}
                items={props.props.areas.map((area) => ({
                    id: area.id,
                    title: area.title,
                    description: area.description,
                }))}
            />
        </Stack>
    </Page>
)
