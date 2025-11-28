
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RegistrationCode, LeaveRequest, LoanRequest, Announcement, Activity, Notification, UserStatus, Permission, RequestStatus, LeaveType, InventoryItem, Category } from '../types';

// Initial Mock Data
const INITIAL_ADMIN: User = {
  id: 'admin-001',
  username: 'AaronTsang',
  password: 'sor9ly2025',
  email: 'aaron@company.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  role: 'admin',
  permissions: [
      Permission.USER_MANAGEMENT, 
      Permission.ACCOUNT_VIEW, 
      Permission.APPROVALS_LEAVE, 
      Permission.APPROVALS_BORROW, 
      Permission.CONTENT_ADMIN
  ],
  status: UserStatus.ACTIVE,
  joinedAt: new Date().toISOString(),
};

const INITIAL_CATEGORIES: Category[] = [
    { id: 'cat-1', name: '電子產品' },
    { id: 'cat-2', name: '文具' },
    { id: 'cat-3', name: '傢俬' },
];

const INITIAL_INVENTORY: InventoryItem[] = [
    { id: 'item-1', name: 'MacBook Pro 16"', categoryId: 'cat-1', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=600&q=80' },
    { id: 'item-2', name: 'Canon 4K Projector', categoryId: 'cat-1', imageUrl: 'https://images.unsplash.com/photo-1517430529647-90c851885834?w=600&q=80' },
    { id: 'item-3', name: 'Herman Miller Chair', categoryId: 'cat-3', imageUrl: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=600&q=80' },
    { id: 'item-4', name: 'Whiteboard Marker Set', categoryId: 'cat-2', imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=80' },
    { id: 'item-5', name: 'Sony Alpha Camera', categoryId: 'cat-1', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80' },
];

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  currentUser: User | null;
  users: User[];
  codes: RegistrationCode[];
  leaves: LeaveRequest[];
  loans: LoanRequest[];
  announcements: Announcement[];
  activities: Activity[];
  notifications: Notification[];
  toast: ToastData | null;
  inventory: InventoryItem[];
  categories: Category[];
}

interface AppContextType extends AppState {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  register: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  firstTimeSetup: (email: string, username: string, password: string, avatar: string) => Promise<{ success: boolean; message: string }>;
  generateCode: () => string;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  updateUserPermissions: (userId: string, permissions: Permission[]) => void;
  createLeave: (data: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'userId'>) => void;
  createLoan: (data: Omit<LoanRequest, 'id' | 'status' | 'createdAt' | 'userId'>) => void;
  createAnnouncement: (data: Omit<Announcement, 'id' | 'readBy' | 'createdAt' | 'creatorId'>) => void;
  createActivity: (data: Omit<Activity, 'id' | 'attendees' | 'createdAt' | 'creatorId'>) => void;
  markAnnouncementRead: (announcementId: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  rsvpActivity: (activityId: string, status: 'ACCEPTED' | 'REJECTED') => void;
  updateRequestStatus: (type: 'LEAVE' | 'LOAN', id: string, status: RequestStatus) => void;
  deleteAnnouncement: (id: string) => void;
  checkEmailForSetup: (email: string) => boolean;
  // Inventory methods
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  deleteInventoryItem: (id: string) => void;
  // User Profile
  updateUserProfile: (userId: string, data: { username?: string, password?: string, avatar?: string }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load from localStorage or use initial
  const load = <T,>(key: string, def: T): T => {
    try {
        const s = localStorage.getItem(key);
        return s ? JSON.parse(s) : def;
    } catch (e) {
        return def;
    }
  };

  const [currentUser, setCurrentUser] = useState<User | null>(load('currentUser', null));
  const [users, setUsers] = useState<User[]>(load('users', [INITIAL_ADMIN]));
  const [codes, setCodes] = useState<RegistrationCode[]>(load('codes', []));
  const [leaves, setLeaves] = useState<LeaveRequest[]>(load('leaves', []));
  const [loans, setLoans] = useState<LoanRequest[]>(load('loans', []));
  const [announcements, setAnnouncements] = useState<Announcement[]>(load('announcements', []));
  const [activities, setActivities] = useState<Activity[]>(load('activities', []));
  const [notifications, setNotifications] = useState<Notification[]>(load('notifications', []));
  const [inventory, setInventory] = useState<InventoryItem[]>(load('inventory', INITIAL_INVENTORY));
  const [categories, setCategories] = useState<Category[]>(load('categories', INITIAL_CATEGORIES));
  const [toast, setToast] = useState<ToastData | null>(null);

  // Sync to localstorage
  useEffect(() => localStorage.setItem('currentUser', JSON.stringify(currentUser)), [currentUser]);
  useEffect(() => localStorage.setItem('users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('codes', JSON.stringify(codes)), [codes]);
  useEffect(() => localStorage.setItem('leaves', JSON.stringify(leaves)), [leaves]);
  useEffect(() => localStorage.setItem('loans', JSON.stringify(loans)), [loans]);
  useEffect(() => localStorage.setItem('announcements', JSON.stringify(announcements)), [announcements]);
  useEffect(() => localStorage.setItem('activities', JSON.stringify(activities)), [activities]);
  useEffect(() => localStorage.setItem('notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('inventory', JSON.stringify(inventory)), [inventory]);
  useEffect(() => localStorage.setItem('categories', JSON.stringify(categories)), [categories]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
      setToast({ id: Date.now().toString(), message, type });
      setTimeout(() => setToast(null), 3000);
  };

  // Helper to add notification
  const notifyUser = (userId: string, title: string, message: string, type: any) => {
    const newNotif: Notification = {
      id: Date.now().toString() + Math.random(),
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const notifyAdmin = (title: string, message: string) => {
    notifyUser('admin-001', title, message, 'SYSTEM');
  };

  const login = async (username: string, password: string) => {
    const cleanUser = username.trim();
    // Allow password to be exact
    const user = users.find(u => u.username === cleanUser && u.password === password);
    if (user) {
        if(user.status === UserStatus.ACTIVE || user.id === 'admin-001') {
            setCurrentUser(user);
            return { success: true };
        } else {
             return { success: false, message: "帳號尚未激活或等待設置" };
        }
    }
    return { success: false, message: "用戶名或密碼錯誤" };
  };

  const logout = () => setCurrentUser(null);

  const checkEmailForSetup = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    return users.some(u => u.email.toLowerCase() === cleanEmail && u.status === UserStatus.WAITING_SETUP);
  };

  const register = async (email: string, code: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().toUpperCase();

    const validCode = codes.find(c => c.code === cleanCode && c.expiresAt > Date.now());
    if (!validCode) return { success: false, message: "驗證碼無效或已過期" };
    
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) return { success: false, message: "電郵已被使用" };

    const newUser: User = {
      id: Date.now().toString(),
      username: `User${Date.now().toString().slice(-4)}`, // Temp username
      email: cleanEmail, // Store cleaned email
      avatar: 'https://picsum.photos/200',
      role: 'user',
      permissions: [],
      status: UserStatus.PENDING_APPROVAL,
      joinedAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    notifyAdmin("新用戶註冊", `電郵 ${cleanEmail} 正在等待批准`);
    return { success: true, message: "SUCCESS" };
  };

  const firstTimeSetup = async (email: string, username: string, password: string, avatar: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim();

      const updatedUsers = users.map(u => {
          if (u.email.toLowerCase() === cleanEmail && u.status === UserStatus.WAITING_SETUP) {
              return { ...u, username: cleanUsername, password, avatar, status: UserStatus.ACTIVE };
          }
          return u;
      });
      setUsers(updatedUsers);
      const user = updatedUsers.find(u => u.email.toLowerCase() === cleanEmail);
      if (user) {
          setCurrentUser(user);
          return { success: true, message: "Setup Complete" };
      }
      return { success: false, message: "Setup Failed" };
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode: RegistrationCode = {
      code,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 mins
      createdBy: currentUser?.id || 'system'
    };
    setCodes(prev => [...prev, newCode]);
    return code;
  };

  const updateUserStatus = (userId: string, status: UserStatus) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status } : u));
  };

  const updateUserPermissions = (userId: string, permissions: Permission[]) => {
      setUsers(users.map(u => u.id === userId ? { ...u, permissions } : u));
  };

  const updateUserProfile = (userId: string, data: { username?: string, password?: string, avatar?: string }) => {
      const updatedUsers = users.map(u => {
          if (u.id === userId) {
              const updatedUser = { ...u, ...data };
              if (currentUser?.id === userId) {
                  setCurrentUser(updatedUser);
              }
              return updatedUser;
          }
          return u;
      });
      setUsers(updatedUsers);
      showToast("個人資料已更新", 'success');
  };

  const createLeave = (data: any) => {
      if (!currentUser) return;
      const req: LeaveRequest = { ...data, id: Date.now().toString(), userId: currentUser.id, status: RequestStatus.PENDING, createdAt: new Date().toISOString() };
      setLeaves([req, ...leaves]);
      notifyAdmin("新假期申請", `${currentUser.username} 申請 ${data.type}`);
  };

  const createLoan = (data: any) => {
    if (!currentUser) return;
    const req: LoanRequest = { ...data, id: Date.now().toString(), userId: currentUser.id, status: RequestStatus.PENDING, createdAt: new Date().toISOString() };
    setLoans([req, ...loans]);
    notifyAdmin("新借物申請", `${currentUser.username} 想借 ${data.itemName}`);
  };

  const createAnnouncement = (data: any) => {
      if (!currentUser) return;
      const ann: Announcement = { ...data, id: Date.now().toString(), creatorId: currentUser.id, readBy: [], createdAt: new Date().toISOString() };
      setAnnouncements([ann, ...announcements]);
      // Notify targets
      const targets = data.isPublic ? users.filter(u => u.status === UserStatus.ACTIVE) : users.filter(u => data.targetUserIds.includes(u.id));
      targets.forEach((t: User) => {
          if (t.id !== currentUser.id) notifyUser(t.id, "新公告", `來自 ${currentUser.username} 的公告`, 'ANNOUNCEMENT');
      });
  };

  const createActivity = (data: any) => {
      if (!currentUser) return;
      const act: Activity = { ...data, id: Date.now().toString(), creatorId: currentUser.id, attendees: [], createdAt: new Date().toISOString() };
      setActivities([act, ...activities]);
      // Notify targets
      const targets = data.isPublic ? users.filter(u => u.status === UserStatus.ACTIVE) : users.filter(u => data.targetUserIds.includes(u.id));
      targets.forEach((t: User) => {
          if (t.id !== currentUser.id) notifyUser(t.id, "新活動", `${currentUser.username} 舉辦了 ${data.title}`, 'ACTIVITY');
      });
  };

  const markAnnouncementRead = (id: string) => {
      if (!currentUser) return;
      setAnnouncements(prev => prev.map(a => {
          if (a.id === id && !a.readBy.includes(currentUser.id)) {
              return { ...a, readBy: [...a.readBy, currentUser.id] };
          }
          return a;
      }));
  };

  const markAllNotificationsRead = (userId: string) => {
    setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, isRead: true } : n));
  };

  const rsvpActivity = (id: string, status: 'ACCEPTED' | 'REJECTED') => {
      if (!currentUser) return;
      let error = '';
      setActivities(prev => prev.map(a => {
          if (a.id === id) {
              const currentAttendees = a.attendees.filter(att => att.userId !== currentUser.id);
              if (status === 'ACCEPTED' && currentAttendees.filter(att => att.status === 'ACCEPTED').length >= a.maxPeople) {
                  error = "人數已滿，無法參加";
                  return a;
              }
              return { ...a, attendees: [...currentAttendees, { userId: currentUser.id, status }] };
          }
          return a;
      }));
      if (error) {
          showToast(error, 'error');
      } else {
          showToast(status === 'ACCEPTED' ? "已報名參加" : "已拒絕邀請", 'success');
      }
  };

  const updateRequestStatus = (type: 'LEAVE' | 'LOAN', id: string, status: RequestStatus) => {
      if (type === 'LEAVE') {
          setLeaves(prev => prev.map(r => {
              if (r.id === id) {
                  notifyUser(r.userId, "假期申請更新", `你的假期申請狀態：${status}`, 'LEAVE');
                  return { ...r, status };
              }
              return r;
          }));
      } else {
          setLoans(prev => prev.map(r => {
            if (r.id === id) {
                notifyUser(r.userId, "借物申請更新", `你的借物申請狀態：${status}`, 'LOAN');
                return { ...r, status };
            }
            return r;
        }));
      }
  };

  const deleteAnnouncement = (id: string) => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      showToast("公告已刪除", 'success');
  };

  // Inventory Management
  const addCategory = (name: string) => {
    setCategories(prev => [...prev, { id: 'cat-' + Date.now(), name }]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setInventory(prev => prev.filter(i => i.categoryId !== id)); // Cascade delete
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    setInventory(prev => [...prev, { ...item, id: 'item-' + Date.now() }]);
  };

  const deleteInventoryItem = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, codes, leaves, loans, announcements, activities, notifications, toast,
      inventory, categories,
      login, logout, register, firstTimeSetup, generateCode, updateUserStatus, updateUserPermissions, updateUserProfile,
      createLeave, createLoan, createAnnouncement, createActivity, markAnnouncementRead, markAllNotificationsRead,
      rsvpActivity, updateRequestStatus, deleteAnnouncement, checkEmailForSetup, showToast,
      addCategory, deleteCategory, addInventoryItem, deleteInventoryItem
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
