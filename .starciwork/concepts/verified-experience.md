# verified-experience

Every part grants specific CV-ready experience. The AI grades the evidence and drafts the CV line; the teacher, or a reviewer he
appoints, signs each item (owner: "AI chấm, thầy ký từng mục"). Only verified items count.

## Terms
- **Experience item**: one entry of the experience catalog, with a CV-line template and the proof it needs.
- **States**: đang luyện (practising) → AI đã chấm (ai-graded) → chờ thầy duyệt (pending-review) → Đã xác minh (verified), or trả lại
  (returned) with a note; verified → thu hồi (revoked).
- **Reviewer**: role REVIEWER plus an active appointment by the teacher, scoped to parts and tracks. The teacher (role TEACHER) reviews
  every part.

## Rules
1. A part grants only catalog items. The AI may grade an item only when its proof exists in proof form (attested CI, server probes, a
   graded session, a proved lesson); relay-only evidence keeps it đang luyện.
2. The AI fills the template only from evidence; a number the learner typed is never used, and no CV line says more than the evidence
   backs. The learner may reword within the template; the reviewer sees exactly the line and evidence that will be exported.
3. The AI alone never makes an item verified. A reviewer never reviews their own item or a learner they mentor privately.
4. Only Đã xác minh items count toward the profile, a path's done, the CV export and the hiring bridge; ai-graded and pending items
   show to the learner as pending, never publicly.
5. Every decision (approve, return, revoke, reassign) records the signer, role and time; return and revoke need a note
   (`CAREER_REVIEW_NOTE_REQUIRED`). Every state change is appended to an audit trail; nothing is edited in place.
6. The teacher, or the signer with his approval, may revoke a verified item; profile, path progress and future exports drop it at
   once and its verification page shows it revoked.
7. A public item shows "Đã xác minh bởi StarCi" with the signer's role and date and links to `/verify/{code}`; a reviewer's personal
   name is never public, the teacher's only on items he signed and with his consent.
8. Review defaults (settings): due 3 working days (`Asia/Ho_Chi_Minh`) after submit, reminder at 2, escalation to the teacher at 3; an
   unchanged resubmit is refused; after 3 returns the next resubmit goes to the teacher and waits 7 days.
9. The hiring bridge is a Premium perk, opt-in, sent by hand to one partner (Pegasi), opened by at least 3 verified items. No fee to
   companies, no automatic matching, no placement promise.
10. The streak is never a CV line. Practice is one CV line per pattern, `practice.pattern-solved`: every problem of the pattern is
    Accepted and none had its solution viewed before its first Accepted. The learner claims it with `claimPracticeExperience`; the
    claim is refused `CAREER_PRACTICE_INCOMPLETE` while a problem is not Accepted (or the pattern has none) and
    `CAREER_PRACTICE_SOLUTION_VIEWED` when a solution was opened first. A single problem, an Accepted count and a streak day are
    readiness only.

## Example
A learner proves a Bản chất concept; the AI drafts "Triển khai CQRS read model trong NestJS" with its evidence; it waits in the
reviewer's queue; only after the signature does it show Đã xác minh and appear in the CV export.

## Don't / Instead
- Don't let a grading service write the verified state; only a reviewer's decision does.
- Don't show a pending item on the public profile.

## Where
`be/src/modules/domain/career/`, `be/src/features/api/career/`, `fe/apps/app/src/app/[locale]/(app)/experience/`,
`fe/apps/app/src/app/[locale]/(app)/review-queue/`, `fe/apps/app/src/app/[locale]/(app)/profile/`

Related: [learning-program](learning-program.md), [projects](projects.md), [identity](identity.md), [streak](streak.md)
