---
title: Harness, một hướng dẫn
route: /harness/use/claude-hooks
area: harness
---

Route: `/harness/use/{guide}`. Mã: `fe/apps/app/src/components/blocks/HarnessGuide/`, dữ liệu qua `hooks/harnessUse/useHarnessGuideScreen.ts`. Markdown được cắt thành các mục theo tiêu đề cấp hai (`sectionsOf` trong `hooks/harness/harness.shared.ts`), mỗi mục có neo riêng để mục lục nhảy tới.

## Băng đầu trang (tên bài, dòng phụ, số phút đọc)

Vì sao: đường dẫn Harness / Xài / tên bài, tab Xài đang chọn.
Luật: `FE-FUNCTION-2`.
Grammar: `Page chrome="panes" layout="workspace" header`.

## Thân bài (markdown có nút sao chép)

Vì sao: mỗi tiêu đề cấp hai là một mục có neo; mọi khối mã và lệnh có nút Sao chép. Nội dung là markdown thật của bài, không dựng lại bằng tay.
Luật: `FE-FUNCTION-4`, `FE-ERROR-1` (vùng thân tự chờ và tự lỗi).
Grammar: `Section id title`, `Markdown labels` (`frame/Markdown/index.d.ts`).

## Mục lục "Trong bài này"

Vì sao: cột bên phải là danh sách phẳng có số thứ tự, bấm nhảy tới mục; ở màn hẹp cột này đứng trên thân bài.
Luật: `FE-FOLDER-2` (composite `OutlineList` dùng chung với trang bài giải thích).
Grammar: `Pane area="aside" surface scroll`, `Section kind="list"` qua `OutlineList` của `@starci-next/ui`.

## Chuyển công cụ

Vì sao: nhóm chip Claude Code và Codex đổi sang bài tương ứng của công cụ kia (cùng thứ tự trong danh sách) và nhớ lựa chọn cho học viên.
Luật: `FE-STORAGE`.
Grammar: `ChoiceChips`.

## Kết quả harness doctor

Vì sao: bảng điều kiện của đúng công cụ của bài, ưu tiên những điều kiện bài này sửa; có lệnh sao chép, công tắc nhỏ lọc điều kiện chưa đạt và nút "Xem cách sửa".
Luật: `FE-ERROR-1`.
Grammar: `Section`, `CopyField`, `Switch kind="compact"`, `Section kind="list"`.
