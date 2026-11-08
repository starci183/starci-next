/** The data of an operation; an answer with no data is a defect, never an empty result. */
export const answeredData = async <T>(
    call: Promise<{ readonly data?: T | null | undefined }>,
    operation: string,
): Promise<NonNullable<T>> => {
    const { data } = await call
    if (data === undefined || data === null) throw new Error(`${operation} answered no data`)
    return data
}
