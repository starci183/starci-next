"use client"

import {
    Alert,
    Badge,
    Cluster,
    CodeBlock,
    DataTable,
    diffCode,
    Disclosure,
    IconTile,
    Section,
    Stack,
    SurfaceCard,
    Text,
    type DataTableColumn,
} from "@starci/grammar/common"
import { useCodeTokens } from "@starci/grammar/core/ext/markdown/react"
import type { ReactNode } from "react"
import { ITEM_TILE } from "../../leaves/Icon"
import { InterviewerQuote, NarrationText } from "../Narration"

/**
 * The dev-only Audit tab of a lesson (owner 2026-11-28: "ghi lại mọi hiện tại, và nếu user sửa code thì sửa gì, đánh giá độ impact vào tư
 * duy"): the editors' read-through of the lesson AS IT IS NOW, drawn from the record as written. Nothing here is computed from the page:
 * the app maps the record's words onto these views, and this composite only lays them out.
 */

/** How a reader got through a page or a case, drawn as the round status mark: read through, stumbled, lost the thread. */
export type CourseAuditVerdict = "easy" | "stumble" | "lost"

/** The status mark of each verdict: the check for "dễ", the warning ring for "vấp", the cross for "mất dấu". */
const VERDICT_STATE = { easy: "done", stumble: "waiting", lost: "error" } as const

/** One verdict line: a page (or a case) of the lesson, how the reader got through it and why. */
export type CourseAuditVerdictView = {
    readonly id: string
    /** What was read (`Giới thiệu`, `u1 · Kho hết hàng`). */
    readonly title: string
    readonly verdict: CourseAuditVerdict
    /** The verdict in words (`Vấp`), the accessible name of the mark. */
    readonly verdictLabel: string
    readonly note: string
}

/** One finding: the words of the page it quotes, why they trip the reader, the fix, what kind it is and where it stands. */
export type CourseAuditFindingView = {
    readonly id: string
    readonly quote: string
    readonly why: string
    readonly fix: string
    /** `lint` a rule a checker could catch, `edit` an editor's judgement. */
    readonly kind: "lint" | "edit"
    /** The kind in words (`lint`, `biên tập`). */
    readonly kindLabel: string
    readonly status: "open" | "fixed" | "deferred"
    /** The status in words (`Còn mở`, `Đã sửa`, `Để sau`). */
    readonly statusLabel: string
    /** The page it stands on, in words; shown in the top five, where findings of every page mix. */
    readonly pageLabel: string
}

/** The findings of one page, under the page's name. */
export type CourseAuditFindingGroupView = {
    readonly id: string
    readonly title: string
    readonly findings: ReadonlyArray<CourseAuditFindingView>
}

/** One change the reference solution expects for a case to turn green: the file, the diff and what changes and why. */
export type CourseAuditExpectedView = {
    readonly id: string
    readonly file: string
    /** The Shiki language of the file (`ts`, `yaml`); empty draws plain text. */
    readonly language: string
    /** The change, as a unified diff. */
    readonly diff: string
    readonly what: string
}

/** How much a case's fix moves the learner's thinking. */
export type CourseAuditImpact = "high" | "medium" | "low"

/** The badge tone of each impact. */
const IMPACT_TONE = { high: "success", medium: "info", low: "muted" } as const

/** The badge tone of each finding status. */
const STATUS_TONE = { open: "warning", fixed: "success", deferred: "muted" } as const

/** One case of the lab as the audit reads it: its current text, the expected changes, what they do to the learner's thinking. */
export type CourseAuditCaseView = {
    readonly id: string
    /** The case's id and title (`u1 · Kho hết hàng sau khi đã trừ tiền`). */
    readonly title: string
    /** `Happy path` or `Unhappy path`. */
    readonly kindLabel: string
    readonly verdict: CourseAuditVerdictView
    /** The situation, as the learner reads it; empty draws none. */
    readonly situation: string
    /** The interviewer's question; empty draws none. */
    readonly question: string
    readonly conditions: ReadonlyArray<string>
    readonly hints: ReadonlyArray<string>
    readonly expected: ReadonlyArray<CourseAuditExpectedView>
    readonly learns: string
    readonly shift: string
    readonly interview: string
    readonly impact: CourseAuditImpact
    /** The impact in words (`Impact cao`). */
    readonly impactLabel: string
    /** The cautions the owner must see: a rote fix and why, an assumption not checked; empty draws none. */
    readonly warnings: ReadonlyArray<{ readonly id: string; readonly title: string; readonly text: string }>
}

/**
 * One row of the paths table at the top of the tab (owner 2026-11-28: "kẻ bảng tất cả path có tác dụng gì và impact ntn đến người học"):
 * a case of the lab, what it simulates, what it proves, how it shifts the learner's thinking and how much.
 */
export type CourseAuditPathView = {
    readonly id: string
    /** Its place in the table, happy cases first, then unhappy, each in the lesson's order (1-based). */
    readonly number: number
    /** The case's id and title (`u1 · Kho hết hàng sau khi đã trừ tiền`). */
    readonly title: string
    readonly kind: "happy" | "unhappy"
    /** The kind in words (`Happy`, `Unhappy`). */
    readonly kindLabel: string
    /** The fault the case runs under: its chaos switches in words, else the first sentence of its situation. */
    readonly fault: string
    /** What passing the case proves the learner understands (the audit's `learns`). */
    readonly proves: string
    readonly shift: string
    readonly impact: CourseAuditImpact
    /** The impact in one word (`cao`). */
    readonly impactLabel: string
    /** The learner can pass it by rote (the audit's `mechanical`). */
    readonly isMechanical: boolean
}

/** What the main column of the Audit tab draws. */
export type CourseAuditView = {
    /** False when the record has no audit: the tab then says so and draws nothing else. */
    readonly isAudited: boolean
    /** One row per case for the paths table; empty draws no table. */
    readonly paths: ReadonlyArray<CourseAuditPathView>
    readonly pages: ReadonlyArray<CourseAuditVerdictView>
    readonly cases: ReadonlyArray<CourseAuditCaseView>
    /** The ranked findings, rank 1 first. */
    readonly top: ReadonlyArray<CourseAuditFindingView>
    /** Every finding, grouped by page in the order of the pages. */
    readonly groups: ReadonlyArray<CourseAuditFindingGroupView>
}

/** The words of the Audit tab. */
export type CourseAuditLabels = {
    readonly emptyTitle: string
    readonly emptyText: string
    /** The title of the paths table and its column headers. */
    readonly pathsTitle: string
    readonly paths: {
        readonly number: string
        readonly path: string
        readonly kind: string
        readonly fault: string
        readonly proves: string
        readonly shift: string
        readonly impact: string
        readonly mechanical: string
    }
    /** The mark of a rote case in the paths table (`Máy móc`). */
    readonly mechanicalMark: string
    readonly pagesTitle: string
    readonly casesTitle: string
    readonly questionLabel: string
    readonly conditionsLabel: string
    readonly hintsLabel: string
    readonly expectedTitle: string
    readonly expectedEmpty: string
    readonly learnsLabel: string
    readonly shiftLabel: string
    readonly interviewLabel: string
    readonly topTitle: string
    readonly allTitle: string
    readonly findingsEmpty: string
    readonly whyLabel: string
    readonly fixLabel: string
}

/** What the Audit tab's main column needs. */
type CourseAuditProps = {
    readonly view: CourseAuditView
    readonly labels: CourseAuditLabels
    readonly isLoading?: boolean
}

/** One verdict line: the round 24 status mark, the name of what was read in strong words, then why in one line. */
const VerdictLine = (props: { readonly line: CourseAuditVerdictView; readonly isLoading: boolean }) => (
    <Cluster gap="inline" align="start" wrap={false}>
        <IconTile
            state={VERDICT_STATE[props.line.verdict]}
            ariaLabel={props.line.verdictLabel}
            isLoading={props.isLoading}
            {...ITEM_TILE}
        />
        <Stack gap="identity">
            <Text as="p" isStrong isLoading={props.isLoading}>
                {props.line.title === "" ? props.line.verdictLabel : `${props.line.title} · ${props.line.verdictLabel}`}
            </Text>
            {/* The audit writes code names in backticks: drawn as Grammar Code, never raw marks (owner 2026-11-28). */}
            <Text as="p" tone="muted">
                <NarrationText text={props.line.note} />
            </Text>
        </Stack>
    </Cluster>
)

/** A line after its muted name (`Hiểu thêm: ...`); empty text draws nothing. */
const Labelled = (props: { readonly label: string; readonly text: string }) =>
    props.text === "" ? null : (
        <Text as="p">
            <Text as="span" tone="muted">{`${props.label}: `}</Text>
            <NarrationText text={props.text} />
        </Text>
    )

/** One expected change: what changes and why, then the diff in Grammar's diff block, coloured by Shiki once its tokens are ready. */
const ExpectedChange = (props: { readonly change: CourseAuditExpectedView; readonly isLoading: boolean }) => {
    const { change } = props
    const tokens = useCodeTokens(diffCode(change.diff), change.language === "" ? undefined : change.language)
    return (
        <Stack gap="identity">
            <Text as="p">
                <NarrationText text={change.what} />
            </Text>
            <CodeBlock
                diff={change.diff}
                path={change.file}
                {...(change.language === "" ? {} : { language: change.language })}
                {...(tokens === undefined ? {} : { tokens })}
                isLoading={props.isLoading}
            />
        </Stack>
    )
}

/**
 * One case as a block: its verdict line, the cautions (a rote fix, a guess), the text the learner reads now (the situation as a quote, the
 * question, the conditions, the hints folded), the changes the reference solution expects, then what those changes teach, how they shift
 * the learner's thinking and what they add to the interview answer, with the impact badge.
 */
const CaseBlock = (props: {
    readonly item: CourseAuditCaseView
    readonly labels: CourseAuditLabels
    readonly isLoading: boolean
}) => {
    const { item, labels, isLoading } = props
    return (
        <Section title={item.title} headingLevel={3} caption={item.kindLabel} isLoading={isLoading}>
            <Stack gap="section">
                {/* The section head names the case; its verdict line carries the verdict alone, never the title twice. */}
                <VerdictLine line={{ ...item.verdict, title: "" }} isLoading={isLoading} />
                {item.warnings.map((warning) => (
                    <Alert
                        key={warning.id}
                        tone="cautionary"
                        title={warning.title}
                        description={<NarrationText text={warning.text} />}
                    />
                ))}
                {item.situation === "" ? null : <InterviewerQuote quote={item.situation} />}
                <Labelled label={labels.questionLabel} text={item.question} />
                {item.conditions.length === 0 ? null : (
                    <Stack gap="identity">
                        <Text as="p" tone="muted">
                            {labels.conditionsLabel}
                        </Text>
                        {item.conditions.map((condition) => (
                            <Text key={condition} as="p">
                                {"· "}
                                <NarrationText text={condition} />
                            </Text>
                        ))}
                    </Stack>
                )}
                {item.hints.length === 0 ? null : (
                    <Disclosure
                        kind="quiet"
                        headingLevel={4}
                        title={`${labels.hintsLabel} (${String(item.hints.length)})`}
                        body={
                            <Stack gap="identity">
                                {item.hints.map((hint, index) => (
                                    <Text key={hint} as="p">
                                        {`${String(index + 1)}. `}
                                        <NarrationText text={hint} />
                                    </Text>
                                ))}
                            </Stack>
                        }
                    />
                )}
                <Section title={labels.expectedTitle} headingLevel={4}>
                    {item.expected.length === 0 ? (
                        <Text as="p" tone="muted">
                            {labels.expectedEmpty}
                        </Text>
                    ) : (
                        <Stack gap="section">
                            {item.expected.map((change) => (
                                <ExpectedChange key={change.id} change={change} isLoading={isLoading} />
                            ))}
                        </Stack>
                    )}
                </Section>
                <Stack gap="identity">
                    <Labelled label={labels.learnsLabel} text={item.learns} />
                    <Labelled label={labels.shiftLabel} text={item.shift} />
                    <Labelled label={labels.interviewLabel} text={item.interview} />
                    <Cluster gap="inline">
                        <Badge tone={IMPACT_TONE[item.impact]}>{item.impactLabel}</Badge>
                    </Cluster>
                </Stack>
            </Stack>
        </Section>
    )
}

/** One finding: the quote of the page, why it trips the reader, the fix, then its kind and status as badges (and its page in the top five). */
const FindingRow = (props: {
    readonly finding: CourseAuditFindingView
    readonly labels: CourseAuditLabels
    readonly withPage: boolean
}) => {
    const { finding, labels } = props
    return (
        <Stack gap="identity">
            <InterviewerQuote quote={finding.quote} />
            <Labelled label={labels.whyLabel} text={finding.why} />
            <Labelled label={labels.fixLabel} text={finding.fix} />
            <Cluster gap="inline">
                {props.withPage ? <Badge tone="neutral">{finding.pageLabel}</Badge> : null}
                <Badge tone={finding.kind === "lint" ? "info" : "accent"}>{finding.kindLabel}</Badge>
                <Badge tone={STATUS_TONE[finding.status]}>{finding.statusLabel}</Badge>
            </Cluster>
        </Stack>
    )
}

/** The badge tone of each path kind: a happy path is the plain case, an unhappy one runs under a fault. */
const KIND_TONE = { happy: "neutral", unhappy: "accent" } as const

/**
 * The paths table: one row per case (happy first, then unhappy, in the lesson's order), its number, its name, then what it simulates, what
 * it proves and how it shifts the learner's thinking, how much (the impact badge) and whether it can be passed by rote (the warning badge).
 * At the reading measure the four text columns fold under the case's name as labelled lines (Grammar's `low` columns), so every word
 * wraps and the page never scrolls sideways; on a phone it keeps its table shape and scrolls inside its own frame if it must.
 */
const PathsTable = (props: {
    readonly paths: ReadonlyArray<CourseAuditPathView>
    readonly labels: CourseAuditLabels
    readonly isLoading: boolean
}) => {
    const { labels } = props
    const columns: ReadonlyArray<DataTableColumn<CourseAuditPathView>> = [
        { id: "number", label: labels.paths.number, isNumeric: true, width: "fit" },
        { id: "path", label: labels.paths.path, isRowHeader: true, width: "fill", truncate: false, minWidth: 160 },
        { id: "kind", label: labels.paths.kind, priority: "low", width: "fit" },
        { id: "fault", label: labels.paths.fault, priority: "low", width: 200, truncate: false },
        { id: "proves", label: labels.paths.proves, priority: "low", width: 220, truncate: false },
        { id: "shift", label: labels.paths.shift, priority: "low", width: 220, truncate: false },
        { id: "impact", label: labels.paths.impact, width: "fit" },
        { id: "mechanical", label: labels.paths.mechanical, width: "fit" },
    ]
    const renderCell = (row: CourseAuditPathView, columnId: string): ReactNode => {
        if (columnId === "number") return row.number
        if (columnId === "path")
            return (
                // A table cell keeps its line by default; the name wraps so the four other columns stay in the reading measure.
                <Text overflow="wrap">
                    <NarrationText text={row.title} />
                </Text>
            )
        if (columnId === "kind") return <Badge tone={KIND_TONE[row.kind]}>{row.kindLabel}</Badge>
        if (columnId === "fault") return <NarrationText text={row.fault} />
        if (columnId === "proves") return <NarrationText text={row.proves} />
        if (columnId === "shift") return <NarrationText text={row.shift} />
        if (columnId === "impact") return <Badge tone={IMPACT_TONE[row.impact]}>{row.impactLabel}</Badge>
        return row.isMechanical ? <Badge tone="warning">{labels.mechanicalMark}</Badge> : null
    }
    return (
        <DataTable
            label={labels.pathsTitle}
            columns={columns}
            rows={props.paths}
            renderCell={renderCell}
            emptyContent={null}
            phone="table"
            isLoading={props.isLoading}
        />
    )
}

/**
 * COMPOSITE - the main column of the dev-only Audit tab, at the reading measure: the paths table, then one verdict line per page, then every case as a block
 * (its current text, the expected changes as diffs, what they do to the learner's thinking), then the top five findings and every finding
 * grouped by page. A lesson with no audit says so and draws nothing else.
 */
export const CourseAudit = (props: CourseAuditProps) => {
    const { view, labels } = props
    const isLoading = props.isLoading === true
    if (!view.isAudited) {
        return (
            <Stack gap="region" measure="reading">
                <Alert tone="informative" title={labels.emptyTitle} description={labels.emptyText} />
            </Stack>
        )
    }
    return (
        <Stack gap="region" measure="reading">
            {view.paths.length === 0 ? null : (
                <Section title={labels.pathsTitle} headingLevel={2} isLoading={isLoading}>
                    <PathsTable paths={view.paths} labels={labels} isLoading={isLoading} />
                </Section>
            )}
            <Section title={labels.pagesTitle} headingLevel={2} isLoading={isLoading}>
                <Stack gap="row">
                    {view.pages.map((line) => (
                        <VerdictLine key={line.id} line={line} isLoading={isLoading} />
                    ))}
                </Stack>
            </Section>
            {view.cases.length === 0 ? null : (
                <Section title={labels.casesTitle} headingLevel={2}>
                    <Stack gap="region">
                        {view.cases.map((item) => (
                            <CaseBlock key={item.id} item={item} labels={labels} isLoading={isLoading} />
                        ))}
                    </Stack>
                </Section>
            )}
            {view.top.length === 0 ? null : (
                <Section title={labels.topTitle} headingLevel={2}>
                    <Stack gap="section">
                        {view.top.map((finding) => (
                            <FindingRow key={finding.id} finding={finding} labels={labels} withPage />
                        ))}
                    </Stack>
                </Section>
            )}
            <Section title={labels.allTitle} headingLevel={2}>
                {view.groups.length === 0 ? (
                    <Text as="p" tone="muted">
                        {labels.findingsEmpty}
                    </Text>
                ) : (
                    <Stack gap="region">
                        {view.groups.map((group) => (
                            <Section key={group.id} title={group.title} headingLevel={3}>
                                <Stack gap="section">
                                    {group.findings.map((finding) => (
                                        <FindingRow
                                            key={finding.id}
                                            finding={finding}
                                            labels={labels}
                                            withPage={false}
                                        />
                                    ))}
                                </Stack>
                            </Section>
                        ))}
                    </Stack>
                )}
            </Section>
        </Stack>
    )
}

/** One fact of the audit's card: its name and its value (`Findings còn mở` · `3`). */
export type CourseAuditFactView = {
    readonly id: string
    readonly label: string
    readonly value: string
}

/** What the rail of the Audit tab shows: the counts, the day it ran, the reader it played and what that reader must know first. */
export type CourseAuditRailView = {
    readonly title: string
    readonly facts: ReadonlyArray<CourseAuditFactView>
    readonly readerTitle: string
    /** The reader the audit played; empty draws no section. */
    readonly reader: string
    readonly prerequisitesTitle: string
    readonly prerequisites: ReadonlyArray<string>
}

/**
 * COMPOSITE - the rail of the Audit tab: one card with the counts as key and value rows (findings open and fixed, lint and biên tập, cases
 * by impact, rote cases, the day it ran), then the reader it played, then what that reader must know first.
 */
export const CourseAuditRail = (props: { readonly view: CourseAuditRailView; readonly isLoading?: boolean }) => {
    const { view } = props
    const isLoading = props.isLoading === true
    return (
        <SurfaceCard label={view.title} headingLevel={2} isLoading={isLoading}>
            <Stack gap="section">
                <Section
                    kind="list"
                    layout="keyValue"
                    ariaLabel={view.title}
                    isLoading={isLoading}
                    empty=""
                    items={view.facts.map((fact) => ({ id: fact.id, title: fact.label, value: fact.value }))}
                />
                {view.reader === "" ? null : (
                    <Section title={view.readerTitle} headingLevel={3}>
                        <Text as="p">
                            <NarrationText text={view.reader} />
                        </Text>
                    </Section>
                )}
                {view.prerequisites.length === 0 ? null : (
                    <Section
                        kind="list"
                        title={view.prerequisitesTitle}
                        headingLevel={3}
                        isLoading={isLoading}
                        empty=""
                        items={view.prerequisites.map((each) => ({
                            id: each,
                            title: each.replaceAll("`", ""),
                            titleContent: <NarrationText text={each} />,
                        }))}
                    />
                )}
            </Stack>
        </SurfaceCard>
    )
}
