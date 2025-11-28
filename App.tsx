import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './services/store';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Leave } from './pages/Leave';
import { Borrow } from './pages/Borrow';
import { Announcements } from './pages/Announcements';
import { Activities } from './pages/Activities';
import { Admin } from './pages/Admin';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  return currentUser ? <>{children}</> : <Navigate to="/" />;
};

const Toast: React.FC = () => {
    const { toast } = useApp();
    if (!toast) return null;

    const bg = toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    const icon = toast.type === 'success' ? <CheckCircle size={20}/> : toast.type === 'error' ? <AlertCircle size={20}/> : <Info size={20}/>;

    return (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3 rounded-full shadow-xl text-white font-medium transition-all animate-bounce ${bg}`}>
            {icon}
            <span>{toast.message}</span>
        </div>
    );
};

const Main = () => {
    return (
        <>
            <Toast />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
                <Route path="/leave" element={<PrivateRoute><Leave /></PrivateRoute>} />
                <Route path="/borrow" element={<PrivateRoute><Borrow /></PrivateRoute>} />
                <Route path="/announcements" element={<PrivateRoute><Announcements /></PrivateRoute>} />
                <Route path="/activities" element={<PrivateRoute><Activities /></PrivateRoute>} />
                <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
                <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            </Routes>
        </>
    );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Main />
      </HashRouter>
    </AppProvider>
  );
}