/**
 * @param {Function} func 
 * @returns {(...args: any[]) => [Error | undefined, any | undefined]}
 */
export function oneLineError(func) {
    return function(...args) {
        let err
        let res
        try {
            res = func(...args)
        } catch (error) {
            if (error instanceof Error) err = error
            else if (typeof error === 'string') err = new Error(error)
        }
        return [err, res]
    }
}

/**
 * @param {Function} func  
 * @returns {(...args: any[]) => Promise<[Error | undefined, any | undefined]>}
 */
export function oneLineErrorPromise(func) {
    return async function(...args) {
        let err
        let res
        try {
            res = await func(...args)
        } catch (error) {
            if (error instanceof Error) err = error
            else if (typeof error === 'string') err = new Error(error)
        }
    
        return [err, res]
    }
}