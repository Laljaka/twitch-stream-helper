export type TaskWrapper = {
    (): Promise<void>
}

declare global {
    interface Window {
        elevenlabsApi: {
            toClose: (callback: () => void) => void
            credentials : string
            stdout: (message: string) => void
            ready: () => void
            receiver: (callback: (data: any) => void) => void
        }
    }
}