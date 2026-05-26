import axiosInstance from './axios';
import type {
  RestaurantRequest,
  CreateRequestPayload,
  ReviewRequestPayload,
  PaginatedResponse,
  PaginationParams,
  ApiResponse,
} from '../types';

export const requestsApi = {
  // ── Admin ──
  adminGetAll: (params?: PaginationParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<RestaurantRequest>>>('/admin/restaurant-requests', { params }),

  adminReview: (id: number, payload: ReviewRequestPayload) =>
    axiosInstance.put<ApiResponse<RestaurantRequest>>(`/admin/restaurant-requests/${id}/review`, payload),

  // ── Owner ──
  ownerGetAll: (params?: PaginationParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<RestaurantRequest>>>('/owner/restaurant-requests', { params }),

  ownerCreate: (payload: CreateRequestPayload) =>
    axiosInstance.post<ApiResponse<RestaurantRequest>>('/owner/restaurant-requests', payload),
};
