import { Field, ID, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One signed form field the browser posts to the rail. */
export class CheckoutFieldType {
    /** The form field name. */
    @Field(() => String)
    name!: string

    /** The form field value. */
    @Field(() => String)
    value!: string
}

@ObjectType()
/** Where the browser goes to pay: a GET navigation to the URL, or a POST of the fields to it. */
export class CheckoutRedirectType {
    /** The HTTP method the browser follows: GET or POST. */
    @Field(() => String)
    method!: string

    /** The checkout or form-action URL. */
    @Field(() => String)
    url!: string

    /** The signed form fields to post; empty for a GET. */
    @Field(() => [CheckoutFieldType])
    fields!: ReadonlyArray<CheckoutFieldType>
}

@ObjectType()
/** The started checkout: the order to read afterwards and the redirect that pays it. */
export class StartPremiumCheckoutType {
    /** The order the checkout created; the result screen reads it. */
    @Field(() => ID)
    orderId!: string

    /** The rail the order runs on: sepay or payos. */
    @Field(() => String)
    rail!: string

    /** Where the browser goes to pay. */
    @Field(() => CheckoutRedirectType)
    redirect!: CheckoutRedirectType
}
