---
title: Harness, tổng quan
route: /harness
area: harness
---

Route: `/harness`. Grammar ở `node_modules/@starci/grammar/dist/core/` (0.40.1). Mã: `fe/apps/app/src/components/blocks/HarnessHub/` (`component.tsx` trang), dữ liệu qua `fe/apps/app/src/hooks/harness/useHarnessHubScreen.ts`. Dữ liệu đọc từ API harness của harness-be (`harnessHub`), ánh xạ ở `fe/apps/app/src/modules/harness-view`. Mã nguồn màn hình nay nằm trong nhóm tuyến `(pages)`; giao diện không đổi.

## Băng đầu trang (tiêu đề, dòng phụ, bốn tab)

Vì sao: Harness là khu riêng, không nằm trong Essentials hay Projects, nên trang gốc không có đường dẫn. Bốn tab gạch chân (Tổng quan, Build, Xài, Hiểu sâu) là liên kết thật, mở được ở tab mới và dùng chung ở mọi trang của khu.
Luật: `FE-FUNCTION-2` (băng do Page vẽ từ dữ liệu), `page-header-left-sublabel-xs.md`.
Grammar: `Page header={{ breadcrumbs: "root", title, description, tabs: { kind: "views" } }}` (`frame/Page/index.d.ts`, `frame/PageHeader/index.d.ts`).

## Dải số liệu tiến độ

Vì sao: bốn con số (build xong, chặng đang luyện, chặng đã chứng minh, kiểm tra máy đạt) đứng thành một dải full-width giữa hai đường kẻ mảnh, không thẻ, không nền. Học viên thấy mình đang ở đâu trong một cái liếc, không phải mở từng phần.
Luật: `FE-ERROR-1` (dải là một vùng đọc dữ liệu, loading vẽ lại đúng khung), `FE-UI-1` (ribbon thay cho thẻ số liệu).
Grammar: `Section kind="figures" ribbon ariaLabel` (`frame/Section/index.d.ts`, `ribbon` từ 0.40.0).

## Danh sách ba phần

Vì sao: ba phần là ba hàng phẳng, mỗi hàng có số thứ tự, tên phần, một câu mô tả, các chủ đề trong phần làm dòng meta, chip tiến độ ở cuối ("2 / 4 build xanh") và cả hàng là liên kết. Phần 1 có kiểm thử nên chip xanh khi mọi build xong; phần 3 chỉ đếm bài vì không có kiểm thử.
Luật: `FE-FUNCTION-4` (hàng nhận chữ đã dựng sẵn), `table-heroui-native-section-head.md`.
Grammar: `Section kind="list" items` với `ListRowData` (`leading.position`, `badges`, `meta`, `href`).

## Chọn công cụ (Claude Code hoặc Codex)

Vì sao: chọn công cụ là chọn một giá trị cho cả khu (hướng dẫn, kiểm tra máy và bẫy thử đều theo nó), nên dùng nhóm chip chọn một, không phải tab chuyển màn hình. Lựa chọn được nhớ riêng cho từng học viên trong trình duyệt (`fe/apps/app/src/modules/harness-tool`).
Luật: `FE-STORAGE` (chỉ module chạm localStorage), `FE-STATE-1`.
Grammar: `ChoiceChips` (`composite/ChoiceChips/index.d.ts`), đặt trong `Section` có chú thích dưới.
