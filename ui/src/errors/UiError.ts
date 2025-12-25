export type UiErrorPayload = {
  key: string
  values?: Record<string, unknown>
}

export class UiError extends Error {
  readonly key: string
  readonly values?: Record<string, unknown>

  constructor(payload: UiErrorPayload) {
    // Keep Error.message non-user-facing; render via i18n using key/values.
    super(payload.key)
    this.name = 'UiError'
    this.key = payload.key
    this.values = payload.values
  }
}

export function isUiError(e: unknown): e is UiError {
  return typeof e === 'object' && e !== null && (e as any).name === 'UiError' && typeof (e as any).key === 'string'
}
