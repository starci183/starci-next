import {
    Alert,
    Button,
    Divider,
    FencedCodeBlock,
    Input,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    Section,
    Stack,
    Text,
    type ListRowData,
} from "@starci/grammar/common"
import { SlotView, StepRows } from "@starci-next/ui"
import type { DataSlot, DevicesPairStep, SlotLabels } from "@/modules/types"

/** One access token of the learner as the list shows it. */
export type ConnectAiToken = {
    readonly id: string
    readonly name: string
    readonly detail: string
    readonly isRevoking: boolean
}

/** One assistant with its setup steps. */
export type ConnectAiGuide = {
    readonly id: string
    readonly title: string
    readonly steps: ReadonlyArray<DevicesPairStep>
}

/** The fixed words of the screen. */
export type ConnectAiLabels = {
    readonly pageHeading: string
    readonly pageSub: string
    readonly endpointTitle: string
    readonly endpointHint: string
    readonly tokensTitle: string
    readonly tokensEmpty: string
    readonly tokensLimit: string
    readonly nameLabel: string
    readonly namePlaceholder: string
    readonly create: string
    readonly creating: string
    readonly createNeedsName: string
    readonly revoke: string
    readonly createdTitle: string
    readonly createdHint: string
    readonly dismiss: string
    readonly canTitle: string
    readonly canText: string
    readonly cannotTitle: string
    readonly cannotText: string
    readonly oauthNote: string
    readonly guidesTitle: string
}

/** Props for {@link ConnectAiBase}. */
export type ConnectAiBaseProps = {
    readonly props: {
        readonly labels: ConnectAiLabels
        readonly slotLabels: SlotLabels
        readonly endpoint: string
        readonly guides: ReadonlyArray<ConnectAiGuide>
        readonly tokens: DataSlot<ReadonlyArray<ConnectAiToken>>
        readonly placeholder: ReadonlyArray<ConnectAiToken>
        readonly name: string
        readonly isCreating: boolean
        /** The secret of the token just created, or undefined. */
        readonly createdSecret: string | undefined
        /** The words of a refused step; empty for none. */
        readonly notice: string
    }
    readonly on: {
        readonly changeName: (value: string) => void
        readonly create: () => void
        readonly revoke: (id: string) => void
        readonly dismissCreated: () => void
        readonly retry: () => void
    }
}

/** The fake token list with the geometry of a settled one. */
export const CONNECT_AI_PLACEHOLDER: ReadonlyArray<ConnectAiToken> = [1, 2].map((index) => ({
    id: `placeholder-${index}`,
    name: "xxxxxxxxxx",
    detail: "xxxxxxxx",
    isRevoking: false,
}))

const tokenRowOf = (token: ConnectAiToken, props: ConnectAiBaseProps): ListRowData => ({
    id: token.id,
    title: token.name,
    description: token.detail,
    action: { label: props.props.labels.revoke, press: () => props.on.revoke(token.id), isPending: token.isRevoking },
})

/** The tokens as one list card; the empty state lives inside it. */
const TokensCard = (props: ConnectAiBaseProps) => {
    const view = props.props
    return (
        <SlotView
            slot={view.tokens}
            placeholder={view.placeholder}
            labels={view.slotLabels}
            onRetry={props.on.retry}
            render={(tokens, isLoading) =>
                tokens.length === 0 ? (
                    <Section title={view.labels.tokensTitle} headingLevel={2} count={0} isLoading={isLoading}>
                        <Text size="sm" tone="muted">
                            {view.labels.tokensEmpty}
                        </Text>
                    </Section>
                ) : (
                    <Section
                        kind="list"
                        title={view.labels.tokensTitle}
                        headingLevel={2}
                        count={tokens.length}
                        isLoading={isLoading}
                        items={tokens.map((token) => tokenRowOf(token, props))}
                        empty={null}
                        caption={view.labels.tokensLimit}
                    />
                )
            }
        />
    )
}

/** The endpoint, the name field, the create command, the secret shown once and the notice of a refused step. */
const CreateCard = (props: ConnectAiBaseProps) => {
    const view = props.props
    return (
        <Section title={view.labels.endpointTitle} headingLevel={2}>
            <Stack gap="row">
                <Text size="sm" tone="muted">
                    {view.labels.endpointHint}
                </Text>
                <FencedCodeBlock code={view.endpoint} language="text" />
                <Input
                    id="mcp-token-name"
                    name="name"
                    label={view.labels.nameLabel}
                    placeholder={view.labels.namePlaceholder}
                    value={view.name}
                    onValueChange={props.on.changeName}
                />
                <Button
                    intent="commit"
                    startGlyph="plus"
                    onPress={props.on.create}
                    isDisabled={view.name.trim() === ""}
                    disabledReason={view.labels.createNeedsName}
                    isPending={view.isCreating}
                >
                    {view.isCreating ? view.labels.creating : view.labels.create}
                </Button>
                {view.notice === "" ? null : <Alert tone="negative" title={view.notice} />}
                {view.createdSecret === undefined ? null : (
                    <Stack gap="row">
                        <Alert tone="informative" title={view.labels.createdTitle} />
                        <FencedCodeBlock code={view.createdSecret} language="text" />
                        <Text size="sm" tone="muted">
                            {view.labels.createdHint}
                        </Text>
                        <Button intent="neutral" onPress={props.on.dismissCreated}>
                            {view.labels.dismiss}
                        </Button>
                    </Stack>
                )}
            </Stack>
        </Section>
    )
}

/** One assistant: its title and numbered steps. */
const Guide = (props: { readonly guide: ConnectAiGuide }) => (
    <Stack gap="row">
        <Text isStrong>{props.guide.title}</Text>
        <StepRows steps={props.guide.steps} />
    </Stack>
)

/** The aside: what the AI can read and do, what it never gets, and the sign-in note. */
const Aside = (props: { readonly labels: ConnectAiLabels }) => (
    <Stack gap="section">
        <Section
            title={props.labels.canTitle}
            kind="list"
            items={[
                { id: "can", title: props.labels.canTitle, description: props.labels.canText },
                { id: "cannot", title: props.labels.cannotTitle, description: props.labels.cannotText },
            ]}
            empty={null}
        />
        <Divider />
        <Text size="sm" tone="muted">
            {props.labels.oauthNote}
        </Text>
    </Stack>
)

/** The connect screen: the endpoint and the tokens, the setup steps for Claude and ChatGPT, and what the AI may and may not do. */
export const ConnectAiBase = (props: ConnectAiBaseProps) => {
    const view = props.props
    return (
        <Page
            chrome="panes"
            header={{ breadcrumbs: "root", title: view.labels.pageHeading, meta: view.labels.pageSub }}
        >
            <PaneGrid
                label={view.labels.tokensTitle}
                areas={{ base: ["aside", "main"], wide: ["main aside"] }}
                columns={{ base: ["fill"], wide: ["fill", "standard"] }}
            >
                <Pane area="main" scroll label={view.labels.tokensTitle}>
                    <PaneSection>
                        <Stack gap="section">
                            <CreateCard {...props} />
                            <TokensCard {...props} />
                            <Divider />
                            <Text isStrong>{view.labels.guidesTitle}</Text>
                            {view.guides.map((guide) => (
                                <Guide key={guide.id} guide={guide} />
                            ))}
                        </Stack>
                    </PaneSection>
                </Pane>
                <Pane area="aside" surface scroll label={view.labels.canTitle}>
                    <PaneSection>
                        <Aside labels={view.labels} />
                    </PaneSection>
                </Pane>
            </PaneGrid>
        </Page>
    )
}
