import React from 'react';
import { useApp } from '../services/store';
import { Bell, LogOut, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode; title?: string; back?: boolean }> = ({ children, title, back }) => {
  const { currentUser, logout, notifications } = useApp();
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => n.userId === currentUser?.id && !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        {currentUser && (
          <header className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-50 bg-opacity-95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {back && (
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full -ml-2 transition">
                  <ArrowLeft size={22} className="text-gray-800" />
                </button>
              )}
              {title ? (
                 <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">{title}</h1>
              ) : (
                <div className="flex items-center gap-2">
                     <img 
                        src="http://ranger4s.com/wp-content/uploads/2025/11/RANGER-scaled.png" 
                        alt="RANGER" 
                        className="h-8 w-auto object-contain" 
                     />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/notifications" className="relative p-1">
                <Bell size={22} className="text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FF385C] border-2 border-white rounded-full"></span>
                )}
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} className="p-1 hover:text-[#FF385C] transition">
                <LogOut size={22} className="text-gray-700" />
              </button>
            </div>
          </header>
        )}
        
        <main className="flex-1 px-5 py-2 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};