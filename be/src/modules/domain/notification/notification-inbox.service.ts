import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type { NotificationMark, NotificationPage, NotificationPageRequest } from "./notification.contracts"
import { decodedCursor, encodedCursor } from "./notification-cursor.policy"
import { markTarget, pageLimit } from "./notification-input.policy"
import { toNotificationView } from "./notification-view.mapper"
import type { CountRow, NotificationRow } from "./persistence/notification.rows"
import {
    COUNT_UNREAD_NOTIFICATIONS,
    MARK_ALL_NOTIFICATIONS_READ,
    MARK_NOTIFICATIONS_READ,
    SELECT_NOTIFICATION_PAGE,
} from "./persistence/notification.sql"

@Injectable()
/** What a learner reads and marks of their own notifications: every statement is scoped to the learner the session names. */
export class NotificationInboxService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /**
     * One page of the learner's notifications, newest first, with the unread count across all pages. The cursor is the one
     * the page before answered; a foreign one is NOTIFICATION_CURSOR_INVALID. The limit defaults to 20 and is at most 50.
     */
    async page(learnerId: string, request: NotificationPageRequest): Promise<NotificationPage> {
        const cursor = request.after === null || request.after === undefined ? null : decodedCursor(request.after)
        const limit = pageLimit(request.limit)
        const rows: Array<NotificationRow> = await this.entityManager.query(SELECT_NOTIFICATION_PAGE, [
            learnerId,
            cursor?.createdAt ?? null,
            cursor?.id ?? null,
            limit + 1,
        ])
        const kept = rows.slice(0, limit)
        const last = kept.at(-1)
        const counts: Array<CountRow> = await this.entityManager.query(COUNT_UNREAD_NOTIFICATIONS, [learnerId])
        return {
            items: kept.map((row) => toNotificationView(row)),
            unreadCount: counts[0]?.total ?? 0,
            next:
                last !== undefined && rows.length > limit
                    ? encodedCursor({ createdAt: last.created_at.toISOString(), id: last.id })
                    : null,
        }
    }

    /**
     * Marks the learner's unread notifications read and answers how many changed: the ids named, or every one when
     * `all` is true. Exactly one of the two is allowed (NOTIFICATION_MARK_INVALID); an id of another learner, an unknown
     * id or an already read one matches nothing, so a repeat answers 0.
     */
    async markRead(learnerId: string, mark: NotificationMark): Promise<number> {
        const ids = markTarget(mark)
        const now = this.clock.now()
        const counts: Array<CountRow> =
            ids === null
                ? await this.entityManager.query(MARK_ALL_NOTIFICATIONS_READ, [learnerId, now])
                : await this.entityManager.query(MARK_NOTIFICATIONS_READ, [learnerId, ids, now])
        return counts[0]?.total ?? 0
    }
}
