const API_BASE = 'http://localhost:8080/api';

export interface Guest {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    city: string;
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
    // АВТОРИЗАЦИЯ (простой вариант – через query-параметры)
    async login(username: string, password: string) {
        const response = await fetch(`${API_BASE}/auth/login?username=${username}&password=${password}`);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Ошибка входа');
        }
        return response.json();
    },

    // ГОСТИ
    async getGuests() {
        const res = await fetch(`${API_BASE}/guests`);
        return res.json();
    },
    async createGuest(guest: Omit<Guest, 'id'>) {
        const res = await fetch(`${API_BASE}/guests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guest),
        });
        return res.json();
    },

    // НОМЕРА
    async getRooms() {
        const res = await fetch(`${API_BASE}/rooms`);
        return res.json();
    },
    async getAvailableRooms() {
        const res = await fetch(`${API_BASE}/rooms/available`);
        return res.json();
    },

    // БРОНИРОВАНИЯ
    async getBookings() {
        const res = await fetch(`${API_BASE}/bookings`);
        return res.json();
    },
    async createBooking(booking: any) {
        const res = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking),
        });
        return res.json();
    },
    async cancelBooking(id: number) {
        const res = await fetch(`${API_BASE}/bookings/${id}/cancel`, { method: 'PUT' });
        return res.json();
    },

    // УСЛУГИ
    async getServices() {
        const res = await fetch(`${API_BASE}/services`);
        return res.json();
    },

    // СТАТИСТИКА
    async getStatistics() {
        const res = await fetch(`${API_BASE}/statistics`);
        return res.json();
    },
};