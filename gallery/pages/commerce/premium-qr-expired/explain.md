---
title: Premium, mã QR hết hạn
route: /premium
area: commerce
reviewed: 2026-11-21
---

Chưa dựng (pending-seed): cùng lý do với thanh toán QR. Hiện đơn quá hạn được báo ở trang kết quả (`/premium/result`, trạng thái Hết hạn), không phải ở trang gói.

## Thẻ gói hiện tại (chưa có mã QR để hết hạn)

Vì sao: Không có mã QR nên không có trạng thái hết hạn của mã trên trang gói; đơn quá hạn nói ở trang kết quả với nút Tạo đơn mới.
Luật: `one-primary-per-view`.
Grammar: `Pane area="aside" surface`, `Button intent="commit"`; trang kết quả dùng `EmptyNotice isError` (`components/blocks/CheckoutResult/component.tsx`).
