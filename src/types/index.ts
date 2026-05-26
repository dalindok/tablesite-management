// ── Auth ──────────────────────────────────────────────
export type UserRole = "admin" | "owner" | "customer";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// ── Users ─────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
  restaurantCount?: number; // for owners
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: "active" | "inactive" | "suspended";
}

// ── Restaurant ────────────────────────────────────────
export type RestaurantStatus = "active" | "inactive" | "pending" | "suspended";
export type CuisineType =
  | "Asian"
  | "Western"
  | "Italian"
  | "Japanese"
  | "Thai"
  | "Chinese"
  | "Indian"
  | "French"
  | "Mexican"
  | "Mediterranean"
  | "Other";

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone: string;
  email: string;
  website?: string;
  coverImageUrl?: string;
  cuisineType: CuisineType;
  priceRange?: PriceRange;
  isPopular?: boolean;
  capacity: number;
  minCapacity?: number;
  openingTime: string;
  closingTime: string;
  image?: string;
  status: RestaurantStatus;
  ownerId: number;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  rating?: number;
  adminNote?: string;
  minBookingNotice?: number;
  maxBookingDays?: number;
  cancellationHours?: number;
  depositRequired?: boolean;
  depositAmount?: number;
  parkingAvailable?: boolean;
  dressCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRestaurantPayload {
  name: string;
  description?: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  cuisineType: CuisineType;
  capacity: number;
  openingTime: string;
  closingTime: string;
}

export interface UpdateRestaurantPayload extends Partial<CreateRestaurantPayload> {
  status?: RestaurantStatus;
}

// ── Booking ───────────────────────────────────────────
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface Booking {
  id: number;
  restaurantId: number;
  restaurantName?: string;
  customerId: number;
  // Legacy / fallback fields
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  // Contact details submitted in the booking form
  contactCustomerName?: string;
  contactCustomerPhone?: string;
  contactCustomerEmail?: string;
  // Linked user account name
  bookingUserName?: string;
  date: string;
  time: string;
  partySize: number;
  status: BookingStatus;
  specialRequests?: string;
  tableNumber?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBookingPayload {
  status?: BookingStatus;
  tableNumber?: string;
  date?: string;
  time?: string;
  partySize?: number;
  cancellationReason?: string;
}

// ── Restaurant Requests ───────────────────────────────
export type RequestStatus = "pending" | "approved" | "rejected";

export interface RestaurantRequest {
  id: number;
  ownerId: number;
  ownerName?: string;
  ownerEmail?: string;
  currentCount: number;
  requestedCount: number;
  reason: string;
  status: RequestStatus;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestPayload {
  reason: string;
  requestedCount: number;
}

export interface ReviewRequestPayload {
  status: "approved" | "rejected";
  adminNote: string;
}

// ── Dashboard ─────────────────────────────────────────
export interface AdminDashboardStats {
  totalUsers: number;
  totalOwners: number;
  totalCustomers: number;
  totalRestaurants: number;
  activeRestaurants: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  todayBookings: number;
  pendingRequests: number;
  recentBookings: Booking[];
  bookingsByMonth: { month: string; count: number }[];
}

export interface OwnerDashboardStats {
  totalRestaurants: number;
  activeRestaurants: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  todayBookings: number;
  canAddRestaurant: boolean;
  restaurantLimit?: number;
  recentBookings: Booking[];
}

// ── API Response Envelope ─────────────────────────────
// Every backend endpoint wraps its payload via successResponse():
//   { success: true, message: "...", data: <T> }
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Restaurant Extended Fields ────────────────────────
export type PriceRange = "LOW" | "MEDIUM" | "HIGH";
export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

// All interfaces below use snake_case to match Prisma / API responses directly.

export interface OperatingHour {
  id: number;
  restaurant_id: number;
  day_of_week: DayOfWeek;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface Table {
  id: number;
  restaurant_id: number;
  table_number: string;
  capacity: number;
  floor?: string;
  description?: string;
  is_active: boolean;
  status: string;
}

export interface GalleryImage {
  id: number;
  restaurant_id: number;
  url: string;
  caption?: string;
  sort_order: number;
}

// Tags are returned as Tag objects { id, name } after the join unwrap in ownerGetRestaurantFull
export interface RestaurantTag {
  id: number;
  name: string;
}

export interface SpecialClosure {
  id: number;
  restaurant_id: number;
  date: string;
  reason?: string;
}

export interface MenuItem {
  id: number;
  menu_id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  is_available: boolean;
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_gluten_free: boolean;
  sort_order: number;
}

export interface Menu {
  id: number;
  restaurant_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  items: MenuItem[]; // Prisma relation name is "items"
}

export interface RestaurantFull {
  id: number;
  name: string;
  slug: string;
  description?: string;
  cuisineType: string;
  address: string;
  city: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone: string;
  email: string;
  website?: string;
  coverImageUrl?: string;
  latitude?: string;
  longitude?: string;
  priceRange?: PriceRange;
  isPopular: boolean;
  minBookingNotice: number;
  maxBookingDays: number;
  cancellationHours: number;
  depositRequired: boolean;
  depositAmount: number;
  capacity: number; // formatRestaurant returns r.max_capacity as "capacity"
  minCapacity: number;
  parkingAvailable: boolean;
  dressCode?: string;
  status: RestaurantStatus;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  // snake_case — returned raw from Prisma via ownerGetRestaurantFull
  operating_hours: OperatingHour[];
  tables: Table[];
  gallery_images: GalleryImage[];
  tags: RestaurantTag[];
  special_closures: SpecialClosure[];
  menus: Menu[];
}

// Extended create/update payloads with new fields
export interface CreateRestaurantExtendedPayload {
  name: string;
  description?: string;
  cuisineType: string;
  address: string;
  city: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone: string;
  email: string;
  website?: string;
  coverImageUrl?: string;
  latitude?: string;
  longitude?: string;
  priceRange?: PriceRange;
  isPopular?: boolean;
  capacity: number; // backend schema field name is "capacity" → maps to max_capacity in DB
  minCapacity?: number;
  minBookingNotice?: number;
  maxBookingDays?: number;
  cancellationHours?: number;
  depositRequired?: boolean;
  depositAmount?: number;
  parkingAvailable?: boolean;
  dressCode?: string;
}

export interface UpdateRestaurantExtendedPayload extends Partial<CreateRestaurantExtendedPayload> {
  status?: RestaurantStatus;
}

// ── Operating Hours Payload ───────────────────────────
// Backend expects a bare array (req.body is the array itself, not { hours: [] })
export type UpsertOperatingHoursPayload = {
  day_of_week: DayOfWeek;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}[];

// ── Table Payloads ────────────────────────────────────
export interface CreateTablePayload {
  table_number: string;
  capacity: number;
  floor?: string;
  description?: string;
}

export interface UpdateTablePayload extends Partial<CreateTablePayload> {
  is_active?: boolean;
}

// ── Gallery Payloads ──────────────────────────────────
export interface AddGalleryImagePayload {
  url: string;
  caption?: string;
  sort_order?: number;
}

// ── Tags Payload ──────────────────────────────────────
export interface UpdateTagsPayload {
  tags: string[];
}

// ── Special Closure Payload ───────────────────────────
export interface CreateClosurePayload {
  date: string;
  reason?: string;
}

// ── Menu Payloads ─────────────────────────────────────
export interface CreateMenuPayload {
  name: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateMenuPayload extends Partial<CreateMenuPayload> {
  id: number; // required by updateMenuSchema
  restaurant_id: number; // required by updateMenuSchema
}

export interface CreateMenuItemPayload {
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  is_available?: boolean;
  is_vegan?: boolean;
  is_vegetarian?: boolean;
  is_gluten_free?: boolean;
  sort_order?: number;
}

export interface UpdateMenuItemPayload extends Partial<CreateMenuItemPayload> {
  id: number; // required by updateMenuItemSchema
  menu_id: number; // required by updateMenuItemSchema
}

// ── Pagination ────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  // Owner-specific: approved restaurant limit & add eligibility
  restaurantLimit?: number;
  canAddRestaurant?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  restaurantId?: number;
}
