export {}

declare global {
    interface Window {
        twitchpubsubApi: {
            credentials : string
            stdout: (str: string) => void
            onClose: (callback: () => void) => void
            ready: () => void
            sender: (msg: string | object) => void
        }
    }
}