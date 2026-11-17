---
title: Harness, danh sách build
route: /harness/build
area: harness
---

Route: `/harness/build`. Mã: `fe/apps/app/src/components/blocks/HarnessBuilds/`, dữ liệu qua `fe/apps/app/src/hooks/harnessBuild/useHarnessBuildsScreen.ts`.

## Băng đầu trang (Build, đường dẫn Harness / Build, bốn tab)

Vì sao: tab Build đang chọn; tab là liên kết nên đổi phần không phải dựng lại cả khu.
Luật: `FE-FUNCTION-2`, `page-header-left-sublabel-xs.md`.
Grammar: `Page header` với `tabs kind="views"` (`frame/PageHeader/index.d.ts`).

## Danh sách các build

Vì sao: mỗi build là một hàng phẳng: tên, một câu nói build làm ra gì, key AI cần có trong `.env` làm dòng meta, hai chip ("3 / 5 chặng đã chứng minh" và "4 / 5 chặng đã chạy"). Cả hàng dẫn tới trang build. Không thẻ vì build chỉ là một mục của danh sách.
Luật: `FE-ERROR-1` (loading, lỗi, rỗng nằm trong chính vùng danh sách), `FE-UI-1`.
Grammar: `Section kind="list"` (`frame/Section/index.d.ts`), `SlotView` của `@starci-next/ui`.
