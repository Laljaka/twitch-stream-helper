export type TaskWrapper = {
    (): Promise<void>
}

declare global {
    interface Window {
        elevenlabsApi: {
            onClose: (callback: Function) => void
            credentials : string
            onTask: (callback: Function) => void
            stdout: (message: string) => void
            ready: () => void
            receiver: (callback: Function) => Promise<void>
        }
    }
}