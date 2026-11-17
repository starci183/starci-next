import { Button, Cluster, Dialog } from "@starci/grammar/common"

/** The words of the end-of-interview dialog, resolved by its block. */
export type InterviewEndDialogLabels = {
    readonly end: string
    readonly endTitle: string
    readonly endDescription: string
    readonly noAnswer: string
    readonly endConfirm: string
    readonly endCancel: string
    readonly endAbandon: string
}

/** The dialog that ends an interview. */
type InterviewEndDialogProps = {
    readonly labels: InterviewEndDialogLabels
    readonly isOpen: boolean
    /** True once at least one question was answered: the end then grades, otherwise it abandons. */
    readonly hasAnswer: boolean
    readonly onOpenChange: (isOpen: boolean) => void
    readonly onSubmit: () => void
    readonly onAbandon: () => void
}

/** The end of the interview: a dialog that asks before it grades, or abandons when nothing was answered. */
export const InterviewEndDialog = (props: InterviewEndDialogProps) => {
    const words = props.hasAnswer ? props.labels.endDescription : props.labels.noAnswer
    return (
        <Dialog
            isOpen={props.isOpen}
            onOpenChange={props.onOpenChange}
            title={props.labels.endTitle}
            description={words}
            closeLabel={props.labels.endCancel}
            trigger={<Button intent="dismiss">{props.labels.end}</Button>}
            footer={
                <Cluster gap="inline" wrap justify="end">
                    <Button intent="dismiss" onPress={() => props.onOpenChange(false)}>
                        {props.labels.endCancel}
                    </Button>
                    {props.hasAnswer ? (
                        <Button intent="commit" onPress={props.onSubmit}>
                            {props.labels.endConfirm}
                        </Button>
                    ) : (
                        <Button intent="neutral" onPress={props.onAbandon}>
                            {props.labels.endAbandon}
                        </Button>
                    )}
                </Cluster>
            }
        />
    )
}
