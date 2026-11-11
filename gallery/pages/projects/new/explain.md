---
title: Dự án / Tạo dự án
route: /projects/new
area: projects
---
Route: `/projects/new`. Trang tạo dự án: chọn loại, điền thông tin, xem cách bắt đầu. Grammar ở `node_modules/@starci/grammar/dist/core/` (0.37.12). Code: `fe/apps/app/src/components/blocks/ProjectNew/component.tsx`.

## Header band (breadcrumbs Dự án / Tạo dự án, tiêu đề)
Vì sao: dải trắng, sát lề trái, có đường dẫn "Dự án / Tạo dự án" vì đây là trang con của Dự án; không có mô tả vì một câu lẻ không phải thẻ. Lệnh chính nằm ở chân thẻ biểu mẫu, không ở band.
Luật: `page-header-left-sublabel-xs.md`, `pink-page-surface-rule.md`.
Grammar: `Page header={{ title, breadcrumbs }}` (`frame/Page/index.d.ts`, `frame/PageHeader/index.d.ts`).

## Loại dự án (thẻ chọn)
Vì sao: một danh sách lựa chọn nên là thẻ `select` với hàng Checkbox, tiêu đề danh từ (Ứng dụng, Agent) và phụ đề 12 ngay dưới; chọn một (đơn) nhưng vẫn kiểu checkbox. Nhãn nằm trên nền hồng, phía trên thẻ. Khi chọn Agent, thêm một thẻ "Công cụ agent" cùng kiểu.
Luật: `surfacecard-select-subtitle.md`, `pink-page-surface-rule.md`.
Grammar: `SurfaceCard kind="select" selectionMode="single"` (`frame/SurfaceCard/index.d.ts`, `surfaceCardData.d.ts` SelectData).
Ghi chú: lựa chọn concept lúc tạo CHƯA CÓ: API tạo dự án không nhận danh sách concept (milestone là danh mục cố định của Bản chất, được chứng minh sau), nên không vẽ thẻ chọn concept giả.

## Thông tin dự án (một thẻ biểu mẫu)
Vì sao: MỘT thẻ cho một việc (biểu mẫu): tên, địa chỉ repo, công nghệ, đề tài, ngôn ngữ chính (back end bắt buộc đề tài và ngôn ngữ). Không có thẻ trong thẻ: các lựa chọn loại nằm ở thẻ riêng phía trên. Lỗi (vd "Dự án thứ hai cần Premium.") hiện trong thẻ bằng Alert.
Luật: `table-heroui-native-section-head.md` (một nội dung một thẻ), `pink-page-surface-rule.md`.
Grammar: `SurfaceCard` + `Grid kind="form"` + `Input kind="text"` (`frame/Grid`, `branch/Input/index.d.ts`), `Alert tone="negative"`.

## Chân thẻ: Huỷ và Tạo dự án
Vì sao: chân biểu mẫu có Huỷ (trung tính, chữ, về /projects) và nút chính "Tạo dự án" (động từ) có biểu tượng cộng, nút chính duy nhất của trang.
Luật: `verify-against-visualize.md` (chỉ CTA chính có icon), `surfacecard-select-subtitle.md` (nút là động từ).
Grammar: `SurfaceCard footers=[{ kind: "custom" }]` (`surfaceCardData.d.ts` FooterZone), `Button intent="neutral"`, `Button intent="commit" startGlyph="plus"` (`leaf/Button/index.d.ts`).

## Cách bắt đầu (danh sách đánh số)
Vì sao: ba bước (thư mục starci/, CLI StarCi, bí mật CI) là một thẻ danh sách với hàng đánh số, tiêu đề danh từ và mô tả 12 dưới; không để chữ rời trên nền.
Luật: `table-heroui-native-section-head.md` (câu lẻ là một hàng của thẻ danh sách), `type-scale-14-12.md`.
Grammar: `SurfaceCard kind="list"` với `ListRowData.leading: { position }` (`surfaceCardData.d.ts`).
Ghi chú: lệnh cài CLI cụ thể CHƯA RÕ (chưa có trong thông điệp của app); hàng CLI chỉ nói cài CLI StarCi.

## Thẻ "Dự án đã tạo" (sau khi tạo)
Vì sao: bí mật CI chỉ hiện một lần, có ô sao chép và nút chính "Mở dự án". Đây là trạng thái sau tạo, chưa chụp trong gallery vì tài khoản học thử chỉ tạo được 1 dự án (xem báo cáo).
Luật: `verify-against-visualize.md`.
Grammar: `SurfaceCard`, `Input isCopyable` , `Alert tone="informative"`.
