import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { ExperienceReviewersQuery, ExperienceReviewersQueryVariables } from "../__generated__/graphql"
import type { QueryParams } from "../types"

const query1: TypedDocumentNode<ExperienceReviewersQuery, ExperienceReviewersQueryVariables> = gql`
    query ExperienceReviewers {
        experienceReviewers {
            reviewerId
            parts
            capacity
            conflicts
            appointedAt
            endedAt
            openItems
        }
    }
`

/** Reads the active reviewer appointments (the teacher only). */
export const queryExperienceReviewers = ({
    signal,
}: QueryParams<Readonly<Record<string, never>>>): Promise<ApolloClient.QueryResult<ExperienceReviewersQuery>> =>
    createApolloClient({ signal }).query({ query: query1 })
