import {
    Avatar,
    Badge,
    Button,
    Cluster,
    FileButton,
    Input,
    Link,
    Page,
    Section,
    Stack,
    Text,
    type ListRowData,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import {
    CV_PLACEHOLDER,
    DEVICES_PLACEHOLDER,
    IDENTITY_PLACEHOLDER,
    PLAN_PLACEHOLDER,
    TOKENS_PLACEHOLDER,
    VERIFY_PLACEHOLDER,
    type DataSlot,
    type ProfileCvLine,
    type ProfileCvView,
    type ProfileDeviceView,
    type ProfileHubLabels,
    type ProfileHubViews,
    type ProfileIdentityView,
    type ProfilePlanView,
    type ProfileTokenView,
    type ProfileVerifyLink,
    type SlotLabels,
} from "@/modules/types"

/** What the identity part is drawn from. */
type IdentitySectionProps = {
    readonly props: {
        readonly labels: ProfileHubLabels
        readonly slotLabels: SlotLabels
        readonly identity: DataSlot<ProfileIdentityView>
        readonly accept: string
        readonly isSaving: boolean
        readonly isSaved: boolean
        readonly isUploading: boolean
        readonly isRemoving: boolean
    }
    readonly on: {
        readonly changeName: (value: string) => void
        readonly saveName: () => void
        readonly uploadAvatar: (file: File) => void
        readonly removeAvatar: () => void
        readonly retry: () => void
    }
}

/** What the avatar row is drawn from. */
type AvatarRowProps = {
    readonly labels: ProfileHubLabels
    readonly identity: ProfileIdentityView
    readonly accept: string
    readonly isUploading: boolean
    readonly isRemoving: boolean
    readonly onUpload: (file: File) => void
    readonly onRemove: () => void
}

/** The avatar with the commands that change it; the hint or the issue stands under the picker. */
const AvatarRow = (props: AvatarRowProps) => (
    <Cluster gap="inline" align="center" wrap>
        <Avatar
            name={props.identity.shownName}
            size="lg"
            {...(props.identity.avatarUrl === null ? {} : { src: props.identity.avatarUrl })}
        />
        <FileButton
            text={props.labels.upload}
            label={props.labels.avatarLabel}
            accept={props.accept}
            isDisabled={props.isUploading}
            description={props.labels.avatarHint}
            {...(props.labels.issue === "" ? {} : { errorMessage: props.labels.issue })}
            onFilesChange={(files) => {
                const [file] = files
                if (file !== undefined) props.onUpload(file)
            }}
        />
        {props.identity.avatarUrl === null ? null : (
            <Button intent="neutral" isPending={props.isRemoving} onPress={props.onRemove}>
                {props.labels.remove}
            </Button>
        )}
    </Cluster>
)

/** What the name row is drawn from. */
type NameRowProps = {
    readonly labels: ProfileHubLabels
    readonly identity: ProfileIdentityView
    readonly isSaving: boolean
    readonly isSaved: boolean
    readonly onChange: (value: string) => void
    readonly onSave: () => void
}

/** The name field with its save command. */
const NameRow = (props: NameRowProps) => (
    <Cluster gap="inline" align="end" wrap>
        <Input
            id="profile-display-name"
            name="displayName"
            label={props.labels.nameLabel}
            placeholder={props.labels.namePlaceholder}
            description={props.labels.nameHint}
            value={props.identity.nameValue}
            onValueChange={props.onChange}
        />
        <Button
            intent="neutral"
            isDisabled={!props.identity.canSaveName}
            isPending={props.isSaving}
            onPress={props.onSave}
        >
            {props.labels.save}
        </Button>
        {props.isSaved ? (
            <Text size="sm" tone="muted">
                {props.labels.saved}
            </Text>
        ) : null}
    </Cluster>
)

/** What the goal row is drawn from. */
type GoalRowProps = { readonly labels: ProfileHubLabels; readonly identity: ProfileIdentityView }

/** The goal path of the learner with the link that chooses or changes it. */
const GoalRow = (props: GoalRowProps) => (
    <Cluster gap="inline" align="center" justify="between" wrap>
        <Text isStrong>{`${props.labels.goalTitle}: ${props.identity.goalTitle ?? props.labels.goalNone}`}</Text>
        <Link variant="plain" href={props.labels.goalHref}>
            {props.identity.goalTitle === null ? props.labels.goalChoose : props.labels.goalChange}
        </Link>
    </Cluster>
)

/** The identity: the avatar, the name and the goal path. */
export const IdentitySection = (props: IdentitySectionProps) => {
    const { labels, accept, isSaving, isSaved, isUploading, isRemoving } = props.props
    return (
        <SlotView
            slot={props.props.identity}
            placeholder={IDENTITY_PLACEHOLDER}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(identity, isLoading) => (
                <Section title={labels.identityTitle} headingLevel={2} isLoading={isLoading}>
                    <AvatarRow
                        labels={labels}
                        identity={identity}
                        accept={accept}
                        isUploading={isUploading}
                        isRemoving={isRemoving}
                        onUpload={props.on.uploadAvatar}
                        onRemove={props.on.removeAvatar}
                    />
                    <NameRow
                        labels={labels}
                        identity={identity}
                        isSaving={isSaving}
                        isSaved={isSaved}
                        onChange={props.on.changeName}
                        onSave={props.on.saveName}
                    />
                    <GoalRow labels={labels} identity={identity} />
                </Section>
            )}
        />
    )
}

/** What one read-only part is drawn from: the words, the slot of its read and how to read it again. */
type PartProps<T> = {
    readonly labels: ProfileHubLabels
    readonly slotLabels: SlotLabels
    readonly slot: DataSlot<T>
    readonly onRetry: () => void
}

/** The head link of a section. */
const headLinkOf = (label: string, href: string) => (
    <Link variant="head" href={href}>
        {label}
    </Link>
)

/** The row of one verified CV line: the line, who signed it, the proof it rests on and the link to it. */
const cvRowOf = (line: ProfileCvLine, proof: string): ListRowData => ({
    id: line.itemId,
    title: line.line,
    description: `${line.signed} · ${line.evidence}`,
    badges: [{ label: line.part, tone: "neutral" }],
    action: { label: proof, href: line.proofHref, endArrow: true },
})

/** What the CV part is drawn from. */
type CvSectionProps = PartProps<ProfileCvView>

/** The verified CV lines, each with its proof link. */
const CvSection = (props: CvSectionProps) => (
    <SlotView
        slot={props.slot}
        placeholder={CV_PLACEHOLDER}
        labels={props.slotLabels}
        onRetry={props.onRetry}
        render={(cv, isLoading) => (
            <Section
                kind="list"
                title={props.labels.cvTitle}
                headingLevel={2}
                count={cv.lines.length}
                isLoading={isLoading}
                caption={`${cv.note}. ${props.labels.cvCaption}`}
                action={headLinkOf(props.labels.cvSeeAll, props.labels.cvSeeAllHref)}
                items={cv.lines.map((line) => cvRowOf(line, props.labels.proof))}
                empty={<Text tone="muted">{props.labels.cvEmpty}</Text>}
            />
        )}
    />
)

/** The row of one public verify link with its copy command. */
const verifyRowOf = (
    link: ProfileVerifyLink,
    labels: ProfileHubLabels,
    copy: (itemId: string, url: string) => void,
): ListRowData => ({
    id: link.itemId,
    title: link.title,
    description: link.url,
    badges: [
        {
            label: link.isPublic ? labels.verifyPublic : labels.verifyPrivate,
            tone: link.isPublic ? "success" : "muted",
            isDot: true,
        },
    ],
    action: {
        label: link.isCopied ? labels.verifyCopied : labels.verifyCopy,
        press: () => copy(link.itemId, link.url),
    },
})

/** What the verify links are drawn from: a read-only part and the copy command. */
type VerifySectionProps = PartProps<ReadonlyArray<ProfileVerifyLink>> & {
    readonly onCopy: (itemId: string, url: string) => void
}

/** The public verify links of the verified items, each copied with one press. */
const VerifySection = (props: VerifySectionProps) => (
    <SlotView
        slot={props.slot}
        placeholder={VERIFY_PLACEHOLDER}
        labels={props.slotLabels}
        forbidden="hide"
        onRetry={props.onRetry}
        render={(links, isLoading) => (
            <Section
                kind="list"
                title={props.labels.verifyTitle}
                headingLevel={2}
                count={links.length}
                isLoading={isLoading}
                caption={props.labels.verifyCaption}
                items={links.map((link) => verifyRowOf(link, props.labels, props.onCopy))}
                empty={<Text tone="muted">{props.labels.verifyEmpty}</Text>}
            />
        )}
    />
)

/** The row of one paired device. */
const deviceRowOf = (device: ProfileDeviceView, labels: ProfileHubLabels): ListRowData => ({
    id: device.id,
    title: device.name,
    description: device.detail,
    badges: [
        {
            label: device.isOnline ? labels.online : labels.offline,
            tone: device.isOnline ? "success" : "muted",
            isDot: true,
        },
    ],
})

/** What the devices part is drawn from. */
type DevicesSectionProps = PartProps<ReadonlyArray<ProfileDeviceView>>

/** The connected devices as a list with the link to manage them. */
const DevicesSection = (props: DevicesSectionProps) => (
    <SlotView
        slot={props.slot}
        placeholder={DEVICES_PLACEHOLDER}
        labels={props.slotLabels}
        forbidden="hide"
        onRetry={props.onRetry}
        render={(devices, isLoading) => (
            <Section
                kind="list"
                title={props.labels.devicesTitle}
                headingLevel={2}
                count={devices.length}
                isLoading={isLoading}
                action={headLinkOf(props.labels.devicesManage, props.labels.devicesHref)}
                items={devices.map((device) => deviceRowOf(device, props.labels))}
                empty={<Text tone="muted">{props.labels.devicesEmpty}</Text>}
            />
        )}
    />
)

/** What the tokens part is drawn from. */
type TokensSectionProps = PartProps<ReadonlyArray<ProfileTokenView>>

/** The MCP tokens as a list with the link to the connect page. */
const TokensSection = (props: TokensSectionProps) => (
    <SlotView
        slot={props.slot}
        placeholder={TOKENS_PLACEHOLDER}
        labels={props.slotLabels}
        forbidden="hide"
        onRetry={props.onRetry}
        render={(tokens, isLoading) => (
            <Section
                kind="list"
                title={props.labels.tokensTitle}
                headingLevel={2}
                count={tokens.length}
                isLoading={isLoading}
                action={headLinkOf(props.labels.tokensManage, props.labels.tokensHref)}
                items={tokens.map((token): ListRowData => ({
                    id: token.id,
                    title: token.name,
                    description: token.detail,
                }))}
                empty={<Text tone="muted">{props.labels.tokensEmpty}</Text>}
            />
        )}
    />
)

/** What the plan part is drawn from. */
type PlanSectionProps = PartProps<ProfilePlanView>

/** The plan of the learner: its status and the way to manage or upgrade it. */
const PlanSection = (props: PlanSectionProps) => (
    <SlotView
        slot={props.slot}
        placeholder={PLAN_PLACEHOLDER}
        labels={props.slotLabels}
        forbidden="hide"
        onRetry={props.onRetry}
        render={(plan, isLoading) => (
            <Section
                title={props.labels.planTitle}
                headingLevel={2}
                isLoading={isLoading}
                action={headLinkOf(props.labels.planManage, props.labels.planHref)}
            >
                <Cluster gap="inline" align="center" wrap>
                    <Badge tone={plan.isPremium ? "success" : "muted"} isDot>
                        {plan.status}
                    </Badge>
                    <Text size="sm" tone="muted">
                        {plan.note}
                    </Text>
                </Cluster>
            </Section>
        )}
    />
)

/** Props for {@link ProfileHubBase}. */
export type ProfileHubBaseProps = {
    readonly props: {
        readonly labels: ProfileHubLabels
        readonly slotLabels: SlotLabels
        readonly views: ProfileHubViews
        /** The accepted types of the avatar picker, as a native `accept` list. */
        readonly accept: string
        readonly isSaving: boolean
        readonly isSaved: boolean
        readonly isUploading: boolean
        readonly isRemoving: boolean
    }
    readonly on: {
        readonly changeName: (value: string) => void
        readonly saveName: () => void
        readonly uploadAvatar: (file: File) => void
        readonly removeAvatar: () => void
        readonly copyLink: (itemId: string, url: string) => void
        readonly retry: () => void
    }
}

/**
 * Draws the profile: who the learner is (avatar, name, goal path), the CV lines StarCi verified with their proof links, the public
 * verify links and the account panels (devices, MCP tokens, plan). Every part is a flat section that reads on its own.
 */
export const ProfileHubBase = (props: ProfileHubBaseProps) => {
    const { labels, slotLabels, views } = props.props
    const part = { labels, slotLabels, onRetry: props.on.retry }
    return (
        <Page
            header={{
                title: labels.title,
                titleScale: "standard",
                description: labels.description,
                breadcrumbs: "root",
            }}
        >
            <Stack gap="region">
                <IdentitySection
                    props={{
                        labels,
                        slotLabels,
                        identity: views.identity,
                        accept: props.props.accept,
                        isSaving: props.props.isSaving,
                        isSaved: props.props.isSaved,
                        isUploading: props.props.isUploading,
                        isRemoving: props.props.isRemoving,
                    }}
                    on={props.on}
                />
                <CvSection {...part} slot={views.cv} />
                <VerifySection {...part} slot={views.verify} onCopy={props.on.copyLink} />
                <DevicesSection {...part} slot={views.devices} />
                <TokensSection {...part} slot={views.tokens} />
                <PlanSection {...part} slot={views.plan} />
            </Stack>
        </Page>
    )
}
