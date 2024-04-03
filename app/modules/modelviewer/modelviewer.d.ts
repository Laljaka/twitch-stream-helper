export {}

declare global {
    interface Window {
        modelviewerApi: {
            toClose: (callback: Function) => void
            credentials : string
            stdout: (message: string) => void
            onData: (callback: Function) => void
            ready: () => void
        }
    }
}
