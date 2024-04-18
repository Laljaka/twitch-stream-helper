export {}

declare global {
    interface Window {
        twitchpubsubApi: {
            credentials : string
            stdout: (...args: Array<string | number>) => void
            ready: () => void
            sender: (msg: string | object) => void
        }
    }
}