---
title: Premium, thanh toán QR
route: /premium
area: commerce
reviewed: 2026-11-21
---

Chưa dựng (pending-seed): bản vẽ đã duyệt trả tiền bằng mã QR ngay trên trang, nhưng mã hiện tại (`fe/apps/app/src/components/blocks/PremiumPlans/`) chuyển sang cổng thanh toán khi bấm Thanh toán, vì `startPremiumCheckout` chỉ trả địa chỉ chuyển hướng. Màn `commerce/premium` nói thật điều đó ở dòng dưới phần tóm tắt.

## Thẻ gói hiện tại (chưa có mã QR)

Vì sao: Thẻ gói giữ lựa chọn gói, tóm tắt và một nút chính vì máy chủ chưa trả dữ liệu QR (cần API: chuỗi VietQR, ngân hàng, số tài khoản, nội dung chuyển khoản, `expiresAt`) và Grammar chưa có lá `QrCode` (cần Grammar).
Luật: `one-primary-per-view`, `grammar-only` (không tự vẽ QR bằng thành phần của ứng dụng).
Grammar: `Pane area="aside" surface`, `RadioGroup appearance="rows"`, `DescriptionList`, `Button intent="commit"` (`@starci/grammar/common`), xem `components/blocks/PremiumPlans/component.tsx`.
