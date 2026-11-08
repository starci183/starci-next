import { Button, Cluster, Select, Stack, SurfaceCard, Text, Textarea } from "@starci/grammar/common"

/** One language the editor offers. */
export type PracticeLanguageOption = { readonly id: string; readonly label: string }

/** The words of the editor, resolved by its block. */
export type PracticeEditorLabels = {
    readonly title: string
    readonly language: string
    readonly code: string
    readonly judgeNote: string
    readonly run: string
    readonly submit: string
    readonly reset: string
    readonly working: string
    readonly draftSaved: string
}

/** The code editor of a problem and its actions. */
type PracticeEditorProps = {
    readonly labels: PracticeEditorLabels
    readonly languages: ReadonlyArray<PracticeLanguageOption>
    readonly language: string
    readonly value: string
    /** True while a run or a submission is in flight: the actions wait, the code stays editable. */
    readonly isBusy: boolean
    /** True when the reader may not run (the problem is locked, or the code is empty). */
    readonly isDisabled: boolean
    readonly onLanguage: (language: string) => void
    readonly onChange: (value: string) => void
    readonly onReset: () => void
    readonly onRun: () => void
    readonly onSubmit: () => void
}

/**
 * A plain editor: the language select, a code field (the Grammar textarea; Tab keeps moving focus, so the editor is never a
 * keyboard trap) and the run (example only) and submit (all tests) actions. No editor package is installed.
 */
export const PracticeEditor = (props: PracticeEditorProps) => (
    <SurfaceCard label={props.labels.title}>
        <Stack gap="row">
            <Cluster gap="row" wrap align="end" justify="between">
                <Select
                    label={props.labels.language}
                    name="practice-language"
                    options={props.languages.map((each) => ({ id: each.id, label: each.label }))}
                    value={props.language}
                    onValueChange={(next) => {
                        if (next !== null) props.onLanguage(next)
                    }}
                />
                <Text size="sm" tone="muted">
                    {props.labels.judgeNote}
                </Text>
            </Cluster>
            <Textarea
                label={props.labels.code}
                name="practice-code"
                rows={18}
                value={props.value}
                onValueChange={props.onChange}
            />
            <Cluster gap="inline" wrap align="center">
                <Button intent="neutral" isDisabled={props.isDisabled || props.isBusy} onPress={props.onRun}>
                    {props.labels.run}
                </Button>
                <Button
                    intent="commit"
                    isPending={props.isBusy}
                    isDisabled={props.isDisabled || props.isBusy}
                    onPress={props.onSubmit}
                >
                    {props.isBusy ? props.labels.working : props.labels.submit}
                </Button>
                <Button intent="dismiss" isDisabled={props.isBusy} onPress={props.onReset}>
                    {props.labels.reset}
                </Button>
                <Text size="sm" tone="muted">
                    {props.labels.draftSaved}
                </Text>
            </Cluster>
        </Stack>
    </SurfaceCard>
)
