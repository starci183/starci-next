import type {
    HarnessBuildSummaryView,
    HarnessBuildView,
    HarnessDocSummaryView,
    HarnessDocView,
    HarnessDoctorView,
    HarnessGuideSummaryView,
    HarnessGuideView,
    HarnessHubView,
    HarnessProbeResultView,
    HarnessStageView,
    HarnessTextView,
    HarnessTrapView,
} from "@modules/domain/harness"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type {
    BindHarnessBuildRequest,
    HarnessBuildRequest,
    HarnessDocRequest,
    HarnessDoctorRequest,
    HarnessGuideRequest,
    HarnessGuidesRequest,
    HarnessLocaleRequest,
    HarnessTrialsRequest,
} from "../../application/harness.contracts"
import type { BindHarnessBuildInput } from "./dto/bind-harness-build.input"
import type { HarnessBuildInput } from "./dto/harness-build.input"
import type { HarnessBuildSummaryType } from "./dto/harness-build-summary.type"
import type { HarnessBuildType } from "./dto/harness-build.type"
import type { HarnessDocInput } from "./dto/harness-doc.input"
import type { HarnessDocSummaryType } from "./dto/harness-doc-summary.type"
import type { HarnessDocType } from "./dto/harness-doc.type"
import type { HarnessDoctorInput } from "./dto/harness-doctor.input"
import type { HarnessDoctorType } from "./dto/harness-doctor.type"
import type { HarnessGuideInput } from "./dto/harness-guide.input"
import type { HarnessGuideSummaryType } from "./dto/harness-guide-summary.type"
import type { HarnessGuideType } from "./dto/harness-guide.type"
import type { HarnessGuidesInput } from "./dto/harness-guides.input"
import type { HarnessHubType } from "./dto/harness-hub.type"
import type { HarnessLocaleInput } from "./dto/harness-locale.input"
import type { HarnessProbeResultType } from "./dto/harness-probe-result.type"
import type { HarnessStageType } from "./dto/harness-stage.type"
import type { HarnessTextType } from "./dto/harness-text.type"
import type { HarnessTrapType } from "./dto/harness-trap.type"
import type { HarnessTrialsInput } from "./dto/harness-trials.input"

const authenticated = (identity: IdentityPrincipal): { readonly id: string; readonly role: "authenticated" } => ({
    id: identity.subject,
    role: "authenticated",
})

/** Maps the locale input and the session to the message params. */
export const toLocaleParams = (
    identity: IdentityPrincipal,
    input: HarnessLocaleInput,
): ExecuteParams<HarnessLocaleRequest> => ({
    request: { locale: input.locale },
    principal: authenticated(identity),
})

/** Maps the build input and the session to the message params. */
export const toHarnessBuildParams = (
    identity: IdentityPrincipal,
    input: HarnessBuildInput,
): ExecuteParams<HarnessBuildRequest> => ({
    request: { locale: input.locale, id: input.id },
    principal: authenticated(identity),
})

/** Maps the guides input and the session to the message params. */
export const toHarnessGuidesParams = (
    identity: IdentityPrincipal,
    input: HarnessGuidesInput,
): ExecuteParams<HarnessGuidesRequest> => ({
    request: { locale: input.locale, tool: input.tool },
    principal: authenticated(identity),
})

/** Maps the guide input and the session to the message params. */
export const toHarnessGuideParams = (
    identity: IdentityPrincipal,
    input: HarnessGuideInput,
): ExecuteParams<HarnessGuideRequest> => ({
    request: { locale: input.locale, tool: input.tool, slug: input.slug },
    principal: authenticated(identity),
})

/** Maps the doc input and the session to the message params. */
export const toHarnessDocParams = (
    identity: IdentityPrincipal,
    input: HarnessDocInput,
): ExecuteParams<HarnessDocRequest> => ({
    request: { locale: input.locale, slug: input.slug },
    principal: authenticated(identity),
})

/** Maps the doctor input and the session to the message params. */
export const toHarnessDoctorParams = (
    identity: IdentityPrincipal,
    input: HarnessDoctorInput,
): ExecuteParams<HarnessDoctorRequest> => ({
    request: { locale: input.locale, tool: input.tool },
    principal: authenticated(identity),
})

/** Maps the trials input and the session to the message params. */
export const toHarnessTrialsParams = (
    identity: IdentityPrincipal,
    input: HarnessTrialsInput,
): ExecuteParams<HarnessTrialsRequest> => ({
    request: { locale: input.locale, tool: input.tool ?? null },
    principal: authenticated(identity),
})

/** Maps the bind input and the session to the message params. */
export const toBindParams = (
    identity: IdentityPrincipal,
    input: BindHarnessBuildInput,
): ExecuteParams<BindHarnessBuildRequest> => ({
    request: { buildId: input.buildId, projectId: input.projectId },
    principal: authenticated(identity),
})

const upper = (value: string): string => value.toUpperCase().replace(/-/gu, "_")

const toTextTypes = (texts: ReadonlyArray<HarnessTextView>): Array<HarnessTextType> =>
    texts.map((text) => ({ ...text, run: [...text.run] }))

const toProbeTypes = (probes: ReadonlyArray<HarnessProbeResultView>): Array<HarnessProbeResultType> =>
    probes.map((probe) => ({ ...probe, status: upper(probe.status) }))

const toStageTypes = (stages: ReadonlyArray<HarnessStageView>): Array<HarnessStageType> =>
    stages.map((stage) => ({
        ...stage,
        state: upper(stage.state),
        e2e: stage.e2e.map((each) => ({ ...each, state: upper(each.state) })),
        steps: toTextTypes(stage.steps),
    }))

const toKeyTypes = (keys: HarnessBuildSummaryView["keys"]): HarnessBuildSummaryType["keys"] =>
    keys.map((key) => ({ ...key, anyOf: [...key.anyOf] }))

/** Maps the hub to its GraphQL type. */
export const toHarnessHubType = (view: HarnessHubView): HarnessHubType => ({
    parts: view.parts.map((part) => ({ ...part, key: upper(part.key) })),
})

/** Maps the build list to its GraphQL types. */
export const toHarnessBuildSummaryTypes = (
    views: ReadonlyArray<HarnessBuildSummaryView>,
): Array<HarnessBuildSummaryType> =>
    views.map((view) => ({ ...view, keys: toKeyTypes(view.keys), state: upper(view.state) }))

/** Maps one build to its GraphQL type. */
export const toHarnessBuildType = (view: HarnessBuildView): HarnessBuildType => ({
    ...view,
    keys: toKeyTypes(view.keys),
    state: upper(view.state),
    stages: toStageTypes(view.stages),
})

/** Maps the guide list to its GraphQL types. */
export const toHarnessGuideSummaryTypes = (
    views: ReadonlyArray<HarnessGuideSummaryView>,
): Array<HarnessGuideSummaryType> => views.map((view) => ({ ...view }))

/** Maps one guide to its GraphQL type. */
export const toHarnessGuideType = (view: HarnessGuideView): HarnessGuideType => ({
    ...view,
    sections: toTextTypes(view.sections),
    probes: toProbeTypes(view.probes),
})

/** Maps the doc list to its GraphQL types. */
export const toHarnessDocSummaryTypes = (views: ReadonlyArray<HarnessDocSummaryView>): Array<HarnessDocSummaryType> =>
    views.map((view) => ({ ...view }))

/** Maps one doc to its GraphQL type. */
export const toHarnessDocType = (view: HarnessDocView): HarnessDocType => ({
    ...view,
    sections: toTextTypes(view.sections),
})

/** Maps the doctor of a tool to its GraphQL type. */
export const toHarnessDoctorType = (view: HarnessDoctorView): HarnessDoctorType => ({
    ...view,
    probes: toProbeTypes(view.probes),
})

/** Maps the traps to their GraphQL types. */
export const toHarnessTrapTypes = (views: ReadonlyArray<HarnessTrapView>): Array<HarnessTrapType> =>
    views.map((view) => ({
        ...view,
        tools: [...view.tools],
        estimate: view.estimate === null ? null : { ...view.estimate },
        last:
            view.last === null
                ? null
                : { ...view.last, shortcuts: view.last.shortcuts.map((shortcut) => ({ ...shortcut })) },
    }))
