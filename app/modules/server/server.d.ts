export {}

declare global {
    interface Window {
        serverApi: {
            toClose: (callback: Function) => void
            credentials : string
            stdout: (message: string) => void
            ready: () => void
        }
    }
}