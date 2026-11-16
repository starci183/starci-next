import { Controller, Get, Param, StreamableFile } from "@nestjs/common"
import type { QueryBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessPackQuery, type GetHarnessPackRequest } from "../../application/get-harness-pack.query"

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/u

@Controller("api/relay/harness")
/**
 * The byte doors of /harness for a paired device (device token): the tarball whose sha256 a build manifest signed, the probe files
 * of a doctor tool and a trial trap folder. Free for everyone; a bad id is answered like an unknown one.
 */
export class HarnessPackController {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Streams `source/` and `e2e/` of a build as application/gzip; never `hidden/`. */
    @Get("build/:buildId/source.tgz")
    @Credential({ kind: "tool-token" })
    build(
        @CurrentCredential() credential: CredentialPrincipal,
        @Param("buildId") buildId: string,
    ): Promise<StreamableFile> {
        return this.stream(credential, "build", buildId, `${buildId}-source.tgz`)
    }

    /** Streams the probe files and fixtures of one doctor tool. */
    @Get("doctor/:tool/probes.tgz")
    @Credential({ kind: "tool-token" })
    doctor(@CurrentCredential() credential: CredentialPrincipal, @Param("tool") tool: string): Promise<StreamableFile> {
        return this.stream(credential, "doctor-pack", tool, `${tool}-probes.tgz`)
    }

    /** Streams one trial trap folder (`trap.yaml` and `repo/`). */
    @Get("trial/:trap/trap.tgz")
    @Credential({ kind: "tool-token" })
    trap(@CurrentCredential() credential: CredentialPrincipal, @Param("trap") trap: string): Promise<StreamableFile> {
        return this.stream(credential, "trap", trap, `${trap}-trap.tgz`)
    }

    private async stream(
        credential: CredentialPrincipal,
        kind: GetHarnessPackRequest["kind"],
        key: string,
        name: string,
    ): Promise<StreamableFile> {
        const found = await this.queryBus.execute(
            new GetHarnessPackQuery({
                request: {
                    device: { learnerId: credential.workspaceId, deviceId: credential.subject },
                    kind,
                    key: SLUG.test(key) ? key : "",
                },
            }),
        )
        return new StreamableFile(found.content, {
            type: "application/gzip",
            disposition: `attachment; filename="${name}"`,
            length: found.content.length,
        })
    }
}
