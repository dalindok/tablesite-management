import axiosInstance from './axios';
import type { AdminDashboardStats, OwnerDashboardStats, ApiResponse } from '../types';

export const dashboardApi = {
  adminStats: () =>
    axiosInstance.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard/stats'),

  ownerStats: () =>
    axiosInstance.get<ApiResponse<OwnerDashboardStats>>('/owner/dashboard/stats'),
};
