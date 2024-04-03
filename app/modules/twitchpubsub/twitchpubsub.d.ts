export {}

declare global {
    interface Window {
        twitchpubsubApi: {
            credentials : string
            stdout: (str: string) => void
            onClose: (callback: Function) => void
            ready: () => void
        }
    }
}