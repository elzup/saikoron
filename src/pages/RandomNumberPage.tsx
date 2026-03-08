import { Navigate } from 'react-router-dom'

export function RandomNumberPage() {
  return <Navigate to="/new?mode=range" replace />
}
