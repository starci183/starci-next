import { Test } from "@nestjs/testing"
import { builder, mock } from "@starci/jest-preset"
import { LessonReadService, type LessonCatalogItemView } from "@modules/domain/lesson"
import { IncidentReadService } from "./incident-read.service"
import { INCIDENT_OPTIONS } from "./incident.decorators"
import type { IncidentOptions } from "./incident.options"

const lessonOf = builder<LessonCatalogItemView>({
    id: "lesson-a",
    version: "v1",
    title: "Lesson A",
    description: "d",
    category: "backend",
    group: "backend",
    topic: { id: "topic-a", title: "Topic A" },
    difficulty: "intermediate",
    minutes: 10,
    languages: [],
    providers: [],
})

const build = async (lessons: ReadonlyArray<LessonCatalogItemView>, options: IncidentOptions = {}) => {
    const settings: IncidentOptions = { ...options }
    const reader = mock<LessonReadService>()
    reader.catalog.mockResolvedValue(lessons)
    const moduleRef = await Test.createTestingModule({
        providers: [
            IncidentReadService,
            { provide: LessonReadService, useValue: reader },
            { provide: INCIDENT_OPTIONS, useValue: settings },
        ],
    }).compile()
    return { service: moduleRef.get(IncidentReadService), reader }
}

describe("IncidentReadService list", () => {
    it("lists every live lesson as coming soon while no incident is authored", async () => {
        const { service } = await build([lessonOf({}), lessonOf({ id: "lesson-b", title: "Lesson B" })])

        const rows = await service.list({ locale: "vi", topic: null })

        expect(rows.map((row) => [row.lessonId, row.status, row.incidentAvailable])).toEqual([
            ["lesson-a", "coming-soon", false],
            ["lesson-b", "coming-soon", false],
        ])
    })

    it("maps the lesson fields and asks the catalog for the locale and topic", async () => {
        const { service, reader } = await build([lessonOf({})])

        const rows = await service.list({ locale: "en", topic: "topic-a" })

        expect(rows[0]).toEqual({
            lessonId: "lesson-a",
            title: "Lesson A",
            topicId: "topic-a",
            topicTitle: "Topic A",
            group: "backend",
            difficulty: "intermediate",
            minutes: 10,
            incidentAvailable: false,
            status: "coming-soon",
        })
        expect(reader.catalog).toHaveBeenCalledWith(expect.objectContaining({ locale: "en", topic: "topic-a" }))
    })

    it("lists authored incidents first and keeps the catalog order inside each status", async () => {
        const { service } = await build([lessonOf({ id: "a" }), lessonOf({ id: "b" }), lessonOf({ id: "c" })], {
            authored: ["c"],
        })

        const rows = await service.list({ locale: "vi", topic: null })

        expect(rows.map((row) => [row.lessonId, row.incidentAvailable])).toEqual([
            ["c", true],
            ["a", false],
            ["b", false],
        ])
    })
})
