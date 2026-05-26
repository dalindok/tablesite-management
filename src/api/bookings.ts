import axiosInstance from './axios';
import type {
  Booking,
  UpdateBookingPayload,
  PaginatedResponse,
  PaginationParams,
  ApiResponse,
} from '../types';

export const bookingsApi = {
  // ── Admin ──
  adminGetAll: (params?: PaginationParams & { restaurantId?: number }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Booking>>>('/admin/bookings', { params }),

  adminGetById: (id: number) =>
    axiosInstance.get<ApiResponse<Booking>>(`/admin/bookings/${id}`),

  adminUpdate: (id: number, payload: UpdateBookingPayload) =>
    axiosInstance.put<ApiResponse<Booking>>(`/admin/bookings/${id}`, payload),

  adminDelete: (id: number) =>
    axiosInstance.delete<ApiResponse<Record<string, never>>>(`/admin/bookings/${id}`),

  // ── Owner ──
  ownerGetAll: (params?: PaginationParams & { restaurantId?: number }) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Booking>>>('/owner/bookings', { params }),

  ownerGetById: (id: number) =>
    axiosInstance.get<ApiResponse<Booking>>(`/owner/bookings/${id}`),

  ownerUpdateStatus: (id: number, payload: UpdateBookingPayload) =>
    axiosInstance.put<ApiResponse<Booking>>(`/owner/bookings/${id}`, payload),
};
