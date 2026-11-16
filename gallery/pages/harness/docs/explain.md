---
title: Harness, danh sách bài giải thích
route: /harness/docs
area: harness
---

Route: `/harness/docs`. Mã: `fe/apps/app/src/components/blocks/HarnessDocs/`, dữ liệu qua `hooks/harnessDocs/useHarnessDocsScreen.ts`.

## Băng đầu trang và danh sách bài

Vì sao: phần Hiểu sâu chỉ để đọc, không kiểm thử, nên danh sách chỉ có tên bài, một câu tóm và số phút đọc, không chip tiến độ. Hàng phẳng, cả hàng là liên kết.
Luật: `FE-ERROR-1`, `surface-layering.md`.
Grammar: `Page header tabs`, `Section kind="list"`.
