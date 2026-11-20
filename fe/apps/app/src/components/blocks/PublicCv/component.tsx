import {
    Avatar,
    Button,
    ChoiceChips,
    Cluster,
    CopyField,
    Divider,
    Drawer,
    Grid,
    Heading,
    Image,
    Link,
    Page,
    Popover,
    Section,
    Stack,
    Stepper,
    Text,
    type ListRowData,
} from "@starci/grammar/common"
import { BrandLockup, ExperienceGlyph, NotFoundNotice, SlotView } from "@starci-next/ui"
import { LocaleSwitch } from "@/components/blocks/LocaleSwitch"
import type {
    DataSlot,
    PublicCvLabels,
    PublicCvLineView,
    PublicCvScreenView,
    PublicCvShareLabels,
    SlotLabels,
} from "@/modules/types"

/** The fake public CV with the geometry of a settled one: the avatar, the name, the event line and three lines. */
export const PUBLIC_CV_PLACEHOLDER: PublicCvScreenView = {
    name: "xxxxxxxx xxxxxx",
    avatarUrl: null,
    facts: "xxxxxxxxxx · xxxxxxxxxxxxxx",
    total: 3,
    sources: [],
    lines: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        title: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        sourceId: "essentials",
        sourceLabel: "xxxxxxxx",
        subject: "xxxxxxxxxxxxxx",
        proofText: "xxxxxxxxxxxxxxxxxxxx",
        signText: "xxxxxxxxxxxx",
        code: "xxxxxxx",
        verifyHref: "/",
    })),
    hidden: 0,
    moreLabel: "",
    growNote: "",
}

/** Props for {@link PublicCvBase}. */
export type PublicCvBaseProps = {
    /** A link StarCi never issued, or one its owner turned private, draws the not-found notice instead of the slot. */
    readonly shape: "read" | "notFound"
    readonly props: {
        readonly slot: DataSlot<PublicCvScreenView>
        readonly placeholder: PublicCvScreenView
        readonly slotLabels: SlotLabels
        readonly labels: PublicCvLabels
        readonly share: PublicCvShareLabels
        readonly source: string
        readonly isShareOpen: boolean
        readonly isPhone: boolean
        readonly canShare: boolean
        readonly url: string
        readonly previewSrc: string
        /** Where the statics are served from: the not-found notice's illustration. */
        readonly staticsBaseUrl: string
    }
    readonly on: {
        readonly retry: () => void
        readonly chooseSource: (source: string) => void
        readonly showMore: () => void
        readonly setShareOpen: (isOpen: boolean) => void
        readonly shareNative: () => void
    }
}

/** The top of the page: the brand, the language and the way in. It is the only chrome of a public page. */
const TopBar = (props: { readonly labels: PublicCvLabels }) => (
    <Cluster gap="row" align="center" justify="between">
        <BrandLockup
            brand={props.labels.brand}
            logoSrc={props.labels.logoSrc}
            homeHref={props.labels.homeHref}
            size="header"
        />
        <Cluster gap="inline" align="center">
            <LocaleSwitch />
            <Button intent="neutral" size="sm" href={props.labels.signInHref}>
                {props.labels.signIn}
            </Button>
        </Cluster>
    </Cluster>
)

/** The share sheet body: the link with its copy field, the places to send it, and the picture a pasted link shows. */
const ShareBody = (props: PublicCvBaseProps["props"] & Pick<PublicCvBaseProps, "on">) => (
    <Stack gap="row">
        <CopyField
            label={props.share.linkLabel}
            isLabelHidden
            value={props.url}
            copyLabel={props.labels.copy}
            copiedLabel={props.labels.copied}
            copyErrorLabel={props.labels.copyError}
        />
        <Cluster gap="inline" wrap align="center">
            {props.share.targets.map((target) => (
                <Button key={target.id} intent="neutral" size="sm" href={target.href} target="_blank" rel="noreferrer">
                    {target.label}
                </Button>
            ))}
            {props.canShare ? (
                <Button intent="neutral" size="sm" onPress={props.on.shareNative}>
                    {props.share.other}
                </Button>
            ) : null}
        </Cluster>
        <Text size="sm" tone="muted">
            {props.share.previewTitle}
        </Text>
        <Image src={props.previewSrc} alt={props.share.previewAlt} ratio="16:9" fit="cover" />
    </Stack>
)

/** The share action: a popover under the button on a wide window, a drawer from the bottom on a phone. */
const ShareAction = (
    props: PublicCvBaseProps["props"] & Pick<PublicCvBaseProps, "on"> & { readonly isLoading: boolean },
) =>
    props.isPhone ? (
        <>
            <Button intent="commit" isLoading={props.isLoading} onPress={() => props.on.setShareOpen(true)}>
                {props.labels.share}
            </Button>
            <Drawer
                title={props.share.title}
                closeLabel={props.share.closeLabel}
                placement="bottom"
                showHandle
                isOpen={props.isShareOpen}
                onOpenChange={props.on.setShareOpen}
            >
                <ShareBody {...props} />
            </Drawer>
        </>
    ) : (
        <Popover
            title={props.share.title}
            placement="bottom"
            trigger={
                <Button intent="commit" isLoading={props.isLoading}>
                    {props.labels.share}
                </Button>
            }
            isOpen={props.isShareOpen}
            onOpenChange={props.on.setShareOpen}
        >
            <ShareBody {...props} />
        </Popover>
    )

/** Who the CV belongs to: the avatar, the name, the shield line and the event line, then the one action. */
const Hero = (
    props: PublicCvBaseProps["props"] & Pick<PublicCvBaseProps, "on"> & { readonly view: PublicCvScreenView },
) => {
    const isLoading = "isLoading" in props.slot
    return (
        <Stack gap="row">
            <Cluster gap="row" align="center" justify="between" wrap>
                <Cluster gap="row" align="center" wrap={false}>
                    <Avatar
                        name={props.view.name}
                        size="lg"
                        fallbackMark="initials"
                        isLoading={isLoading}
                        {...(props.view.avatarUrl === null ? {} : { src: props.view.avatarUrl })}
                    />
                    <Stack gap="identity">
                        <Heading level={1} isLoading={isLoading}>
                            {props.view.name}
                        </Heading>
                        <Text tone="muted" size="sm" isLoading={isLoading}>
                            {props.labels.verifiedBy}
                        </Text>
                        <Text tone="muted" size="sm" isLoading={isLoading}>
                            {props.view.facts}
                        </Text>
                    </Stack>
                </Cluster>
                <ShareAction {...props} isLoading={isLoading} />
            </Cluster>
            <Divider />
        </Stack>
    )
}

/** One signed line: the shield, the sentence, the source and the subject, the trust trail and the verification link. */
const rowOf = (line: PublicCvLineView, labels: PublicCvLabels, isLoading: boolean): ListRowData => ({
    id: line.id,
    title: line.title,
    ...(line.subject === "" ? {} : { description: line.subject }),
    leading: { icon: ExperienceGlyph },
    badges: [{ label: line.sourceLabel, tone: "neutral" }],
    detail: (
        <Cluster gap="inline" wrap align="center">
            <Text size="sm" tone="muted" isLoading={isLoading}>
                {line.proofText}
            </Text>
            <Text size="sm" tone="muted" isLoading={isLoading}>
                {labels.aiText}
            </Text>
            <Text size="sm" isStrong isLoading={isLoading}>
                {line.signText}
            </Text>
        </Cluster>
    ),
    action: { label: `${labels.verify} ${line.code}`, href: line.verifyHref, endArrow: true },
})

/** The source chips, from eight lines, each with its count; one choice, "all sources" first. */
const SourceChips = (
    props: PublicCvBaseProps["props"] & Pick<PublicCvBaseProps, "on"> & { readonly view: PublicCvScreenView },
) => (
    <ChoiceChips
        label={props.labels.sourcesLabel}
        isLabelHidden
        options={[
            { value: "all", label: `${props.labels.allSources} ${props.view.total}` },
            ...props.view.sources.map((source) => ({ value: source.id, label: `${source.label} ${source.count}` })),
        ]}
        value={props.source}
        onValueChange={props.on.chooseSource}
        empty={null}
    />
)

/** The signed lines, with the source filter and "Xem thêm"; a short list adds the line that says the CV keeps growing. */
const LinesSection = (
    props: PublicCvBaseProps["props"] & Pick<PublicCvBaseProps, "on"> & { readonly view: PublicCvScreenView },
) => {
    const isLoading = "isLoading" in props.slot
    return (
        <Stack gap="row">
            <Section
                kind="list"
                title={props.labels.linesTitle}
                headingLevel={2}
                count={props.view.total}
                caption={props.labels.note}
                isLoading={isLoading}
                {...(props.view.sources.length === 0 ? {} : { filter: <SourceChips {...props} /> })}
                items={props.view.lines.map((line) => rowOf(line, props.labels, isLoading))}
                empty={<Text tone="muted">{props.labels.empty}</Text>}
            />
            {props.view.hidden > 0 ? (
                <Button intent="neutral" onPress={props.on.showMore}>
                    {props.view.moreLabel}
                </Button>
            ) : null}
            {props.view.growNote === "" ? null : (
                <Text size="sm" tone="muted">
                    {props.view.growNote}
                </Text>
            )}
        </Stack>
    )
}

/** Why the CV can be trusted: the three signals every line carries, once, and how a code is checked. */
const WhySection = (props: { readonly labels: PublicCvLabels; readonly isLoading: boolean }) => (
    <Section title={props.labels.whyTitle} headingLevel={2} isLoading={props.isLoading}>
        <Stack gap="row">
            <Stepper
                label={props.labels.stepsLabel}
                orientation="vertical"
                steps={props.labels.steps.map((step) => ({
                    id: step.id,
                    label: step.label,
                    description: step.description,
                    state: "complete" as const,
                }))}
                currentStepId="signed"
                isLoading={props.isLoading}
            />
            <Text size="sm" tone="muted">
                {props.labels.whyNote}
            </Text>
        </Stack>
    </Section>
)

/** The words under every public CV: how a code is checked, and the way to make one's own. */
const Foot = (props: { readonly labels: PublicCvLabels }) => (
    <Stack gap="row">
        <Divider />
        <Cluster gap="row" justify="between" wrap>
            <Text size="sm" tone="muted">
                {props.labels.footNote}
            </Text>
            <Link variant="plain" href={props.labels.signInHref}>
                {props.labels.footCta}
            </Link>
        </Cluster>
    </Stack>
)

/** A link nobody owns or whose owner keeps private reads the same: the shared not-found notice, with its words. */
const NotFound = (props: { readonly labels: PublicCvLabels; readonly staticsBaseUrl: string }) => (
    <NotFoundNotice
        title={props.labels.notFoundTitle}
        description={props.labels.notFoundDescription}
        homeLabel={props.labels.notFoundHome}
        homeHref={props.labels.homeHref}
        staticsBaseUrl={props.staticsBaseUrl}
    />
)

/**
 * Draws the public CV a learner chose to share, for a recruiter with no account: the owner and the one action to share it, the signed
 * lines (each with its source, subject, trust trail Luyện xong, AI chấm, Thầy ký and a link to its verification), the source filter from
 * eight lines, why the CV can be trusted, and the share sheet with the preview a pasted link shows. No score and no reviewer name.
 */
export const PublicCvBase = (props: PublicCvBaseProps) => (
    <Page>
        <Stack gap="region">
            <TopBar labels={props.props.labels} />
            {props.shape === "notFound" ? (
                <NotFound labels={props.props.labels} staticsBaseUrl={props.props.staticsBaseUrl} />
            ) : (
                <SlotView
                    slot={props.props.slot}
                    placeholder={props.props.placeholder}
                    labels={props.props.slotLabels}
                    onRetry={props.on.retry}
                    render={(view, isLoading) => (
                        <Stack gap="region">
                            <Hero {...props.props} on={props.on} view={view} />
                            <Grid
                                kind="main-rail"
                                primary={<LinesSection {...props.props} on={props.on} view={view} />}
                                rail={<WhySection labels={props.props.labels} isLoading={isLoading} />}
                                railWidth="standard"
                                align="start"
                                collapsedOrder="rail-first"
                                railPosition="trailing"
                            />
                        </Stack>
                    )}
                />
            )}
            <Foot labels={props.props.labels} />
        </Stack>
    </Page>
)
