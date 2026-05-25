import { useApp } from './context/AppContext'
import { AuthScreen } from './components/auth/AuthScreen'
import { TopBar } from './components/layout/TopBar'
import { Sidebar } from './components/layout/Sidebar'
import { ChatArea } from './components/chat/ChatArea'
import { ProfileModal } from './components/profile/ProfileModal'
import { WahooConnectModal } from './components/wahoo/WahooConnectModal'
import { Notification } from './components/ui/Notification'

export function App() {
  const { state } = useApp()

  return (
    <>
      {!state.uid ? (
        <AuthScreen />
      ) : (
        <div className="app-screen">
          <TopBar />
          <div className="main">
            <Sidebar />
            <ChatArea />
          </div>
        </div>
      )}
      {state.showProfileModal && <ProfileModal />}
      {state.uid && state.showWahooModal && state.wahooConnected === false && <WahooConnectModal />}
      <Notification />
    </>
  )
}
