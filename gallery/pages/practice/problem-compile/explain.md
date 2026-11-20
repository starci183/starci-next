---
title: Giải bài, lỗi biên dịch
route: /practice/[slug]
area: practice
reviewed: 2026-11-20
---

Trạng thái của màn này: lỗi biên dịch. Mục tiêu: đọc đề, viết mã, chạy thử rồi nộp, mở gợi ý khi kẹt, xem lời giải khi muốn.

## Dải tiêu đề: Chứa nhiều nước nhất

Vì sao: tên trang, dòng sự kiện và đúng một nút chính. "Nộp bài" ("Chạy thử" trung tính); đang chấm thì xám kèm lý do; Accepted thì "Bài tiếp theo".
Luật: một nút chính mỗi view, các nút khác trung tính (skills/claude-design/SKILL.md, mục The look).
Grammar: PageHeader

## Phần tử còn thiếu

Vì sao: bản vẽ cần một phần tử mà Grammar chưa có và vẫn vẽ nó, đánh dấu trong khung.
Luật: skills/claude-design/SKILL.md, mục Method (một phần tử Grammar còn thiếu không chặn bản vẽ); danh sách ở GRAMMAR-GAPS.md.
Grammar: cần Grammar: ô soạn mã có tô màu cú pháp và thụt dòng (hiện chỉ có Textarea)

## Chưa chụp

Màn này chưa chụp được trên kho dev: cần verdict compile-error; không có máy chấm trong kho dev. Mở được bằng mock của practiceSubmission (compile-error).
Trạng thái design.json giữ nguyên approved. Mã của màn đã theo bản vẽ đã duyệt (Section kind="list", SlotView, Tabs kind="filter", EmptyNotice mark="none").
