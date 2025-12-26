import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  return invoke<T>(command, args)
}

export async function tauriListen<T>(event: string, handler: (payload: T) => void): Promise<() => void> {
  const unlisten = await listen<T>(event, (ev) => {
    handler(ev.payload)
  })

  return () => {
    try {
      unlisten()
    } catch {
      // ignore
    }
  }
}
