export {}

declare global {
    interface Window {
        elevenlabsApi: {
            onClose: (callback: Function) => void
            credentials : string
            onTask: (callback: Function) => void
            stdout: (message: string) => void
            ready: () => void
        }
    }
}