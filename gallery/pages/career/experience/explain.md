---
title: Kinh nghiệm đã xác minh
route: /experience
area: career
---

Route: `/experience` (ảnh chụp: học viên mới, chưa có mục nào). Mã: `fe/apps/app/src/components/blocks/ExperienceList/component.tsx` (vẽ), `index.tsx` (đọc, sửa dòng CV, gửi duyệt). Khung chung giải thích ở `learn/home`.

## Dải tiêu đề: nhãn, tiêu đề, mô tả và năm tab

Vì sao: dải trắng phẳng, viền dưới, sát trái: nhãn "Kinh nghiệm để ghi CV", tiêu đề "Mỗi phần học cho bạn một kinh nghiệm, thầy ký xác nhận" và đoạn mô tả luật (chỉ mục Đã xác minh mới vào hồ sơ, đích lộ trình và CV). Dưới là năm tab lọc theo trạng thái (Tất cả, Đã xác minh, Chờ thầy duyệt, AI đã chấm, Thầy trả lại): tab chuyển cả vùng nội dung nên nằm trong đầu trang. CHƯA RÕ: tiêu đề cỡ lớn hơn mọi trang khác (nó là câu dài, 28px), nhãn nằm giữa tiêu đề và mô tả thay vì phía trên; cần chuyển sang `Page header` chuẩn (tiêu đề 18/600, mô tả 12 muted).
Luật: lint `page-tabs-in-header` (tab trang nằm trong header), `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header.tabs` (`frame/Page/index.d.ts`); code `ExperienceList/component.tsx`.

## Thẻ tóm tắt luồng và số liệu

Vì sao: một thẻ trắng nổi: hàng chip nói luồng đi của một mục (Đang luyện, AI đã chấm, Chờ thầy duyệt, Đã xác minh) và dưới là ba dòng muted đếm ("0 kinh nghiệm đã xác minh", "0 mục đang chờ", "Cần 3 mục đã xác minh để được giới thiệu việc làm"). Ảnh cũ có ba chip "xxxxxx" thừa trước các chip thật: đó là lỗi khung xương (các chữ giữ chỗ trùng khoá nên React để lại phần tử cũ), đã sửa bằng chữ giữ chỗ khác độ dài ở `EXPERIENCE_PLACEHOLDER`; ảnh chụp lại cho thấy hàng chip đúng bốn chip.
Luật: `pink-page-surface-rule.md`, `table-heroui-native-section-head.md` (chip xám), `type-scale-14-12.md`.
Grammar: `SurfaceCard` với `Badge tone="neutral"` và `Text size="sm" tone="muted"`; khung xương qua `SlotView` (`fe/packages/starci-next-ui/src/branches/SlotView`).

## Danh sách mục kinh nghiệm và trạng thái rỗng

Vì sao: mỗi mục là một thẻ (phần học, trạng thái, dòng CV có thể sửa song ngữ, chip bằng chứng, dòng meta và nút việc tiếp theo như "Gửi thầy duyệt"; mục đã xác minh có liên kết công khai). Ảnh chụp là trạng thái rỗng: một câu muted "Không có mục nào ở trạng thái này." thay cho danh sách.
Luật: `verified-experience-per-part.md` (mỗi phần học một kinh nghiệm, thầy ký), `pink-page-surface-rule.md`.
Grammar: thẻ mục tự dựng từ `SurfaceCard`, `Badge`, `Textarea`, `Button` (`ExperienceList/component.tsx`); trạng thái rỗng là `Text tone="muted"`. CHƯA RÕ: trạng thái rỗng chỉ có một câu, chưa có chỉ dẫn "làm bài nào để có mục đầu tiên" và chưa dùng `EmptyNotice` của Grammar.
