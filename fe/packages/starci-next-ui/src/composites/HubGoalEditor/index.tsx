import { Button, ChoiceChips, Cluster, Stack, Text } from "@starci/grammar/common"

/** One choice of the weekly goal. */
export type HubGoalOption = { readonly value: string; readonly label: string }

/** The state of the goal editor, owned by the connected block. */
export type HubGoalEditorState = {
    readonly isOpen: boolean
    readonly value: string
    readonly isPending: boolean
}

/** The fixed words of the goal editor. */
export type HubGoalEditorLabels = {
    readonly open: string
    readonly groupLabel: string
    readonly options: ReadonlyArray<HubGoalOption>
    readonly save: string
    readonly cancel: string
    /** The result of the last save, or empty. */
    readonly status: string
}

/** Editing the weekly goal: a command that opens the choices of 2 to 7 days, with save and close. */
type HubGoalEditorProps = {
    readonly state: HubGoalEditorState
    readonly labels: HubGoalEditorLabels
    readonly onOpenChange: (isOpen: boolean) => void
    readonly onChoose: (value: string) => void
    readonly onSave: () => void
}

/** The weekly-goal control of the streak card. */
export const HubGoalEditor = (props: HubGoalEditorProps) => {
    if (!props.state.isOpen) {
        return (
            <Button intent="neutral" onPress={() => props.onOpenChange(true)}>
                {props.labels.open}
            </Button>
        )
    }
    return (
        <Stack gap="row">
            <ChoiceChips
                label={props.labels.groupLabel}
                options={props.labels.options}
                value={props.state.value}
                onValueChange={props.onChoose}
                empty={null}
                width="fill"
            />
            <Cluster gap="row">
                <Button intent="commit" onPress={props.onSave} isPending={props.state.isPending}>
                    {props.labels.save}
                </Button>
                <Button intent="neutral" onPress={() => props.onOpenChange(false)}>
                    {props.labels.cancel}
                </Button>
            </Cluster>
            <Text tone="muted" size="xs">
                {props.labels.status}
            </Text>
        </Stack>
    )
}
