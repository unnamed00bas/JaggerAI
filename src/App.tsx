import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './components/Dashboard'
import { WorkoutHistory } from './components/workout/WorkoutHistory'
import { WorkoutStartPicker } from './components/workout/WorkoutStartPicker'
import { ActiveWorkout } from './components/workout/ActiveWorkout'
import { PlanPage } from './components/workout/PlanPage'
import { AnalyticsPage } from './components/analytics/AnalyticsPage'
import { CoachPage } from './components/ai/CoachPage'
import { SettingsPage } from './components/settings/SettingsPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workout" element={<WorkoutHistory />} />
        <Route path="/workout/start" element={<WorkoutStartPicker />} />
        <Route path="/workout/start/:dayType" element={<ActiveWorkout />} />
        <Route path="/workout/active" element={<ActiveWorkout />} />
        <Route path="/workout/active/:dayType" element={<ActiveWorkout />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/coach" element={<CoachPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
