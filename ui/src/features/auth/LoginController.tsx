import { useState, type FormEvent } from 'react'
import { LoginView } from './LoginView'

export function LoginController(props: {
  appKey: string
  wsUrl: string
  setAppKey: (next: string) => void
  setWsUrl: (next: string) => void
  login: (args: { username: string; password: string }) => Promise<void>
}): React.ReactNode {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    await props.login({ username, password })
    setPassword('')
  }

  return (
    <LoginView
      appKey={props.appKey}
      wsUrl={props.wsUrl}
      username={username}
      password={password}
      onChangeAppKey={props.setAppKey}
      onChangeWsUrl={props.setWsUrl}
      onChangeUsername={setUsername}
      onChangePassword={setPassword}
      onSubmit={onSubmit}
    />
  )
}
