export {}

declare global {
    interface Window {
        serverApi: {
            credentials : string
            stdout: (message: string) => void
            ready: () => void
            receiver: (callback: (data: any) => void) => void
        }
    }
}