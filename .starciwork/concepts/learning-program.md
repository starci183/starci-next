# learning-program

StarCi Next is a learning program, not a course shop: parts that each grant verified, CV-worthy experience, strung into outcome paths,
shown together on one hub. It teaches building a profile, connecting, building agents and using AI coding the right way, and reaching
an outcome (owner).

## Terms
- **Part**: one learning area (Bản chất, Ôn tập, Luyện code, Dự án, Sự cố). *Not to confuse with* a
  **layer** (Mục tiêu, Hồ sơ & CV, Kết nối việc làm), which shows progress across parts and has no streak of its own.
- **Outcome path** ("Mục tiêu đầu ra"): Khởi nghiệp, AI Engineer, job tracks; each strings parts together and ends in a concrete "done"
  made of verified experience items, never "finish course N".
- **Hub**: the page at `/` listing every part and layer with progress, today's actions and verified experience.

## Rules
1. The hub at `/` lists nine entries in this order: Mục tiêu, Bản chất, Ôn tập, Luyện code, Dự án, Bài toán thực
   chiến, Sự cố, Hồ sơ & CV, Kết nối việc làm. The sidebar may stay shorter; the hub shows them all. `/paths/choose` is
   the goal picker. Why: the owner wants learners to see everything they can do, to drive study and the streak.
2. Bài toán thực chiến (case studies) and Sự cố (incidents) have their own list pages but no data of their own: each item opens a
   Bản chất lesson or repo and reads its progress from [essentials](essentials.md). An item not yet authored shows "Sắp có".
3. Every part declares the experience items it grants ([verified-experience](verified-experience.md)); a part with no place in an
   outcome path, or no experience item, is not added. Mục tiêu and Kết nối việc làm grant none.
4. Build order (owner): Bản chất first, then Dự án; a later part waits for those two.
5. The program is built in waves: A Ôn tập; B Xây app thật (graded by GitHub Actions) and Luyện code
   (self-hosted Judge0); C Hồ sơ và CV, Code ra app cùng AI and Kết nối việc làm.

## Example
The AI Engineer path strings Bản chất lessons and an agent project; its "done" is a set of verified experience items. The
hub shows it as the top Mục tiêu card, beside the part cards with today's due reviews and the streak.

## Don't / Instead
- Don't add leaderboards or social streak comparison; show the learner's own progress per part.
- Don't write path content to fill a screen; show the empty state and wait for the teacher ([content](content.md)).

## Where
`be/src/modules/domain/hub/`, `be/src/modules/domain/path/`, `be/src/features/api/hub/`,
`fe/apps/app/src/app/[locale]/(app)/`, `fe/apps/app/src/components/blocks/LearnHub/`

Related: [essentials](essentials.md), [projects](projects.md), [verified-experience](verified-experience.md), [streak](streak.md),
[content](content.md)
