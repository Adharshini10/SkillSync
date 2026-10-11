import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SkillSwapper from './pages/SkillSwapper';
import ProjectFinder from './pages/ProjectFinder';
import CreateProject from './pages/CreateProject';
import ProjectDetails from './pages/ProjectDetails';
import EditProject from './pages/EditProject';
import YourConnections from './pages/YourConnections';
import Notifications from './pages/Notifications';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className={`app-root ${isAuthenticated ? 'with-sidebar-layout' : 'auth-navbar-layout'}`}>
      {isAuthenticated ? (
        <div className="authenticated-shell">
          <Sidebar />
          <main className="main-viewport-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/skill-swapper"
                element={
                  <ProtectedRoute>
                    <SkillSwapper />
                  </ProtectedRoute>
                }
              />
              <Route path="/connections" element={<Navigate to="/skill-swapper?tab=connections" replace />} />
              <Route path="/chat" element={<Navigate to="/skill-swapper?tab=connections" replace />} />
              <Route path="/project-finder" element={<Navigate to="/projects" replace />} />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectFinder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/create"
                element={
                  <ProtectedRoute>
                    <CreateProject />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjectDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/edit"
                element={
                  <ProtectedRoute>
                    <EditProject />
                  </ProtectedRoute>
                }
              />
              <Route path="/projects/my" element={<Navigate to="/projects?tab=my-projects" replace />} />
              <Route path="/projects/requests" element={<Navigate to="/projects?tab=requests" replace />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/register" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        <div className="unauthenticated-shell">
          <Navbar />
          <main className="auth-main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/skill-swapper"
                element={
                  <ProtectedRoute>
                    <SkillSwapper />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connections"
                element={
                  <ProtectedRoute>
                    <YourConnections />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectFinder />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
