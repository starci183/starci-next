---
title: Phỏng vấn thử (bắt đầu một buổi)
route: /interview
area: interview
---

Route: `/interview` (ảnh chụp: học viên chưa có Premium, đã dùng buổi miễn phí của tháng và còn một buổi dở). Mã: `fe/apps/app/src/components/blocks/InterviewHome/component.tsx` (vẽ), `index.tsx` (đọc, bắt đầu, bỏ buổi). Khung chung giải thích ở `learn/home`.

## Thẻ mở đầu "Phỏng vấn thử với AI"

Vì sao: thẻ trắng nổi mở trang: nhãn "Phỏng vấn thử · AI hỏi, chấm một lượt khi kết thúc", tiêu đề, đoạn nói luật buổi (trả lời bằng chữ, không nhận xét giữa buổi, không tra nội dung bài, chấm một lượt theo đáp án và tiêu chí của thầy) và một chip "3 câu, trộn kỹ thuật và hành vi".
Luật: `pink-page-surface-rule.md`, `table-heroui-native-section-head.md` (chip xám), `type-scale-14-12.md`.
Grammar: `Page` bọc `CatalogIntro` (`fe/packages/starci-next-ui/src/composites/CatalogIntro`).

## Khối "Bạn đang có một buổi dở dang"

Vì sao: chỉ hiện khi học viên còn một buổi chưa nộp: nhãn khối trên một thẻ nền accent nhạt, một dòng nói ngày bắt đầu và rằng "Tiếp tục" quay lại đúng câu đang hỏi. Hai nút: "Tiếp tục" là nút chính, "Bỏ buổi này" trung tính (bỏ thì buổi không được chấm).
Luật: `verify-against-visualize.md` (một nút chính mỗi vùng), `pink-page-surface-rule.md`.
Grammar: `SurfaceCard treatment="soft" label`, `Button intent="commit"` và `Button intent="neutral"` (`leaf/Button`).

## Khối "Hết buổi miễn phí tháng này"

Vì sao: chỉ hiện khi quota miễn phí hết và chưa có Premium (`LockedNotice`): một câu nói Premium mở khoá phỏng vấn không giới hạn, mọi bộ câu hỏi, phỏng vấn lại và xu hướng điểm, kèm nút chính "Xem gói Premium". CHƯA RÕ: ở ảnh khối này đứng cùng lúc với "buổi dở dang" và nút "Tiếp tục" cũng là nút chính tím, nên có hai nút chính trên cùng màn; cần chọn một nút chính khi cả hai trạng thái cùng có.
Luật: `verify-against-visualize.md`, `pink-page-surface-rule.md`.
Grammar: `LockedNotice` (`fe/packages/starci-next-ui/src/composites/LockedNotice`) trên `SurfaceCard treatment="soft"`, `Button intent="commit" href`.

## Biểu mẫu "Thiết lập buổi phỏng vấn"

Vì sao: nhãn khối trên một thẻ trắng: ba ô chọn (Lộ trình, Cấp độ, Ngôn ngữ code, hai cột trên lưới), hai dòng muted nói buổi gồm mấy câu và có bao nhiêu bộ câu hỏi đã xuất bản cho lộ trình đó, rồi nút chính "Bắt đầu phỏng vấn". Nút chính mờ (không bấm được) và dòng giải thích bên cạnh nói lý do ("Bạn đã dùng buổi miễn phí của tháng này. Đặt lại 1 thg 12, 2026."), thay vì để nút chết không lý do.
Luật: `verify-against-visualize.md`, `type-scale-14-12.md`, `table-heroui-native-section-head.md`.
Grammar: `Select` (`composite/Select`), `Grid`, `Cluster`, `Button intent="commit" isDisabled` (`leaf/Button`), `Text tone="muted"`.

## Danh sách "Lịch sử"

Vì sao: nhãn khối trên một thẻ danh sách các buổi gần đây: tên lộ trình và cấp, dòng 12 muted ngày và trạng thái ("Đang làm"), bên phải nút trung tính "Tiếp tục" hoặc "Xem kết quả" tuỳ trạng thái. Biểu đồ xu hướng điểm dành cho Premium không có trong ảnh.
Luật: `table-heroui-native-section-head.md`, `type-scale-14-12.md`.
Grammar: `PracticeList` (`fe/packages/starci-next-ui/src/composites/PracticeList`) trên `SurfaceCard kind="list"`.

## Trạng thái đang tải và lỗi

Vì sao: không có trong ảnh. Khi đọc, mỗi khối hiện khung xương cùng hình học; khi lỗi, `Alert` có nút "Thử lại"; khi bắt đầu bị từ chối, `issueWords` nói lý do ngay trên nút.
Luật: `grammar-slot-interface`.
Grammar: `SlotView`, `Alert` (`composite/Alert`).
