import type { ReactNode } from "react"
import { Skeleton } from "@heroui/react"
import {
    Avatar,
    Button,
    Cluster,
    CopyField,
    Divider,
    Drawer,
    EmptyNotice,
    Grid,
    Heading,
    Image,
    Link,
    Page,
    Popover,
    Section,
    Stack,
    SurfaceCard,
    Tabs,
    Text,
    type ListRowData,
} from "@starci/grammar/common"
import { areaArt, ArtImage, ExperienceGlyph, NotFoundNotice, SlotView } from "@starci-next/ui"
import type {
    DataSlot,
    PublicCvLabels,
    PublicCvLineView,
    PublicCvScreenView,
    PublicCvShareLabels,
    SlotLabels,
} from "@/modules/types"

/**
 * The view SlotView is handed for its loading branch. The block never draws it: the first read draws {@link PublicCvSkeleton}, so it
 * carries no placeholder words.
 */
export const PUBLIC_CV_PLACEHOLDER: PublicCvScreenView = {
    name: "",
    avatarUrl: null,
    facts: "",
    total: 0,
    figures: [],
    sources: [],
    lines: [],
    hidden: 0,
    moreLabel: "",
    growNote: "",
}

/** Props for {@link PublicCvBase}. */
export type PublicCvBaseProps = {
    /**
     * `loading` (the first read) draws the skeleton page, `failed` the page notice with its retry, `notFound` (a link StarCi never issued,
     * or one its owner turned private) the not-found notice; `read` draws the settled CV.
     */
    readonly shape: "loading" | "failed" | "read" | "notFound"
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
        /** The public top bar (PublicTopBar): the same brand, language and sign-in as the verification page. */
        readonly top: ReactNode
    }
    readonly on: {
        readonly retry: () => void
        readonly chooseSource: (source: string) => void
        readonly showMore: () => void
        readonly setShareOpen: (isOpen: boolean) => void
        readonly shareNative: () => void
    }
}

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
                <Button key={target.id} variant="border" href={target.href} target="_blank" rel="noreferrer">
                    {target.label}
                </Button>
            ))}
            {props.canShare ? (
                <Button variant="border" onPress={props.on.shareNative}>
                    {props.share.other}
                </Button>
            ) : null}
        </Cluster>
        <Text tone="muted">{props.share.previewTitle}</Text>
        <Image src={props.previewSrc} alt={props.share.previewAlt} ratio="16:9" fit="cover" />
    </Stack>
)

/** The share action: a popover under the button on a wide window, a drawer from the bottom on a phone. */
const ShareAction = (
    props: PublicCvBaseProps["props"] & Pick<PublicCvBaseProps, "on"> & { readonly isLoading: boolean },
) =>
    props.isPhone ? (
        <>
            <Button variant="primary" isLoading={props.isLoading} onPress={() => props.on.setShareOpen(true)}>
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
                <Button variant="primary" isLoading={props.isLoading}>
                    {props.labels.share}
                </Button>
            }
            isOpen={props.isShareOpen}
            onOpenChange={props.on.setShareOpen}
        >
            <ShareBody {...props} />
        </Popover>
    )

/** Who the CV belongs to: the avatar, the name, the shield line and the event line, the one action, and the picture of the CV. */
const Hero = (
    props: PublicCvBaseProps["props"] &
        Pick<PublicCvBaseProps, "on"> & { readonly view: PublicCvScreenView; readonly isLoading: boolean },
) => {
    const { isLoading } = props
    return (
        <Grid
            kind="main-rail"
            primary={
                <Stack gap="row">
                    <Cluster gap="row" align="center" wrap={false}>
                        <Avatar
                            name={props.view.name}
                            size="md"
                            isLoading={isLoading}
                            {...(props.view.avatarUrl === null ? {} : { src: props.view.avatarUrl })}
                        />
                        <Stack gap="identity">
                            <Heading level={1} isLoading={isLoading}>
                                {props.view.name}
                            </Heading>
                            <Text tone="muted" isLoading={isLoading}>
                                {props.labels.verifiedBy}
                            </Text>
                            <Text tone="muted" isLoading={isLoading}>
                                {props.view.facts}
                            </Text>
                        </Stack>
                    </Cluster>
                    <Cluster gap="inline">
                        <ShareAction {...props} isLoading={isLoading} />
                    </Cluster>
                </Stack>
            }
            rail={<ArtImage asset={areaArt("cv")} base={props.staticsBaseUrl} />}
            railWidth="standard"
            align="start"
            collapsedOrder="primary-first"
            railPosition="trailing"
        />
    )
}

/** The key figures of the CV as one ribbon: the signed lines, then the lines of each source group. */
const Figures = (
    props: PublicCvBaseProps["props"] & { readonly view: PublicCvScreenView; readonly isLoading: boolean },
) => (
    <Section
        kind="figures"
        ariaLabel={props.labels.figuresLabel}
        isLoading={props.isLoading}
        items={props.view.figures.map((figure) => ({ id: figure.id, term: figure.term, value: figure.value }))}
    />
)

/**
 * One signed line: the shield, the sentence, the source and the subject, the trust trail and the verification link. The link is a
 * standalone Button at the one control height (40px), not the row's small action: it is the row's only target, and on a phone a
 * recruiter taps it with a thumb.
 */
const rowOf = (line: PublicCvLineView, labels: PublicCvLabels, isLoading: boolean): ListRowData => ({
    id: line.id,
    title: line.title,
    ...(line.subject === "" ? {} : { description: line.subject }),
    leading: { icon: ExperienceGlyph },
    badges: [{ label: line.sourceLabel, tone: "neutral" }],
    detail: (
        <Stack gap="inline">
            <Cluster gap="inline" wrap align="center">
                <Text tone="muted" isLoading={isLoading}>
                    {line.proofText}
                </Text>
                <Text tone="muted" isLoading={isLoading}>
                    {labels.aiText}
                </Text>
                <Text role="label.item" isLoading={isLoading}>
                    {line.signText}
                </Text>
            </Cluster>
            <Cluster gap="inline">
                <Button variant="border" href={line.verifyHref} endArrow isLoading={isLoading}>
                    {`${labels.verify} ${line.code}`}
                </Button>
            </Cluster>
        </Stack>
    ),
})

/** The source chips, from eight lines, each with its count; one choice, "all sources" first. */
const SourceChips = (
    props: PublicCvBaseProps["props"] & Pick<PublicCvBaseProps, "on"> & { readonly view: PublicCvScreenView },
) => (
    <Tabs
        kind="filter"
        label={props.labels.sourcesLabel}
        items={[
            { id: "all", label: props.labels.allSources, count: props.view.total },
            ...props.view.sources.map((source) => ({ id: source.id, label: source.label, count: source.count })),
        ]}
        selectedKey={props.source}
        onSelect={props.on.chooseSource}
    />
)

/** The signed lines, with the source filter and "Xem thêm"; a short list adds the line that says the CV keeps growing. */
const LinesSection = (
    props: PublicCvBaseProps["props"] &
        Pick<PublicCvBaseProps, "on"> & { readonly view: PublicCvScreenView; readonly isLoading: boolean },
) => {
    const { isLoading } = props
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
                <Button variant="border" onPress={props.on.showMore}>
                    {props.view.moreLabel}
                </Button>
            ) : null}
            {props.view.growNote === "" ? null : <Text tone="muted">{props.view.growNote}</Text>}
        </Stack>
    )
}

/** Why the CV can be trusted: the three signals every line carries, as three cards, and how a code is checked. */
const WhySection = (props: { readonly labels: PublicCvLabels; readonly isLoading: boolean }) => (
    <Section title={props.labels.whyTitle} headingLevel={2} caption={props.labels.whyNote} isLoading={props.isLoading}>
        <Grid kind="cards" columns={3}>
            {props.labels.steps.map((step) => (
                <SurfaceCard
                    key={step.id}
                    kind="tile"
                    name={step.label}
                    description={step.description}
                    mark={{ icon: ExperienceGlyph }}
                    isLoading={props.isLoading}
                />
            ))}
        </Grid>
    </Section>
)

/** The words under every public CV: how a code is checked, and the way to make one's own. */
const Foot = (props: { readonly labels: PublicCvLabels }) => (
    <Stack gap="row">
        <Divider />
        <Cluster gap="row" justify="between" wrap>
            <Text tone="muted">{props.labels.footNote}</Text>
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

/** One signed line while the CV loads: the line's mark, then bars for its sentence, its source and its trust trail. */
const LineSkeleton = () => (
    <Cluster gap="row" align="start" wrap={false}>
        <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
        <Stack gap="row">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
        </Stack>
    </Cluster>
)

/**
 * The public CV while its first read is in flight: no title, label, step or button word, only the geometry of the settled page as bars
 * (the owner with the avatar and the share button, three signed lines and the caption line, the trust steps of the rail).
 */
const PublicCvSkeleton = (props: { readonly labels: PublicCvLabels }) => (
    <Stack gap="region">
        <Cluster gap="row" align="center" wrap={false}>
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <Stack gap="row">
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-4 w-56 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-md" />
            </Stack>
        </Cluster>
        <Cluster gap="row" wrap={false}>
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
        </Cluster>
        <Stack gap="section">
            <Skeleton className="h-5 w-40 rounded-md" />
            <LineSkeleton />
            <LineSkeleton />
            <LineSkeleton />
            <Skeleton className="h-4 w-32 rounded-md" />
        </Stack>
        <Stack gap="section">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Cluster gap="row" wrap={false}>
                {props.labels.steps.map((step) => (
                    <Skeleton key={step.id} className="h-24 w-full rounded-md" />
                ))}
            </Cluster>
        </Stack>
    </Stack>
)

/** The words under the page while it loads: the same divider, the note and the link as bars. */
const FootSkeleton = () => (
    <Stack gap="row">
        <Divider />
        <Skeleton className="h-4 w-2/3 rounded-md" />
        <Skeleton className="h-4 w-32 rounded-md" />
    </Stack>
)

/** The read failed: the page notice in the middle of the page, what happened and the retry (neutral, at the one control height). */
const Failed = (props: { readonly slotLabels: SlotLabels; readonly onRetry: () => void }) => (
    <EmptyNotice
        scope="page"
        isError
        message={props.slotLabels.error}
        {...(props.slotLabels.errorDescription === undefined ? {} : { description: props.slotLabels.errorDescription })}
        actionVariant="border"
        actionLabel={props.slotLabels.retry}
        onAction={props.onRetry}
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
            {props.props.top}
            {props.shape === "notFound" ? (
                <NotFound labels={props.props.labels} staticsBaseUrl={props.props.staticsBaseUrl} />
            ) : props.shape === "loading" ? (
                <PublicCvSkeleton labels={props.props.labels} />
            ) : props.shape === "failed" ? (
                <Failed slotLabels={props.props.slotLabels} onRetry={props.on.retry} />
            ) : (
                <SlotView
                    slot={props.props.slot}
                    placeholder={props.props.placeholder}
                    labels={props.props.slotLabels}
                    onRetry={props.on.retry}
                    render={(view, isLoading) => (
                        <Stack gap="region">
                            <Hero {...props.props} on={props.on} view={view} isLoading={isLoading} />
                            <Figures {...props.props} view={view} isLoading={isLoading} />
                            <LinesSection {...props.props} on={props.on} view={view} isLoading={isLoading} />
                            <WhySection labels={props.props.labels} isLoading={isLoading} />
                        </Stack>
                    )}
                />
            )}
            {props.shape === "loading" ? <FootSkeleton /> : <Foot labels={props.props.labels} />}
        </Stack>
    </Page>
)
