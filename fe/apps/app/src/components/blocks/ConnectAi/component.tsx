import {
    Alert,
    Button,
    CopyField,
    DescriptionList,
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
import { SkeletonBlock } from "@/components/loading/SkeletonBlock"

/** Blank text of the width the skeleton needs: non-breaking spaces carry no readable word into the page or the accessibility tree. */
const blank = (width: number): string => " ".repeat(width)

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
    readonly oauthTitle: string
    readonly oauthNote: string
    readonly guidesTitle: string
    readonly copy: string
    readonly copied: string
    readonly copyFailed: string
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
    name: blank(10),
    detail: blank(8),
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
                <CopyField
                    label={view.labels.endpointTitle}
                    isLabelHidden
                    value={view.endpoint}
                    copyLabel={view.labels.copy}
                    copiedLabel={view.labels.copied}
                    copyErrorLabel={view.labels.copyFailed}
                />
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
                    <Alert
                        tone="cautionary"
                        title={view.labels.createdTitle}
                        description={view.labels.createdHint}
                        action={{ label: view.labels.dismiss, onAction: props.on.dismissCreated }}
                        form={
                            <CopyField
                                label={view.labels.createdTitle}
                                isLabelHidden
                                value={view.createdSecret}
                                copyLabel={view.labels.copy}
                                copiedLabel={view.labels.copied}
                                copyErrorLabel={view.labels.copyFailed}
                            />
                        }
                    />
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

/** The aside: what the AI can read and do, what it never gets, and how sign-in works today; each answer in full. */
const Aside = (props: { readonly labels: ConnectAiLabels }) => (
    <DescriptionList
        layout="stacked"
        isDivided
        items={[
            { id: "can", term: props.labels.canTitle, description: props.labels.canText },
            { id: "cannot", term: props.labels.cannotTitle, description: props.labels.cannotText },
            { id: "sign-in", term: props.labels.oauthTitle, description: props.labels.oauthNote },
        ]}
    />
)

/** The connect screen: the endpoint and the tokens, the setup steps for Claude and ChatGPT, and what the AI may and may not do. */
export const ConnectAiBase = (props: ConnectAiBaseProps) => {
    const view = props.props
    // While the tokens read runs the content zone is bars only (no title, label, hint or tone).
    const isFirstLoad = "isLoading" in view.tokens
    return (
        <Page
            chrome="panes"
            header={{ breadcrumbs: "root", title: view.labels.pageHeading, meta: view.labels.pageSub }}
        >
            <PaneGrid
                label={view.labels.tokensTitle}
                areas={{ base: ["main", "aside"], wide: ["main aside"] }}
                columns={{ base: ["fill"], wide: ["fill", "standard"] }}
            >
                <Pane area="main" scroll label={view.labels.tokensTitle}>
                    <PaneSection>
                        {isFirstLoad ? (
                            <Stack gap="section">
                                <SkeletonBlock lines={5} />
                                <SkeletonBlock lines={4} />
                                <SkeletonBlock lines={6} />
                            </Stack>
                        ) : (
                            <Stack gap="section">
                                <CreateCard {...props} />
                                <TokensCard {...props} />
                                <Section title={view.labels.guidesTitle} headingLevel={2}>
                                    <Stack gap="section">
                                        {view.guides.map((guide) => (
                                            <Guide key={guide.id} guide={guide} />
                                        ))}
                                    </Stack>
                                </Section>
                            </Stack>
                        )}
                    </PaneSection>
                </Pane>
                <Pane area="aside" surface scroll label={view.labels.canTitle}>
                    <PaneSection>
                        {isFirstLoad ? <SkeletonBlock lines={9} /> : <Aside labels={view.labels} />}
                    </PaneSection>
                </Pane>
            </PaneGrid>
        </Page>
    )
}
