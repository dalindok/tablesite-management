import axiosInstance from './axios';
import type {
  Menu,
  MenuItem,
  CreateMenuPayload,
  UpdateMenuPayload,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
  ApiResponse,
} from '../types';

// Shape returned by GET /:restaurant_id/menus
export interface MenuListResponse {
  restaurant_id: number;
  menus: Menu[];
}

export const menusApi = {
  // ── Menus ──
  // Pass include_inactive=true so owners can see/manage all menus, not just active ones.
  list: (restaurantId: number) =>
    axiosInstance.get<ApiResponse<MenuListResponse>>(
      `/restaurants/${restaurantId}/menus`,
      { params: { include_inactive: true } },
    ),

  create: (restaurantId: number, payload: CreateMenuPayload) =>
    axiosInstance.post<ApiResponse<Menu>>(`/restaurants/${restaurantId}/menus`, payload),

  // id & restaurant_id are injected automatically to satisfy updateMenuSchema
  update: (restaurantId: number, menuId: number, payload: Omit<UpdateMenuPayload, 'id' | 'restaurant_id'>) =>
    axiosInstance.put<ApiResponse<Menu>>(
      `/restaurants/${restaurantId}/menus/${menuId}`,
      { ...payload, id: menuId, restaurant_id: restaurantId },
    ),

  delete: (restaurantId: number, menuId: number) =>
    axiosInstance.delete<ApiResponse<Record<string, never>>>(`/restaurants/${restaurantId}/menus/${menuId}`),

  // ── Menu Items ──
  createItem: (restaurantId: number, menuId: number, payload: CreateMenuItemPayload) =>
    axiosInstance.post<ApiResponse<MenuItem>>(`/restaurants/${restaurantId}/menus/${menuId}/items`, payload),

  // id & menu_id are injected automatically to satisfy updateMenuItemSchema
  updateItem: (restaurantId: number, menuId: number, itemId: number, payload: Omit<UpdateMenuItemPayload, 'id' | 'menu_id'>) =>
    axiosInstance.put<ApiResponse<MenuItem>>(
      `/restaurants/${restaurantId}/menus/${menuId}/items/${itemId}`,
      { ...payload, id: itemId, menu_id: menuId },
    ),

  deleteItem: (restaurantId: number, menuId: number, itemId: number) =>
    axiosInstance.delete<ApiResponse<Record<string, never>>>(`/restaurants/${restaurantId}/menus/${menuId}/items/${itemId}`),
};
