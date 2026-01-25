// types/index.ts

export enum UserRole {
  admin = 'admin',
  staff = 'staff',
  partner = 'partner',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}