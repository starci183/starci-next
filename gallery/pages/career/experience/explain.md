---
title: Kinh nghiệm đã xác minh
route: /experience
area: career
reviewed: 2026-11-17
---

Route: `/experience` (ảnh chụp: học viên mới, chưa có mục nào). Mã: `fe/apps/app/src/components/blocks/ExperienceList/component.tsx` (vẽ), `index.tsx` (đọc, sửa dòng CV, gửi duyệt). Trang trắng; mỗi mục kinh nghiệm là một vật thật nên khi có dữ liệu mới là thẻ.

## Đầu trang: tiêu đề, mô tả và năm tab

Vì sao: đầu trang chuẩn, sát trái: tiêu đề 18/600 "Mỗi phần học cho bạn một kinh nghiệm, thầy ký xác nhận" và mô tả 12 muted nói luật (chỉ mục Đã xác minh mới vào hồ sơ, đích lộ trình và CV); không còn nhãn phía trên. Dưới là năm tab lọc theo trạng thái (Tất cả, Đã xác minh, Chờ thầy duyệt, AI đã chấm, Thầy trả lại) với đường kẻ ngang bên dưới: tab chuyển cả vùng nội dung nên nằm trong đầu trang. Ở 390 tab cuộn ngang, có mũi tên ở mép phải. CHƯA RÕ: chữ của tab đang chọn tô màu accent (chỉ gạch chân là foreground); theo luật tab chọn là foreground, accent không đánh dấu lựa chọn.
Luật: `theme-and-type` (tab chọn: gạch chân foreground), `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ title, description, tabs }}` (`frame/Page/index.d.ts`).

## Tóm tắt luồng và số liệu

Vì sao: phẳng trên mặt trắng, không thẻ: hàng chip xám nói luồng đi của một mục (Đang luyện, AI đã chấm, Chờ thầy duyệt, Đã xác minh) và dưới là ba cụm muted đếm ("0 kinh nghiệm đã xác minh", "0 mục đang chờ", "Cần 3 mục đã xác minh để được giới thiệu việc làm"). Ở 390 chip và cụm số xuống dòng.
Luật: `surface-layering` (phẳng dưới đầu trang), `type-scale-14-12.md`.
Grammar: `Badge tone="neutral"` và `Text size="sm" tone="muted"` trong `Stack`; khung xương qua `SlotView`.

## Danh sách mục kinh nghiệm và trạng thái rỗng

Vì sao: ảnh chụp là trạng thái rỗng, chỉ một câu muted "Không có mục nào ở trạng thái này." Khi có dữ liệu, mỗi mục là một thẻ hairline (kinh nghiệm là vật thật): phần học, trạng thái, dòng CV song ngữ sửa được, chip bằng chứng, dòng meta và nút việc tiếp theo như "Gửi thầy duyệt" (nút chính chỉ một mỗi lúc); mục đã xác minh có liên kết công khai. CHƯA RÕ: trạng thái rỗng chưa có chỉ dẫn "làm bài nào để có mục đầu tiên" và chưa dùng `EmptyNotice`.
Luật: `verified-experience-per-part.md` (mỗi phần học một kinh nghiệm, thầy ký), `surface-layering` (thẻ cho vật thật).
Grammar: `Text tone="muted"` cho rỗng; mục dựng từ `SurfaceCard`, `Badge`, `Textarea`, `Button` (`ExperienceList/component.tsx`).

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440: tab "Tất cả" đang chọn có chữ màu accent tím (gạch chân đen); luật nói tab chọn là foreground, accent không đánh dấu lựa chọn. Lỗi này còn ở cả ba độ rộng.
- 1440: tiêu đề "Mỗi phần học cho bạn một kinh nghiệm, thầy ký xác nhận" là một câu dài chứ không phải tên trang; mô tả muted xuống dòng và để "CV." mồ côi.
- 1440: bốn chip luồng nền xám nhạt không có mũi tên hay thứ tự nên không đọc ra là một luồng; ba cụm số muted bên dưới dính liền nhau không có dấu ngăn nên nhìn như một câu.
- 1440: trạng thái rỗng "Không có mục nào ở trạng thái này." là một câu muted trơ trọi, không chỉ dẫn và không có nút.
- 1920: tab, tiêu đề và mô tả sát trái x=288 nhưng chip, số liệu và câu rỗng ở x=480; hai trục trái lệch nhau.
- 390: tab cuộn ngang và "AI đã chấm" bị cắt ở mép phải kèm mũi tên; chip "Đã xác minh" sát mép phải; cụm số thứ ba xuống dòng, lệch nhịp; tiêu đề bẻ thành hai dòng.
