export type TaskWrapper = {
    (): Promise<void>
}

declare global {
    interface Window {
        elevenlabsApi: {
            credentials : string
            stdout: (...args: Array<string | number>) => void
            ready: () => void
            receiver: (callback: (data: any) => void) => void
        }
    }
}