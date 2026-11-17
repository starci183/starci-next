---
title: Harness, một build
route: /harness/build/[build]
area: harness
---

Route: `/harness/build/{build}?stage={stage}`. Mã: `fe/apps/app/src/components/blocks/HarnessBuild/`, dữ liệu qua `fe/apps/app/src/hooks/harnessBuild/useHarnessBuildScreen.ts` (`harnessBuild.shared.ts` dựng view). Kết quả e2e được đọc lại mỗi 2 giây khi có chặng đang chạy và mỗi 10 giây trong lúc còn lại (`fe/apps/app/src/hooks/swr/api/graphql/queries/useQueryHarnessBuildSwr.ts`), cùng cách trang bài học đọc kết quả relay.

## Băng đầu trang (tên build, mô tả, chip e2e)

Vì sao: dòng meta "e2e 9 / 20" là con số học viên theo dõi khi làm; đường dẫn Harness / Build / tên build cho lối quay lại.
Luật: `FE-FUNCTION-2`, `page-header-left-sublabel-xs.md`.
Grammar: `Page header` (`breadcrumbs`, `meta`, `tabs`).

## Danh sách các chặng

Vì sao: các chặng nằm đầu trang, mỗi chặng một hàng phẳng với chip kết quả (Xanh, Đỏ, Chưa chạy) và số ca đạt làm meta. Hàng chặng đang mở được tô nhẹ. Chọn chặng là một liên kết (`?stage=`), nên mở thẳng được từ lệnh của CLI.
Luật: `FE-ERROR-1`, `FE-UI-1`.
Grammar: `Section kind="list"` với `ListRowData.state="informative"` cho hàng đang mở.

## Kết nối repo để chứng minh

Vì sao: kết quả chạy trên máy học viên chỉ là "đang luyện"; muốn "đã chứng minh" thì build phải chạy trong CI có chữ ký của repo GitHub của họ. Chưa kết nối: một ô nhập `owner/repo` và nút "Kết nối repo" (không cần Project). Đã kết nối: tên repo và audience mà workflow phải xin trong token OIDC, có nút sao chép. Mục cũng liệt kê key cần có trong `.env`.
Luật: `FE-ERROR-1`, `FE-DATA-COMMAND` (ghi qua hook lệnh, đọc lại build sau khi ghi).
Grammar: `Section` với `fact` và `caption`, `Input`, `Button intent="neutral"`, `CopyField`.

## Lệnh tải source mẫu

Vì sao: một lệnh một dòng, sao chép được, kèm dòng nhắc key AI nằm trong `.env` trên máy học viên và không gửi lên StarCi.
Luật: `FE-I18N-1` (mọi chữ đến từ catalog), `FE-UI-1`.
Grammar: `CopyField` (`branch/CopyField/index.d.ts`).

## Ca e2e của chặng

Vì sao: bảng phẳng ba cột (ca, kết quả, lý do), chip màu theo kết quả, cột lý do ẩn ở màn hẹp. Công tắc nhỏ "Chỉ ca chưa xanh" nằm trên bảng để việc còn lại nổi lên.
Luật: `table-heroui-native-section-head.md`, `FE-FUNCTION-4`.
Grammar: `DataTable` (`branch/DataTable/index.d.ts`, bảng phẳng từ 0.40.0), `Switch kind="compact"` (`leaf/Switch/index.d.ts`, 0.40.1).

## Lần chạy e2e gần nhất

Vì sao: khối log đen trình bày đúng những gì terminal của học viên in ra (dấu ✓, ✗, ·), để học viên đối chiếu với máy mình.
Luật: `FE-ERROR-1`.
Grammar: `Terminal` (`branch/Terminal/index.d.ts`).

## Hướng dẫn từng bước

Vì sao: mỗi bước một mục có tiêu đề đánh số, thân là markdown có khối mã sao chép được. Chặng đang khóa không hiện bước, chỉ nói khi nào mở.
Luật: `FE-FUNCTION-4`, `no-nested-label` của Grammar (bước là mục con của mục "Hướng dẫn từng bước").
Grammar: `Markdown` với `labels` đã dịch (`frame/Markdown/index.d.ts`), `Section`.
