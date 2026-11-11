import { Alert, Button, Drawer, Input, Stack } from "@starci/grammar/common"
import { StepRows } from "./steps"
import type { DevicesPairLabels, DevicesPairPreview, DevicesPairStep } from "./types"

/** What the connect drawer needs: the words, the steps, the typed code with its outcome and the handlers. */
type ConnectDrawerProps = {
    readonly labels: DevicesPairLabels
    readonly steps: ReadonlyArray<DevicesPairStep>
    readonly code: string
    readonly preview: DevicesPairPreview | undefined
    readonly isCodeUnknown: boolean
    readonly canConfirm: boolean
    readonly isConfirming: boolean
    readonly notice: string
    readonly isNoticeError: boolean
    readonly isOpen: boolean
    readonly on: {
        readonly changeCode: (value: string) => void
        readonly confirm: () => void
        readonly setOpen: (isOpen: boolean) => void
    }
}

/** The connect drawer: the steps, the code from the terminal, the machine it names and the confirm. */
export const ConnectDrawer = (props: ConnectDrawerProps) => {
    return (
        <Drawer
            isOpen={props.isOpen}
            onOpenChange={props.on.setOpen}
            title={props.labels.connectTitle}
            closeLabel={props.labels.closeLabel}
        >
            <Stack gap="row">
                <StepRows steps={props.steps} />
                <Input
                    id="relay-pair-code"
                    name="userCode"
                    label={props.labels.codeLabel}
                    description={props.labels.codeHint}
                    placeholder={props.labels.codePlaceholder}
                    value={props.code}
                    onValueChange={props.on.changeCode}
                />
                {props.isCodeUnknown ? <Alert tone="negative" title={props.labels.codeUnknown} /> : null}
                {props.preview === undefined ? null : (
                    <Alert
                        tone="informative"
                        title={`${props.labels.previewTitle}: ${props.preview.name} · ${props.preview.detail}`}
                    />
                )}
                <Button
                    intent="commit"
                    onPress={props.on.confirm}
                    isDisabled={!props.canConfirm}
                    isPending={props.isConfirming}
                >
                    {props.isConfirming ? props.labels.confirming : props.labels.confirm}
                </Button>
                {props.notice === "" ? null : (
                    <Alert tone={props.isNoticeError ? "negative" : "affirmative"} title={props.notice} />
                )}
            </Stack>
        </Drawer>
    )
}
