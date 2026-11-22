import type { ReactElement } from "react"
import { Image } from "@starci/grammar/common"

/** One piece of the lesson art as the app serves it: its staticsKey (the path under `statics/`) and its intrinsic size, so the box is reserved before it loads. */
type ArtAsset = {
    readonly key: string
    readonly width: number
    readonly height: number
}

/** A stage picture, 960 by 640. */
const stage = (name: string): ArtAsset => ({ key: `art/${name}.webp`, width: 960, height: 640 })

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
    teacher: { key: "art/teacher-3d.webp", width: 320, height: 320 },
    journey: { key: "art/pro-learning-journey-v1.webp", width: 960, height: 540 },
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
type ArtImageProps = {
    readonly asset: ArtAsset
    /** The public base of the statics (`NEXT_PUBLIC_STATICS_URL`), read once by the app. */ readonly base: string
    /** The widest the picture draws, in pixels; without it the picture fills its box (a header slot or a hero must set it). */
    readonly maxWidth?: number
}

/** A decorative art image at its own aspect: width and height reserve the box, so nothing shifts when it loads. */
export const ArtImage = (props: ArtImageProps): ReactElement => {
    const image = (
        <Image
            src={`${props.base}/${props.asset.key}`}
            alt=""
            width={props.asset.width}
            height={props.asset.height}
            loading="lazy"
        />
    )
    return props.maxWidth === undefined ? (
        image
    ) : (
        <div style={{ width: "100%", maxWidth: props.maxWidth, flexShrink: 0 }}>{image}</div>
    )
}

/** The v2 clay-3D pictures, 960 by 640, under `art/v2/`; the same sets of ids as the files in `statics/art/v2`. */
const v2 = (name: string): ArtAsset => ({ key: `art/v2/${name}.webp`, width: 960, height: 640 })

/** The lessons that have their own picture (Essentials, one per lesson). */
const LESSON_ART_IDS = ["outbox-idempotency", "distributed-cache"] as const
/** The topics that have their own picture. */
const TOPIC_ART_IDS = ["api-reliability", "caching", "databases", "messaging", "observability"] as const
/** The area heroes and the empty, locked and milestone pictures. */
const AREA_ART_NAMES = [
    "essentials",
    "projects",
    "auth",
    "cv",
    "empty-essentials",
    "empty-projects",
    "locked",
    "milestone",
] as const

/** The name of an area picture. */
export type AreaArtName = (typeof AREA_ART_NAMES)[number]

/** The picture of an Essentials lesson by its id; a lesson without one gets the essentials hero, so a page never branches on it. */
export const lessonArt = (id: string): ArtAsset =>
    (LESSON_ART_IDS as readonly string[]).includes(id) ? v2(`lesson-${id}`) : v2("area-essentials")

/** The picture of an Essentials topic by its id; a topic without one gets the essentials hero. */
export const topicArt = (id: string): ArtAsset =>
    (TOPIC_ART_IDS as readonly string[]).includes(id) ? v2(`topic-${id}`) : v2("area-essentials")

/** The hero or state picture of an area. */
export const areaArt = (name: AreaArtName): ArtAsset => v2(`area-${name}`)
