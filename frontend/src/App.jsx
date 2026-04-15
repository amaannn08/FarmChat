import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import LoginScreen from './components/Auth/LoginScreen';
import ChatDashboard from './components/Chat/ChatDashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#16a34a] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#8b949e] font-medium text-sm">Loading KisanSaathi...</p>
        </div>
      </div>
    );
  }

  return user ? (
    <SocketProvider>
      <ChatDashboard />
    </SocketProvider>
  ) : (
    <LoginScreen />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
