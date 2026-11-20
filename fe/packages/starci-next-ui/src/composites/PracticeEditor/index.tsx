import { Button, Cluster, Section, Select, Stack, Text, Textarea } from "@starci/grammar/common"

/** One language the editor offers. */
export type PracticeLanguageOption = { readonly id: string; readonly label: string }

/** The words of the editor, resolved by its block. */
export type PracticeEditorLabels = {
    readonly title: string
    readonly language: string
    readonly code: string
    readonly judgeNote: string
    readonly reset: string
}

/** The code editor of a problem. The commands that run or submit it stand in the page header, not here. */
type PracticeEditorProps = {
    readonly labels: PracticeEditorLabels
    readonly languages: ReadonlyArray<PracticeLanguageOption>
    readonly language: string
    readonly value: string
    readonly onLanguage: (language: string) => void
    readonly onChange: (value: string) => void
    readonly onReset: () => void
    readonly isLoading?: boolean
}

/**
 * A plain editor: a head with a reset command, the language select with the judge note, and a code field (the Grammar textarea; Tab keeps
 * moving focus, so the editor is never a keyboard trap). No editor package is installed, so there is no syntax colour or line numbering yet.
 */
export const PracticeEditor = (props: PracticeEditorProps) => (
    <Section
        title={props.labels.title}
        headingLevel={2}
        isLoading={props.isLoading === true}
        action={
            <Button intent="dismiss" onPress={props.onReset}>
                {props.labels.reset}
            </Button>
        }
    >
        <Stack gap="row">
            <Cluster gap="inline" wrap align="center">
                <Select
                    label={props.labels.language}
                    isLabelHidden
                    name="practice-language"
                    options={props.languages.map((each) => ({ id: each.id, label: each.label }))}
                    value={props.language}
                    onValueChange={(next) => {
                        if (next !== null) props.onLanguage(next)
                    }}
                />
                <Text tone="muted">{props.labels.judgeNote}</Text>
            </Cluster>
            <Textarea
                label={props.labels.code}
                isLabelHidden
                name="practice-code"
                rows={16}
                value={props.value}
                onValueChange={props.onChange}
            />
        </Stack>
    </Section>
)
