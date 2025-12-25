export function AuthGate(props: {
  isAuthed: boolean
  unauthenticated: React.ReactNode
  authenticated: React.ReactNode
}): React.ReactNode {
  return props.isAuthed ? props.authenticated : props.unauthenticated
}
