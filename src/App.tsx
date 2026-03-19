import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './components/Dashboard'
import { CycleSetup } from './components/workout/CycleSetup'
import { WorkoutDay } from './components/workout/WorkoutDay'
import { TabataDay } from './components/workout/TabataDay'
import { CycleOverview } from './components/workout/CycleOverview'
import { AnalyticsPage } from './components/analytics/AnalyticsPage'
import { CoachPage } from './components/ai/CoachPage'
import { WorkoutList } from './components/workout/WorkoutList'
import { SettingsPage } from './components/settings/SettingsPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cycle/new" element={<CycleSetup />} />
        <Route path="/cycle/overview" element={<CycleOverview />} />
        <Route path="/workout/:lift" element={<WorkoutDay />} />
        <Route path="/workout/tabata" element={<TabataDay />} />
        <Route path="/workout" element={<WorkoutList />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/coach" element={<CoachPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
