# StarCi Next: business questions for the owner

These are business choices only; missing APIs are tracked in API-GAPS.md. Each question gives the assumption the drawings use now, so if the assumption is right, the answer is just "đúng".

1. **When does the next level in Tự áp dụng unlock?** Code today (origin/dev, `RELAY_CHALLENGE_LOCKED`) unlocks it once every hidden scenario of the level below passes. *Drawn as:* a score of at least 80/100 and every critical ("trọng yếu") rubric item passed.
2. **What goes in the Free vs Premium comparison?** *Drawn as:* Free has Harness (Build, Xài, Docs), Luyện code, Ôn tập, part 1 (Bản chất) of every Essentials lesson and 1 CLI machine. Premium adds Essentials parts 2–4 (Source, Kịch bản, Tự áp dụng), Projects and 2 CLI machines. Prices come from the server (229.000 ₫/month, 2.290.000 ₫/year, "tiết kiệm 2 tháng").
3. **Which four languages does Projects support?** *Drawn as:* TypeScript, Python, Go, C#. The backend accepts any string today.
4. **Sign-in providers: drop Facebook, add Google?** The backend has Facebook + GitHub. *Drawn as:* GitHub + Google, no Facebook.
5. **What happens when Premium ends?** *Drawn as:* progress, proofs and verified CV lines stay; a new purchase adds time on top of what is left; nothing renews automatically; existing projects become read-only until Premium is back.
6. **Payment: SePay only?** *Drawn as:* SePay QR only, with payOS hidden (the backend keeps both rails).
7. **Does Tiến độ get its own nav item?** *Drawn as:* no. The sidebar is Học · Essentials · Projects · Harness · Luyện code · Ôn tập · Hồ sơ. Tiến độ and Kinh nghiệm open from Hồ sơ (breadcrumb "Hồ sơ / …"), and Học links to Tiến độ.
8. **Does Luyện code count toward verified experience?** *Drawn as:* yes, as a pending source. A whole pattern Accepted becomes one experience item, and a problem whose solution was viewed before Accepted does not count. If the answer is no, the "Luyện code" source chip on Kinh nghiệm goes away.
9. **A check marked "cần chứng minh lại" (it passed once, then the latest CI or probe failed): does it leave the CV until it is proven again?** *Drawn as:* yes. It is hidden from the CV preview and the public CV, and listed under "chưa vào CV" with the reason.
10. **Do Sự cố (incidents) and "chọn lộ trình" (paths/choose) stay?** Both still exist on origin/dev (learnerHub shard `incidents`, layer mission → /paths/choose). *Drawn as:* both removed; Học shows "Việc tiếp theo" from the lesson in progress instead of a chosen path.
11. **Product words.** *Drawn as:* the area is called **Essentials**. Each lesson has four parts: **Bản chất · Source · Kịch bản · Tự áp dụng**, and part 1 opens with "5 câu hỏi mở bài". The lanes had used "Bản chất" for the whole area and "Cốt lõi / Mã nguồn / Áp dụng" for the parts.
12. **Using a hint in Kịch bản.** *Drawn as:* the run is marked "có hỗ trợ". Does an assisted pass still count toward proof and experience? *Assumed:* yes, the mark is only shown to the learner.
