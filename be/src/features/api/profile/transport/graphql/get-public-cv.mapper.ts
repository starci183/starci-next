import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { GetPublicCvRequest } from "../../application/get-public-cv.contracts"
import type { PublicCvInput } from "./dto/public-cv.input"

/** Maps the publicCv input to the message params. */
export const toGetPublicCvParams = (input: PublicCvInput): PublicExecuteParams<GetPublicCvRequest> => ({
    request: { slug: input.slug, locale: input.locale },
})
