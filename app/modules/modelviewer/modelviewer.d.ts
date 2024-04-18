export {}

declare global {
    interface Window {
        modelviewerApi: {
            credentials : string
            stdout: (message: string) => void
            ready: () => void
            receiver: (callback: (data: any) => void) => void
        }
    }
}
