---
title: Premium, thanh toán QR
route: /premium
area: commerce
reviewed: 2026-11-20
---

Chưa dựng, chờ dữ liệu: bản vẽ đã duyệt trả tiền bằng mã QR ngay trên trang, nhưng mã hiện tại (`PremiumPlans`) bấm Thanh toán thì `startPremiumCheckout` trả địa chỉ chuyển hướng của cổng thanh toán và trang rời đi. Cần API: `startPremiumCheckout` trả chuỗi VietQR, ngân hàng, số tài khoản, nội dung chuyển khoản và `expiresAt`. Cần Grammar: lá `QrCode`. Trong lúc chờ, màn hình `commerce/premium` giữ luồng chuyển hướng và nói thật điều đó ở dòng dưới phần tóm tắt. Trạng thái: pending-seed.
