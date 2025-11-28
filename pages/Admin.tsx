
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useApp } from '../services/store';
import { Permission, UserStatus, RequestStatus } from '../types';
import { Check, X, Eye, Shield, Key } from 'lucide-react';

export const Admin: React.FC = () => {
  const { currentUser, users, codes, generateCode, updateUserStatus, updateUserPermissions, leaves, loans, updateRequestStatus, showToast, inventory } = useApp();
  const [tab, setTab] = useState<'USERS' | 'REQUESTS' | 'CODES'>('USERS');

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.permissions.length === 0)) {
      return <div>Access Denied</div>;
  }

  const hasPerm = (p: Permission) => currentUser.role === 'admin' || currentUser.permissions.includes(p);
  
  const canApprove = currentUser.role === 'admin' || 
                     currentUser.permissions.includes(Permission.APPROVALS_LEAVE) || 
                     currentUser.permissions.includes(Permission.APPROVALS_BORROW);

  const handleUpdateStatus = (id: string, status: UserStatus) => {
      updateUserStatus(id, status);
      showToast(`用戶狀態已更新為 ${status}`, 'success');
  };

  const handleUpdatePerms = (id: string, perms: Permission[]) => {
      updateUserPermissions(id, perms);
      showToast("用戶權限已更新", 'success');
  };

  const handleRequest = (type: 'LEAVE' | 'LOAN', id: string, status: RequestStatus) => {
      updateRequestStatus(type, id, status);
      showToast(`申請已${status === RequestStatus.APPROVED || status === RequestStatus.SUCCESS ? '批准' : '拒絕'}`, status === RequestStatus.APPROVED || status === RequestStatus.SUCCESS ? 'success' : 'info');
  };

  const handleGenerateCode = () => {
      generateCode();
      showToast("新驗證碼已生成", 'success');
  };

  return (
    <Layout title="管理員面板" back>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {hasPerm(Permission.USER_MANAGEMENT) && <TabBtn name="用戶" active={tab === 'USERS'} onClick={() => setTab('USERS')} />}
        {canApprove && <TabBtn name="審批" active={tab === 'REQUESTS'} onClick={() => setTab('REQUESTS')} />}
        {hasPerm(Permission.USER_MANAGEMENT) && <TabBtn name="驗證碼" active={tab === 'CODES'} onClick={() => setTab('CODES')} />}
      </div>

      {tab === 'USERS' && hasPerm(Permission.USER_MANAGEMENT) && (
        <div className="space-y-4">
             {users.map(u => (
                 <div key={u.id} className="bg-white p-4 rounded-xl shadow-sm">
                     <div className="flex items-center gap-3 mb-2">
                         <img src={u.avatar} className="w-10 h-10 rounded-full" />
                         <div>
                             <p className="font-bold">{u.username} <span className="text-xs text-gray-500">({u.role})</span></p>
                             <p className="text-xs text-gray-400">{u.email}</p>
                         </div>
                         <div className={`ml-auto px-2 py-1 text-xs rounded ${u.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                             {u.status}
                         </div>
                     </div>
                     
                     {u.status === UserStatus.PENDING_APPROVAL && (
                         <div className="flex gap-2 mb-2">
                             <button onClick={() => handleUpdateStatus(u.id, UserStatus.WAITING_SETUP)} className="flex-1 bg-green-500 text-white text-xs py-1 rounded">批准並等待設置</button>
                         </div>
                     )}

                     {currentUser.role === 'admin' && u.id !== currentUser.id && (
                         <div className="mt-2 border-t pt-2 space-y-2">
                             {hasPerm(Permission.ACCOUNT_VIEW) && (
                                 <div className="text-xs text-gray-500 flex items-center gap-1">
                                     <Key size={12}/> 密碼: {u.password || 'Not Set'}
                                 </div>
                             )}
                             <div className="flex flex-wrap gap-1">
                                 {Object.values(Permission).map(p => (
                                     <button 
                                        key={p}
                                        onClick={() => {
                                            const newPerms = u.permissions.includes(p) 
                                                ? u.permissions.filter(perm => perm !== p)
                                                : [...u.permissions, p];
                                            handleUpdatePerms(u.id, newPerms);
                                        }}
                                        className={`px-2 py-1 text-[10px] rounded border ${u.permissions.includes(p) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                                     >
                                         {p}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     )}
                 </div>
             ))}
        </div>
      )}

      {tab === 'CODES' && hasPerm(Permission.USER_MANAGEMENT) && (
          <div className="space-y-4">
              <button onClick={handleGenerateCode} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">生成新驗證碼 (30分鐘有效)</button>
              {codes.sort((a,b) => b.expiresAt - a.expiresAt).map(c => {
                  const isExpired = c.expiresAt < Date.now();
                  return (
                      <div key={c.code} className={`p-3 rounded-lg flex justify-between items-center ${isExpired ? 'bg-gray-200 text-gray-500' : 'bg-white shadow-sm'}`}>
                          <span className="font-mono text-xl font-bold tracking-widest">{c.code}</span>
                          <span className="text-xs">{isExpired ? '已過期' : `有效至 ${new Date(c.expiresAt).toLocaleTimeString()}`}</span>
                      </div>
                  );
              })}
          </div>
      )}

      {tab === 'REQUESTS' && canApprove && (
          <div className="space-y-6">
              {(currentUser.role === 'admin' || currentUser.permissions.includes(Permission.APPROVALS_LEAVE)) && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-2">假期申請</h3>
                  {leaves.filter(l => l.status === RequestStatus.PENDING).map(l => {
                      const u = users.find(user => user.id === l.userId);
                      return (
                          <div key={l.id} className="bg-white p-3 rounded-lg shadow-sm mb-2">
                               <p className="font-bold text-sm">{u?.username} - {l.type}</p>
                               <p className="text-xs text-gray-500">{new Date(l.startDate).toLocaleDateString()} -> {new Date(l.endDate).toLocaleDateString()}</p>
                               {l.allowedBy && <p className="text-xs text-blue-500">批准人: {l.allowedBy}</p>}
                               <div className="flex gap-2 mt-2">
                                   <button onClick={() => handleRequest('LEAVE', l.id, RequestStatus.APPROVED)} className="bg-green-100 text-green-600 p-1 rounded flex-1 flex justify-center"><Check size={16}/></button>
                                   <button onClick={() => handleRequest('LEAVE', l.id, RequestStatus.REJECTED)} className="bg-red-100 text-red-600 p-1 rounded flex-1 flex justify-center"><X size={16}/></button>
                               </div>
                          </div>
                      );
                  })}
                  {leaves.filter(l => l.status === RequestStatus.PENDING).length === 0 && <p className="text-xs text-gray-400">無待處理申請</p>}
              </div>
              )}

              {(currentUser.role === 'admin' || currentUser.permissions.includes(Permission.APPROVALS_BORROW)) && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-2">借物申請</h3>
                  {loans.filter(l => l.status === RequestStatus.PENDING).map(l => {
                      const u = users.find(user => user.id === l.userId);
                      const requestedImages = l.itemIds.map(id => inventory.find(i => i.id === id)?.imageUrl).filter(Boolean);

                      return (
                          <div key={l.id} className="bg-white p-3 rounded-lg shadow-sm mb-2">
                               <div className="flex items-start gap-3">
                                   <div className="flex-1">
                                        <p className="font-bold text-sm">{u?.username} - {l.itemName}</p>
                                        <p className="text-xs text-gray-500">借: {new Date(l.startDate).toLocaleString()}</p>
                                   </div>
                               </div>
                               
                               {requestedImages.length > 0 && (
                                   <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                                       {requestedImages.map((img, idx) => (
                                           <img key={idx} src={img} className="w-10 h-10 rounded object-cover border" />
                                       ))}
                                   </div>
                               )}

                               <div className="flex gap-2 mt-2">
                                   <button onClick={() => handleRequest('LOAN', l.id, RequestStatus.SUCCESS)} className="bg-green-100 text-green-600 p-1 rounded flex-1 flex justify-center"><Check size={16}/></button>
                                   <button onClick={() => handleRequest('LOAN', l.id, RequestStatus.REJECTED)} className="bg-red-100 text-red-600 p-1 rounded flex-1 flex justify-center"><X size={16}/></button>
                               </div>
                          </div>
                      );
                  })}
                  {loans.filter(l => l.status === RequestStatus.PENDING).length === 0 && <p className="text-xs text-gray-400">無待處理申請</p>}
              </div>
              )}
          </div>
      )}
    </Layout>
  );
};

const TabBtn = ({ name, active, onClick }: any) => (
    <button onClick={onClick} className={`px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap ${active ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'}`}>
        {name}
    </button>
);
