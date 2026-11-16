---
title: Agent và AI (danh mục công cụ)
route: /agents
area: agents
---

Route: `/agents` (ảnh chụp: học viên chưa có Premium, chưa có lab nào). Mã: `fe/apps/app/src/components/blocks/AgentLab/component.tsx` (vẽ), `index.tsx` (đọc). Khung chung giải thích ở `learn/home`.

## Thẻ mở đầu "Thao tác agent bằng công cụ bạn sẽ dùng ở công ty"

Vì sao: thẻ trắng nổi mở trang: nhãn "Xây agent · công cụ thật, tư duy chuẩn", tiêu đề nói mục tiêu, đoạn giải thích rằng mọi công cụ đều chấm theo cùng bảy concept, và hai chip xám đếm ("3 công cụ", "7 concept"). Không có hình minh hoạ vì trang đã dày nội dung.
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`, `table-heroui-native-section-head.md` (chip xám).
Grammar: `Page` bọc `CatalogIntro` (`fe/packages/starci-next-ui/src/composites/CatalogIntro`) trên `SurfaceCard`, `Badge` chip.

## Thẻ hạn mức "Còn 50 lượt gọi model hôm nay"

Vì sao: một thẻ riêng nói hạn mức hôm nay bằng một thanh tiến độ và một dòng giải thích StarCi trả qua proxy có hạn mức, hết lượt thì lab dừng. Nó tách khỏi lưới công cụ vì là trạng thái của học viên chứ không phải của một công cụ. Thanh tiến độ đầy khi còn đủ lượt.
Luật: `pink-page-surface-rule.md`, `verify-against-visualize.md`.
Grammar: `QuotaSection` và `AgentQuotaBar` (`fe/packages/starci-next-ui/src/composites/AgentQuotaBar`) trên `Progress` của Grammar.

## Ba thẻ công cụ (Claude Code + Agent SDK, OpenClaw, Hermes Agent)

Vì sao: mỗi công cụ là một thẻ ngang hàng, cùng khuôn: avatar, tên, chip cách trả ("Dùng tài khoản Anthropic của bạn" hoặc "StarCi trả, có hạn mức"), chip "Phiên bản khoá theo lab", một câu mô tả và dòng trạng thái lab ("Chưa có lab"). Bấm thẻ mở trang công cụ (`agents/track`). CHƯA RÕ: ở 1440 thẻ Claude có chip dài xuống hai dòng nên tên và avatar lệch hàng so với hai thẻ còn lại, thẻ cao không đều; chip cách trả cần một cỡ cố định hoặc xuống một dòng riêng cho cả ba thẻ.
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `AgentLabGrid` và `AgentLabCell` (`fe/packages/starci-next-ui/src/composites/AgentLabGrid`) trên `SurfaceCard`, `Badge`.

## Danh sách "7 concept của tư duy chuẩn"

Vì sao: bảy hàng đánh số trong một thẻ danh sách: tên concept 500, mô tả 12 muted, và bên phải chip "Học thử miễn phí" ở concept đầu (các concept sau không chip vì cần Premium). Nhãn khối nằm trên thẻ.
Luật: `table-heroui-native-section-head.md` (nhãn trên thẻ danh sách), `type-scale-14-12.md`.
Grammar: `AgentConceptList` và `AgentConceptRow` (`fe/packages/starci-next-ui/src/composites/AgentConceptList`) trên `SurfaceCard kind="list"`.

## Hai thẻ "Orca và công cụ khác" và "StarCi harness"

Vì sao: hai thẻ nhỏ nói điều chưa có: Orca và công cụ khác sắp có, StarCi harness là phần cuối tuỳ chọn và chưa mở; thầy ghi rõ harness chỉ là ví dụ, không phải phương pháp bắt buộc. Chữ "sắp có", "phần cuối, tuỳ chọn · chưa mở" là chip mờ.
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `AgentSoonCard` (`fe/packages/starci-next-ui/src/composites/AgentSoonCard`).

## Thẻ "Bằng chứng nằm ở Dự án"

Vì sao: thẻ chốt nói agent học viên làm là một dự án loại agent, StarCi chấm ở trang Dự án chứ không ở đây, kèm một nút chính "Mở Dự án" (chỉ một nút chính trên trang).
Luật: `verify-against-visualize.md` (một nút chính), `pink-page-surface-rule.md`.
Grammar: `MissingNotice`-kiểu thẻ với `Button intent="commit" href` (`leaf/Button`).
