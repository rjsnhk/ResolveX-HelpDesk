import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TicketsList from './pages/TicketsList';
import TicketDetail from './pages/TicketDetail';
import NewTicket from './pages/NewTicket';
import AgentsList from './pages/AgentsList';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <TicketsList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets/new"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <NewTicket />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <TicketDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/dashboard"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <AgentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/tickets"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <TicketsList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/tickets/:id"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <TicketDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/tickets"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TicketsList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/tickets/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <TicketDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/agents"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AgentsList />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
