---
title: Bài Essentials · Tự áp dụng, mức Vừa đang luyện
route: /essentials/[topic]/[lesson]?part=apply
area: essentials
reviewed: 2026-11-20
---

Route: `/essentials/[topic]/[lesson]?part=apply`. Trạng thái: học viên có điểm các bậc, mức Dễ đã xanh và mức Vừa đang luyện. Chờ seed: cần một học viên có điểm các bậc tự áp dụng trên dev stack (pending-seed); chưa chụp được ảnh thật, nên màn này chưa có `screen.yaml`.

## Thang bốn bậc

Vì sao: bốn bậc Dễ, Vừa, Khó, Siêu khó là danh sách phẳng. Bậc đã mở là hàng bấm được, bậc đang xem được tô một lần; bậc chưa mở là hàng thường không bấm được, tông mờ, lý do khóa là chữ meta.
Luật: `ui/components/list-table.md` (hàng px-4 py-3), `ui/components/button.md` (một nút chính).
Grammar: `Section kind="list"`, `ListRow state="unavailable"`. Code: `fe/packages/starci-next-ui/src/composites/EssentialApply/index.tsx`.

## Chi tiết bậc đang xem

Vì sao: đề, terminal của lần chạy ẩn, thang điểm theo từng tiêu chí và chuỗi từ luyện trên máy tới chứng minh bằng CI. Một nút chính "Chạy mức Vừa" ở đầu bài.
Luật: `ui/components/data-views.md`.
Grammar: `Terminal`, `Section kind="list"`, `Stepper`. Code: `EssentialApply/index.tsx` (`Detail`).
