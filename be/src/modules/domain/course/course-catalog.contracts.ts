/** The `schema` of a course record of the seed standard, when a record names it. */
export const COURSE_COURSE_SCHEMA = "starci-next-seed-standard/essentials-course@1"

/** A text of the catalog in both languages. */
export type CourseBilingual = { readonly vi: string; readonly en: string }

/** One lesson of a course as the catalog lists it. */
export interface CourseCatalogLessonView {
    /** The lesson id, the key of its lab record. */
    readonly lessonId: string
    /** The concept the lesson teaches. */
    readonly concept: string
    /** The concept as the lab record words it (its allowed term), or the concept id when the lab has none. */
    readonly conceptTerm: string
    /** The lesson title: the lab record has no title yet, so it is the concept term in both languages. */
    readonly title: CourseBilingual
    /** Whether a lab record of the lesson is live. */
    readonly available: boolean
}

/** One course as the catalog lists it. */
export interface CourseCatalogEntryView {
    /** The course id, the key of its record. */
    readonly courseId: string
    /** The course title. */
    readonly title: CourseBilingual
    /** What the course is about. */
    readonly summary: CourseBilingual
    /** Its lessons in teaching order. */
    readonly lessons: ReadonlyArray<CourseCatalogLessonView>
}

/** One service of the course's system map. */
export interface CourseSystemNodeView {
    /** The node id. */
    readonly id: string
    /** The service the node stands for. */
    readonly service: string
    /** The node name. */
    readonly label: CourseBilingual
    /** What the node does. */
    readonly role: CourseBilingual
}

/** One call between two nodes of the system map. */
export interface CourseSystemEdgeView {
    /** The calling node. */
    readonly from: string
    /** The called node. */
    readonly to: string
}

/** One course with the system map of its intro. */
export interface CourseCatalogDetailView extends CourseCatalogEntryView {
    /** The system the lessons grow. */
    readonly system: {
        readonly nodes: ReadonlyArray<CourseSystemNodeView>
        readonly edges: ReadonlyArray<CourseSystemEdgeView>
    }
}

/** What a lab record contributes to the catalog: the terms its words may name. */
export type CourseLabTerms = ReadonlyArray<{ readonly id: string; readonly term: string }>

