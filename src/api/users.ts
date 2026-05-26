import axiosInstance from './axios';
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  PaginatedResponse,
  PaginationParams,
  ApiResponse,
} from '../types';

export const usersApi = {
  // Admin: get all users (customers + owners)
  getAll: (params?: PaginationParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<User>>>('/admin/users', { params }),

  getById: (id: number) =>
    axiosInstance.get<ApiResponse<User>>(`/admin/users/${id}`),

  create: (payload: CreateUserPayload) =>
    axiosInstance.post<ApiResponse<User>>('/admin/users', payload),

  update: (id: number, payload: UpdateUserPayload) =>
    axiosInstance.put<ApiResponse<User>>(`/admin/users/${id}`, payload),

  delete: (id: number) =>
    axiosInstance.delete<ApiResponse<Record<string, never>>>(`/admin/users/${id}`),

  updateStatus: (id: number, status: User['status']) =>
    axiosInstance.patch<ApiResponse<User>>(`/admin/users/${id}/status`, { status }),
};
