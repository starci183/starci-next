import { topicSourceOf } from "./lesson-topic-file.policy"

const FILE = `
schema: starci-next-seed-standard/essentials-topic@1
status: draft
author: ai-placeholder
title: Độ tin cậy của API
from: starci-next-seed-standard essentials
modules: []
details:
  description: "Cùng một yêu cầu gửi lại nhiều lần chỉ được tạo một kết quả."
  prerequisites:
    - "Một yêu cầu HTTP đi qua backend thế nào."
  related:
    - backend-framework
    - caching
`

describe("topicSourceOf", () => {
    it("reads the title, where it comes from, the source modules and the page copy of a topic.yaml", () => {
        expect(topicSourceOf(FILE)).toEqual({
            issue: null,
            source: {
                title: "Độ tin cậy của API",
                from: "starci-next-seed-standard essentials",
                modules: [],
                details: {
                    description: "Cùng một yêu cầu gửi lại nhiều lần chỉ được tạo một kết quả.",
                    prerequisites: ["Một yêu cầu HTTP đi qua backend thế nào."],
                    related: ["backend-framework", "caching"],
                },
            },
        })
    })

    it("keeps the course modules the file names and drops the malformed ones", () => {
        const result = topicSourceOf(
            "title: T\nfrom: F\nmodules:\n  - { course: 1-system-design-mastery, index: 3 }\n  - { course: x }\n",
        )
        expect(result.source?.modules).toEqual([{ course: "1-system-design-mastery", index: 3 }])
        expect(result.source?.details).toBeUndefined()
    })

    it.each([
        ["from: F", "has no title"],
        ["title: T", "has no from"],
        ["- a\n- b", "is not a mapping"],
    ])("refuses %j", (text, issue) => {
        expect(topicSourceOf(text)).toEqual({ source: null, issue })
    })

    it("refuses text that is not yaml", () => {
        expect(topicSourceOf("title: [unclosed").issue).toMatch(/^is not valid yaml/u)
    })
})
