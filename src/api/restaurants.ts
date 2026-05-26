import axiosInstance from "./axios";
import type {
  Restaurant,
  UpdateRestaurantPayload,
  CreateRestaurantExtendedPayload,
  UpdateRestaurantExtendedPayload,
  RestaurantFull,
  OperatingHour,
  UpsertOperatingHoursPayload,
  Table,
  CreateTablePayload,
  UpdateTablePayload,
  GalleryImage,
  AddGalleryImagePayload,
  RestaurantTag,
  UpdateTagsPayload,
  SpecialClosure,
  CreateClosurePayload,
  PaginatedResponse,
  PaginationParams,
  ApiResponse,
} from "../types";

export const restaurantsApi = {
  // ── Admin ──
  adminGetAll: (params?: PaginationParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Restaurant>>>(
      "/admin/restaurants",
      { params },
    ),

  adminUpdate: (id: number, payload: UpdateRestaurantPayload) =>
    axiosInstance.put<ApiResponse<Restaurant>>(
      `/admin/restaurants/${id}`,
      payload,
    ),

  adminDelete: (id: number) =>
    axiosInstance.delete<ApiResponse<Record<string, never>>>(
      `/admin/restaurants/${id}`,
    ),

  adminUpdateStatus: (id: number, status: Restaurant["status"], reason?: string) =>
    axiosInstance.patch<ApiResponse<Restaurant>>(
      `/admin/restaurants/${id}/status`,
      { status, ...(reason ? { reason } : {}) },
    ),

  // ── Owner ──
  ownerGetAll: (params?: PaginationParams) =>
    axiosInstance.get<ApiResponse<PaginatedResponse<Restaurant>>>(
      "/owner/restaurants",
      { params },
    ),

  ownerGetById: (id: number) =>
    axiosInstance.get<ApiResponse<Restaurant>>(`/owner/restaurants/${id}`),

  ownerCreate: (payload: CreateRestaurantExtendedPayload) =>
    axiosInstance.post<ApiResponse<Restaurant>>("/owner/restaurants", payload),

  ownerUpdate: (id: number, payload: UpdateRestaurantExtendedPayload) =>
    axiosInstance.put<ApiResponse<Restaurant>>(
      `/owner/restaurants/${id}`,
      payload,
    ),

  ownerDelete: (id: number) =>
    axiosInstance.delete<ApiResponse<Record<string, never>>>(
      `/owner/restaurants/${id}`,
    ),

  // ── Owner — Full detail (with all relations) ──
  ownerGetFull: (id: number) =>
    axiosInstance.get<ApiResponse<RestaurantFull>>(
      `/owner/restaurants/${id}/full`,
    ),

  // ── Owner — Operating Hours ──
  ownerUpdateHours: (id: number, payload: UpsertOperatingHoursPayload) =>
    axiosInstance.put<ApiResponse<OperatingHour[]>>(
      `/owner/restaurants/${id}/hours`,
      payload,
    ),

  // ── Owner — Tables ──
  ownerListTables: (id: number) =>
    axiosInstance.get<ApiResponse<Table[]>>(`/owner/restaurants/${id}/tables`),

  ownerCreateTable: (id: number, payload: CreateTablePayload) =>
    axiosInstance.post<ApiResponse<Table>>(
      `/owner/restaurants/${id}/tables`,
      payload,
    ),

  ownerUpdateTable: (
    id: number,
    tableId: number,
    payload: UpdateTablePayload,
  ) =>
    axiosInstance.put<ApiResponse<Table>>(
      `/owner/restaurants/${id}/tables/${tableId}`,
      payload,
    ),

  ownerDeleteTable: (id: number, tableId: number) =>
    axiosInstance.delete<ApiResponse<Record<string, never>>>(
      `/owner/restaurants/${id}/tables/${tableId}`,
    ),

  // ── Owner — Gallery ──
  ownerAddGalleryImage: (id: number, payload: AddGalleryImagePayload) =>
    axiosInstance.post<ApiResponse<GalleryImage>>(
      `/owner/restaurants/${id}/gallery`,
      payload,
    ),

  ownerDeleteGalleryImage: (id: number, imageId: number) =>
    axiosInstance.delete<ApiResponse<Record<string, never>>>(
      `/owner/restaurants/${id}/gallery/${imageId}`,
    ),

  // ── Owner — Tags ──
  ownerUpdateTags: (id: number, payload: UpdateTagsPayload) =>
    axiosInstance.put<ApiResponse<RestaurantTag[]>>(
      `/owner/restaurants/${id}/tags`,
      payload,
    ),

  // ── Owner — Special Closures ──
  ownerAddClosure: (id: number, payload: CreateClosurePayload) =>
    axiosInstance.post<ApiResponse<SpecialClosure>>(
      `/owner/restaurants/${id}/closures`,
      payload,
    ),

  ownerDeleteClosure: (id: number, closureId: number) =>
    axiosInstance.delete<ApiResponse<Record<string, never>>>(
      `/owner/restaurants/${id}/closures/${closureId}`,
    ),
};
