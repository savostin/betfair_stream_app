import { useState, type FormEvent } from 'react'
import { LoginView } from './LoginView'

export function LoginController(props: {
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
      username={username}
      password={password}
      onChangeUsername={setUsername}
      onChangePassword={setPassword}
      onSubmit={onSubmit}
    />
  )
}
