export enum UserStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  WAITING_SETUP = 'WAITING_SETUP',
  ACTIVE = 'ACTIVE',
}

export enum Permission {
  USER_MANAGEMENT = 'I',       // Gen codes, approve users
  ACCOUNT_VIEW = 'II',         // View passwords, change avatars
  APPROVALS_LEAVE = 'III_L',   // Approve Leave
  APPROVALS_BORROW = 'III_B',  // Approve Borrow
  CONTENT_ADMIN = 'IV',        // Delete announcements
}

export enum LeaveType {
  PERSONAL = '事假',
  SICK = '病假',
  ANNUAL = '年假',
  MARRIAGE = '婚假',
  FUNERAL = '喪假',
  MATERNITY = '產假',
  COMPENSATION = '補假',
  ALLOWED = '被允許的假期',
}

export enum RequestStatus {
  PENDING = '申請中',
  APPROVED = '已批准',
  REJECTED = '已失敗',
  EXPIRED = '已過期',
  SUCCESS = '已成功', // For borrow
  OVERDUE = '逾期中', // For borrow
}

export interface User {
  id: string;
  username: string;
  password?: string;
  email: string;
  avatar: string; // URL or Base64
  role: 'admin' | 'user';
  permissions: Permission[];
  status: UserStatus;
  joinedAt: string;
}

export interface RegistrationCode {
  code: string;
  expiresAt: number; // Timestamp
  createdBy: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string; // Time + Date
  type: LeaveType;
  allowedBy?: string;
  comment?: string; // New field
  status: RequestStatus;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  imageUrl: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface LoanRequest {
  id: string;
  userId: string;
  itemName: string; // Summarized string for display (e.g., "Laptop, Projector")
  itemIds: string[]; // List of specific item IDs
  startDate: string;
  returnDate: string;
  status: RequestStatus;
  createdAt: string;
}

export interface Announcement {
  id: string;
  creatorId: string;
  content: string;
  isPublic: boolean;
  targetUserIds: string[]; // if not public
  readBy: string[]; // userIds
  createdAt: string;
}

export interface Activity {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  totalPrice: string; // Changed from price to total price concept
  maxPeople: number;
  banner?: string; // New field for Base64 image
  isPublic: boolean;
  targetUserIds: string[];
  attendees: { userId: string; status: 'ACCEPTED' | 'REJECTED' }[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string; // Owner of notification
  type: 'LEAVE' | 'LOAN' | 'ANNOUNCEMENT' | 'ACTIVITY' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}