import {
    Alert,
    Avatar,
    Button,
    Cluster,
    Grid,
    CopyField,
    EmptyNotice,
    Link,
    Page,
    Section,
    Stack,
    Switch,
    Text,
    type ListRowData,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import {
    ASIDE_PLACEHOLDER,
    CV_LINK_PLACEHOLDER,
    CV_PLACEHOLDER,
    DEVICES_PLACEHOLDER,
    IDENTITY_PLACEHOLDER,
    PLAN_PLACEHOLDER,
    type DataSlot,
    type ProfileCvLine,
    type ProfileHubLabels,
    type ProfileHubViews,
    type ProfileIdentityView,
    type SlotLabels,
} from "@/modules/types"

/** Props for {@link ProfileHubBase}. */
export type ProfileHubBaseProps = {
    readonly props: {
        readonly labels: ProfileHubLabels
        readonly slotLabels: SlotLabels
        readonly views: ProfileHubViews
        readonly metaLine: string | undefined
        readonly isNew: boolean
        readonly isSaved: boolean
        readonly isCvLinkBusy: boolean
        /** The words of a count of machines, from the catalog. */
        readonly devicesCount: (count: number) => string
    }
    readonly on: {
        readonly setPublic: (isPublic: boolean) => void
        readonly toggleLine: (itemId: string) => void
        readonly copyLine: (itemId: string, url: string) => void
        readonly retry: () => void
    }
}

/** What one part is drawn from: the words, the slot labels and how to read again. */
type PartProps = Pick<ProfileHubBaseProps["props"], "labels" | "slotLabels"> & { readonly onRetry: () => void }

/** The head link of a section. */
const headLinkOf = (label: string, href: string) => (
    <Link variant="head" href={href}>
        {label}
    </Link>
)

/** The identity: the avatar, the name, then the email and the goal path with the link that changes it. */
const IdentitySection = (props: PartProps & { readonly slot: DataSlot<ProfileIdentityView> }) => (
    <SlotView
        slot={props.slot}
        placeholder={IDENTITY_PLACEHOLDER}
        labels={props.slotLabels}
        onRetry={props.onRetry}
        render={(identity, isLoading) => (
            <Section title={props.labels.identityTitle} headingLevel={2} isLoading={isLoading}>
                <Cluster gap="inline" align="center" wrap>
                    <Avatar
                        name={identity.avatarName}
                        size="lg"
                        {...(identity.avatarUrl === null ? {} : { src: identity.avatarUrl })}
                    />
                    <Stack gap="identity">
                        <Text isStrong>{identity.shownName}</Text>
                        <Cluster gap="inline" align="center" wrap>
                            <Text tone="muted">
                                {[
                                    identity.email,
                                    `${props.labels.goalTitle}: ${identity.goalTitle ?? props.labels.goalNone}`,
                                ]
                                    .filter((part) => part !== "")
                                    .join(" · ")}
                            </Text>
                            <Link href={props.labels.goalHref}>
                                {identity.goalTitle === null ? props.labels.goalChoose : props.labels.goalChange}
                            </Link>
                        </Cluster>
                    </Stack>
                </Cluster>
            </Section>
        )}
    />
)

/** The combined CV link with its copy field and the switch that makes it public; without a verified line it says when it appears. */
const CvLinkSection = (
    props: PartProps & Pick<ProfileHubBaseProps, "on"> & Pick<ProfileHubBaseProps["props"], "views" | "isCvLinkBusy">,
) => (
    <SlotView
        slot={props.views.cvLink}
        placeholder={CV_LINK_PLACEHOLDER}
        labels={props.slotLabels}
        onRetry={props.onRetry}
        render={(link, isLoading) => (
            <Section title={props.labels.cvLinkTitle} headingLevel={2} isLoading={isLoading}>
                {link.verifiedCount === 0 ? (
                    <Text tone="muted">{props.labels.cvLinkEmpty}</Text>
                ) : (
                    <Stack gap="row">
                        <CopyField
                            label={props.labels.cvLinkLabel}
                            isLabelHidden
                            value={link.url}
                            copyLabel={props.labels.cvLinkCopy}
                            copiedLabel={props.labels.cvLinkCopied}
                            copyErrorLabel={props.labels.cvLinkCopyError}
                            isLoading={isLoading}
                        />
                        <Switch
                            label={props.labels.cvLinkSwitch}
                            description={props.labels.cvLinkSwitchHint}
                            isSelected={link.isPublic}
                            isDisabled={props.isCvLinkBusy}
                            onSelectedChange={props.on.setPublic}
                            isLoading={isLoading}
                        />
                    </Stack>
                )}
            </Section>
        )}
    />
)

/** The row of one verified CV line: the line, who signed it, the badges, the copy command and the public switch. */
const cvRowOf = (
    line: ProfileCvLine,
    labels: ProfileHubLabels,
    on: ProfileHubBaseProps["on"],
    isLoading: boolean,
): ListRowData => ({
    id: line.itemId,
    title: line.line,
    description: `${line.signed}, ${line.evidence} · ${line.code}`,
    badges: [
        { label: labels.verified, tone: "success" },
        { label: line.part, tone: "neutral" },
    ],
    action: {
        label: line.isCopied ? labels.verifyCopied : labels.verifyCopy,
        press: () => on.copyLine(line.itemId, line.url),
    },
    control: (
        <Switch
            label={line.isPublic ? labels.verifyPublic : labels.verifyPrivate}
            isLabelHidden
            isSelected={line.isPublic}
            onSelectedChange={() => on.toggleLine(line.itemId)}
            isLoading={isLoading}
        />
    ),
})

/** The verified CV lines; with none, the way to the first one. */
const CvSection = (
    props: PartProps & Pick<ProfileHubBaseProps, "on"> & Pick<ProfileHubBaseProps["props"], "views">,
) => (
    <SlotView
        slot={props.views.cv}
        placeholder={CV_PLACEHOLDER}
        labels={props.slotLabels}
        onRetry={props.onRetry}
        render={(cv, isLoading) => (
            <Section
                kind="list"
                title={props.labels.cvTitle}
                headingLevel={2}
                count={cv.lines.length}
                meta={cv.gate}
                isLoading={isLoading}
                items={cv.lines.map((line) => cvRowOf(line, props.labels, props.on, isLoading))}
                empty={
                    <Stack gap="row">
                        <EmptyNotice
                            message={props.labels.cvEmptyTitle}
                            description={props.labels.cvEmpty}
                            frame="frameless"
                        />
                        <div>
                            <Button intent="neutral" href={props.labels.cvEmptyHref}>
                                {props.labels.cvEmptyAction}
                            </Button>
                        </div>
                    </Stack>
                }
            />
        )}
    />
)

/** The account: the machines paired and the plan, as two rows each with its link. */
const AccountSection = (props: PartProps & Pick<ProfileHubBaseProps["props"], "views" | "devicesCount">) => (
    <SlotView
        slot={props.views.devices}
        placeholder={DEVICES_PLACEHOLDER}
        labels={props.slotLabels}
        forbidden="hide"
        onRetry={props.onRetry}
        render={(devices, isDevicesLoading) => {
            const first = devices[0]
            return (
                <SlotView
                    slot={props.views.plan}
                    placeholder={PLAN_PLACEHOLDER}
                    labels={props.slotLabels}
                    forbidden="hide"
                    onRetry={props.onRetry}
                    render={(plan, isPlanLoading) => (
                        <Section
                            kind="list"
                            title={props.labels.accountTitle}
                            headingLevel={2}
                            isLoading={isDevicesLoading || isPlanLoading}
                            items={[
                                {
                                    id: "devices",
                                    title: props.labels.devicesTitle,
                                    description:
                                        first === undefined
                                            ? props.labels.devicesEmpty
                                            : `${props.devicesCount(devices.length)} · ${first.isOnline ? props.labels.online : props.labels.offline}`,
                                    action: { label: props.labels.devicesManage, href: props.labels.devicesHref },
                                },
                                {
                                    id: "plan",
                                    title: props.labels.planTitle,
                                    description: `${plan.status} · ${plan.note}`,
                                    action: { label: props.labels.planManage, href: props.labels.planHref },
                                },
                            ]}
                            empty={null}
                        />
                    )}
                />
            )
        }}
    />
)

/** The side: a few figures of progress with the way to Progress, then the words about experience with the way to Experience. */
const Aside = (props: PartProps & Pick<ProfileHubBaseProps["props"], "views">) => (
    <SlotView
        slot={props.views.aside}
        placeholder={ASIDE_PLACEHOLDER}
        labels={props.slotLabels}
        forbidden="hide"
        onRetry={props.onRetry}
        render={(aside, isLoading) => (
            <Stack gap="region">
                <Section
                    kind="list"
                    layout="keyValue"
                    title={props.labels.asideProgressTitle}
                    headingLevel={2}
                    isLoading={isLoading}
                    action={headLinkOf(props.labels.asideProgressLink, props.labels.progressHref)}
                    items={aside.figures.map((figure) => ({ id: figure.id, title: figure.term, value: figure.value }))}
                    empty={null}
                />
                <Section
                    title={props.labels.asideExperienceTitle}
                    headingLevel={2}
                    isLoading={isLoading}
                    action={headLinkOf(props.labels.asideExperienceLink, props.labels.experienceHref)}
                >
                    <Text tone="muted">{aside.experience}</Text>
                </Section>
            </Stack>
        )}
    />
)

/** The command at the head: Edit, or Add photo and name for a learner who has neither. */
const EditAction = (props: { readonly labels: ProfileHubLabels; readonly isNew: boolean }) => (
    <Button intent="commit" startGlyph="pencil" href={props.labels.editHref}>
        {props.isNew ? props.labels.editNew : props.labels.edit}
    </Button>
)

/**
 * Draws the profile: who the learner is, the combined CV link with its public switch, the verified CV lines each with its own link and
 * switch, and the account rows. The rail holds the quick progress and the experience summary (below the page at 390). Every part
 * reads on its own, so one that fails says so without hiding the others.
 */
export const ProfileHubBase = (props: ProfileHubBaseProps) => {
    const { labels, slotLabels, views } = props.props
    const part = { labels, slotLabels, onRetry: props.on.retry }
    return (
        <Page
            header={{
                title: labels.title,
                titleScale: "standard",
                breadcrumbs: "root",
                meta: props.props.metaLine ?? labels.loading,
                actions: <EditAction labels={labels} isNew={props.props.isNew} />,
            }}
        >
            <Grid
                kind="main-rail"
                primary={
                    <Stack gap="region">
                        {props.props.isSaved ? (
                            <Alert tone="affirmative" title={labels.savedTitle} description={labels.savedText} />
                        ) : null}
                        <IdentitySection {...part} slot={views.identity} />
                        <CvLinkSection {...part} views={views} isCvLinkBusy={props.props.isCvLinkBusy} on={props.on} />
                        <CvSection {...part} views={views} on={props.on} />
                        <AccountSection {...part} views={views} devicesCount={props.props.devicesCount} />
                    </Stack>
                }
                rail={<Aside {...part} views={views} />}
            />
        </Page>
    )
}
