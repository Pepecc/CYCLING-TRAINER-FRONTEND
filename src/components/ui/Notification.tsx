import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'

export function Notification() {
  const { state, clearNotification } = useApp()

  useEffect(() => {
    if (!state.notification) return
    const t = setTimeout(clearNotification, 2500)
    return () => clearTimeout(t)
  }, [state.notification, clearNotification])

  return (
    <div className={`notification ${state.notification ? 'show' : ''}`}>
      {state.notification}
    </div>
  )
}
