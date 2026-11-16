---
title: Bản chất / Bài học · phần 1 Bản chất
route: /essentials/[topic]/[lesson]
area: essentials
---

Route: `/essentials/[topic]/[lesson]` (không có `?phase=`; `?part=essence` là mặc định). Một bài có bốn phần (owner, COOK 2026-11-17): Bản chất, Source, Kịch bản, Tự áp dụng. Đây là phần 1: mở bằng 5 câu trắc nghiệm phỏng vấn, rồi bài viết, cuối bài làm lại 5 câu. Mockup: `D:/starci-tmp/claude-20261117/essentials-clusters/mockup/essential-4-parts.html` (artboard 1). Code: `fe/apps/app/src/components/blocks/EssentialLesson/component.tsx`, hook `fe/apps/app/src/hooks/essentialLesson/`, composite `fe/packages/starci-next-ui/src/composites/EssentialParts/index.tsx`. Grammar dưới `node_modules/@starci/grammar/dist/core/`. Liên kết `?phase=` cũ vẫn mở trang sáu pha (`LessonStudy`).

## Band (breadcrumbs, tiêu đề, chip mức độ, facts, bốn tab phần)

Vì sao: breadcrumbs Bản chất / topic / bài; tiêu đề; chip mức độ; dòng 12 muted "90 phút đọc · TypeScript" (bài chỉ có TypeScript, không còn chọn ngôn ngữ). Bốn phần là tab trang (underline) trên đường kẻ đáy band, `?part=` giữ phần đang mở để chia sẻ link.
Luật: COOK 2026-11-17 "Lesson = 4 parts"; owner pivot "REPO H TRÒ VIẾT TS THÔI" (không có language picker); `page-header-left-sublabel-xs.md`.
Grammar: `Page header { breadcrumbs, title, status, meta, tabs: { kind: "views", items, selectedKey, onSelect } }` (`frame/PageHeader/index.d.ts` `PageHeaderTabs`), `Badge` (`leaf/Badge/index.d.ts`).

## Mở bài · 5 câu trắc nghiệm phỏng vấn

Vì sao: mỗi lần một câu, thanh 5 bước và "Câu n / 5" trên đầu; chọn một đáp án rồi gửi, server chấm ngay (attempt `opener.<id>`, loại choice, không lộ đáp án trước khi gửi). Đúng: hộp affirmative với lời giải thích. Sai: hộp negative với lời giải thích và link "Đọc kỹ mục n" (neo `#section-…`) cùng "Thấy tận mắt ở kịch bản …" (`?part=scenarios&scenario=…`). Không có ô trả lời tự do. Xong 5 câu hiện "Đúng x/5".
Luật: COOK 2026-11-17 phần 1 (5 câu trắc nghiệm, chấm tất định, sai thì giải thích + "đọc §n / xem kịch bản"); concept `conventions` rule 4 (đáp án không rời server trước khi nộp).
Grammar: `Section title meta` (`frame/Section/index.d.ts`), `Progress steps` (`leaf/Progress/index.d.ts`), `SurfaceCard kind="select"` qua `ChoiceCard` (`fe/packages/starci-next-ui/src/composites/ChoiceCard/index.tsx`), `Alert tone="affirmative"|"negative"` (`composite/Alert/index.d.ts`), `Link` (`leaf/Link/index.d.ts`), `Button intent="neutral"` (`leaf/Button/index.d.ts`).

## Mục lục (chip "Nên đọc kỹ")

Vì sao: danh sách phẳng các mục của bài viết, mỗi hàng là link neo tới mục; mục mà một câu mở bài trả lời sai trỏ tới mang chip vàng "Nên đọc kỹ". Danh sách nằm thẳng trên mặt trang, không bọc thẻ.
Luật: COOK 2026-11-17 ("sai câu nào, mục đó được đánh dấu nên đọc kỹ"); white-theme BRIEF "LIMIT CARDS" (danh sách nằm phẳng trên bề mặt).
Grammar: `Section kind="list" items[{ title, href, badges }]` (`frame/Section/index.d.ts`, `surfaceCardData.d.ts` `ListRowData`).

## Bài viết (các mục lý thuyết)

Vì sao: mỗi mục lý thuyết là một Section có neo `section-<id>`, thân markdown của thầy (bảng, code, mermaid) vẽ bằng Markdown của Grammar; mục cần Premium chỉ giữ tiêu đề.
Luật: concept `content` rule 5 (hiển thị đúng chữ của thầy); `grammar-generic-app-themed.md`.
Grammar: `Section id title` (`frame/Section/index.d.ts`), `Markdown source labels renderCode` (`frame/Markdown/index.d.ts`).

## Làm lại 5 câu (trước và sau)

Vì sao: cuối bài, bảng phẳng mỗi câu một hàng: "Lần đầu" (lần trả lời đầu tiên) và "Lần mới nhất" (đúng/sai/chưa làm), đọc từ `lessonOpenerScores`; nút nhỏ "Làm lại" đưa về câu 1 và mở lại 5 câu (revision mới, lần đầu vẫn giữ).
Luật: COOK 2026-11-17 ("the same 5 again at the end shows before/after"); Grammar 0.40 "DataTable surface none" (bảng phẳng, không thẻ).
Grammar: `Section action={<Button intent="neutral" size="sm">}` (`frame/Section/head.d.ts`), `DataTable columns rows renderCell` (`branch/DataTable/index.d.ts`), `Badge tone` (`leaf/Badge/index.d.ts`).
