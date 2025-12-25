import type { BetfairLoginResponse, ListMarketCatalogueResponse } from '../types/betfair'
import { UiError } from '../errors/UiError'

export type LoginArgs = {
  appKey: string
  username: string
  password: string
}

export async function betfairLogin(args: LoginArgs): Promise<string> {
  const body = new URLSearchParams()
  body.set('username', args.username)
  body.set('password', args.password)

  const res = await fetch('/bf-identity/api/login', {
    method: 'POST',
    headers: {
      'X-Application': args.appKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  })

  const data = (await res.json()) as BetfairLoginResponse

  // Betfair Identity can return HTTP 200 with status=FAIL.
  if (!res.ok) {
    throw new UiError(identityErrorToUiError(data, String(res.status)))
  }

  if (data.status && data.status !== 'SUCCESS') {
    throw new UiError(identityErrorToUiError(data, String(data.status)))
  }

  const token = (data.sessionToken ?? data.token)?.trim()
  if (!token) {
    throw new UiError(identityErrorToUiError(data, 'MISSING_SESSION_TOKEN'))
  }

  return token
}

function identityErrorToUiError(
  data: BetfairLoginResponse,
  fallbackCode: string,
): { key: string; values: Record<string, unknown> } {
  const code = (data.error ?? '').trim() || fallbackCode

  const knownCodes = new Set([
    'INVALID_USERNAME_OR_PASSWORD',
    'ACCOUNT_LOCKED',
    'ACCOUNT_SUSPENDED',
    'INVALID_APP_KEY',
    'INVALID_CONNECTIVITY_TO_REGULATOR_DK',
    'INVALID_CONNECTIVITY_TO_REGULATOR_IT',
    'INVALID_CONNECTIVITY_TO_REGULATOR_NZ',
    'KYC_SUSPEND',
    'PENDING_AUTH',
    'SECURITY_QUESTION_WRONG_3X',
    'SELF_EXCLUDED',
    'TOO_MANY_REQUESTS',
  ])

  const key = knownCodes.has(code) ? `errors:betfair.identity.${code}` : 'errors:betfair.identity.unknown'
  return { key, values: { code } }
}

export type ListNextWinMarketsArgs = {
  appKey: string
  sessionToken: string
}

export async function listNextHorseWinMarkets(
  args: ListNextWinMarketsArgs,
): Promise<ListMarketCatalogueResponse> {
  const nowIso = new Date().toISOString()

  const requestBody = {
    filter: {
      eventTypeIds: ['7'],
      marketTypeCodes: ['WIN'],
      marketStartTime: { from: nowIso },
    },
    maxResults: '100',
    marketProjection: ['RUNNER_DESCRIPTION', 'EVENT', 'MARKET_START_TIME'],
    sort: 'FIRST_TO_START',
  }

  const res = await fetch('/bf-api/exchange/betting/rest/v1.0/listMarketCatalogue/', {
    method: 'POST',
    headers: {
      'X-Application': args.appKey,
      'X-Authentication': args.sessionToken,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (text) {
      throw new UiError({
        key: 'errors:betfair.api.listMarketCatalogueFailedWithDetails',
        values: { status: res.status, details: text },
      })
    }
    throw new UiError({
      key: 'errors:betfair.api.listMarketCatalogueFailed',
      values: { status: res.status },
    })
  }

  return (await res.json()) as ListMarketCatalogueResponse
}
