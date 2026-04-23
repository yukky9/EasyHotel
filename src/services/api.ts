const API_BASE = 'http://localhost:8080/api';

// Тип пользователя (сотрудника)
export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    avatar?: string;
}

// Остальные интерфейсы (Guest, Room, Booking...)
export interface Guest {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country?: string;
    city?: string;
}

export interface Room {
    id: number;
    room_number: string;
    status: string;
}

export interface Booking {
    id: number;
    guest_id: number;
    room_id: number;
    check_in_date: string;
    check_out_date: string;
    total_price: number;
    status: string;
}

export interface Service {
    id: number;
    name: string;
    price: number;
}

export interface Statistics {
    total_bookings: number;
    active_bookings: number;
    total_revenue: number;
    available_rooms: number;
    occupancy_rate: number;
}

export const api = {
    // ========== АВТОРИЗАЦИЯ ==========
    async login(username: string, password: string) {
        const response = await fetch(`${API_BASE}/auth/login?username=${username}&password=${password}`);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Ошибка входа');
        }
        return response.json();
    },

    // ========== ПРОФИЛЬ ==========
    async getMe(): Promise<User> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Не удалось загрузить профиль');
        return response.json();
    },

    async updateProfile(data: Partial<User>): Promise<{ message: string }> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE}/users/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Ошибка обновления профиля');
        return response.json();
    },

    async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE}/users/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
        if (!response.ok) throw new Error('Ошибка смены пароля');
        return response.json();
    },

    // ========== ГОСТИ ==========
    async getGuests(): Promise<Guest[]> {
        const res = await fetch(`${API_BASE}/guests`);
        return res.json();
    },

    async createGuest(guest: Omit<Guest, 'id'>): Promise<Guest> {
        const res = await fetch(`${API_BASE}/guests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guest),
        });
        return res.json();
    },

    // ========== НОМЕРА ==========
    async getRooms(): Promise<Room[]> {
        const res = await fetch(`${API_BASE}/rooms`);
        return res.json();
    },

    async getAvailableRooms(): Promise<Room[]> {
        const res = await fetch(`${API_BASE}/rooms/available`);
        return res.json();
    },

    // ========== БРОНИРОВАНИЯ ==========
    async getBookings(): Promise<Booking[]> {
        const res = await fetch(`${API_BASE}/bookings`);
        return res.json();
    },

    async createBooking(booking: any): Promise<Booking> {
        const res = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking),
        });
        return res.json();
    },

    async cancelBooking(id: number): Promise<{ message: string }> {
        const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, { method: 'PUT' });
        return res.json();
    },

    // ========== УСЛУГИ ==========
    async getServices(): Promise<Service[]> {
        const res = await fetch(`${API_BASE}/services`);
        return res.json();
    },

    // ========== СТАТИСТИКА ==========
    async getStatistics(): Promise<Statistics> {
        const res = await fetch(`${API_BASE}/statistics`);
        return res.json();
    }
};