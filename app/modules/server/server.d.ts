export {}

declare global {
    interface Window {
        serverApi: {
            toClose: (callback: () => void) => void
            credentials : string
            stdout: (message: string) => void
            ready: () => void
            receiver: (callback: (data: any) => void) => void
        }
    }
}