# profile-progress

Two pages that show the learner to themselves: the profile (who they are and what StarCi verified) and the progress (how far they have
come, across the whole app). Neither owns learning state; both read it from the capability that owns it.

## Terms
- **Profile**: the display name, the avatar and the goal path of a learner. It owns `profile_learners` (name and avatar storage key) and
  nothing else; the goal path is read from the path capability, the CV lines from career, devices from the relay, MCP tokens from mcp
  and the plan from entitlement.
- **Avatar key**: `avatars/<learner id>/<generated id>.<ext>` in the one bucket of the app. A new upload is a new key, so an old signed
  address never shows a new image.
- **Progress**: the read model `learnerProgress`: the ribbon (proved concepts, streak, lessons done, builds done), Essentials (topics,
  lessons, opener before and after, the parts the plan opens), the harness (builds, stages, doctor and trial verdicts), Projects
  (concepts proved and practising, milestones), Review (due cards, streak) and a recent-activity timeline.
- **Opener before and after**: of a lesson's five opener questions, how many were right the first time (before) and are right now
  (after); read from the attempt capability.
- **Harness read**: the builds with their stages, the doctor of each tool and the newest trial of each trap, read through
  `ProgressHarnessPort`; the app binds `ProgressHarnessClient`, which asks the harness capability and the results the learner relayed.

## Rules
1. The progress stores nothing and owns no table. Every number is a read; a source that fails is logged, listed in `unavailable` and
   its section shows "could not load" while the rest of the page still answers (`conventions.md` rule 5).
2. Access follows the owner's settings in one place ([premium](premium.md)): Harness is free for everyone; Essentials part 1 is free and
   parts 2 to 4 need Premium; Projects are for subscribers only. A learner without a subscription gets `projectsLocked` and the page
   draws the pitch, never a crippled tool, and the back end does not read Projects for that learner.
3. An avatar is uploaded by the browser straight to the object store on a signed address that fixes its content type and exact size.
   The profile checks type and size against its settings (`PROFILE_AVATAR_MAX_BYTES` 2 MiB, `PROFILE_AVATAR_TYPES` PNG, JPEG, WebP)
   before it signs, and again on what the store recorded when the learner confirms. A key that is not under the learner's own folder is
   refused (`PROFILE_AVATAR_KEY_INVALID`). The old object is deleted after the new one is stored; a failed delete is logged and never
   fails the learner.
4. Only Verified items are CV lines and only they get a public verify link (`/verify/{code}`); the link never shows a score or a
   reviewer name ([verified-experience](verified-experience.md) rules 4 and 7). Practising, graded and pending items never show here.
5. The streak and the review counts are readiness, never a CV line (`verified-experience.md` rule 10); the ribbon shows them beside the
   proved concepts without joining them.
6. The display name is 1 to `PROFILE_NAME_MAX` (60) characters with no control character; empty clears it and the account name shows.

## Example
A free learner opens `/progress`: the ribbon shows 0 proved concepts and a 3-day streak, Essentials shows part 1 open and parts 2 to 4
"Cần Premium", Harness shows the builds, and Projects is one row that invites them to Premium. On `/profile` they upload a 300 KB PNG:
the browser checks it, the server signs a 300 KB `image/png` upload, the bytes go to MinIO, the server confirms what the store holds.

## Don't / Instead
- Don't copy a lesson, project or experience state into a progress table; read the capability.
- Don't let the browser name the bucket or the key; the server builds the key from the verified subject.
- Don't show Projects numbers to a learner without a subscription to make the page look fuller.

## Where
`be/src/modules/domain/profile/`, `be/src/modules/domain/progress/`, `be/src/features/api/profile/`, `be/src/features/api/progress/`,
`fe/apps/app/src/components/blocks/ProfileHub/`, `fe/apps/app/src/components/blocks/ProgressOverview/`, `fe/apps/app/src/hooks/profile/`,
`gallery/pages/profile/`, `gallery/pages/progress/`

Related: [verified-experience](verified-experience.md), [premium](premium.md), [streak](streak.md), [essentials](essentials.md),
[projects](projects.md), [learner-cli-relay](learner-cli-relay.md), [mcp](mcp.md)
