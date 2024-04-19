export {}

declare global {
    interface Window {
        modelviewerApi: {
            credentials : string
            stdout: (...args: Array<string | number>) => void
            ready: () => void
            receiver: (callback: (data: any) => void) => void
        }
    }
}
