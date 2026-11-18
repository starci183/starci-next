---
title: CV công khai, đã tải
route: /cv/{slug}
area: cv
---

Route: `/cv/{slug}` (không cần đăng nhập; ảnh chụp: CV của Minh Nguyễn, bốn dòng từ bốn nguồn). Mã: `fe/apps/app/src/components/blocks/PublicCv/`. Trạng thái khác: `cv/public-few-lines`, `cv/public-many-lines`, `cv/public-not-found`, `cv/public-loading`, `cv/public-share`. Trang không được máy tìm kiếm lập chỉ mục (`noindex`) cho tới khi chủ sản phẩm quyết.

## Thanh trên công khai

Vì sao: người xem chưa đăng nhập; chỉ cần biết đây là StarCi và đổi ngôn ngữ (dòng CV đọc theo ngôn ngữ đang chọn).
Luật: route nằm trong nhóm `(auth)`, không có phiên và không có thanh bên của app.
Grammar: `BrandLockup`, `Button` neutral.

## Chủ CV

Vì sao: nhà tuyển dụng thấy ngay CV của ai và ai bảo đảm: ảnh hoặc chữ đầu, tên, dấu "CV đã xác minh bởi StarCi", dòng sự kiện (số dòng đã ký, ngày ký mới nhất); không email, không gói, không lộ trình. Nút chính "Chia sẻ CV".
Luật: `verified-experience.md` điều 7 (chỉ hiện vai trò người ký và ngày, không hiện tên người duyệt).
Grammar: `Avatar`, `Heading`, `Text`, `Button`, `Popover`, `Drawer`.

## Dòng CV đã ký

Vì sao: mỗi dòng là câu CV, nguồn, chủ đề và vết tin cậy Luyện xong, AI chấm, Thầy ký, kèm liên kết "Xác minh" và mã tới `/verify/{mã}`. Chỉ dòng Đã xác minh mà học viên bật Công khai, mới ký trước; dòng bị thu hồi biến mất.
Luật: `verified-experience.md` điều 4 và 10 (chỉ mục Đã xác minh lên CV; số bài luyện là bằng chứng, không tự thành dòng CV).
Grammar: `Section kind="list"` + `ListRow` (`leading`, `badges`, `detail`, `action`), `ChoiceChips`, `Button`.

## Vì sao tin được CV này

Vì sao: giải thích một lần ba tín hiệu mà mỗi dòng mang (Luyện xong, AI chấm, Thầy ký), và nói trang không hiện điểm số hay tên người duyệt.
Luật: `verified-experience.md` điều 3 (AI không tự xác minh, nên "AI chấm" là một bước của vết, không có điểm) và điều 7.
Grammar: `Section`, `Stepper`.

## Chân trang xác minh

Vì sao: nói cách đọc mã xác minh và mời người xem tạo CV của họ.
Luật: `verified-experience.md` điều 6 (dòng bị thu hồi hiện "đã thu hồi" ở trang xác minh).
Grammar: `Text`, `Link`.

## Điểm còn mở

Vì sao: hai điều chưa chắc, chờ chủ sản phẩm hoặc người kiểm.

- Loại bằng chứng `cli-scenario` ("Kịch bản chạy qua CLI") đang suy ra từ dạng chứng minh `graded-session` ở backend; chưa có nguồn nào ghi thẳng loại này, nên phép ánh xạ là giả định.
- Địa chỉ chia sẻ Zalo (`https://zalo.me/share?url=…`) chưa kiểm với Zalo; LinkedIn và Facebook dùng địa chỉ chia sẻ công khai của họ.
  Luật: `verified-experience.md` điều 1 (bằng chứng phải có dạng chứng minh) và điều 10.
  Grammar: không đổi.
