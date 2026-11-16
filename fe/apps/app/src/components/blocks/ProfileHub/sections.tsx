import { Badge, Cluster, Link, Section, Text, type ListRowData } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type {
    DataSlot,
    ProfileCvLine,
    ProfileCvView,
    ProfileDeviceView,
    ProfileHubLabels,
    ProfilePlanView,
    ProfileTokenView,
    ProfileVerifyLink,
    SlotLabels,
} from "@/modules/types"
import {
    CV_PLACEHOLDER,
    DEVICES_PLACEHOLDER,
    PLAN_PLACEHOLDER,
    TOKENS_PLACEHOLDER,
    VERIFY_PLACEHOLDER,
} from "./placeholders"

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
export type CvSectionProps = PartProps<ProfileCvView>

/** The verified CV lines, each with its proof link. */
export const CvSection = (props: CvSectionProps) => (
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
export type VerifySectionProps = PartProps<ReadonlyArray<ProfileVerifyLink>> & {
    readonly onCopy: (itemId: string, url: string) => void
}

/** The public verify links of the verified items, each copied with one press. */
export const VerifySection = (props: VerifySectionProps) => (
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
export type DevicesSectionProps = PartProps<ReadonlyArray<ProfileDeviceView>>

/** The connected devices as a list with the link to manage them. */
export const DevicesSection = (props: DevicesSectionProps) => (
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
export type TokensSectionProps = PartProps<ReadonlyArray<ProfileTokenView>>

/** The MCP tokens as a list with the link to the connect page. */
export const TokensSection = (props: TokensSectionProps) => (
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
export type PlanSectionProps = PartProps<ProfilePlanView>

/** The plan of the learner: its status and the way to manage or upgrade it. */
export const PlanSection = (props: PlanSectionProps) => (
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
