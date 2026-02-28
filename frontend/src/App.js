import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import TodosOpen from "./pages/TodosOpen";
import TodosClosed from "./pages/TodosClosed";
import OneMinuteOpen from "./pages/OneMinuteOpen";
import OneMinuteClosed from "./pages/OneMinuteClosed";
import HabitsToday from "./pages/HabitsToday";
import HabitsProgress from "./pages/HabitsProgress";
import HabitsManage from "./pages/HabitsManage";
import "./App.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-100 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-100 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/todos/open" replace />} />
        <Route path="todos/open" element={<TodosOpen />} />
        <Route path="todos/closed" element={<TodosClosed />} />
        <Route path="todos/quick/open" element={<OneMinuteOpen />} />
        <Route path="todos/quick/closed" element={<OneMinuteClosed />} />
        <Route path="habits/today" element={<HabitsToday />} />
        <Route path="habits/progress" element={<HabitsProgress />} />
        <Route path="habits/manage" element={<HabitsManage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="bottom-right" theme="dark" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
