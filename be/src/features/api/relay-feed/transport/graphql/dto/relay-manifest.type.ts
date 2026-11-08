import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One allowlisted check of a manifest. */
export class RelayManifestCheckType {
    /** The check id the results name. */
    @Field(() => String)
    id!: string

    /** The exact command; the CLI shows it and asks before running it. */
    @Field(() => String)
    command!: string

    /** The folder it runs in, relative to the task workspace. */
    @Field(() => String)
    cwd!: string

    /** The longest it may run, in milliseconds. */
    @Field(() => Int)
    timeoutMs!: number
}

@ObjectType()
/** A signed task manifest: the checks, the exact signed text and its Ed25519 signature. */
export class RelayManifestType {
    /** The manifest id the ack names. */
    @Field(() => String)
    manifestId!: string

    /** The task. */
    @Field(() => String)
    taskId!: string

    /** The allowlisted checks. */
    @Field(() => [RelayManifestCheckType])
    checks!: ReadonlyArray<RelayManifestCheckType>

    /** The canonical JSON that was signed; the CLI verifies it and reads the checks from it. */
    @Field(() => String)
    payload!: string

    /** The base64 Ed25519 signature of the payload. */
    @Field(() => String)
    signature!: string
}
