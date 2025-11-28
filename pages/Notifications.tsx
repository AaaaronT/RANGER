import React, { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useApp } from '../services/store';

export const Notifications: React.FC = () => {
  const { currentUser, notifications: allNotifs, markAllNotificationsRead } = useApp();
  
  const myNotifications = allNotifs.filter(n => n.userId === currentUser?.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  // Mark all as read when entering
  useEffect(() => {
      if (currentUser) {
          markAllNotificationsRead(currentUser.id);
      }
  }, []);

  return (
    <Layout title="通知中心" back>
        <div className="space-y-3">
            {myNotifications.map(n => (
                <div key={n.id} className={`p-4 rounded-xl border ${n.isRead ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-gray-500 px-2 py-0.5 rounded bg-gray-100 mb-1 inline-block">{n.type}</span>
                        <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-gray-800">{n.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                </div>
            ))}
            {myNotifications.length === 0 && <p className="text-center text-gray-400 py-10">暫無通知</p>}
        </div>
    </Layout>
  );
};