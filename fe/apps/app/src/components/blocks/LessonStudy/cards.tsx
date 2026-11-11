import { Markdown, Section, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { ApplyEvidence, ChoiceCard, FilesCard, SimulationCard, WrittenCard } from "@starci-next/ui"
import type { LessonStudyActions, LessonStudyLabels, StudyCardView, WrittenDraftView } from "@/modules/types"
import { renderLessonCode } from "./code"
import { ChoiceWhy, ResultCard } from "./results"

/** What every card of the body needs besides its own data. */
export type CardEnv = {
    readonly labels: LessonStudyLabels
    readonly plansHref: string
    /** The destinations the completion card leads to. */
    readonly reviewHref: string
    readonly projectsHref: string
    readonly on: LessonStudyActions
    readonly isLoading: boolean
}

/** The section tabs of a theory phase, drawn as the filter zone that heads the reading card. */
export type SectionTabs = {
    readonly label: string
    readonly items: ReadonlyArray<{ readonly id: string; readonly label: string }>
    readonly selectedKey: string
    readonly onSelect: (key: string) => void
}

/** A written card whose own grade rows are left out: the grade stands in the result card after it. */
const ungraded = (draft: WrittenDraftView): WrittenDraftView => ({ ...draft, criteria: [], scoreLine: "" })

/** What a simulation block needs: its card and the environment. */
type SimulationBlockProps = { readonly card: Extract<StudyCardView, { kind: "simulation" }>; readonly env: CardEnv }

/** A simulation card and, once it reaches a goal, its debrief question as a written answer with its result. */
const SimulationBlock = (props: SimulationBlockProps) => {
    const { card, env } = props
    return (
        <Stack gap="section">
            <SimulationCard
                key={card.isRestored ? "restored" : "fresh"}
                prompt={card.prompt}
                initialStateId={card.initialStateId}
                states={card.states}
                actions={card.actions}
                transitions={card.transitions}
                initialSteps={card.initialSteps}
                initialTriedActionIds={card.initialTriedActionIds}
                labels={env.labels.simulation}
                onChange={(progress) => env.on.walk(card.id, progress)}
            />
            {card.isSuccess ? (
                <>
                    <WrittenCard
                        prompt={card.debrief}
                        criteria={[]}
                        instructions=""
                        draft={ungraded(card.draft)}
                        labels={env.labels.written}
                        plansHref={env.plansHref}
                        onChange={(text) => env.on.write(card.id, text)}
                        onSubmit={() => env.on.submitDebrief(card.id, card.draft.value)}
                    />
                    <ResultCard draft={card.draft} labels={env.labels.result} />
                </>
            ) : null}
        </Stack>
    )
}

/** What a choice card needs: its data, the environment and whether it is the quick check of a theory section. */
type ChoiceBlockProps = { readonly card: Extract<StudyCardView, { kind: "choice" }>; readonly env: CardEnv }

/**
 * A choice. The quick check after a theory section keeps the explanation of each option under it (graded answers saved); a prediction
 * shows the verdict and then one "why" card with the reason of each option in normal text.
 */
const ChoiceBlock = (props: ChoiceBlockProps) => {
    const { card, env } = props
    const isGraded = card.status === "graded"
    const body = (
        <ChoiceCard
            prompt={card.prompt}
            options={card.options}
            pickedId={card.pickedId}
            status={card.status}
            isCorrect={card.isCorrect}
            explanations={card.isCheck ? card.explanations : {}}
            labels={env.labels.choice}
            plansHref={env.plansHref}
            onPick={(optionId) => env.on.pick(card.id, optionId)}
            onSubmit={() => env.on.submitChoice(card.id, card.pickedId)}
        />
    )
    const saved =
        isGraded && card.savedAt !== "" ? (
            <Text size="xs" tone="muted">
                {env.labels.result.savedAt(card.savedAt)}
            </Text>
        ) : null
    const why =
        isGraded && !card.isCheck ? (
            <ChoiceWhy
                title={env.labels.result.why}
                options={card.options}
                explanations={card.explanations}
                correctId={card.correctId}
                correctWords={env.labels.choice.correct}
                markdownLabels={env.labels.markdown}
            />
        ) : null
    return card.isCheck ? (
        <Section title={env.labels.result.check} headingLevel={2}>
            {body}
            {saved}
        </Section>
    ) : (
        <Stack gap="row">
            {body}
            {saved}
            {why}
        </Stack>
    )
}

/** What the evidence block needs: its card and the environment. */
type EvidenceBlockProps = { readonly card: Extract<StudyCardView, { kind: "evidence" }>; readonly env: CardEnv }

/** The graded result of an evidence, once there is a grade. */
const evidenceResultOf = (draft: WrittenDraftView) =>
    draft.criteria.length === 0
        ? {}
        : {
              result: {
                  scoreLine: draft.scoreShort,
                  savedAt: draft.savedAt,
                  criteria: draft.criteria.map((each) => ({
                      id: each.id,
                      criterion: each.criterion,
                      level: each.level,
                      missing: each.missing,
                  })),
              },
          }

/** The evidence of an apply exercise: the red test output and the explanation, graded together. */
const EvidenceBlock = (props: EvidenceBlockProps) => {
    const { card, env } = props
    return (
        <ApplyEvidence
            task={card.task}
            outputValue={card.outputValue}
            explanationValue={card.explanationValue}
            status={card.draft.status}
            issue={card.draft.issue}
            {...evidenceResultOf(card.draft)}
            labels={env.labels.evidence}
            plansHref={env.plansHref}
            onOutputChange={(text) => env.on.writeEvidence(card.id, "output", text)}
            onExplanationChange={(text) => env.on.writeEvidence(card.id, "explanation", text)}
            onSubmit={() => env.on.submitEvidence(card.id, card.outputValue, card.explanationValue)}
        />
    )
}

/** What the files block needs: its card and the environment. */
type FilesBlockProps = { readonly card: Extract<StudyCardView, { kind: "files" }>; readonly env: CardEnv }

/** The files of a lab or an exercise, with the language switch when the lab ships several. */
const FilesBlock = (props: FilesBlockProps) => {
    const { card, env } = props
    return (
        <FilesCard
            label={env.labels.filesLabel}
            files={card.files}
            openLabel={env.labels.filesOpen}
            copyLabel={env.labels.markdown.copy ?? "Copy"}
            copiedLabel={env.labels.markdown.copied ?? "Copied"}
            closeLabel={env.labels.filesClose}
            {...(card.downloadHref === undefined || card.downloadLanguage === undefined
                ? {}
                : { downloadHref: card.downloadHref, downloadLabel: env.labels.filesDownload(card.downloadLanguage) })}
            {...(card.variants === undefined
                ? {}
                : {
                      variants: card.variants.map((variant) => ({
                          ...variant,
                          ...(variant.downloadHref === undefined
                              ? {}
                              : { downloadLabel: env.labels.filesDownload(variant.label) }),
                      })),
                      variantLabel: env.labels.languageLabel,
                      variant: card.selectedVariant ?? "typescript",
                      onVariant: env.on.pickLanguage,
                  })}
        />
    )
}

/** One card of the body with the environment it is drawn in; the reading card of a theory phase also carries the section tabs. */
type StudyCardProps = {
    readonly card: StudyCardView
    readonly env: CardEnv
    readonly sectionTabs?: SectionTabs
}

/** One card of the phase body, drawn by its kind. */
export const StudyCard = (props: StudyCardProps) => {
    const { card, env } = props
    switch (card.kind) {
        case "reading":
            return (
                <SurfaceCard
                    {...(props.sectionTabs === undefined ? { label: card.title } : { ariaLabel: card.title })}
                    {...(props.sectionTabs === undefined
                        ? {}
                        : { headers: [{ kind: "filter" as const, ...props.sectionTabs }] })}
                >
                    <Markdown source={card.markdown} labels={env.labels.markdown} renderCode={renderLessonCode} />
                </SurfaceCard>
            )
        case "choice":
            return <ChoiceBlock card={card} env={env} />
        case "written":
            return (
                <Stack gap="row">
                    <WrittenCard
                        prompt={card.prompt}
                        criteria={card.criteria}
                        instructions={card.instructions}
                        draft={ungraded(card.draft)}
                        labels={env.labels.written}
                        plansHref={env.plansHref}
                        onChange={(text) => env.on.write(card.id, text)}
                        onSubmit={() => env.on.submitWritten(card.id, card.draft.value)}
                    />
                    <ResultCard draft={card.draft} labels={env.labels.result} />
                </Stack>
            )
        case "simulation":
            return <SimulationBlock card={card} env={env} />
        case "evidence":
            return <EvidenceBlock card={card} env={env} />
        case "files":
            return <FilesBlock card={card} env={env} />
    }
}
