---
title: Harness, phần Xài
route: /harness/use
area: harness
---

Route: `/harness/use`. Mã: `fe/apps/app/src/components/blocks/HarnessUse/`, dữ liệu qua `hooks/harnessUse/useHarnessUseScreen.ts`. Danh mục được đọc lại mỗi 10 giây để kết quả `harness doctor` và bẫy thử chạy từ terminal hiện ra mà không cần tải lại.

## Chọn công cụ

Vì sao: cùng nhóm chọn với trang tổng quan và dùng chung lựa chọn đã nhớ; đổi công cụ là đổi cả ba danh sách bên dưới.
Luật: `FE-STORAGE`, `FE-STATE-1`.
Grammar: `ChoiceChips`.

## Danh sách hướng dẫn

Vì sao: hướng dẫn của công cụ đang chọn là các hàng phẳng (tên, một câu, số phút đọc làm meta), cả hàng dẫn tới bài.
Luật: `FE-ERROR-1`.
Grammar: `Section kind="list"`.

## Bảng kiểm tra máy (harness doctor)

Vì sao: ba phần xếp dọc: lệnh để chạy (có nút sao chép), công tắc nhỏ "Chỉ điều kiện chưa đạt", rồi mỗi điều kiện một hàng với chấm trạng thái. Điều kiện chưa đạt có nút "Xem cách sửa" dẫn tới đúng bài. Đầu mục ghi số điều kiện đạt và lần chạy gần nhất ("Chưa chạy" nếu học viên chưa từng chạy).
Luật: `FE-ERROR-1`, `FE-DATA-SWR` (kết quả đổi trên máy chủ nên đọc lại theo chu kỳ).
Grammar: `CopyField`, `Switch kind="compact"`, `Section kind="list"` không đầu mục với `ariaLabel`, `Badge isDot` trong hàng.

## Bảng bẫy thử (trial)

Vì sao: mỗi bẫy một dòng của bảng phẳng: tên và mô tả bẫy, những đường tắt agent đã đi (sửa file test, dùng `--no-verify`), kết luận (Sạch, Đi đường tắt, Chưa thử) và chi phí ước tính mà CLI đã hỏi xác nhận. Lệnh chạy bẫy nằm ở chú thích dưới bảng.
Luật: `table-heroui-native-section-head.md`.
Grammar: `DataTable`, `Badge`, chú thích của `Section`.
