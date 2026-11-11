---
title: Dự án / Chi tiết
route: /projects/[projectId]
area: projects
---
Route: `/projects/<projectId>`. Một dự án của người học: milestone, lần chạy gần đây, kinh nghiệm, địa chỉ triển khai; bên phải là kho mã, chứng thực CI, máy của bạn, bí mật CI, thư mục starci/. Grammar 0.37.12, đường dẫn trong `node_modules/@starci/grammar/dist/core/`. Chấm tròn "N" và "1 Issue" là overlay của Next dev, không phải UI của app.

## Dải đầu trang (đường dẫn, tên, chip trạng thái, dòng repo · công nghệ, lệnh)
Vì sao: breadcrumbs "Dự án / Shop bán sách" đưa về danh sách; tên 18/600; chip trạng thái của cả dự án (Chưa bắt đầu / Đang luyện / Đã chứng minh) tính từ số concept; dòng 12 muted nối repo, stack, ngôn ngữ bằng "·"; một lệnh duy nhất "Cập nhật kết quả từ máy" là nút neutral md không icon (trang không có hành động chính nào khác).
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`, `verify-against-visualize.md` (chỉ CTA chính có icon).
Grammar: `Page header={{ title, breadcrumbs, meta, status, actions }}` (`frame/Page/index.d.ts`, `PageHeaderProps`), `Badge isDot`, `Button intent="neutral"`.

## Khung hai pane (giếng hồng + aside trắng)
Vì sao: chrome (dải đầu trang, aside) là mặt trắng phẳng; chỉ pane giữa là giếng hồng chứa các thẻ trắng riêng, rộng tối đa 80rem. Dưới lg aside xuống thành khối đầu tiên của trang, giếng theo sau.
Luật: `pink-page-surface-rule.md`, `nivo-surface-layering.md`.
Grammar: `Page chrome="panes" layout="workspace"`, `PaneGrid areas columns`, `Pane surface scroll` (`frame/PaneGrid/index.d.ts`, `frame/Page/index.d.ts`).

## Milestone (một thẻ danh sách)
Vì sao: một thẻ list duy nhất cho mọi milestone: mỗi dòng có ô icon, tên (500), "n/m concept đã chứng minh" (muted), thanh tiến độ ở cuối dòng (`control` = Grammar `Progress` qua `RowProgress`), chip trạng thái (Chưa bắt đầu / Đang làm / Xong / Cần Premium) và mũi tên; cả dòng là `<a href>` tới milestone (Grammar 0.37.14 vẽ chevron, không ↗; không còn `onPress` + router). Nhãn "Milestone" + chip đếm xám nằm trên giếng, phía trên thẻ.
Luật: `table-heroui-native-section-head.md`, `surfacecard-zones-api.md`, `type-scale-14-12.md`.
Grammar: `SurfaceCard kind="list" count` + `ListRowData { leading, description, badges, href, control }`, `Progress` (`frame/SurfaceCard/index.d.ts`, `surfaceCardData.d.ts`, `leaf/Progress/index.d.ts`).
CHƯA RÕ: glyph của milestone đang dùng `ProjectsGlyph` (thư mục) vì leaf Icon của starci-next-ui chưa có glyph cờ; control của hàng không có bề rộng riêng nên `Progress` bọc 7rem (xem projects/list).

## Lần chạy gần đây (thẻ bảng)
Vì sao: dữ liệu dạng cột là Table: Loại | Chi tiết | Kết quả | Lúc (CI có chữ ký, server kiểm tra); tiêu đề cột muted; khi chưa có lần chạy nào, câu trống nằm trong thẻ. Cột Chi tiết và Lúc là `priority="low"` nên dưới 390 gộp vào dòng.
Luật: `table-heroui-native-section-head.md`.
Grammar: `SurfaceCard kind="table" columns rows empty`, `RelativeTime`, `Badge` (`surfaceCardData.d.ts` `TableData`).
Ghi chú: ảnh chụp là dự án chưa có lần chạy nào nên chỉ thấy trạng thái trống; chưa chụp được trạng thái có dữ liệu (cần một lần CI có chữ ký thật).

## Kết quả từng probe (thẻ danh sách, chỉ hiện khi có kết quả)
Vì sao: sau khi server kiểm tra địa chỉ đã triển khai, mỗi probe là một dòng với chip đạt / chưa đạt. Không hiện khi chưa có kết quả (không có thẻ rỗng). Không có trong ảnh.
Luật: `table-heroui-native-section-head.md` (một nội dung một thẻ).
Grammar: `SurfaceCard kind="list"` + `badges`.

## Kinh nghiệm từ dự án (thẻ danh sách)
Vì sao: ba dòng số thật của dự án (concept đã chứng minh, concept đang luyện, milestone xong) với số ở cuối dòng; một liên kết đầu mục "Xem kinh nghiệm →" sang trang kinh nghiệm.
Luật: `verified-experience-per-part.md` (chỉ "đã chứng minh" mới thành kinh nghiệm), `table-heroui-native-section-head.md`.
Grammar: `SurfaceCard kind="list" labelEnd`, `Link variant="head"`.
CHƯA RÕ: API dự án chưa trả danh sách mục kinh nghiệm CV đã xác minh theo từng phần; hiện chỉ hiện số đếm, chờ be.

## Địa chỉ đã triển khai (thẻ form)
Vì sao: một thẻ form: câu giải thích, ô địa chỉ, hai nút neutral "Lưu địa chỉ" và "Chạy kiểm tra" (không nút nào là CTA chính, nên không có icon); lỗi từ lệnh hiện bằng Alert trong thẻ.
Luật: `verify-against-visualize.md`, `blocks-are-real-code.md` (dữ liệu đổi qua hành động khai báo).
Grammar: `SurfaceCard kind="body"`, `Input`, `Alert`, `Button`.

## Aside: Kho mã
Vì sao: dòng đầu của aside là liên kết repo đứng một mình (không nằm trong câu), nên chữ màu foreground, không gạch chân, không ↗ (đã đổi từ màu accent); vẫn mở tab mới. Không repo thì một dòng muted.
Luật: `red-budget-links-foreground` (owner 2026-11-10: accent chỉ cho CTA chính và link trong câu; link đứng một mình dùng foreground).
Grammar: `Link variant="plain" kind="external"` (`node_modules/@starci/grammar/dist/core/leaf/Link/index.d.ts`), `Text isStrong`.

## Aside: Chứng thực CI
Vì sao: chip có vòng rỗng "Có chữ ký / Chưa có chữ ký", dòng 12 muted về lần chạy, và dòng 12 nhắc GitHub OIDC xác nhận lần chạy trước khi tính. Chip này là cái mà "Đã chứng minh" dựa vào.
Luật: `verified-experience-per-part.md`, `type-scale-14-12.md`.
Grammar: `Badge isDot`, `Text size="sm" tone="muted"`.

## Aside: Máy của bạn
Vì sao: vòng rỗng + "Chưa kết nối", dòng 12 nói kết quả từ máy chỉ là "đang luyện", nút neutral sm "Kết nối máy" (sm không icon) dẫn tới /devices.
Luật: `verify-against-visualize.md`, `page-header-left-sublabel-xs.md`.
Grammar: `Badge isDot tone="muted"`, `Button intent="neutral" size="sm" href`.

## Aside: Bí mật CI và thư mục starci/
Vì sao: bí mật CI: dòng giải thích, nút neutral sm "Đổi bí mật CI", bí mật mới hiện một lần trong ô chỉ đọc có nút sao chép; thư mục starci/: cây thư mục chữ mono từng dòng, nơi để test, khác nhau giữa luyện và chứng minh. Hai phần này trước nằm thành ba thẻ trong giếng; nay là hàng của aside, ngăn bằng đường kẻ.
Luật: `pink-page-surface-rule.md` (aside là section + dòng, không thẻ nổi).
Grammar: `Divider semantics="presentation"`, `Input isCopyable`, `Text mono`.

## Trạng thái tải, lỗi, không tìm thấy
Vì sao: đang tải thì các thẻ giữ hình khối (skeleton) qua `isLoading`; không tìm thấy dự án thì `MissingNotice`; lỗi đọc đi qua `SlotView` (đường kẻ chung của app).
Luật: `type-scale-14-12.md` ("Empty, loading, error nằm trong thẻ").
Grammar: `SurfaceCard isLoading`, `Page isLoading`.
CHƯA RÕ: lỗi đọc của `SlotView` là `Alert` ngoài thẻ, chưa phải EmptyNotice lỗi trong thẻ có nút "Thử lại" như luật; cần SlotView của starci-next-ui (ngoài phạm vi) vẽ lỗi trong thẻ.

## Điện thoại (390)
Vì sao: aside xuống thành khối đầu, giếng theo sau; lưới của Grammar xếp một cột.
Luật: `pink-page-surface-rule.md` (dưới lg aside thành các khối đầu của giếng).
Grammar: `PaneGrid areas={{ base: ["aside","main"], wide: ["main aside"] }}`.
Đã rõ (Grammar 0.37.14, `data-grammar-pane-stacked="grow"`): ở 390 aside đứng trước, hiển thị đủ đến câu cuối "Luyện: chạy trên máy…", trang cuộn một lần. SAI còn lại: nhãn "Milestone" co chiều cao về 0 (chỉ còn chip đếm); thêm một khoảng trống cao khoảng 300px giữa aside và nhãn Milestone ở ảnh 390 (chụp 2026-11-10).
