export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(command, args)
}

export async function tauriListen<T>(event: string, handler: (payload: T) => void): Promise<() => void> {
  const { listen } = await import('@tauri-apps/api/event')

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
