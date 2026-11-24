import type { CliIo } from "./relay-client.contracts"
import { isRecord } from "./json.mapper"
import { writeDeviceKey } from "./lab-files.adapter"
import { newDeviceKey } from "./lab-sign.policy"
import { refusalLine } from "./relay-api.client"
import { REGISTER_DEVICE_KEY_MUTATION, relayGraphql } from "./relay-graphql.client"
import type { RelaySession } from "./task-run.cli"

/**
 * Makes this machine's Ed25519 key pair after a pairing: the private key stays in the settings folder (this user alone can read
 * it) and is never printed or sent, the public key (base64 SPKI DER) is registered with StarCi, which checks what this device
 * signs for a grade. A key made again replaces the old one. Answers whether StarCi accepted the public key.
 */
export const registerDeviceKey = async (io: CliIo, session: RelaySession): Promise<boolean> => {
    const key = newDeviceKey()
    writeDeviceKey(io.env, key.privatePem)
    const answer = await relayGraphql(io.fetch, session.baseUrl, session.token, REGISTER_DEVICE_KEY_MUTATION, {
        input: { publicKey: key.publicKey },
    })
    if (answer.kind === "refused") {
        io.err(`${refusalLine(answer)} This machine cannot grade labs until it is paired again.`)
        return false
    }
    const registered = answer.data.registerRelayDeviceKey
    if (!isRecord(registered) || registered.registered !== true) {
        io.err("StarCi did not confirm the device key. This machine cannot grade labs until it is paired again.")
        return false
    }
    io.out("Device key registered: this machine can sign lab grades.")
    return true
}
