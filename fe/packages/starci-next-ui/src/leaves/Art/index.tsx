import type { ReactElement } from "react"
import { Image } from "@starci/grammar/common"

/** One piece of the lesson art as the app serves it: its path under `public/` and its intrinsic size, so the box is reserved before it loads. */
type ArtAsset = {
    readonly src: string
    readonly width: number
    readonly height: number
}

/** A stage picture, 960 by 640. */
const stage = (name: string): ArtAsset => ({ src: `/art/${name}.webp`, width: 960, height: 640 })

/** The names of the generic art pieces. */
type ArtName =
    | "teacher"
    | "journey"
    | "map"
    | "ask"
    | "predictRun"
    | "whatBreaks"
    | "explain"
    | "fixCode"
    | "interview"
    | "prove"
    | "remember"

/** The generic 3D art of the product, by name; every one is decorative (empty `alt`). */
export const ART: Readonly<Record<ArtName, ArtAsset>> = {
    teacher: { src: "/art/teacher-3d.webp", width: 320, height: 320 },
    journey: { src: "/art/pro-learning-journey-v1.webp", width: 960, height: 540 },
    map: stage("stage-map"),
    ask: stage("stage-ask"),
    predictRun: stage("stage-predict-run"),
    whatBreaks: stage("stage-what-breaks"),
    explain: stage("stage-explain"),
    fixCode: stage("stage-fix-code"),
    interview: stage("stage-interview"),
    prove: stage("stage-prove"),
    remember: stage("stage-remember"),
}

/** The picture of each lesson phase; the overview has none. */
export const PHASE_ART: Readonly<Record<string, ArtAsset>> = {
    challenge: ART.ask,
    predict: ART.predictRun,
    explore: ART.whatBreaks,
    explain: ART.explain,
    apply: ART.fixCode,
    reflect: ART.interview,
    review: ART.remember,
}

/** The picture of each group of the approved tree on its topic pages. */
const GROUP_ART: Readonly<Record<string, ArtAsset>> = {
    backend: ART.fixCode,
    frontend: ART.predictRun,
    data: ART.explain,
    caching: ART.remember,
    messaging: ART.predictRun,
    realtime: ART.whatBreaks,
    distributed: ART.explain,
    security: ART.prove,
    testing: ART.whatBreaks,
    observability: ART.whatBreaks,
    infra: ART.map,
    delivery: ART.prove,
    cloud: ART.map,
    integrations: ART.ask,
    ai: ART.interview,
    casestudy: ART.prove,
}

/** The topic picture of a group; a group with none falls back to the map. */
export const groupArtOf = (group: string): ArtAsset => GROUP_ART[group] ?? ART.map

/** What {@link ArtImage} draws. */
type ArtImageProps = { readonly asset: ArtAsset }

/** A decorative art image at its own aspect: width and height reserve the box, so nothing shifts when it loads. */
export const ArtImage = (props: ArtImageProps): ReactElement => (
    <Image src={props.asset.src} alt="" width={props.asset.width} height={props.asset.height} loading="lazy" />
)
