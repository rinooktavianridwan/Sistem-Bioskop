export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Movie {
  id: number;
  title: string;
  description: string;
  duration: number;
  release_date: string;
  poster?: string;
  genre_ids: number[];
  genres?: Genre[];
  created_at: string;
  updated_at: string;
}

export interface Genre {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Studio {
  id: number;
  name: string;
  capacity: number;
  facilities?: Facility[];
  created_at: string;
  updated_at: string;
}

export interface Facility {
  id: number;
  name: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: number;
  movie_id: number;
  studio_id: number;
  start_time: string;
  end_time: string;
  price: number;
  movie?: Movie;
  studio?: Studio;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  schedule_id: number;
  total_tickets: number;
  total_price: number;
  status: 'pending' | 'paid' | 'cancelled';
  user?: User;
  schedule?: Schedule;
  created_at: string;
  updated_at: string;
}

export interface Promo {
  id: number;
  code: string;
  name: string;
  discount_percentage: number;
  max_discount: number;
  min_purchase: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface LoginResponse {
  token: string;
  user: User;
}