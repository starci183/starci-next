---
title: Kết quả thanh toán, hết hạn
route: /premium/result
area: commerce
reviewed: 2026-11-21
---

Mã dựng xong (`fe/apps/app/src/components/blocks/CheckoutResult/`, hình hết hạn) nhưng chưa có ảnh: dev không có đơn hết hạn vì một đơn đang chờ chỉ quá hạn sau 24 giờ và không có lệnh nào của ứng dụng làm đơn già đi (pending-seed).

## Thông báo hết hạn

Vì sao: Hình hết hạn dùng thông báo lỗi có biểu tượng cảnh báo, tiêu đề Đơn thanh toán đã hết hạn và câu nói chuyển khoản rồi thì mã đơn giúp tra lại; trạng thái do máy chủ trả lời.
Luật: `status-colors` (cặp x-soft và x-soft-foreground), `one-primary-per-view`.
Grammar: `EmptyNotice isError` (`@starci/grammar/common`).

## Thông tin đơn và nút đi tiếp

Vì sao: Danh sách phẳng mã đơn, gói, số tiền, cổng, rồi một nút chính Tạo đơn mới về trang gói.
Luật: `one-primary-per-view`.
Grammar: `DescriptionList isDivided`, `Button intent="commit" href`.
