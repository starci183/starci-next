import { Dialog } from "@starci/grammar/common"
import { AuthPanel } from "@/components/blocks/AuthPanel"

/** The modal's words, whether it is open, and the path the reader keeps (also where a social sign-in returns to). */
export type SignInModalBaseProps = {
    readonly props: {
        readonly isOpen: boolean
        readonly title: string
        readonly closeLabel: string
        readonly returnTo: string
    }
    readonly on: { readonly openChange: (isOpen: boolean) => void }
}

/** The sign-in flow (password, emailed code, social) in a grammar dialog above the page; a finished sign-in closes it in place. */
export const SignInModalBase = (props: SignInModalBaseProps) => (
    <Dialog
        isOpen={props.props.isOpen}
        onOpenChange={props.on.openChange}
        title={props.props.title}
        closeLabel={props.props.closeLabel}
        size="sm"
    >
        <AuthPanel
            mode="signIn"
            notice={undefined}
            destination={props.props.returnTo}
            returnTo={props.props.returnTo}
            presentation="modal"
            onDone={() => props.on.openChange(false)}
        />
    </Dialog>
)
