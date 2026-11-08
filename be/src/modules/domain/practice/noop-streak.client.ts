import { Injectable } from "@nestjs/common"
import type { PracticeStreakPort } from "./practice-streak.port"

@Injectable()
/** The streak port of an app that did not bind the hub's streak: the announcement of a graded attempt goes nowhere. */
export class NoopStreakClient implements PracticeStreakPort {
    /** Does nothing. */
    recordStreakAction(): Promise<void> {
        return Promise.resolve()
    }
}
