import { Skeleton } from "@heroui/react"
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
        readonly retry: () => void
    }
}

/** What one part is drawn from: the words, the slot labels and how to read again. */
type PartProps = Pick<ProfileHubBaseProps["props"], "labels" | "slotLabels"> & { readonly onRetry: () => void }

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
                        size="md"
                        {...(identity.avatarUrl === null ? {} : { src: identity.avatarUrl })}
                    />
                    <Stack gap="identity">
                        <Text role="label.item" isLoading={isLoading}>
                            {identity.shownName}
                        </Text>
                        <Cluster gap="inline" align="center" wrap>
                            <Text tone="muted" isLoading={isLoading}>
                                {[
                                    identity.email,
                                    `${props.labels.goalTitle}: ${identity.goalTitle ?? props.labels.goalNone}`,
                                ]
                                    .filter((part) => part !== "")
                                    .join(" · ")}
                            </Text>
                            {isLoading ? null : (
                                <Link href={props.labels.goalHref}>
                                    {identity.goalTitle === null ? props.labels.goalChoose : props.labels.goalChange}
                                </Link>
                            )}
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
                            kind="compact"
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

/**
 * The row of one verified CV line: the line and its badges, then under it who signed it and on what proof (wrapping, never cut), the
 * verification link in full with its copy command, and the switch that puts the line on the public CV, which says while it saves and
 * when it failed.
 */
const cvRowOf = (
    line: ProfileCvLine,
    labels: ProfileHubLabels,
    on: ProfileHubBaseProps["on"],
    isLoading: boolean,
): ListRowData => ({
    id: line.itemId,
    title: line.line,
    badges: [
        { label: labels.verified, tone: "success" },
        { label: line.part, tone: "neutral" },
    ],
    detail: (
        <Stack gap="row">
            <Text tone="muted" isLoading={isLoading}>
                {[line.signed, line.evidence].filter((part) => part !== "").join(" · ")}
            </Text>
            <CopyField
                label={labels.verifyLinkLabel}
                value={line.url}
                copyLabel={labels.cvLinkCopy}
                copiedLabel={labels.cvLinkCopied}
                copyErrorLabel={labels.cvLinkCopyError}
                isLoading={isLoading}
            />
            <Switch
                kind="compact"
                label={labels.lineShown}
                description={line.lineState === "saving" ? labels.lineSaving : labels.lineShownHint}
                {...(line.lineState === "failed" ? { errorMessage: labels.lineFailed } : {})}
                isSelected={line.isPublic}
                isDisabled={line.lineState === "saving"}
                onSelectedChange={() => on.toggleLine(line.itemId)}
                isLoading={isLoading}
            />
        </Stack>
    ),
})

/**
 * The verified CV lines; with none, the way to the first one. A failed read keeps the section's heading with the failure and its retry
 * under it, so the learner sees which part did not load.
 */
const CvSection = (props: PartProps & Pick<ProfileHubBaseProps, "on"> & Pick<ProfileHubBaseProps["props"], "views">) =>
    "isError" in props.views.cv ? (
        <Section title={props.labels.cvTitle} headingLevel={2}>
            <Stack gap="inline" align="start">
                <Text tone="muted">{props.slotLabels.error}</Text>
                <Button variant="border" onPress={props.onRetry}>
                    {props.slotLabels.retry}
                </Button>
            </Stack>
        </Section>
    ) : (
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
                        <EmptyNotice
                            message={props.labels.cvEmptyTitle}
                            description={props.labels.cvEmpty}
                            frame="frameless"
                            actionLabel={props.labels.cvEmptyAction}
                            actionHref={props.labels.cvEmptyHref}
                            actionEndArrow
                        />
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
                                    control: (
                                        <Button variant="border" href={props.labels.devicesHref}>
                                            {props.labels.devicesManage}
                                        </Button>
                                    ),
                                },
                                {
                                    id: "plan",
                                    title: props.labels.planTitle,
                                    description: `${plan.status} · ${plan.note}`,
                                    control: (
                                        <Button variant="border" href={props.labels.planHref}>
                                            {props.labels.planManage}
                                        </Button>
                                    ),
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

/**
 * The side: a few figures of progress with the way to Progress under them, then the words about experience with the way to Experience
 * under them. The ways stand in the body, not the section head: a head link drops under the title in a narrow rail and overlaps the body.
 */
const Aside = (props: PartProps & Pick<ProfileHubBaseProps["props"], "views">) => (
    <SlotView
        slot={props.views.aside}
        placeholder={ASIDE_PLACEHOLDER}
        labels={props.slotLabels}
        forbidden="hide"
        onRetry={props.onRetry}
        render={(aside, isLoading) => (
            <Stack gap="region">
                {/* The figures take the rail width (a start-aligned stack shrank them to ~100px and wrapped their labels). */}
                <Stack gap="section">
                    <Section
                        kind="list"
                        layout="keyValue"
                        title={props.labels.asideProgressTitle}
                        headingLevel={2}
                        isLoading={isLoading}
                        items={aside.figures.map((figure) => ({
                            id: figure.id,
                            title: figure.term,
                            value: figure.value,
                        }))}
                        empty={null}
                    />
                    <Cluster gap="inline">
                        <Button variant="border" endArrow href={props.labels.progressHref} isLoading={isLoading}>
                            {props.labels.asideProgressLink}
                        </Button>
                    </Cluster>
                </Stack>
                <Section title={props.labels.asideExperienceTitle} headingLevel={2} isLoading={isLoading}>
                    <Stack gap="inline" align="start">
                        <Text tone="muted" isLoading={isLoading}>
                            {aside.experience}
                        </Text>
                        <Button variant="border" endArrow href={props.labels.experienceHref} isLoading={isLoading}>
                            {props.labels.asideExperienceLink}
                        </Button>
                    </Stack>
                </Section>
            </Stack>
        )}
    />
)

/** The command at the head: Edit, or Add photo and name for a learner who has neither. */
const EditAction = (props: { readonly labels: ProfileHubLabels; readonly isNew: boolean }) => (
    <Button variant="primary" startGlyph="pencil" href={props.labels.editHref}>
        {props.isNew ? props.labels.editNew : props.labels.edit}
    </Button>
)

/** One block of the loading page: a bar for its title, then the lines its body will take. */
const SkeletonBlock = (props: { readonly lines: number }) => (
    <Stack gap="row">
        <Skeleton className="h-5 w-40 rounded-md" />
        {Array.from({ length: props.lines }, (_, index) => (
            <Skeleton key={index} className="h-4 w-2/3 rounded-md" />
        ))}
    </Stack>
)

/**
 * The CV link while it loads: flat bars for its title, the copy field and the public switch's words (one look for every skeleton: no
 * field ring and no control skeleton of its own; a control-sized shape waits for Grammar, GRAMMAR-GAPS #16).
 */
const CvLinkSkeleton = () => (
    <Stack gap="row">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Cluster gap="row" align="center" justify="between" wrap={false}>
            <Skeleton className="h-4 w-48 rounded-md" />
            <Skeleton className="h-[18px] w-8 shrink-0 rounded-full" />
        </Cluster>
    </Stack>
)

/**
 * The profile while its first reads load: no section title, label or placeholder word, only the geometry of the page (identity with
 * its avatar, the CV link, the verified lines, the account rows; the rail's figures) as Skeleton bars.
 */
const ProfileSkeleton = () => (
    <Grid
        kind="main-rail"
        primary={
            <Stack gap="region">
                <Stack gap="row">
                    <Skeleton className="h-5 w-40 rounded-md" />
                    <Cluster gap="inline" align="center" wrap={false}>
                        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                        <Stack gap="row">
                            <Skeleton className="h-4 w-40 rounded-md" />
                            <Skeleton className="h-3 w-56 rounded-md" />
                        </Stack>
                    </Cluster>
                </Stack>
                <CvLinkSkeleton />
                <SkeletonBlock lines={6} />
                <SkeletonBlock lines={4} />
            </Stack>
        }
        rail={
            <Stack gap="region">
                <SkeletonBlock lines={4} />
                <SkeletonBlock lines={2} />
            </Stack>
        }
    />
)

/**
 * Draws the profile: who the learner is, the combined CV link with its public switch, the verified CV lines each with its own link and
 * switch, and the account rows. The rail holds the quick progress and the experience summary (below the page at 390). Every part
 * reads on its own, so one that fails says so without hiding the others.
 */
export const ProfileHubBase = (props: ProfileHubBaseProps) => {
    const { labels, slotLabels, views } = props.props
    const part = { labels, slotLabels, onRetry: props.on.retry }
    // While the first reads load the page is one skeleton (Grammar draws its text as bars), never the placeholder words.
    const isFirstLoad = "isLoading" in views.identity
    return (
        <Page
            header={{
                // The title is a fixed label and stays real while loading; the meta line is a bar and the action waits for the read.
                title: labels.title,
                titleScale: "standard",
                breadcrumbs: "root",
                meta: isFirstLoad ? (
                    <Skeleton className="h-3 w-56 rounded-md" />
                ) : (
                    (props.props.metaLine ?? labels.loading)
                ),
                ...(isFirstLoad ? {} : { actions: <EditAction labels={labels} isNew={props.props.isNew} /> }),
            }}
        >
            {isFirstLoad ? (
                <ProfileSkeleton />
            ) : (
                <Grid
                    kind="main-rail"
                    primary={
                        <Stack gap="region">
                            {props.props.isSaved ? (
                                <Alert tone="affirmative" title={labels.savedTitle} description={labels.savedText} />
                            ) : null}
                            <IdentitySection {...part} slot={views.identity} />
                            <CvLinkSection
                                {...part}
                                views={views}
                                isCvLinkBusy={props.props.isCvLinkBusy}
                                on={props.on}
                            />
                            <CvSection {...part} views={views} on={props.on} />
                            <AccountSection {...part} views={views} devicesCount={props.props.devicesCount} />
                        </Stack>
                    }
                    rail={<Aside {...part} views={views} />}
                />
            )}
        </Page>
    )
}
