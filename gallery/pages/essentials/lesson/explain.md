---
title: Bản chất / Bài học (tổng quan)
route: /essentials/[topic]/[lesson]
area: essentials
---

Route: `/essentials/[topic]/[lesson]` (không có `?phase=`). Trang tổng quan của một bài: band, giếng giữa với các thẻ, aside phải. Grammar 0.37.12; đường d.ts dưới `node_modules/@starci/grammar/dist/core/`. Khung: `Page chrome="panes"` + `PaneGrid` (giếng `main` + `aside` bề mặt), code `fe/apps/app/src/components/blocks/LessonStudy/`.

## Band (breadcrumbs, tiêu đề, chip, facts, nút chính)

Vì sao: breadcrumbs Bản chất / chủ đề / bài; tiêu đề 18/600 sát trái; chip "Nền tảng" là mức độ; dòng 12 muted "65 phút · TypeScript · 6 pha"; một nút chính duy nhất "Bắt đầu với câu Bị hỏi" có icon play (outline) dẫn vào pha đầu.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`, `verify-against-visualize.md` (chỉ CTA chính có icon).
Grammar: `Page header { breadcrumbs, title, status, meta, actions }` (`frame/Page/index.d.ts`, `frame/PageHeader/index.d.ts`), `Button intent="commit" startContent={<Icon source={PlayGlyph} />}` (`leaf/Button/index.d.ts`; `PlayGlyph` ở `fe/packages/starci-next-ui/src/leaves/Icon/index.tsx`), `Badge` (`leaf/Badge/index.d.ts`).

## Tổng quan (thẻ chi tiết: "Bài này nói về", "Phạm vi")

Vì sao: một thẻ gồm các hàng term/value; câu mô tả là một hàng, không phải một câu lẻ nằm trong thẻ; "Phạm vi của bài" gập lại sau disclosure "Xem phạm vi" vì dài. Disclosure là hàng kích thước đầy đủ có chevron (chữ foreground), không còn dòng `quiet` màu accent: màu accent ở trang này chỉ còn nút chính "Bắt đầu với câu Bị hỏi".
Luật: `table-heroui-native-section-head.md` (câu lẻ không thành thẻ, thành hàng của thẻ danh sách), `pink-page-surface-rule.md`, `red-budget-links-foreground` (owner 2026-11-10: một khối accent là nút chính).
Grammar: `SurfaceCard kind="details" label items` (`frame/SurfaceCard/index.d.ts`), `Disclosure` mặc định `kind="row"` (`node_modules/@starci/grammar/dist/core/branch/Disclosure/index.d.ts`; `quiet` là dòng "link-toned", bị bỏ theo luật dưới). Code: `fe/packages/starci-next-ui/src/composites/OverviewPanel/index.tsx`.

## Sáu pha của bài (MỘT thẻ danh sách)

Vì sao: bản cũ có hai danh sách pha trùng nhau (rail trái và "Sáu pha"); gộp thành một thẻ. Mỗi hàng: vòng số thứ tự, tên pha, dòng 12 muted, trạng thái (chip "Mở" hoặc khoá outline) và chevron; cả hàng bấm được (`onPress` qua router) nên là hàng điều hướng có chevron, không có mũi tên ↗ trên tiêu đề (với `href`, Grammar vẽ tiêu đề thành link có ↗).
Luật: `table-heroui-native-section-head.md`, `verify-against-visualize.md`, `type-scale-14-12.md`. Chip "Mở" là chip xám trung tính (`tone="neutral"`): xám là trạng thái thường, màu chỉ dành cho việc đang chờ người học.
Grammar: `SurfaceCard kind="list"` với `ListRowData { leading: {position}, description (ReactNode, 12 muted), onPress, badges | control }` (`surfaceCardData.d.ts`, `composite/ListRow/index.d.ts`).

## Sau bài, bạn sẽ / Cần biết trước (hai thẻ cạnh nhau)

Vì sao: hai danh sách ngang hàng cùng vai, mỗi thẻ một nhãn đặt trên giếng; hàng là câu khẳng định, không có nút.
Luật: `pink-page-surface-rule.md`, `table-heroui-native-section-head.md`.
Grammar: `Grid kind="cards" columns={2}` + `SurfaceCard kind="list"` (`frame/Grid/index.d.ts`).

## Aside: Kết quả học tập

Vì sao: người chưa có Premium không có tiến độ, nên aside nói rõ bằng một dòng có khoá và link "Xem Premium" (link điều hướng đứng một mình tới trang gói: màu foreground, `Link variant="plain"`, không ↗). Có Premium thì hiện thanh tiến độ cho từng kết quả.
Luật: `pink-page-surface-rule.md` (aside là bề mặt phẳng, mục = section có đường kẻ, không thẻ nổi), `red-budget-links-foreground` (owner 2026-11-10; link điều hướng đứng một mình = foreground).
Grammar: `Pane area="aside" surface scroll` (`frame/PaneGrid/index.d.ts`), `PaneSection`, `Section title headingLevel` (`frame/Section/index.d.ts`), `Divider`, `Link variant="plain"` (`node_modules/@starci/grammar/dist/core/leaf/Link/index.d.ts`), `Progress`.

## Aside: Ôn tập (Sau 1/7/21 ngày)

Vì sao: ba hàng có đường kẻ, mỗi hàng tên "Sau n ngày" và trạng thái 12 muted "Mở khi bạn học xong bài" (`meta`). Là `Section kind="list"`: từ Grammar 0.37.14 nó vẽ phẳng trong aside nên không còn cần `DescriptionList`.
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `Section kind="list" items[{ title, meta }]` (`node_modules/@starci/grammar/dist/core/frame/Section/index.d.ts`, 0.37.14); code `fe/packages/starci-next-ui/src/composites/StudyRail`. Đã rõ.

## Aside: Tài liệu tham khảo

Vì sao: link ngoài, mỗi cái một dòng trong danh sách tài liệu ở aside; là link đứng một mình (không trong câu) nên chữ màu foreground, không gạch chân, không ↗ (đã đổi từ accent); vẫn mở tab mới.
Luật: `red-budget-links-foreground` (owner 2026-11-10).
Grammar: `Link variant="plain" kind="external"` (`node_modules/@starci/grammar/dist/core/leaf/Link/index.d.ts`).

## Aside dưới lg (điện thoại)

Vì sao: trang bài học chỉ có một cột nội dung chính; dưới lg phần kết quả học tập không chen vào cột đó mà thu vào một ngăn kéo mở bằng nút "Kết quả học tập" ở thanh dưới, để màn hình điện thoại dành chỗ cho bài.
Luật: `pink-page-surface-rule.md`.
Grammar: `Pane collapse="drawer" trigger="bar"` (`frame/PaneGrid/index.d.ts`). Code: `fe/apps/app/src/components/blocks/LessonStudy/component.tsx` (`PaneGrid areas={{ base: ["main"], wide: ["main aside"] }}`).
