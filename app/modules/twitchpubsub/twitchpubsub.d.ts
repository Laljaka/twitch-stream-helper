export {}

declare global {
    interface Window {
        twitchpubsubApi: {
            credentials : string
            stdout: (str: string) => void
            ready: () => void
            sender: (msg: string | object) => void
        }
    }
}