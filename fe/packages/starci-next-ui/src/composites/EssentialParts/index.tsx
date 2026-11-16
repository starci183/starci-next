import {
    Alert,
    Badge,
    Button,
    Cluster,
    DataTable,
    FencedCodeBlock,
    Link,
    Markdown,
    MermaidDiagram,
    Progress,
    Section,
    Stack,
    Terminal,
    Text,
} from "@starci/grammar/common"
import { ChoiceCard } from "../ChoiceCard"
import { LessonCode } from "../LessonCode"
import { HighlightedCode } from "../../branches/HighlightedCode"
import type {
    ApplyPartView,
    ArticleSectionView,
    CompareRowView,
    EssentialPartsLabels,
    OpenerView,
    QuestionCardView,
    ScenarioCardView,
    ScenariosPartView,
    SourcePartView,
} from "./types"

export type {
    ApplyPartView,
    ArticleSectionView,
    CompareRowView,
    EssentialPartsLabels,
    OpenerView,
    QuestionCardView,
    QuestionLink,
    QuestionStatus,
    ScenarioCardView,
    ScenarioState,
    ScenariosPartView,
    SourcePartView,
} from "./types"

/** What a question needs: its view, the words and what the learner does. */
type QuestionProps = {
    readonly question: QuestionCardView
    readonly labels: EssentialPartsLabels
    readonly plansHref: string
    readonly onPick: (activityId: string, optionId: string) => void
    readonly onSubmit: (activityId: string, optionId: string) => void
}

/**
 * One multiple-choice interview question, graded on the spot by the server: the choice card, then, once graded, the verdict
 * with the explanation and where to read or see more (the section to read closely, the scenario that shows it).
 */
export const EssentialQuestion = (props: QuestionProps) => {
    const { question, labels } = props
    const isGraded = question.status === "graded"
    return (
        <Stack gap="row">
            <ChoiceCard
                prompt={question.prompt}
                options={question.choices}
                pickedId={question.pickedId}
                status={question.status}
                isSendFailed={question.isSendFailed}
                isCorrect={question.isCorrect}
                explanations={{}}
                labels={labels.choice}
                plansHref={props.plansHref}
                onPick={(optionId) => props.onPick(question.id, optionId)}
                onSubmit={() => props.onSubmit(question.id, question.pickedId)}
            />
            {isGraded && question.explanation !== "" ? (
                <Alert
                    title={question.isCorrect ? labels.opener.right : labels.opener.wrong}
                    tone={question.isCorrect ? "affirmative" : "negative"}
                    description={
                        <Stack gap="inline">
                            <Text>{question.explanation}</Text>
                            {question.isCorrect || question.links.length === 0 ? null : (
                                <Cluster gap="inline" label={labels.opener.readMore}>
                                    {question.links.map((link) => (
                                        <Link key={link.id} href={link.href}>
                                            {link.label}
                                        </Link>
                                    ))}
                                </Cluster>
                            )}
                        </Stack>
                    }
                />
            ) : null}
        </Stack>
    )
}

/** What the opener needs. */
type OpenerProps = {
    readonly opener: OpenerView
    readonly labels: EssentialPartsLabels
    readonly plansHref: string
    readonly onPick: (activityId: string, optionId: string) => void
    readonly onSubmit: (activityId: string, optionId: string) => void
    readonly onMove: (index: number) => void
}

/**
 * The opener of Bản chất: five multiple-choice interview questions, one at a time, with the step bar and the position, graded
 * at once; a wrong answer explains itself and marks the section to read closely. No free-text answer box.
 */
export const EssentialOpener = (props: OpenerProps) => {
    const { opener, labels } = props
    const question = opener.questions[opener.index]
    const answered = opener.questions.filter((each) => each.status === "graded").length
    if (question === undefined) return <Text tone="muted">{labels.opener.empty}</Text>
    return (
        <Section title={labels.opener.title} headingLevel={2} id="opener" meta={opener.position}>
            <Stack gap="row">
                <Progress
                    label={labels.opener.progress}
                    steps={{ total: opener.questions.length, completed: answered }}
                    valueText={opener.position}
                />
                <EssentialQuestion
                    question={question}
                    labels={labels}
                    plansHref={props.plansHref}
                    onPick={props.onPick}
                    onSubmit={props.onSubmit}
                />
                <Cluster gap="inline" justify="end">
                    {opener.index > 0 ? (
                        <Button intent="neutral" onPress={() => props.onMove(opener.index - 1)}>
                            {labels.opener.previous}
                        </Button>
                    ) : null}
                    {opener.index < opener.questions.length - 1 ? (
                        <Button
                            intent="neutral"
                            isDisabled={question.status !== "graded"}
                            onPress={() => props.onMove(opener.index + 1)}
                        >
                            {labels.opener.next}
                        </Button>
                    ) : null}
                </Cluster>
                {opener.score === "" ? null : <Text isStrong>{opener.score}</Text>}
            </Stack>
        </Section>
    )
}

/** What the article needs. */
type ArticleProps = {
    readonly sections: ReadonlyArray<ArticleSectionView>
    readonly labels: EssentialPartsLabels
}

/**
 * The article of Bản chất: the contents with "nên đọc kỹ" on the sections a wrong answer pointed at, then every section in
 * order, each its own anchor so a wrong answer can link to it. A locked section keeps its title.
 */
export const EssentialArticle = (props: ArticleProps) => {
    const { labels } = props
    return (
        <Stack gap="section">
            <Section
                kind="list"
                title={labels.article.toc}
                headingLevel={2}
                empty={labels.article.empty}
                items={props.sections.map((section, index) => ({
                    id: section.id,
                    title: `${index + 1}. ${section.title}`,
                    href: `#section-${section.id}`,
                    ...(section.isFlagged
                        ? { badges: [{ label: labels.article.flagged, tone: "warning" as const }] as const }
                        : {}),
                }))}
            />
            {props.sections.map((section) => (
                <Section key={section.id} title={section.title} headingLevel={2} id={`section-${section.id}`}>
                    {section.isLocked ? (
                        <Text tone="muted">{labels.article.locked}</Text>
                    ) : (
                        <Markdown
                            source={section.markdown}
                            labels={labels.markdown}
                            renderCode={(code) => <LessonCode code={code} />}
                        />
                    )}
                </Section>
            ))}
        </Stack>
    )
}

/** What the retake needs. */
type RetakeProps = {
    readonly rows: ReadonlyArray<CompareRowView>
    readonly labels: EssentialPartsLabels
    readonly onStart: () => void
}

/** The word of one side of the before-and-after. */
const sideOf = (side: CompareRowView["before"], labels: EssentialPartsLabels["retake"]) => {
    if (side === "none") return <Badge tone="muted">{labels.none}</Badge>
    return side === "right" ? <Badge tone="success">{labels.right}</Badge> : <Badge tone="danger">{labels.wrong}</Badge>
}

/** The end of the article: the same five questions again and, per question, the first answer against the newest. */
export const EssentialRetake = (props: RetakeProps) => {
    const labels = props.labels.retake
    return (
        <Section
            title={labels.title}
            headingLevel={2}
            description={labels.description}
            action={
                <Button intent="neutral" size="sm" onPress={props.onStart}>
                    {labels.start}
                </Button>
            }
        >
            <DataTable
                label={labels.title}
                rows={props.rows}
                columns={[
                    { id: "prompt", label: labels.question, isRowHeader: true, width: "fill" },
                    { id: "before", label: labels.before, width: "fit" },
                    { id: "after", label: labels.after, width: "fit" },
                ]}
                renderCell={(row, columnId) => {
                    if (columnId === "before") return sideOf(row.before, labels)
                    if (columnId === "after") return sideOf(row.after, labels)
                    return row.prompt
                }}
                emptyContent={labels.none}
            />
        </Section>
    )
}

/** What the source part needs. */
type SourceProps = { readonly source: SourcePartView; readonly labels: EssentialPartsLabels }

/**
 * Source: the two commands that pull and start the lesson's TypeScript source, the architecture (mermaid) with the rules each
 * component keeps, then the code walk: each snippet equal to the repository, tagged with its invariant and `file:line`.
 */
export const EssentialSource = (props: SourceProps) => {
    const { source, labels } = props
    return (
        <Stack gap="section">
            <Section title={labels.source.pullTitle} headingLevel={2} description={labels.source.pullNote}>
                <FencedCodeBlock code={source.pullCommand} language="bash" label={labels.source.pullTitle} />
            </Section>
            {source.diagram === "" ? null : (
                <Section title={labels.source.architecture} headingLevel={2}>
                    <Stack gap="row">
                        <MermaidDiagram
                            source={source.diagram}
                            label={labels.source.diagram}
                            errorTitle={labels.source.diagramError}
                        />
                        <DataTable
                            label={labels.source.components}
                            rows={source.components}
                            columns={[
                                { id: "name", label: labels.source.component, isRowHeader: true, width: "fit" },
                                { id: "port", label: labels.source.port, width: "fit" },
                                { id: "rules", label: labels.source.rules, width: "fill" },
                            ]}
                            renderCell={(row, columnId) => {
                                if (columnId === "port") return row.port
                                if (columnId === "rules") return row.rules
                                return row.name
                            }}
                            emptyContent={labels.source.empty}
                        />
                    </Stack>
                </Section>
            )}
            {source.codeWalk.map((entry) => (
                <Section key={entry.id} title={entry.title} headingLevel={2} fact={entry.location}>
                    <Stack gap="inline">
                        <Cluster gap="inline">
                            <Badge tone="accent">{entry.invariant}</Badge>
                        </Cluster>
                        <HighlightedCode code={entry.snippet} language="typescript" />
                        {entry.why === "" ? null : (
                            <Text tone="muted" size="sm">
                                {`${labels.source.why}: ${entry.why}`}
                            </Text>
                        )}
                    </Stack>
                </Section>
            ))}
        </Stack>
    )
}

/** The badge tone of a scenario state. */
const scenarioTone = (state: ScenarioCardView["state"]) => {
    if (state === "passed") return "success" as const
    if (state === "failed") return "danger" as const
    if (state === "running" || state === "guarded") return "warning" as const
    return "muted" as const
}

/** What the scenarios part needs. */
type ScenariosProps = {
    readonly part: ScenariosPartView
    readonly labels: EssentialPartsLabels
    readonly onSelect: (scenarioId: string) => void
}

/** The detail of the scenario on screen: the fault, the commands, what a correct system prints, the live run and, when red, why. */
const ScenarioDetail = (props: { readonly scenario: ScenarioCardView; readonly labels: EssentialPartsLabels }) => {
    const { scenario } = props
    const labels = props.labels.scenarios
    return (
        <Section
            title={scenario.title}
            headingLevel={2}
            meta={scenario.at}
            fact={scenario.stateLabel}
            id={`scenario-${scenario.id}`}
        >
            <Stack gap="row">
                <Text>{scenario.fault}</Text>
                <FencedCodeBlock
                    code={[scenario.runCommand, ...scenario.guardCommands].join("\n")}
                    language="bash"
                    label={labels.run}
                />
                <Text tone="muted" size="sm">{`${labels.expected}: ${scenario.expected}`}</Text>
                <Terminal
                    title={labels.output}
                    lines={scenario.output.length === 0 ? [labels.noOutput] : scenario.output}
                    isLoading={scenario.state === "running"}
                />
                {scenario.state === "failed" ? (
                    <Stack gap="row">
                        <Alert
                            title={labels.why}
                            tone="negative"
                            description={
                                <Stack gap="identity">
                                    {scenario.why === "" ? null : <Text>{scenario.why}</Text>}
                                    <Text size="sm">{`${labels.invariant}: ${scenario.invariant}`}</Text>
                                    {scenario.hint === "" ? null : (
                                        <Text size="sm" tone="muted">{`${labels.hint}: ${scenario.hint}`}</Text>
                                    )}
                                </Stack>
                            }
                        />
                        <Section title={labels.askAi} headingLevel={3} description={labels.askAiNote}>
                            <Stack gap="row">
                                <FencedCodeBlock code={scenario.fixPrompt} language="text" label={labels.prompt} />
                                <FencedCodeBlock code={scenario.checkCommand} language="bash" label={labels.check} />
                            </Stack>
                        </Section>
                    </Stack>
                ) : null}
            </Stack>
        </Section>
    )
}

/**
 * Kịch bản: every scenario with the state of its newest relayed run (the page polls while one is in flight), and the one on
 * screen: run it, switch a guard off to see the fault land, read why it is red, and hand the fix to your AI; `check` judges.
 */
export const EssentialScenarios = (props: ScenariosProps) => {
    const { part, labels } = props
    const selected = part.scenarios.find((each) => each.id === part.selectedId) ?? part.scenarios[0]
    return (
        <Stack gap="section">
            <Section
                kind="list"
                title={labels.scenarios.list}
                headingLevel={2}
                meta={part.summary}
                empty={labels.scenarios.empty}
                items={part.scenarios.map((scenario) => ({
                    id: scenario.id,
                    title: scenario.title,
                    description: scenario.fault,
                    badges: [{ label: scenario.stateLabel, tone: scenarioTone(scenario.state) }] as const,
                    onPress: () => props.onSelect(scenario.id),
                    ...(scenario.id === selected?.id ? { state: "informative" as const } : {}),
                }))}
            />
            {selected === undefined ? null : <ScenarioDetail scenario={selected} labels={labels} />}
        </Stack>
    )
}

/** What the apply part needs. */
type ApplyProps = {
    readonly part: ApplyPartView
    readonly labels: EssentialPartsLabels
    readonly plansHref: string
    readonly onSelect: (challengeId: string) => void
    readonly onPick: (activityId: string, optionId: string) => void
    readonly onSubmit: (activityId: string, optionId: string) => void
}

/**
 * Tự áp dụng: the ladder easy, medium, hard, insane; the rung on screen with its brief, its rubric of 100 points (one
 * critical criterion), the essence check graded on the spot, the hidden scenarios run through the CLI ("Đang luyện") and the
 * way to proof (CI with OIDC, "Đã chứng minh").
 */
export const EssentialApply = (props: ApplyProps) => {
    const { part, labels } = props
    const challenge = part.challenge
    return (
        <Stack gap="section">
            <Section
                kind="list"
                title={labels.apply.ladder}
                headingLevel={2}
                empty={labels.apply.empty}
                items={part.rungs.map((rung) => ({
                    id: rung.id,
                    title: `${rung.level} · ${rung.title}`,
                    badges: [{ label: rung.state }] as const,
                    onPress: () => props.onSelect(rung.id),
                    ...(rung.id === part.selectedId ? { state: "informative" as const } : {}),
                }))}
            />
            {challenge === undefined ? null : (
                <Stack gap="section">
                    <Section title={challenge.heading} headingLevel={2}>
                        <Markdown
                            source={challenge.brief}
                            labels={labels.markdown}
                            renderCode={(code) => <LessonCode code={code} />}
                        />
                    </Section>
                    <Section
                        kind="list"
                        title={labels.apply.rubric}
                        headingLevel={2}
                        empty={labels.apply.empty}
                        items={challenge.rubric.map((criterion) => ({
                            id: criterion.id,
                            title: criterion.criterion,
                            badges: criterion.isCritical
                                ? ([
                                      { label: criterion.points, tone: "accent" as const },
                                      { label: labels.apply.critical, tone: "accent" as const },
                                  ] as const)
                                : ([{ label: criterion.points }] as const),
                        }))}
                    />
                    {challenge.isLocked ? (
                        <Text tone="muted">{labels.apply.locked}</Text>
                    ) : (
                        <Stack gap="section">
                            {challenge.questions.length === 0 ? null : (
                                <Section title={labels.apply.essence} headingLevel={2}>
                                    <Stack gap="row">
                                        {challenge.questions.map((question) => (
                                            <EssentialQuestion
                                                key={question.id}
                                                question={question}
                                                labels={labels}
                                                plansHref={props.plansHref}
                                                onPick={props.onPick}
                                                onSubmit={props.onSubmit}
                                            />
                                        ))}
                                    </Stack>
                                </Section>
                            )}
                            <Section title={labels.apply.hidden} headingLevel={2} fact={challenge.hiddenState}>
                                <FencedCodeBlock code={challenge.runCommand} language="bash" label={labels.apply.run} />
                            </Section>
                            <Section title={labels.apply.proof} headingLevel={2}>
                                <Text tone="muted">{labels.apply.proofSteps}</Text>
                            </Section>
                        </Stack>
                    )}
                </Stack>
            )}
        </Stack>
    )
}
