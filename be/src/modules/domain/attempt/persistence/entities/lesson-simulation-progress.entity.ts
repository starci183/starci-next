import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("lesson_simulation_progress")
/** Where one learner stands in one simulation activity: the current state, the path taken and every transition ever tried. */
export class LessonSimulationProgressEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The lesson. */
    @PrimaryColumn({ name: "lesson_id", type: "text" })
    lessonId!: string

    /** The simulation activity. */
    @PrimaryColumn({ name: "activity_id", type: "text" })
    activityId!: string

    /** The version the learner plays. */
    @Column({ name: "lesson_version", type: "text" })
    lessonVersion!: string

    /** The state the learner is in now. */
    @Column({ name: "current_state_id", type: "text" })
    currentStateId!: string

    /** The actions of the current path, from the initial state. */
    @Column({ name: "action_ids", type: "text", array: true })
    actionIds!: Array<string>

    /** Every transition the learner ever took, a branch tried once stays tried. */
    @Column({ name: "tried_transition_ids", type: "text", array: true })
    triedTransitionIds!: Array<string>

    /** When the progress last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
