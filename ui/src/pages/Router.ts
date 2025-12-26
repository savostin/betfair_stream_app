import { MainPage } from './MainPage'
import { SettingsPage } from './SettingsPage'
import { AccountStatementPage } from './AccountStatementPage'
import { OrdersPage } from './OrdersPage'

export const routes = {
  main: MainPage,
  settings: SettingsPage,
  accountStatement: AccountStatementPage,
  orders: OrdersPage,
} as const

export type Page = keyof typeof routes
