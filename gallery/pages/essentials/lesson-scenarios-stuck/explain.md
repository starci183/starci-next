---
title: Bài Essentials · Kịch bản, bí: hỏi Claude
route: /essentials/[topic]/[lesson]?part=scenarios
area: essentials
reviewed: 2026-11-20
---

Route: `/essentials/[topic]/[lesson]?part=scenarios`. Trạng thái: lần chạy đỏ, học viên bí. Chờ nội dung: cần nội dung gợi ý kịch bản (pending-seed): bài hiện chưa có gợi ý nào, nên trạng thái bí không khác trạng thái đỏ trên dev stack; chưa chụp được ảnh thật, nên màn này chưa có `screen.yaml`.

## Khối Sửa và Bí? Hỏi Claude

Vì sao: dưới lý do sai là lời nhắc sửa cho AI của học viên trong một khối mã có nút Sao chép, công tắc tắt luật và khối "Bí? Hỏi Claude" dẫn tới connector; gợi ý mở dần khi có.
Luật: `ui/components/toast-alert.md`, `ui/components/data-views.md`.
Grammar: `FencedCodeBlock`, `Switch`, `Alert`, `Link`. Code: `fe/packages/starci-next-ui/src/composites/EssentialScenarios/Detail.tsx`.
