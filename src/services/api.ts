// src/services/api.ts
const API_BASE = 'http://localhost:8080/api';

// ========== ИНТЕРФЕЙСЫ ==========
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

export interface Guest {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    created_at?: string;
}

export interface Room {
    id: number;
    room_number: string;
    room_type_id: number;
    status: string;
}

export interface RoomType {
    id: number;
    name: string;
    base_price: number;
}

export interface AvailableRoom {
    id: number;
    room_number: string;
    room_type: string;
    base_price: number;
}

export interface Booking {
    id: number;
    guest_id: number;
    room_id: number;
    staff_id: number;
    check_in_date: string;
    check_out_date: string;
    total_price: number;
    status: string;
    amount_paid: number;
    balance_due: number;
    adults?: number;
    children?: number;
    special_requests?: string;
    room_type?: string;
    source?: string;
    payment_status?: string;
    created_at?: string;
}

export interface Service {
    id: number;
    name: string;
    price: number;
    category?: string;
    duration_minutes?: number;
    is_available?: boolean;
}

export interface Statistics {
    total_bookings: number;
    active_bookings: number;
    total_revenue: number;
    available_rooms: number;
    occupancy_rate: number;
}

export interface ReportStats {
    occupancy_rate: number;
    occupancy_change: number;
    average_check: number;
    check_change: number;
    new_guests: number;
    guests_change: number;
    cancellations: number;
    cancellations_change: number;
}

export interface Report {
    id: number;
    name: string;
    type: 'financial' | 'occupancy' | 'guests' | 'bookings';
    created_at: string;
    period_start: string;
    period_end: string;
    format: 'PDF' | 'Excel' | 'CSV';
    size: string;
    file_data?: string;
}

// ========== API МЕТОДЫ ==========
export const api = {
    // ---------- АВТОРИЗАЦИЯ ----------
    async login(username: string, password: string) {
        const res = await fetch(`${API_BASE}/auth/login?username=${username}&password=${password}`);
        if (!res.ok) {
            const error = await res.text();
            throw new Error(error || 'Ошибка входа');
        }
        return res.json();
    },

    // ---------- ПРОФИЛЬ ----------
    async getMe(): Promise<User> {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Не удалось загрузить профиль');
        return res.json();
    },

    async updateProfile(data: Partial<User>): Promise<{ message: string }> {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/users/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Ошибка обновления профиля');
        return res.json();
    },

    async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/users/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        });
        if (!res.ok) throw new Error('Ошибка смены пароля');
        return res.json();
    },

    // ---------- ГОСТИ ----------
    async getGuests(): Promise<Guest[]> {
        const res = await fetch(`${API_BASE}/guests`);
        if (!res.ok) throw new Error('Failed to fetch guests');
        return res.json();
    },

    async getGuest(id: number): Promise<Guest> {
        const res = await fetch(`${API_BASE}/guests/${id}`);
        if (!res.ok) throw new Error('Guest not found');
        return res.json();
    },

    async createGuest(guest: Omit<Guest, 'id' | 'created_at'>): Promise<Guest> {
        const res = await fetch(`${API_BASE}/guests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guest),
        });
        if (!res.ok) {
            const error = await res.text();
            throw new Error(error || 'Failed to create guest');
        }
        return res.json();
    },

    // ---------- КОМНАТЫ ----------
    async getRooms(): Promise<Room[]> {
        const res = await fetch(`${API_BASE}/rooms`);
        if (!res.ok) throw new Error('Failed to fetch rooms');
        return res.json();
    },

    async getRoomTypes(): Promise<RoomType[]> {
        const res = await fetch(`${API_BASE}/room-types`);
        if (!res.ok) throw new Error('Failed to fetch room types');
        return res.json();
    },

    async getAvailableRoomsByDates(checkIn: string, checkOut: string): Promise<AvailableRoom[]> {
        const res = await fetch(`${API_BASE}/rooms/available-by-dates?check_in=${checkIn}&check_out=${checkOut}`);
        if (!res.ok) throw new Error('Failed to fetch available rooms');
        return res.json();
    },

    async updateRoomStatus(id: number, status: string): Promise<{ message: string }> {
        const res = await fetch(`${API_BASE}/rooms/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed to update room status');
        return res.json();
    },

    // ---------- БРОНИРОВАНИЯ ----------
    async getBookings(): Promise<Booking[]> {
        const res = await fetch(`${API_BASE}/bookings`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return res.json();
    },

    async getBooking(id: number): Promise<Booking> {
        const res = await fetch(`${API_BASE}/bookings/${id}`);
        if (!res.ok) throw new Error('Booking not found');
        return res.json();
    },

    async createBooking(booking: {
        guest_id: number;
        room_id: number;
        staff_id: number;
        check_in_date: string;
        check_out_date: string;
        adults?: number;
        children?: number;
        special_requests?: string;
        room_type?: string;
        source?: string;
    }): Promise<Booking> {
        const res = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking),
        });
        if (!res.ok) {
            const error = await res.text();
            throw new Error(error || 'Failed to create booking');
        }
        return res.json();
    },

    async updateBooking(id: number, data: Partial<Booking>): Promise<{ message: string }> {
        const res = await fetch(`${API_BASE}/bookings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Update failed');
        return res.json();
    },

    async cancelBooking(id: number): Promise<{ message: string }> {
        const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, { method: 'PUT' });
        if (!res.ok) throw new Error('Cancel failed');
        return res.json();
    },

    async checkoutBooking(id: number): Promise<{ message: string }> {
        const res = await fetch(`${API_BASE}/bookings/${id}/checkout`, { method: 'POST' });
        if (!res.ok) throw new Error('Checkout failed');
        return res.json();
    },

    // ---------- УСЛУГИ ----------
    async getServices(): Promise<Service[]> {
        const res = await fetch(`${API_BASE}/services`);
        if (!res.ok) throw new Error('Failed to fetch services');
        return res.json();
    },

    async addServiceToBooking(bookingId: number, serviceId: number, quantity: number = 1): Promise<any> {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/bookings/${bookingId}/services`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ service_id: serviceId, quantity }),
        });
        if (!res.ok) throw new Error('Failed to add service');
        return res.json();
    },

    // ---------- СТАТИСТИКА ----------
    async getStatistics(): Promise<Statistics> {
        const res = await fetch(`${API_BASE}/statistics`);
        if (!res.ok) throw new Error('Failed to fetch statistics');
        return res.json();
    },

    // ---------- ОТЧЕТЫ ----------
    async getReportStats(startDate: string, endDate: string): Promise<ReportStats> {
        const res = await fetch(`${API_BASE}/reports/stats?start=${startDate}&end=${endDate}`);
        if (!res.ok) throw new Error('Failed to fetch report stats');
        return res.json();
    },

    async getReports(): Promise<Report[]> {
        const res = await fetch(`${API_BASE}/reports`);
        if (!res.ok) throw new Error('Failed to fetch reports');
        return res.json();
    },

    async generateReport(type: string, startDate: string, endDate: string, format: string): Promise<Report> {
        const res = await fetch(`${API_BASE}/reports/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, start_date: startDate, end_date: endDate, format }),
        });
        if (!res.ok) throw new Error('Failed to generate report');
        return res.json();
    },

    async downloadReport(reportId: number): Promise<Blob> {
        const res = await fetch(`${API_BASE}/reports/${reportId}/download`);
        if (!res.ok) throw new Error('Failed to download report');
        return res.blob();
    },

    async massCheckout(bookingIds: number[]): Promise<{ message: string; updated: number }> {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/bookings/mass-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ booking_ids: bookingIds }),
        });
        if (!res.ok) throw new Error('Mass checkout failed');
        return res.json();
    },
};