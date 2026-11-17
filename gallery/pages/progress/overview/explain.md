---
title: Hồ sơ · tiến độ
route: /progress
area: progress
---

Route: `/progress` (ảnh chụp: học viên Premium, đã làm cả năm khu vực). Mã: `fe/apps/app/src/components/blocks/ProgressOverview/` (`component.tsx` vẽ, `index.tsx` nối dữ liệu). Mọi vùng là một `Section` phẳng, không thẻ nổi. Các trạng thái khác nằm ở `progress/free` (chưa Premium), `progress/first` (lần đầu), `progress/partial` (một nguồn lỗi), `progress/error` và `progress/loading`.

## Mục tiêu và đường vào

Vì sao: một chỗ xem mình tới đâu ở mọi khu vực và nhảy vào khu vực đó. Trang không có mục riêng ở thanh bên: vào từ Hồ sơ ("Xem tiến độ", đường dẫn "Hồ sơ / Tiến độ") và từ Học. Trang chỉ để xem nên không có nút chính.
Luật: `verified-experience.md` (chuỗi ngày không bao giờ vào dòng CV, chỉ check đã chứng minh qua CI mới tính).
Grammar: `Page chrome="panes"` + `PaneGrid`, `Page header breadcrumbs`.

## Hàng số liệu

Vì sao: một hàng năm con số kẻ mảnh: khái niệm đã chứng minh, chuỗi ngày, bài đã học, bản dựng đã xong, bài Accepted. Con số của một nguồn không đọc được thì bỏ khỏi hàng, không hiện 0 giả.
Grammar: `Section kind="figures" ribbon`.

## Năm vùng: Essentials, Harness, Dự án, Luyện code, Ôn tập

Vì sao: mỗi vùng có liên kết "Mở …" ở cuối dòng tiêu đề và các hàng chi tiết. Essentials liệt kê bốn phần (Đã mở hoặc Cần Premium kèm "Xem Premium") rồi mỗi chủ đề một hàng có thanh tiến độ đen trên xám. Harness gộp bản dựng và Doctor trong một danh sách. Dự án là số liệu và hàng từng dự án, hoặc một hàng lời mời khi chưa Premium. Luyện code đọc `learnerProgress.practice` (bài Accepted trên tổng, pattern đang làm, pattern đã xong, tiến độ từng pattern). Ôn tập là số thẻ đến hạn kèm số quá hạn, đã ôn hôm nay, chuỗi hiện tại và dài nhất. Một vùng lỗi nói "Chưa tải được phần này" kèm nút Thử lại, không làm hỏng cả trang.
Grammar: `Section kind="figures"`, `Section kind="list"` + `ListRow` (`detail` là `Meter size="sm"`), `Alert`.

## Hoạt động gần đây

Vì sao: cột phải ở 1440 (cuối trang ở 390), mới nhất trước, tối đa 12 dòng.
Grammar: `Pane area="aside"`, `Timeline`.

## Lần đầu

Vì sao: học viên chưa có gì để đo được nói một lần ("Chưa có gì để đo, và đó là bình thường"), rồi ba lối vào: Essentials, Luyện code, Ôn tập.
Grammar: `Alert tone="informative"`, `Section kind="list"`.
