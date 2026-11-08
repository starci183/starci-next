import { Column, Entity, PrimaryColumn } from "typeorm"
import type { LessonTopicStep } from "../../lesson-topic.contracts"

@Entity("lesson_topics")
/** One topic of the catalog with its path of source content folders, as the last import left it. */
export class LessonTopicEntity {
    /** The topic slug. */
    @PrimaryColumn({ name: "topic", type: "text" })
    topic!: string

    /** The title. */
    @Column({ name: "title", type: "text" })
    title!: string

    /** Where the topic comes from, in words. */
    @Column({ name: "source_note", type: "text" })
    sourceNote!: string

    /** What the topic covers. */
    @Column({ name: "description", type: "text", nullable: true })
    description!: string | null

    /** What a learner should know first. */
    @Column({ name: "prerequisites", type: "jsonb", nullable: true })
    prerequisites!: Array<string> | null

    /** The slugs of related topics. */
    @Column({ name: "related", type: "jsonb", nullable: true })
    related!: Array<string> | null

    /** The path rows in the teacher's order. */
    @Column({ name: "path", type: "jsonb" })
    path!: Array<LessonTopicStep>

    /** The import ref the path was read at. */
    @Column({ name: "ref", type: "text" })
    ref!: string

    /** When the topic was last imported. */
    @Column({ name: "imported_at", type: "timestamptz" })
    importedAt!: Date
}
