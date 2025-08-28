import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import './App.css'

// Lazy load all pages
const LandingPage = lazy(() => import('@/pages/LandingPage').then(module => ({ default: module.LandingPage })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })))
const Research = lazy(() => import('@/pages/Research').then(module => ({ default: module.Research })))
const Projects = lazy(() => import('@/pages/Projects').then(module => ({ default: module.Projects })))
const Knowledge = lazy(() => import('@/pages/Knowledge').then(module => ({ default: module.Knowledge })))
const Analytics = lazy(() => import('@/pages/Analytics').then(module => ({ default: module.Analytics })))
const Settings = lazy(() => import('@/pages/Settings').then(module => ({ default: module.Settings })))
const Newsletter = lazy(() => import('@/pages/Newsletter').then(module => ({ default: module.Newsletter })))
const Hackathons = lazy(() => import('@/pages/Hackathons').then(module => ({ default: module.Hackathons })))
const PromptLibrary = lazy(() => import('@/pages/PromptLibrary').then(module => ({ default: module.PromptLibrary })))
const ProjectView = lazy(() => import('@/pages/ProjectView').then(module => ({ default: module.ProjectView })))
const Login = lazy(() => import('@/pages/Login').then(module => ({ default: module.Login })))
const Signup = lazy(() => import('@/pages/Signup').then(module => ({ default: module.Signup })))

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="text-white">Loading...</div>
  </div>
)


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-950 text-white">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/research" element={
                <ProtectedRoute>
                  <Research />
                </ProtectedRoute>
              } />
              <Route path="/projects" element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              } />
              <Route path="/projects/:id" element={
                <ProtectedRoute>
                  <ProjectView />
                </ProtectedRoute>
              } />
              <Route path="/knowledge" element={
                <ProtectedRoute>
                  <Knowledge />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/newsletter" element={
                <ProtectedRoute>
                  <Newsletter />
                </ProtectedRoute>
              } />
              <Route path="/hackathons" element={
                <ProtectedRoute>
                  <Hackathons />
                </ProtectedRoute>
              } />
              <Route path="/prompts" element={
                <ProtectedRoute>
                  <PromptLibrary />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App