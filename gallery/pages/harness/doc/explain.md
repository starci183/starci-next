---
title: Harness, một bài giải thích
route: /harness/docs/[doc]
area: harness
---

Route: `/harness/docs/{doc}`. Mã: `fe/apps/app/src/components/blocks/HarnessDoc/`, dữ liệu qua `fe/apps/app/src/hooks/harnessDocs/useHarnessDocScreen.ts`.

## Thân bài dài (markdown, bảng, sơ đồ)

Vì sao: bài dài được cắt thành các mục theo tiêu đề cấp hai, mỗi mục có neo; bảng cuộn ngang trong khung riêng, sơ đồ mermaid được vẽ và có tên cho trình đọc màn hình ("Sơ đồ 1").
Luật: `FE-ERROR-1`, `FE-FUNCTION-4`.
Grammar: `Section id title`, `Markdown labels` với `diagram`, `diagramError`, `table` (`frame/Markdown/index.d.ts`, `frame/MermaidDiagram/index.d.ts`).

## Mục lục "Trong bài này"

Vì sao: bài dài cần chỗ nhảy; cột phải liệt kê mọi mục và đứng trên thân bài ở màn hẹp. Không có công cụ để chọn vì bài là kiến thức chung.
Luật: `FE-FOLDER-2`.
Grammar: `Pane area="aside" surface scroll`, `OutlineList` của `@starci-next/ui` (`Section kind="list"`).
