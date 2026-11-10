import { useApp } from './context/AppContext'
import { AuthScreen } from './components/auth/AuthScreen'
import { TopBar } from './components/layout/TopBar'
import { Sidebar } from './components/layout/Sidebar'
import { ChatArea } from './components/chat/ChatArea'
import { ProfileModal } from './components/profile/ProfileModal'
import { WahooConnectModal } from './components/wahoo/WahooConnectModal'
import { WorkoutsModal } from './components/wahoo/WorkoutsModal'
import { Notification } from './components/ui/Notification'
import { CalendarView } from './components/plan/CalendarView'
import { FormView } from './components/plan/FormView'

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
            {state.view === 'chat' && <Sidebar />}
            {state.view === 'chat' && <ChatArea />}
            {state.view === 'calendar' && <CalendarView />}
            {state.view === 'form' && <FormView />}
          </div>
        </div>
      )}
      {state.showProfileModal && <ProfileModal />}
      {state.uid && state.showWahooModal && state.wahooConnected === false && <WahooConnectModal />}
      {state.uid && state.showWorkoutsModal && state.wahooConnected === true && <WorkoutsModal />}
      <Notification />
    </>
  )
}
