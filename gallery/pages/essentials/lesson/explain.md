---
title: Bản chất / Bài học · phần 1 (câu hỏi, đã trả lời câu 2)
route: /essentials/[topic]/[lesson]
area: essentials
reviewed: 2026-11-18
---

Route: `/essentials/[topic]/[lesson]`. Phần 1 Bản chất khi học viên đã trả lời câu 1 đúng và câu 2 sai: thanh năm đoạn, câu 2 đã chấm với lời giải và liên kết, mục lục có nhãn "Nên đọc kỹ", bài viết bên dưới. Trạng thái dựng bằng lõi giả của lane (mẫu Outbox + Idempotency). Code: `fe/apps/app/src/components/blocks/EssentialLesson/` (vỏ trang, `parts/partEssence.tsx`, `parts/partLocked.tsx`), hook `fe/apps/app/src/hooks/essence/`, composite `fe/packages/starci-next-ui/src/composites/LessonEssence/` và `LessonLockedPart/`.

## Dải đầu bài (đường dẫn, tên bài, bài toán, dòng sự kiện, nút chính, bốn tab)

Vì sao: đường dẫn Essentials, chủ đề, bài; tên bài; một câu bài toán nghiệp vụ; dòng sự kiện "Bài 3/6 trong chủ đề · 20 phút đọc · 5 kịch bản · 4 mức tự áp dụng" (số bài lấy từ đường đi của chủ đề). Nút chính duy nhất do phần đang mở giao cho dải: Câu tiếp theo, Câu n, Xem kết quả, Đọc bài viết, Làm lại 5 câu, Nâng cấp Premium. Bốn tab phần nằm trên đường kẻ đáy; phần đang dở có chip đếm số đã xong, phần xong có dấu tích, phần cần Premium có ổ khóa; nhãn tab luôn hiện chữ.
Luật: `app.essentials.essential` trong thông điệp; `ui/components/page-header.md` (một nút chính ở cuối hàng tiêu đề); `ui/components/tabs.md` (tab trang có đếm).
Grammar: `Page header { breadcrumbs, title, description, meta, actions, tabs: { kind: "views", labelVisibility: "always", items[{ count, leading }] } }` (`frame/PageHeader`, `branch/Tabs`). Code: `EssentialLesson/component.tsx` (`bandOf`).

## Câu hỏi mở bài (thanh năm đoạn, câu, bốn đáp án)

Vì sao: mỗi lần một câu. Thanh năm đoạn cho biết câu đang trả lời và kết quả từng câu (đúng tô màu nhấn, sai tô đỏ); dòng dưới thanh ghi "Câu 2/5 · đúng 1". Trước khi chọn, bốn đáp án là một nhóm radio dạng hàng; chọn là gửi chấm ngay, máy chủ trả đúng sai và lời giải. Sau khi chấm, bốn đáp án thành bốn hàng: hàng đúng viền xanh kèm "Đáp án đúng", đáp án sai đã chọn viền đỏ kèm "Bạn chọn"; dưới là "Vì sao." với liên kết gạch chân tới mục cần đọc (`sectionRef`) và tới kịch bản liên quan (`scenarioId`). Không có ô viết tự do; đáp án đúng không đi xuống trình duyệt trước khi chọn.
Luật: `.starciwork/concepts/essentials.md` (Bản chất: năm câu trắc nghiệm chấm ngay), `conventions.md` luật 4 (không gửi đáp án trước submit); `ui/components/tabs.md`/`ui/loading.md` cho trạng thái chờ chấm.
Grammar: `Stepper kind="bar"` (một đoạn mỗi câu, `state: complete | error | upcoming`), `RadioGroup appearance="rows"`, `Section kind="list"` + `ListRow verdict`, `Alert` (`composite/Stepper`, `composite/RadioGroup`, `frame/Section`). Code: `LessonEssence/question.tsx`.

## Bài viết và mục lục

Vì sao: dưới câu hỏi (hoặc một mình khi đã làm xong): dòng "Bài viết · 20 phút đọc", mục lục sáu mục (mục mà câu sai trỏ tới mang nhãn "Nên đọc kỹ", hết nhãn khi đã đánh dấu đọc), rồi từng mục là markdown với neo `#section-<id>` để liên kết từ lời giải nhảy tới.
Luật: `ui/composition.md` (đọc dài là Section phẳng, không thẻ); `essentials.md` (mục đánh dấu "nên đọc kỹ").
Grammar: `Section kind="list"` + `ListRow badges` cho mục lục, `Section` + `RichMarkdown` (bao `Markdown`) cho từng mục (`frame/Section`, `frame/Markdown`). Code: `LessonEssence/index.tsx` (`LessonToc`, `LessonArticleBody`).

## Cột phải (chỉ từ 1440)

Vì sao: "Bài này gồm 4 phần" liệt kê bốn phần (phần xong có dấu tích, phần cần Premium là hàng không mở được) và "Cuối bài": nhắc làm lại 5 câu để thấy điểm trước và sau. Dưới 70rem cột này ẩn; mục lục không nằm ở cột phải mà nằm trong thân (xem Phản biện).
Luật: `ui/composition.md` (cột phải là các khối phẳng ngăn bằng đường kẻ, không thẻ).
Grammar: `PaneGrid areas={{ base: ["main"], wide: ["main aside"] }}` + `Pane area="aside" surface`, `PaneSection rule="start"`, `Section kind="list"` với `ListRow state="unavailable"` (`frame/PaneGrid`, `frame/Section`).

## Phản biện

Vì sao: tự phản biện của lần chụp này (lõi giả của lane, ảnh ở 1440, 1920 và 390); liệt kê điều còn lệch bản vẽ, không sửa trong lần chụp.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Đường dẫn: dải đầu đặt dòng sự kiện trên câu bài toán, còn bản vẽ đặt dưới; `PageHeader` cố định thứ tự `meta` rồi `description`. Cần Grammar cho phép đổi thứ tự, chưa sửa.
- Thanh năm đoạn: `Stepper kind="bar"` tô đoạn đúng bằng màu nhấn (tím), không phải xanh; chỉ đoạn sai có màu đỏ. Bản vẽ muốn xanh/đỏ (GRAMMAR-GAPS #3). Dùng phần tử gần nhất, ghi vào báo cáo.
- Đáp án có hàng số "1." đến "4." thay cho vòng chữ A đến D của bản vẽ: `ListRow` chỉ có số thứ tự (không có chữ cái); cần Grammar nếu chủ muốn chữ cái.
- Chip đếm trên tab chỉ hiện số đã xong ("2"), bản vẽ hiện "2/5"; `Tabs count` chỉ nhận một số.
- Dùng màn cũ của khung (thanh bên cũ); khung do lane build-01 giữ nên ảnh chưa có thanh bên mới.
- Mục lục: bản vẽ đặt mục lục ở cột phải ở 1440; ở đây mục lục nằm trong thân ở mọi độ rộng, vì cột phải ẩn dưới 70rem và ở 390 mục lục phải đứng trước bài viết. `PaneGrid` không cho một khối vừa ở thân vừa ở cột phải theo độ rộng; chờ quyết định.
