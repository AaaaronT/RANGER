import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useApp } from '../services/store';
import { Permission } from '../types';
import { Check, Trash2, Users, Plus, Send } from 'lucide-react';

export const Announcements: React.FC = () => {
  const { announcements, createAnnouncement, markAnnouncementRead, deleteAnnouncement, currentUser, users, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  // Create Form
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canDelete = currentUser?.role === 'admin' || currentUser?.permissions.includes(Permission.CONTENT_ADMIN);

  const handleCreate = () => {
      if (!content.trim()) {
          return showToast("請輸入公告內容", 'error');
      }
      if (!isPublic && selectedUsers.length === 0) {
          return showToast("請選擇至少一位指定對象", 'error');
      }

      createAnnouncement({ content, isPublic, targetUserIds: selectedUsers });
      showToast("公告已發布", 'success');
      setActiveTab('LIST');
      setContent('');
      setSelectedUsers([]);
      setIsPublic(true);
  };

  const toggleUser = (id: string) => {
      if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(u => u !== id));
      else setSelectedUsers([...selectedUsers, id]);
  };

  const visibleAnnouncements = announcements.filter(a => 
      a.isPublic || a.targetUserIds.includes(currentUser?.id || '') || a.creatorId === currentUser?.id
  ).sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Layout title="有嘢講" back>
      {/* Airbnb-style Tab Switcher */}
      <div className="flex border-b border-gray-200 mb-6 sticky top-0 bg-white z-10 -mx-4 px-4 pt-2">
        <button 
            onClick={() => setActiveTab('LIST')} 
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'LIST' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
            公告牆
        </button>
        <button 
            onClick={() => setActiveTab('CREATE')} 
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'CREATE' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
            發布新公告
        </button>
      </div>

      {activeTab === 'LIST' && (
          <div className="space-y-6 pb-20">
              {visibleAnnouncements.length === 0 && (
                  <div className="text-center py-20">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">暫無公告</h3>
                      <p className="text-gray-500">有什麼想告訴大家嗎？</p>
                  </div>
              )}

              {visibleAnnouncements.map(a => {
                  const creator = users.find(u => u.id === a.creatorId);
                  const isRead = a.readBy.includes(currentUser?.id || '');
                  const readUsers = users.filter(u => a.readBy.includes(u.id));

                  return (
                      <div key={a.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition hover:shadow-lg">
                          <div className="p-5">
                              {/* Header */}
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex gap-3 items-center">
                                      <img src={creator?.avatar} className="w-12 h-12 rounded-full object-cover border border-gray-200" alt="avatar" />
                                      <div>
                                          <p className="font-bold text-gray-900 text-base">{creator?.username}</p>
                                          <p className="text-xs text-gray-500 font-medium">{new Date(a.createdAt).toLocaleString()}</p>
                                      </div>
                                  </div>
                                  {canDelete && (
                                      <button onClick={() => deleteAnnouncement(a.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-50 transition">
                                          <Trash2 size={18} />
                                      </button>
                                  )}
                              </div>

                              {/* Content */}
                              <p className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed mb-4 font-normal">
                                  {a.content}
                              </p>
                              
                              {/* Footer Actions */}
                              <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-2">
                                  <div className="flex items-center gap-2">
                                      {isRead ? (
                                          <span className="text-green-600 text-xs font-bold flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                                              <Check size={12}/> 已讀
                                          </span>
                                      ) : (
                                          <button 
                                            onClick={() => markAnnouncementRead(a.id)} 
                                            className="text-white bg-black text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-800 transition"
                                          >
                                              確認收到
                                          </button>
                                      )}
                                  </div>
                                  <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} className="text-xs text-gray-500 font-bold hover:text-gray-800 transition flex items-center gap-1">
                                      <Users size={14} /> {readUsers.length} 人已讀
                                  </button>
                              </div>
                          </div>
                          
                          {/* Expanded Read List */}
                          {expandedId === a.id && (
                              <div className="bg-gray-50 px-5 py-4 border-t border-gray-100">
                                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">已讀成員</p>
                                  <div className="flex flex-wrap gap-2">
                                      {readUsers.map(u => (
                                          <img key={u.id} src={u.avatar} title={u.username} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                                      ))}
                                      {readUsers.length === 0 && <span className="text-xs text-gray-400 italic">暫無人已讀</span>}
                                  </div>
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      )}

      {activeTab === 'CREATE' && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">撰寫公告</h3>
                  
                  <div className="relative mb-4">
                    <textarea 
                        className="w-full p-4 border border-gray-300 rounded-xl bg-white focus:ring-1 focus:ring-black focus:border-black outline-none min-h-[160px] text-gray-800 text-base resize-none" 
                        placeholder="想和大家分享什麼..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-gray-900">發布對象</span>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <span className={`text-sm font-bold ${isPublic ? 'text-[#FF385C]' : 'text-gray-400'}`}>所有人</span>
                              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isPublic ? 'bg-[#FF385C]' : 'bg-gray-200'}`} onClick={() => setIsPublic(!isPublic)}>
                                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
                              </div>
                          </label>
                      </div>
                      
                      {!isPublic && (
                          <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto bg-gray-50 custom-scrollbar">
                              <p className="text-xs text-gray-500 font-bold mb-2 uppercase px-1">選擇成員</p>
                              {users.filter(u => u.id !== currentUser?.id).map(u => (
                                  <div 
                                    key={u.id} 
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${selectedUsers.includes(u.id) ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-gray-100'}`} 
                                    onClick={() => toggleUser(u.id)}
                                  >
                                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedUsers.includes(u.id) ? 'bg-black border-black' : 'bg-white border-gray-300'}`}>
                                          {selectedUsers.includes(u.id) && <Check size={12} className="text-white" />}
                                      </div>
                                      <img src={u.avatar} className="w-8 h-8 rounded-full" />
                                      <span className="text-sm font-medium text-gray-800">{u.username}</span>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <button 
                    onClick={handleCreate} 
                    className="w-full bg-[#FF385C] text-white font-bold py-4 rounded-xl hover:bg-[#D90B3E] transition shadow-md flex items-center justify-center gap-2 text-lg"
                  >
                      <Send size={20} /> 發布公告
                  </button>
              </div>
          </div>
      )}
    </Layout>
  );
};