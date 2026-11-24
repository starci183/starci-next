import { Alert, CopyField, Disclosure, Stack } from "@starci/grammar/common"

/** The npm package of the StarCi Relay and the command it installs. */
export const RELAY_PACKAGE = "@starci/next-relay"

/** The one global install command of the relay, shown under the technical details. */
export const RELAY_INSTALL_COMMAND: "npm i -g @starci/next-relay" = `npm i -g ${RELAY_PACKAGE}`

/** The pairing command a learner types once after the install. */
export const RELAY_LOGIN_COMMAND = "starci-relay login"

/** The words under "Chi tiết kỹ thuật": the fold, the label of each command and the copy states. */
export type NoMachineDetailsLabels = {
    readonly title: string
    readonly install: string
    readonly login: string
    readonly copy: string
    readonly copied: string
    readonly copyFailed: string
}

/** What the no-machine notice needs. */
type NoMachineNoticeProps = {
    readonly title: string
    readonly note: string
    readonly details: NoMachineDetailsLabels
}

/** The warning that no machine is connected, with the install and login commands folded under the technical details. */
export const NoMachineNotice = (props: NoMachineNoticeProps) => {
    const { details } = props
    const field = (label: string, value: string) => (
        <CopyField
            label={label}
            value={value}
            copyLabel={details.copy}
            copiedLabel={details.copied}
            copyErrorLabel={details.copyFailed}
        />
    )
    return (
        <Stack gap="row">
            <Alert tone="cautionary" title={props.title} description={props.note} />
            <Disclosure
                title={details.title}
                kind="quiet"
                defaultExpanded={false}
                headingLevel={3}
                body={
                    <Stack gap="row">
                        {field(details.install, RELAY_INSTALL_COMMAND)}
                        {field(details.login, RELAY_LOGIN_COMMAND)}
                    </Stack>
                }
            />
        </Stack>
    )
}
