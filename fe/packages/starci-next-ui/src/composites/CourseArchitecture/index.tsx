import {
    ArrowPathIcon,
    ArrowRightCircleIcon,
    BoltIcon,
    CheckCircleIcon,
    CircleStackIcon,
    ClockIcon,
    CreditCardIcon,
    CubeIcon,
    DocumentDuplicateIcon,
    EnvelopeIcon,
    ExclamationTriangleIcon,
    GlobeAltIcon,
    PowerIcon,
    QuestionMarkCircleIcon,
    SignalSlashIcon,
} from "@heroicons/react/24/outline"
import { Code, CodeBlock, DataTable, Section, Stack, Text, type DataTableColumn } from "@starci/grammar/common"
import { NarrationText, narrationPlainOf, narrationTermsOf, type NarrationTerm } from "../Narration"
import { MermaidDiagram } from "@starci/grammar/core/ext/graph"

/** A piece of a sentence: plain words, or a name set as inline code (a file path, a service id). */
export type CourseArchitectureSegment = { readonly text: string; readonly isCode: boolean }

/** One step of the business flow of an order, led by the icon the record names (`credit-card`). */
export type CourseArchitectureStepView = {
    readonly id: string
    readonly text: string
    readonly icon: string
}

/** One request the learner file sends: its number, the function that sends it, the real endpoint and what it does in business words. */
export type CourseArchitectureRequestRowView = {
    readonly id: string
    readonly n: string
    /** The call on the sending line (`ctx.payments.charge`); empty when the excerpt holds no code for it. */
    readonly call: string
    /** `payments POST /charges`. */
    readonly endpoint: string
    readonly does: string
}

/** One learner file as a card: its path, its role, its code excerpt and the lines that send a request, marked with their numbers. */
export type CourseArchitectureFileView = {
    readonly id: string
    readonly path: string
    /** What the file does; empty for the one file of a single-file lab (the lead line says it). */
    readonly role: string
    /** The excerpt's code; empty when the server holds no text for the file (the card then names the file alone). */
    readonly code: string
    /** The language badge, from the file's extension (`ts`, `sql`). */
    readonly language: string
    /** The excerpt's first line number in the file. */
    readonly start: number
    /** The lines that send a request. */
    readonly marked: ReadonlyArray<number>
    /** The line under the code that pairs each marked line with its request number. */
    readonly note: string
}

/** One case of the lab as a situation the learner's system meets: normal cases first, then the failure cases. */
export type CourseArchitectureSituationView = {
    readonly id: string
    /** `1. Đặt hàng khi còn hàng`. */
    readonly title: string
    /** What the case turns on, in engineering and business words (`Mạng chậm (400)`), never the fix. */
    readonly situation: string
    /** The kind of situation, for the icon of its tile: `normal`, `stock`, `slow`, `flaky`, `duplicate`, `crash`, `lost` or `failure`. */
    readonly icon: string
}

/** What the static Kiến trúc page draws: business, architecture, why the plain approach fails, the learner's code, the situations. */
export type CourseArchitectureView = {
    /** False for a record cut before the page: the page then says it has nothing to show. */
    readonly hasArchitecture: boolean
    /** `Một order đi qua 4 service`. */
    readonly flowTitle: string
    readonly flow: ReadonlyArray<CourseArchitectureStepView>
    /** The Mermaid flowchart: edges are the real requests, each database lists its tables, the learner file's service names the file. */
    readonly diagram: string
    readonly why: string
    /** `Code chạy khi frontend gửi POST /checkout`. */
    readonly codeTitle: string
    /** The opening line of the code section, with the path and the service as inline code. */
    readonly codeLead: ReadonlyArray<CourseArchitectureSegment>
    /** One line per file of a lab of several files (path and role); empty for a single-file lab. */
    readonly fileLines: ReadonlyArray<{ readonly id: string; readonly path: string; readonly role: string }>
    readonly files: ReadonlyArray<CourseArchitectureFileView>
    readonly requests: ReadonlyArray<CourseArchitectureRequestRowView>
    readonly situations: ReadonlyArray<CourseArchitectureSituationView>
    /** The narration's keywords and their notes (lessons.md §9): the flow is one section, the why another, each marked where it first stands. */
    readonly terms: ReadonlyArray<NarrationTerm>
}

/** The words of the Kiến trúc page. */
export type CourseArchitectureLabels = {
    readonly diagramTitle: string
    readonly diagramLabel: string
    readonly diagramError: string
    readonly diagramCaption: string
    readonly diagramCalls: string
    readonly diagramData: string
    readonly diagramEdit: string
    readonly diagramTo: string
    readonly whyTitle: string
    readonly requestsLabel: string
    readonly numberColumn: string
    readonly callColumn: string
    readonly endpointColumn: string
    readonly doesColumn: string
    readonly situationsTitle: string
    readonly situationsNote: string
    readonly empty: string
}

/** What the Kiến trúc page needs. */
type CourseArchitectureProps = {
    readonly view: CourseArchitectureView
    readonly labels: CourseArchitectureLabels
    readonly isLoading?: boolean
}

/** The glyph of a flow step by the icon name the record gives; an unknown name keeps a plain step arrow. */
const FLOW_ICONS: Readonly<Record<string, typeof GlobeAltIcon>> = {
    browser: GlobeAltIcon,
    database: CircleStackIcon,
    mail: EnvelopeIcon,
    "credit-card": CreditCardIcon,
    package: CubeIcon,
    retry: ArrowPathIcon,
}

/**
 * The glyph of a situation's tile by its kind.
 * TODO(grammar): lead each row with Grammar's numbered step tile once it lands; until then an identity tile with a fitting glyph, the number in the title.
 */
const SITUATION_ICONS: Readonly<Record<string, typeof GlobeAltIcon>> = {
    normal: CheckCircleIcon,
    stock: CubeIcon,
    slow: ClockIcon,
    flaky: SignalSlashIcon,
    duplicate: DocumentDuplicateIcon,
    crash: PowerIcon,
    lost: QuestionMarkCircleIcon,
    failure: ExclamationTriangleIcon,
}

/** A sentence whose names are set as inline code. */
const Sentence = (props: { readonly segments: ReadonlyArray<CourseArchitectureSegment> }) => (
    <Text as="p" role="reading.body">
        {props.segments.map((segment, index) =>
            segment.isCode ? <Code key={index}>{segment.text}</Code> : <span key={index}>{segment.text}</span>,
        )}
    </Text>
)

/** One learner file: its role (a lab of several files) and its excerpt with the sending lines marked; a file without code is named alone. */
const FileCard = (props: { readonly file: CourseArchitectureFileView; readonly isLoading: boolean }) => {
    const { file } = props
    if (file.code === "") return null
    return (
        <CodeBlock
            code={file.code}
            path={file.path}
            language={file.language}
            start={file.start}
            highlightLines={file.marked}
            note={file.note === "" ? undefined : file.note}
            isLoading={props.isLoading}
        />
    )
}

/**
 * The static Kiến trúc page of a lab (lessons.md §7): it explains, it holds no button and no case state. In order: one order through the
 * services in business words (each step led by an icon tile), the architecture on the learner's machine drawn from the record (each edge the
 * real request, each database its tables), why the plain approach is not enough, the code that runs when the frontend sends the request (the
 * learner file or files, the sending lines marked by request number, then a table number → call → endpoint → business effect), and every
 * case of the lab as the situation it creates, normal cases first.
 */
export const CourseArchitecture = (props: CourseArchitectureProps) => {
    const { view, labels } = props
    const isLoading = props.isLoading === true
    if (!view.hasArchitecture && !isLoading) {
        return (
            <Text as="p" tone="muted">
                {labels.empty}
            </Text>
        )
    }
    // The flow and the why are two sections of narration: a keyword is marked where it first stands in each.
    const flowMarks = narrationTermsOf(
        view.flow.map((step) => step.text),
        view.terms,
    )
    const whyMarks = narrationTermsOf([view.why], view.terms)
    const diagramWords = {
        calls: labels.diagramCalls,
        data: labels.diagramData,
        edit: labels.diagramEdit,
        to: labels.diagramTo,
    }
    return (
        <Stack gap="region" measure="reading">
            <Section
                kind="list"
                title={view.flowTitle}
                headingLevel={2}
                isLoading={isLoading}
                empty={labels.empty}
                items={view.flow.map((step, index) => ({
                    id: step.id,
                    title: narrationPlainOf(step.text),
                    titleContent: <NarrationText text={step.text} terms={flowMarks[index] ?? []} />,
                    leading: { icon: FLOW_ICONS[step.icon] ?? ArrowRightCircleIcon },
                }))}
            />
            <Section title={labels.diagramTitle} headingLevel={2} isLoading={isLoading}>
                <MermaidDiagram
                    source={view.diagram}
                    label={labels.diagramLabel}
                    errorTitle={labels.diagramError}
                    isLoading={isLoading}
                    caption={labels.diagramCaption}
                    labels={diagramWords}
                    height="md"
                />
            </Section>
            <Section title={labels.whyTitle} headingLevel={2} isLoading={isLoading}>
                <Text as="p" role="reading.body">
                    <NarrationText text={view.why} terms={whyMarks[0] ?? []} />
                </Text>
            </Section>
            <Section title={view.codeTitle} headingLevel={2} isLoading={isLoading}>
                <Stack gap="section">
                    <Sentence segments={view.codeLead} />
                    {view.fileLines.length === 0 ? null : (
                        <Stack gap="identity">
                            {view.fileLines.map((line) => (
                                <Text key={line.id} as="p">
                                    <Code>{line.path}</Code>
                                    {line.role === "" ? null : <span>{`: ${line.role}`}</span>}
                                </Text>
                            ))}
                        </Stack>
                    )}
                    {view.files.map((file) => (
                        <FileCard key={file.id} file={file} isLoading={isLoading} />
                    ))}
                    <DataTable
                        label={labels.requestsLabel}
                        phone="table"
                        rows={view.requests}
                        columns={
                            [
                                { id: "n", label: labels.numberColumn, width: "fit" },
                                { id: "call", label: labels.callColumn, width: "fit", truncate: false },
                                {
                                    id: "endpoint",
                                    label: labels.endpointColumn,
                                    isRowHeader: true,
                                    width: "fit",
                                    truncate: false,
                                },
                                { id: "does", label: labels.doesColumn, width: "fill", truncate: false },
                            ] satisfies DataTableColumn[]
                        }
                        emptyContent={labels.empty}
                        renderCell={(row, column) => {
                            if (column === "n") return <Text isStrong>{row.n}</Text>
                            if (column === "call") return row.call === "" ? "" : <Code>{row.call}</Code>
                            if (column === "endpoint") return <Code>{row.endpoint}</Code>
                            return row.does
                        }}
                    />
                </Stack>
            </Section>
            <Section
                kind="list"
                title={labels.situationsTitle}
                caption={labels.situationsNote}
                headingLevel={2}
                isLoading={isLoading}
                empty={labels.empty}
                items={view.situations.map((each) => ({
                    id: each.id,
                    title: each.title,
                    description: each.situation,
                    leading: { icon: SITUATION_ICONS[each.icon] ?? BoltIcon },
                }))}
            />
        </Stack>
    )
}
