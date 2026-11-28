import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A text of the lab record: Vietnamese, and English when the record carries it. */
export class CourseTextType {
    /** Vietnamese. */
    @Field(() => String)
    vi!: string

    /** English, or null when the record has none. */
    @Field(() => String, { nullable: true })
    en!: string | null
}

@ObjectType()
/** A text of the lab record in both languages. */
export class CourseBilingualType {
    /** Vietnamese. */
    @Field(() => String)
    vi!: string

    /** English. */
    @Field(() => String)
    en!: string
}

@ObjectType()
/** One invariant statement of the lab. */
export class CourseInvariantType extends CourseBilingualType {
    /** The invariant id. */
    @Field(() => String)
    id!: string
}

@ObjectType()
/** One chaos switch a case runs under. */
export class CourseChaosType {
    /** The switch key. */
    @Field(() => String)
    key!: string

    /** The switch value, as text. */
    @Field(() => String)
    value!: string
}

@ObjectType()
/** One chaos switch of the lab with the label the lab declares for it. */
export class CourseChaosLabelType {
    /** The switch key. */
    @Field(() => String)
    id!: string

    /** The label in both languages. */
    @Field(() => CourseBilingualType)
    label!: CourseBilingualType
}

@ObjectType()
/** One hint level of a case for the learner: the text only once the level is open. */
export class CourseHintType {
    /** The level, 1 to 3. */
    @Field(() => Int)
    level!: number

    /** The hint text, or null while the level is closed. */
    @Field(() => String, { nullable: true })
    text!: string | null

    /** Whether the learner opened this level. */
    @Field(() => Boolean)
    unlocked!: boolean
}

@ObjectType()
/** What page 5 says of one case. */
export class CourseRecapType {
    /** What the learner did. */
    @Field(() => CourseTextType)
    did!: CourseTextType

    /** What the customer gains. */
    @Field(() => CourseTextType)
    gain!: CourseTextType

    /** The English name of the idea. */
    @Field(() => String)
    en!: string
}

@ObjectType()
/** The file and the lines one case checks: the page lights them when the case is picked. */
export class CourseFocusType {
    /** The path of the learner file in the lab. */
    @Field(() => String)
    file!: string

    /** The 1-based lines. */
    @Field(() => [Int])
    lines!: ReadonlyArray<number>
}

@ObjectType()
/** One happy or unhappy case of the lab. */
export class CourseCaseSpecType {
    /** The case id. */
    @Field(() => String)
    id!: string

    /** The title in both languages. */
    @Field(() => CourseBilingualType)
    title!: CourseBilingualType

    /** The chaos the case runs under. */
    @Field(() => [CourseChaosType])
    chaos!: ReadonlyArray<CourseChaosType>

    /** The ids of the invariants the case must keep. */
    @Field(() => [String])
    invariants!: ReadonlyArray<string>

    /** The term the case teaches, or null for a happy case. */
    @Field(() => String, { nullable: true })
    teaches!: string | null

    /** The hint levels; empty for a happy case. */
    @Field(() => [CourseHintType])
    hints!: ReadonlyArray<CourseHintType>

    /** Whether a reference step exists to reset to. */
    @Field(() => Boolean)
    hasReference!: boolean

    /** The interviewer's follow-up question the case answers, or null. */
    @Field(() => CourseTextType, { nullable: true })
    question!: CourseTextType | null

    /** What the learner did, what the customer gains and the English name; null until the case was green once, or when the record has none. */
    @Field(() => CourseRecapType, { nullable: true })
    recap!: CourseRecapType | null

    /** The situation the case creates, one line of narration (inline markdown); null when the record has none. */
    @Field(() => CourseTextType, { nullable: true })
    situation!: CourseTextType | null

    /** The file and lines the case checks; null when the record names none. */
    @Field(() => CourseFocusType, { nullable: true })
    focus!: CourseFocusType | null
}

@ObjectType()
/** One term learner-facing words may name. */
export class CourseAllowedTermType {
    /** The term id. */
    @Field(() => String)
    id!: string

    /** The term. */
    @Field(() => String)
    term!: string
}

@ObjectType()
/** One service of the lab's declared stack. */
export class CourseServiceType {
    /** The service id. */
    @Field(() => String)
    id!: string

    /** The port it listens on. */
    @Field(() => Int)
    port!: number

    /** Its own database, or null. */
    @Field(() => String, { nullable: true })
    db!: string | null

    /** The dependencies it uses. */
    @Field(() => [String])
    uses!: ReadonlyArray<string>

    /** What it does. */
    @Field(() => CourseTextType)
    role!: CourseTextType

    /** The name of its logo on the drawing, or null. */
    @Field(() => String, { nullable: true })
    icon!: string | null
}

@ObjectType()
/** One backing dependency of the lab's declared stack. */
export class CourseDepType {
    /** The dependency id. */
    @Field(() => String)
    id!: string

    /** The image it runs. */
    @Field(() => String)
    image!: string

    /** What it is for. */
    @Field(() => CourseTextType)
    role!: CourseTextType

    /** The name of its logo on the drawing, or null. */
    @Field(() => String, { nullable: true })
    icon!: string | null
}

@ObjectType()
/** The stack the lab declares. */
export class CourseStackType {
    /** The language. */
    @Field(() => String)
    language!: string

    /** The runtime. */
    @Field(() => String)
    runtime!: string

    /** The test runner. */
    @Field(() => String)
    test!: string

    /** The services. */
    @Field(() => [CourseServiceType])
    services!: ReadonlyArray<CourseServiceType>

    /** The backing dependencies. */
    @Field(() => [CourseDepType])
    deps!: ReadonlyArray<CourseDepType>

    /** Where the lab runs (`docker`), or null. */
    @Field(() => String, { nullable: true })
    host!: string | null
}

@ObjectType()
/** The dimensions of the hidden grading matrix, never its cells. */
export class CourseGraderType {
    /** The steps of the matrix. */
    @Field(() => [String])
    steps!: ReadonlyArray<string>

    /** The faults of the matrix. */
    @Field(() => [String])
    faults!: ReadonlyArray<string>
}

@ObjectType()
/** One file of the NestJS version and where it comes from in the Express lab. */
export class CourseNestMapType {
    /** The path in the lab. */
    @Field(() => String)
    from!: string

    /** The path in the NestJS version. */
    @Field(() => String)
    to!: string
}

@ObjectType()
/** One file of a production repository, its link pinned to a commit. */
export class CourseProductionFileType {
    /** The path in the repository. */
    @Field(() => String)
    path!: string

    /** The link, pinned to a full commit sha. */
    @Field(() => String)
    url!: string
}

@ObjectType()
/** How a production repository handles one unhappy case: `yes`, `engine`, `partial`, `no`, `manual` or `unknown`. */
export class CourseProductionShowType {
    /** The unhappy case id. */
    @Field(() => String)
    caseId!: string

    /** How the repository handles it. */
    @Field(() => String)
    value!: string
}

@ObjectType()
/** One language folder of the standard reference repository. */
export class CourseReferenceVariantType {
    /** The id the learner types after `--lang` (`typescript`). */
    @Field(() => String)
    lang!: string

    /** The language and framework as a label (`TypeScript · NestJS`). */
    @Field(() => String)
    label!: string

    /** `ready` when the folder exists at the pinned commit, `soon` when it is only announced. */
    @Field(() => String)
    status!: string

    /** The folder at the repository root. */
    @Field(() => String)
    folder!: string
}

@ObjectType()
/**
 * The standard reference repository of the lesson (`starci-next/essential-<lesson>`), one row beside the production repositories: a
 * link to one language folder pinned to a commit, never file text.
 */
export class CourseReferenceType {
    /** `owner/name`. */
    @Field(() => String)
    repo!: string

    /** The full commit sha the link is pinned to. */
    @Field(() => String)
    commit!: string

    /** The language and framework of the folder linked. */
    @Field(() => String)
    lang!: string

    /** The language folder at the pinned commit. */
    @Field(() => String)
    url!: string

    /** The day the comparison was read at that commit. */
    @Field(() => String)
    checked!: string

    /** The relay command that puts the folder next to the learner's lab. */
    @Field(() => String)
    command!: string

    /** One entry per unhappy case. */
    @Field(() => [CourseProductionShowType])
    shows!: ReadonlyArray<CourseProductionShowType>

    /** How it does it and how that differs from the learner's file. */
    @Field(() => CourseTextType)
    note!: CourseTextType

    /** The language folders of the repository, the default first: `ready` ones exist at the commit, `soon` ones are announced. */
    @Field(() => [CourseReferenceVariantType])
    variants!: ReadonlyArray<CourseReferenceVariantType>

    /** The technology icon names read from the repository (`typescript`, `nestjs`, `postgresql`); empty when not declared. */
    @Field(() => [String])
    stack!: ReadonlyArray<string>

    /** The main packages of the ready folder (`@nestjs/core`, `pg`); empty when not declared. */
    @Field(() => [String])
    libs!: ReadonlyArray<string>
}

@ObjectType()
/** One public repository the learner's file is compared with on the last page. */
export class CourseProductionType {
    /** `owner/name`. */
    @Field(() => String)
    repo!: string

    /** The language. */
    @Field(() => String)
    lang!: string

    /** The day the files were checked, or null. */
    @Field(() => String, { nullable: true })
    checked!: string | null

    /** The files read, pinned to a commit. */
    @Field(() => [CourseProductionFileType])
    files!: ReadonlyArray<CourseProductionFileType>

    /** One entry per unhappy case. */
    @Field(() => [CourseProductionShowType])
    shows!: ReadonlyArray<CourseProductionShowType>

    /** How it does it and how that differs from the learner's file. */
    @Field(() => CourseTextType)
    note!: CourseTextType
}

@ObjectType()
/** The interview scene the first page opens with. */
export class CourseHookType {
    /** A title that names no concept of the lesson, or null. */
    @Field(() => CourseTextType, { nullable: true })
    title!: CourseTextType | null

    /** The moment of the interview, or null; the page does not draw it (owner 2026-11-28). */
    @Field(() => CourseTextType, { nullable: true })
    when!: CourseTextType | null

    /** Who asks the question ("Chị trưởng nhóm"), or null: the page then names a generic interviewer. */
    @Field(() => CourseTextType, { nullable: true })
    asker!: CourseTextType | null

    /** The scene. */
    @Field(() => CourseTextType)
    scene!: CourseTextType

    /** The interviewer's question. */
    @Field(() => CourseTextType)
    question!: CourseTextType

    /** Where the learner gets stuck. */
    @Field(() => CourseTextType)
    stuck!: CourseTextType

    /** The mentor pressing back on the naive answer (a plain quote), or null when the record has none. */
    @Field(() => CourseTextType, { nullable: true })
    pushback!: CourseTextType | null

    /** What the lesson promises. */
    @Field(() => CourseTextType)
    promise!: CourseTextType
}

@ObjectType()
/** One keyword of the narration and its one plain sentence (lessons.md §9): drawn with a dotted underline and a hover or tap note. */
export class CourseTermType {
    /** The keyword as it stands in a sentence ("timeout", "primary key"). */
    @Field(() => String)
    term!: string

    /** Its one sentence. */
    @Field(() => CourseTextType)
    note!: CourseTextType
}

@ObjectType()
/** One ticked line of the first page. */
export class CourseOutcomeType {
    /** What the learner can do. */
    @Field(() => CourseTextType)
    can!: CourseTextType

    /** The unhappy case id that teaches it; null for the last line. */
    @Field(() => String, { nullable: true })
    caseId!: string | null
}

@ObjectType()
/** The opening of the naming page. */
export class CourseRecallType {
    /** The line that points back to the interview question. */
    @Field(() => CourseTextType)
    title!: CourseTextType

    /** The retelling, paragraph by paragraph. */
    @Field(() => [CourseTextType])
    paragraphs!: ReadonlyArray<CourseTextType>
}

@ObjectType()
/** The closing words of the submit page. */
export class CourseClosingType {
    /** What none of the listed repositories ships. */
    @Field(() => CourseTextType)
    beyond!: CourseTextType

    /** The answer to the page-1 question. */
    @Field(() => CourseTextType)
    answer!: CourseTextType
}

@ObjectType()
/** One HTTP endpoint of a service. */
export class CourseEndpointType {
    /** The HTTP method. */
    @Field(() => String)
    method!: string

    /** The path, `/charges/:orderId/refund`. */
    @Field(() => String)
    path!: string
}

@ObjectType()
/** One step of the business flow of an order on the Kiến trúc page. */
export class CourseArchitectureStepType {
    /** The step in business words. */
    @Field(() => CourseTextType)
    text!: CourseTextType

    /** The icon name the record gives (`credit-card`). */
    @Field(() => String)
    icon!: string
}

@ObjectType()
/** One HTTP request the learner file sends, numbered in the order it runs. */
export class CourseArchitectureRequestType {
    /** The number, from 1. */
    @Field(() => Int)
    n!: number

    /** The calling service id. */
    @Field(() => String)
    from!: string

    /** The called service id. */
    @Field(() => String)
    to!: string

    /** The HTTP method. */
    @Field(() => String)
    method!: string

    /** The path. */
    @Field(() => String)
    path!: string

    /** What the request does, in business words. */
    @Field(() => CourseTextType)
    does!: CourseTextType

    /** The endpoint the callee already has to revert it, or null. */
    @Field(() => CourseEndpointType, { nullable: true })
    undo!: CourseEndpointType | null
}

@ObjectType()
/** The tables one service's own database holds. */
export class CourseArchitectureTablesType {
    /** The service id. */
    @Field(() => String)
    serviceId!: string

    /** The table names. */
    @Field(() => [String])
    tables!: ReadonlyArray<string>
}

@ObjectType()
/** A span of a learner file and its code, cut from the file the learner starts from. */
export class CourseArchitectureExcerptType {
    /** The first line, 1-based. */
    @Field(() => Int)
    from!: number

    /** The last line, included. */
    @Field(() => Int)
    to!: number

    /** The code of those lines, or null when the server holds no text for the file. */
    @Field(() => String, { nullable: true })
    code!: string | null
}

@ObjectType()
/** The line of a learner file that sends one numbered request. */
export class CourseArchitectureMarkType {
    /** The 1-based line. */
    @Field(() => Int)
    line!: number

    /** The request number. */
    @Field(() => Int)
    request!: number
}

@ObjectType()
/** One learner file as the Kiến trúc page shows it. */
export class CourseArchitectureFileType {
    /** The path in the lab. */
    @Field(() => String)
    path!: string

    /** What the file does, or null when the record gives no role. */
    @Field(() => CourseTextType, { nullable: true })
    role!: CourseTextType | null

    /** The excerpt, or null when none. */
    @Field(() => CourseArchitectureExcerptType, { nullable: true })
    excerpt!: CourseArchitectureExcerptType | null

    /** The line that sends each request. */
    @Field(() => [CourseArchitectureMarkType])
    marks!: ReadonlyArray<CourseArchitectureMarkType>
}

@ObjectType()
/** The static Kiến trúc page of the lesson: business flow, requests, tables, why the plain approach fails and the learner files. */
export class CourseArchitectureType {
    /** The business flow of one order. */
    @Field(() => [CourseArchitectureStepType])
    flow!: ReadonlyArray<CourseArchitectureStepType>

    /** The requests the learner file sends, by number. */
    @Field(() => [CourseArchitectureRequestType])
    requests!: ReadonlyArray<CourseArchitectureRequestType>

    /** The tables of each service's database, in the stack's order. */
    @Field(() => [CourseArchitectureTablesType])
    tables!: ReadonlyArray<CourseArchitectureTablesType>

    /** Why the plain approach is not enough. */
    @Field(() => CourseTextType)
    why!: CourseTextType

    /** The learner files, one or up to three. */
    @Field(() => [CourseArchitectureFileType])
    files!: ReadonlyArray<CourseArchitectureFileType>
}

@ObjectType()
/** How the reader of the audit got through one page. */
export class CourseAuditPageType {
    /** The page id (`intro`, `setup`, `architecture`, `happy`, `unhappy`, `pattern`, `submit`). */
    @Field(() => String)
    page!: string

    /** `de` read through, `vap` stumbled, `mat-dau` lost the thread. */
    @Field(() => String)
    verdict!: string

    /** Why, in one line. */
    @Field(() => String)
    note!: string
}

@ObjectType()
/** One finding of the audit: the words of the page it quotes, why they trip the reader, the fix and where it stands. */
export class CourseAuditFindingType {
    /** The finding's id, unique in the audit. */
    @Field(() => String)
    id!: string

    /** The page the quote stands on. */
    @Field(() => String)
    page!: string

    /** `lint` a rule a checker could catch, `bien-tap` an editor's judgement. */
    @Field(() => String)
    kind!: string

    /** The words of the page, as quoted. */
    @Field(() => String)
    quote!: string

    /** Why they trip the reader. */
    @Field(() => String)
    why!: string

    /** The fix. */
    @Field(() => String)
    fix!: string

    /** Its place in the top five (1 first), or null when it is not one of them. */
    @Field(() => Int, { nullable: true })
    rank!: number | null

    /** `open`, `fixed` or `deferred`; a record that names none reads `open`. */
    @Field(() => String)
    status!: string
}

@ObjectType()
/** The text of a case the learner sees now; a part the case does not have is empty. */
export class CourseAuditCaseNowType {
    /** The situation the case creates. */
    @Field(() => String)
    situation!: string

    /** The interviewer's question of the case. */
    @Field(() => String)
    question!: string

    /** The conditions the case checks. */
    @Field(() => [String])
    conditions!: ReadonlyArray<string>

    /** The hint levels, in order. */
    @Field(() => [String])
    hints!: ReadonlyArray<string>
}

@ObjectType()
/** One change the reference solution expects for a case to turn green (rung N to N+1 of the ladder). */
export class CourseAuditExpectedType {
    /** The learner file the change touches. */
    @Field(() => String)
    file!: string

    /** The change, as a unified diff. */
    @Field(() => String)
    diff!: string

    /** What changes and why it is needed, in one line. */
    @Field(() => String)
    what!: string
}

@ObjectType()
/** What a case's fix does to the learner's thinking. */
export class CourseAuditThinkingType {
    /** What the learner understands after the fix. */
    @Field(() => String)
    learns!: string

    /** How their way of thinking changes. */
    @Field(() => String)
    shift!: string

    /** What it adds to their interview answer. */
    @Field(() => String)
    interview!: string

    /** `high`, `medium` or `low`. */
    @Field(() => String)
    impact!: string

    /** True when the fix is rote, with little thinking. */
    @Field(() => Boolean)
    mechanical!: boolean

    /** Why it is rote; empty when it is not, or when the record says nothing. */
    @Field(() => String)
    mechanicalWhy!: string
}

@ObjectType()
/** One case of the lab as the audit reads it today: its text, the expected changes, what they do to their thinking and the verdict. */
export class CourseAuditCaseType {
    /** The case id of the lab. */
    @Field(() => String)
    id!: string

    /** `happy` or `unhappy`. */
    @Field(() => String)
    kind!: string

    /** The case's title. */
    @Field(() => String)
    title!: string

    /** The text the learner sees now. */
    @Field(() => CourseAuditCaseNowType)
    now!: CourseAuditCaseNowType

    /** The changes the reference solution expects for the case to turn green; empty for a case the starter passes. */
    @Field(() => [CourseAuditExpectedType])
    expected!: ReadonlyArray<CourseAuditExpectedType>

    /** What the fix does to the learner's thinking. */
    @Field(() => CourseAuditThinkingType)
    thinking!: CourseAuditThinkingType

    /** What the audit assumed without checking; empty when everything was verified. */
    @Field(() => String)
    guess!: string

    /** `de`, `vap` or `mat-dau`. */
    @Field(() => String)
    verdict!: string

    /** Why, in one line. */
    @Field(() => String)
    note!: string
}

@ObjectType()
/** The read-through audit of the lesson as it is now (owner 2026-11-28): a stored fact the dev-only Audit tab draws as written. */
export class CourseAuditType {
    /** The day the audit ran. */
    @Field(() => String)
    checked!: string

    /** The reader the audit played. */
    @Field(() => String)
    reader!: string

    /** What the reader must know before the lesson; empty when the audit names nothing. */
    @Field(() => [String])
    prerequisites!: ReadonlyArray<string>

    /** One verdict per page the audit read. */
    @Field(() => [CourseAuditPageType])
    pages!: ReadonlyArray<CourseAuditPageType>

    /** Every finding; the ranked ones (1 to 5) are the top five. */
    @Field(() => [CourseAuditFindingType])
    findings!: ReadonlyArray<CourseAuditFindingType>

    /** Every case of the lab, read as it is now; empty when the cases were not read yet. */
    @Field(() => [CourseAuditCaseType])
    cases!: ReadonlyArray<CourseAuditCaseType>
}

@ObjectType()
/** The lab@2 record of one lesson as the web may see it; hint texts only for the levels the learner opened. */
export class CourseLessonType {
    /** The lesson id. */
    @Field(() => String)
    lessonId!: string

    /** The version label of the live record. */
    @Field(() => String)
    version!: string

    /** The lab repository id. */
    @Field(() => String)
    lab!: string

    /** The concept the lesson teaches. */
    @Field(() => String)
    concept!: string

    /** The concepts that come before it. */
    @Field(() => [String])
    requires!: ReadonlyArray<string>

    /** The terms learner-facing words may name. */
    @Field(() => [CourseAllowedTermType])
    allowedTerms!: ReadonlyArray<CourseAllowedTermType>

    /** The keywords of the narration with their notes; a keyword that names the lesson's concept only on the naming pages. */
    @Field(() => [CourseTermType])
    terms!: ReadonlyArray<CourseTermType>

    /** The declared stack. */
    @Field(() => CourseStackType)
    stack!: CourseStackType

    /** The one file the learner edits. */
    @Field(() => String)
    learnerFile!: string

    /** Every invariant in both languages. */
    @Field(() => [CourseInvariantType])
    invariants!: ReadonlyArray<CourseInvariantType>

    /** The happy cases in order. */
    @Field(() => [CourseCaseSpecType])
    happy!: ReadonlyArray<CourseCaseSpecType>

    /** The unhappy cases in order. */
    @Field(() => [CourseCaseSpecType])
    unhappy!: ReadonlyArray<CourseCaseSpecType>

    /** The label of each chaos switch the lab declares; empty when the lab declares none. */
    @Field(() => [CourseChaosLabelType])
    chaos!: ReadonlyArray<CourseChaosLabelType>

    /** The dimensions of the hidden grading matrix. */
    @Field(() => CourseGraderType)
    grader!: CourseGraderType

    /** The file map of the NestJS version. */
    @Field(() => [CourseNestMapType])
    nestjs!: ReadonlyArray<CourseNestMapType>

    /** The interview hook of page 1, or null. */
    @Field(() => CourseHookType, { nullable: true })
    hook!: CourseHookType | null

    /** The ticked outcomes of page 1; empty when the record lists none. */
    @Field(() => [CourseOutcomeType])
    outcomes!: ReadonlyArray<CourseOutcomeType>

    /** The opening of page 5; null until every unhappy case was green once, or when the record has none. */
    @Field(() => CourseRecallType, { nullable: true })
    recall!: CourseRecallType | null

    /** The closing words of page 6; null until every unhappy case was green once, or when the record has none. */
    @Field(() => CourseClosingType, { nullable: true })
    closing!: CourseClosingType | null

    /** The repositories page 6 compares with; empty until every unhappy case was green once. */
    @Field(() => [CourseProductionType])
    production!: ReadonlyArray<CourseProductionType>

    /** The standard reference repository of the lesson; null until every unhappy case was green once, or when none is pinned. */
    @Field(() => CourseReferenceType, { nullable: true })
    reference!: CourseReferenceType | null

    /** The static Kiến trúc page; null for a record cut before it. */
    @Field(() => CourseArchitectureType, { nullable: true })
    architecture!: CourseArchitectureType | null

    /** The read-through audit the dev-only Audit tab draws; null when the lesson was not audited yet. */
    @Field(() => CourseAuditType, { nullable: true })
    audit!: CourseAuditType | null
}
