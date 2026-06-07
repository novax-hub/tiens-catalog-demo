/**
 * Admin-specific view models for user management backoffice.
 * This is the foundation for PR 8 (user management module).
 */

import type { AuthRole } from "@/lib/auth";

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
  /** Country codes this user has been granted access to. Empty array for SUPER_ADMIN. */
  countryCodes: string[];
};

export type AdminUserMutationInput = {
  name: string;
  email: string;
  role: AuthRole;
  isActive: boolean;
  countryCodes: string[];
  passwordHash?: string;
};

export type AdminUserDetail = AdminUserListItem;
