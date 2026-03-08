import { Navigate } from 'react-router-dom'

export function ListDrawPage() {
  return <Navigate to="/new?mode=text" replace />
}
