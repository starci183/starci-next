---
title: Tiến độ (người đăng ký)
route: /progress
area: progress
---

Route: `/progress` (ảnh chụp: học viên Premium, đã học vài bài, một bản dựng đã chứng minh, hai dự án, có thẻ đến hạn). Mã: `fe/apps/app/src/components/blocks/ProgressOverview/` (`component.tsx` vẽ, `index.tsx` nối dữ liệu và lời). Dữ liệu đến từ một truy vấn `learnerProgress` đọc thẳng các capability, không lưu bản sao.

## Đầu trang (Tiến độ của bạn)

Vì sao: tiêu đề 18/600 sát trái, một dòng muted nói mọi con số đọc từ Bản chất, Harness, Dự án và Ôn tập. Trang chỉ để xem nên không có lệnh chính.
Luật: `COOK.md` theme trắng, `theme-and-type.md` điều 3.
Grammar: `Page header={{ title, titleScale: "standard", description }}`.

## Dải số liệu trên cùng

Vì sao: bốn con số một hàng, không thẻ: khái niệm đã chứng minh, chuỗi ngày, bài đã học, bản dựng đã xong. Chọn đúng bốn thứ đo bằng bằng chứng (chuỗi ngày là chuyên cần, không thành dòng CV).
Luật: `verified-experience.md` điều 10, `streak.md` (chuỗi chỉ đếm hành động có nghĩa).
Grammar: `Section kind="figures" ribbon ariaLabel items` (`frame/Section/index.d.ts`, `Figure { term, value, unit }`).

## Bản chất

Vì sao: bốn phần của một bài hiện thành bốn hàng với chip Đã mở hoặc Cần Premium (hàng khoá có liên kết "Xem Premium"), dòng chú thích dưới danh sách nói câu mở bài: đúng bao nhiêu câu lúc đầu và sau khi học. Dưới đó mỗi chủ đề là một danh sách bài, chủ đề học viên đã chạm tới xếp trước; hàng bài có "Câu mở bài: trước 2/5, sau 5/5" và chip Đã học, Đang học hoặc Chưa học.
Luật: `premium.md` và COOK 2026-11-17 access (phần 1 miễn phí, phần 2 đến 4 Premium), `essentials.md` (câu mở bài trước và sau).
Grammar: `Section kind="list" fact caption action`, `ListRowData { badges, action }`, `Link variant="head"`.

## Harness

Vì sao: miễn phí cho mọi người nên luôn hiện. Danh sách bản dựng ghi "3/5 giai đoạn đã chứng minh, 1 đang luyện" với chip Đã chứng minh, Đang luyện hoặc Chưa bắt đầu; dưới đó Doctor theo công cụ (Claude Code, Codex) và Thử bẫy theo bẫy với phán quyết Giữ vững, Bị phá, Chưa xong hoặc Chưa thử.
Luật: COOK 2026-11-17 (Harness miễn phí, đang luyện không phải bằng chứng).
Grammar: `Section kind="list"` ba danh sách, `Badge isDot`.

## Dự án

Vì sao: người đăng ký thấy ba số (khái niệm đã chứng minh, đang luyện, cột mốc xong) rồi danh sách dự án với "6/12 khái niệm, 2/4 cột mốc" và liên kết mở dự án. Đã chứng minh là qua CI có chữ ký, đang luyện là kết quả chạy trên máy.
Luật: `projects.md` (đang luyện khác đã chứng minh), COOK 2026-11-17 (Dự án chỉ cho người đăng ký).
Grammar: `Section kind="figures"` rồi `Section kind="list"`.

## Ôn tập

Vì sao: thẻ đến hạn (kèm số quá hạn), đã ôn hôm nay trên mục tiêu ngày, chuỗi hiện tại (kèm hôm nay đã tính hay chưa) và chuỗi dài nhất; liên kết "Mở Ôn tập" ở cuối hàng đầu.
Luật: `review.md`, `streak.md`, `conventions.md` điều 2 (ngày tính theo Asia/Ho_Chi_Minh).
Grammar: `Section kind="figures" title action items`.

## Hoạt động gần đây

Vì sao: một dòng thời gian gộp bài đã học, khái niệm đã chứng minh, mục được xác minh và giai đoạn Harness, mới nhất trước, tối đa 12 dòng, mỗi dòng có thời điểm tương đối. Chỉ đọc từ các capability sở hữu; không có bảng hoạt động riêng.
Luật: `conventions.md` (mọi thứ đọc, không sao chép trạng thái).
Grammar: `Timeline label items { title, dateTime, timeLabel }` (`composite/Timeline/index.d.ts`).

## Một nguồn lỗi

Vì sao: nếu một nguồn không đọc được (ví dụ Ôn tập), phần đó nói "Chưa tải được phần này." còn các phần khác vẫn hiện; chỉ khi cả truy vấn lỗi mới có nút Thử lại.
Luật: `conventions.md` điều 5, `grammar-slot-interface.md`.
Grammar: `SlotView`, `Section` với văn bản muted.
