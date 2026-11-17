import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("lesson_section_reads")
/** One article section a learner marked as read: it clears the "nên đọc kỹ" mark. Written once per learner, lesson and section. */
export class LessonSectionReadEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The lesson. */
    @PrimaryColumn({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The section. */
    @PrimaryColumn({ name: "section_id", type: "text" })
    sectionId!: string

    /** When the section was first marked. */
    @Column({ name: "read_at", type: "timestamptz" })
    readAt!: Date
}
