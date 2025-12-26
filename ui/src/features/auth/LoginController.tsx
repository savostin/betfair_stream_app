import { useState, type FormEvent } from 'react'
import { LoginView } from './LoginView'
import { useNotifications } from '@hooks/notificationsContext'

export function LoginController(props: {
  login: (args: { username: string; password: string }) => Promise<void>
}): React.ReactNode {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const notifications = useNotifications()

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setIsLoading(true)
    try {
      await props.login({ username, password })
      setPassword('')
    } catch (error) {
      notifications.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LoginView
      username={username}
      password={password}
      onChangeUsername={setUsername}
      onChangePassword={setPassword}
      onSubmit={onSubmit}
      isLoading={isLoading}
    />
  )
}
