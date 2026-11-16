---
title: Một pattern (các bài trong pattern)
route: /practice/patterns/[patternId]
area: practice
---

Route: `/practice/patterns/[patternId]` (ảnh chụp: pattern Mảng, học viên chưa có Premium nên chỉ bài đầu mở). Mã: `fe/apps/app/src/components/blocks/PracticePattern/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn "Luyện code / Mảng" và tiêu đề

Vì sao: dải trắng phẳng, viền dưới, sát trái: đường dẫn hai mục (mục đầu quay về `practice/list`, mục cuối đậm là trang hiện tại) và tiêu đề 18/600 "Mảng". Trang con có đường dẫn trong dải.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ breadcrumbs, title }}` (`frame/Page/index.d.ts`).

## Thẻ tiến độ của pattern

Vì sao: nhãn khối "Mảng" trên một thẻ nền accent nhạt: dòng muted "0/5 bài Accepted · bản miễn phí mở 1 bài" và hàng nâng cấp (nút chính "Mở toàn bộ bài" cùng câu muted nói Premium mở toàn bộ). Cùng khuôn thẻ với `practice/list` để học viên nhận ra.
Luật: `pink-page-surface-rule.md`, `verify-against-visualize.md` (một nút chính).
Grammar: `PracticeBrowse` (`fe/packages/starci-next-ui/src/composites/PracticeBrowse`), `UpsellRow`, `Button intent="commit" href`.

## Danh sách "Các bài trong pattern"

Vì sao: nhãn khối trên một thẻ danh sách năm bài: số thứ tự, tên bài 500, dòng 12 muted độ khó và các nhãn kỹ thuật (Trung bình · arrays · sorting...), bên phải trạng thái ("Chưa làm" hoặc chữ "Premium" cho bài khoá) và nút trung tính "Giải bài". Bài khoá vẫn là liên kết: bấm vào thì trang bài nói cần Premium.
Luật: `table-heroui-native-section-head.md`, `type-scale-14-12.md`.
Grammar: `PracticeList` (`fe/packages/starci-next-ui/src/composites/PracticeList`) trên `SurfaceCard kind="list"`, `Badge`.
