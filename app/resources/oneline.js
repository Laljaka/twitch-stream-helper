/**
 * @param {Function} func 
 * @param {...any} args 
 * @returns {[any, any]}
 */
export function oneLineError(func, ...args) {
    let err
    let res

    try {
        res = func(...args)
    } catch (error) {
        err = error
    }

    return [err, res]
}

/**
 * @param {Function} func 
 * @param {...any} args 
 * @returns {Promise<[any, any]>}
 */
export async function oneLineErrorPromise(func, ...args) {
    let err
    let res

    try {
        res = await func(...args)
    } catch (error) {
        err = error
    }

    return [err, res]
}