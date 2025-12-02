
import React from 'react';
import { Layout } from '../components/Layout';
import { useApp } from '../services/store';
import { Link } from 'react-router-dom';
import { Briefcase, Repeat, MessageCircle, PartyPopper, AlertTriangle, Settings, UserCog, ChevronRight } from 'lucide-react';
import { RequestStatus } from '../types';

export const Home: React.FC = () => {
  const { announcements, loans, currentUser, users, inventory } = useApp();

  const activeLoans = loans.filter(l => l.userId === currentUser?.id && l.status === RequestStatus.SUCCESS);
  // Simple check if loan is overdue
  const overdueLoans = activeLoans.filter(l => new Date(l.returnDate) < new Date());

  const recentAnnouncements = announcements
    .filter(a => a.isPublic || a.targetUserIds.includes(currentUser?.id || ''))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const isAdminOrPerm = currentUser?.role === 'admin' || (currentUser?.permissions && currentUser.permissions.length > 0);

  return (
    <Layout>
      <div className="space-y-8 pb-10">
        {/* Welcome / Header Section */}
        <div className="pt-2">
           <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">你好, {currentUser?.username}</h2>
           <p className="text-gray-500 mt-1 text-lg">今天想要做什麼？</p>
           
           <div className="flex gap-3 mt-6">
               <Link to="/profile" className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition">
                   <UserCog size={18} /> 編輯個人資訊
               </Link>
               {isAdminOrPerm && (
                   <Link to="/admin" className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white border border-black rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition">
                       <Settings size={18} /> 管理員面板
                   </Link>
               )}
           </div>
        </div>

        {/* 4 Main Buttons - Airbnb Categories Style */}
        <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">探索</h3>
            <div className="grid grid-cols-2 gap-4">
                <MenuBtn to="/leave" icon={<Briefcase size={28} />} title="請假！" desc="申請假期" />
                <MenuBtn to="/borrow" icon={<Repeat size={28} />} title="要借嘢" desc="借用物品" />
                <MenuBtn to="/announcements" icon={<MessageCircle size={28} />} title="有嘢講" desc="公司公告" />
                <MenuBtn to="/activities" icon={<PartyPopper size={28} />} title="一齊玩" desc="活動報名" />
            </div>
        </div>

        {/* Reminders Section */}
        {(activeLoans.length > 0) && (
             <div className="animate-fade-in">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    需要歸還
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">{activeLoans.length}</span>
                </h3>
                <div className="space-y-4">
                    {activeLoans.map(l => {
                        const isOverdue = new Date(l.returnDate) < new Date();
                        const firstItemImage = l.itemIds.length > 0 ? inventory.find(i => i.id === l.itemIds[0])?.imageUrl : null;

                        return (
                            <div key={l.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-md border border-gray-100">
                                {firstItemImage ? (
                                    <img src={firstItemImage} className="w-16 h-16 rounded-xl object-cover" alt="Item" />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold">?</div>
                                )}
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900">{l.itemName}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <AlertTriangle size={14} className={isOverdue ? "text-red-500" : "text-yellow-500"} />
                                        <span className={`text-sm ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                            {isOverdue ? '已逾期' : `請於 ${new Date(l.returnDate).toLocaleDateString()} 歸還`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
        )}

        {/* Recent Announcements */}
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">最新公告</h3>
                <Link to="/announcements" className="text-gray-900 underline text-sm font-semibold">查看全部</Link>
            </div>
            <div className="space-y-4">
                {recentAnnouncements.map(a => {
                    const creator = users.find(u => u.id === a.creatorId);
                    return (
                        <div key={a.id} className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col gap-3">
                            <p className="text-gray-800 text-base leading-relaxed line-clamp-3 font-medium">
                                {a.content}
                            </p>
                            <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                                <img src={creator?.avatar} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">{creator?.username}</span>
                                    <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {recentAnnouncements.length === 0 && (
                    <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
                        <p className="text-gray-400 font-medium">暫時沒有新公告</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </Layout>
  );
};

const MenuBtn: React.FC<{ to: string; icon: React.ReactNode; title: string; desc: string }> = ({ to, icon, title, desc }) => (
  <Link to={to} className="flex flex-col items-start p-4 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition active:scale-[0.98]">
    <div className="mb-3 text-black p-2 bg-gray-100 rounded-lg">{icon}</div>
    <span className="font-bold text-lg text-gray-900">{title}</span>
    <span className="text-xs text-gray-500 font-medium mt-1">{desc}</span>
  </Link>
);
