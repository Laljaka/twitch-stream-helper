export type TaskWrapper = {
    (): Promise<void>
}

declare global {
    interface Window {
        elevenlabsApi: {
            credentials : string
            stdout: (message: string) => void
            ready: () => void
            receiver: (callback: (data: any) => void) => void
        }
    }
}