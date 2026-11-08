import { LessonTopicEntity } from "./entities/lesson-topic.entity"
import { LessonVersionEntity } from "./entities/lesson-version.entity"
import { AddLessonGroup1795100000000 } from "./migrations/1795100000000-add-lesson-group"
import { AddLessonTopic1795200000000 } from "./migrations/1795200000000-add-lesson-topic"
import { InitLesson1795000000000 } from "./migrations/1795000000000-init-lesson"

/** The entities of the lesson capability. */
export const lessonEntities: Array<typeof LessonVersionEntity | typeof LessonTopicEntity> = [
    LessonVersionEntity,
    LessonTopicEntity,
]

/** The migrations of the lesson capability, in the order they run. */
export const lessonMigrations: Array<
    typeof InitLesson1795000000000 | typeof AddLessonGroup1795100000000 | typeof AddLessonTopic1795200000000
> = [InitLesson1795000000000, AddLessonGroup1795100000000, AddLessonTopic1795200000000]
