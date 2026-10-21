import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { SettingsProvider, useSettings } from './context/SettingsContext'
import { ToastProvider } from './context/ToastContext'
import { ProgressProvider } from './context/ProgressContext'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { AmbientBackground } from './components/layout/AmbientBackground'
import { BootScreen } from './pages/BootScreen'
import { MainMenu } from './pages/MainMenu'
import { MissionSelect } from './pages/MissionSelect'
import { Workspace } from './pages/Workspace'
import { TrainingLab } from './pages/TrainingLab'
import { Achievements } from './pages/Achievements'
import { Settings } from './pages/Settings'
import { Profile } from './pages/Profile'

const SCREEN_COMPONENTS = {
  boot: BootScreen,
  menu: MainMenu,
  missions: MissionSelect,
  workspace: Workspace,
  training: TrainingLab,
  achievements: Achievements,
  settings: Settings,
  profile: Profile,
}

function ScreenRouter() {
  const { screen, params } = useNavigation()
  const Screen = SCREEN_COMPONENTS[screen] ?? MainMenu
  // Workspace remounts per mission so each session starts clean.
  const key = screen === 'workspace' ? `workspace:${params.missionId}` : screen

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="min-h-dvh"
      >
        <Screen {...params} />
      </motion.div>
    </AnimatePresence>
  )
}

function AppRoot() {
  const { settings, reducedMotion } = useSettings()
  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
      <NavigationProvider initialScreen={settings.skipBoot ? 'menu' : 'boot'}>
        <AmbientBackground />
        <ScreenRouter />
      </NavigationProvider>
    </MotionConfig>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <ProgressProvider>
          <AppRoot />
        </ProgressProvider>
      </ToastProvider>
    </SettingsProvider>
  )
}
