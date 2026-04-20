// EasyHotel/src/services/api.ts

const API_BASE_URL = 'http://localhost:8000/api';

// ==================== TYPES ====================
export interface Guest {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    passport_data?: string;
    date_of_birth?: string;
    country: string;
    city: string;
    address?: string;
    created_at: string;
}

export interface RoomType {
    id: number;
    name: string;
    description: string;
    base_price: number;
    capacity: number;
    area: number;
    amenities: string[];
}

export interface Room {
    id: number;
    room_number: string;
    room_type_id: number;
    room_type?: RoomType;
    floor: number;
    status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
    has_sea_view: boolean;
    has_balcony: boolean;
}

export interface Staff {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    hire_date: string;
    salary: number;
    is_active: boolean;
}

export interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    duration_minutes: number;
    is_available: boolean;
}

export interface Booking {
    id: number;
    guest_id: number;
    guest?: Guest;
    room_id: number;
    room?: Room;
    staff_id: number;
    staff?: Staff;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    children: number;
    total_price: number;
    status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
    source: string;
    special_requests: string;
    amount_paid: number;
    balance_due: number;
    payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
}

export interface BookingService {
    id: number;
    booking_id: number;
    service_id: number;
    service?: Service;
    quantity: number;
    date_used: string;
    total_price: number;
    unit_price: number;
    payment_status: string;
}

export interface PaymentMethod {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
    processing_fee_percentage: number;
}

export interface BookingPayment {
    id: number;
    booking_id: number;
    amount_paid: number;
    payment_date: string;
    payment_method_id: number;
    payment_method?: PaymentMethod;
    transaction_reference: string;
    status: string;
    staff_processed_id: number;
    notes: string;
}

export interface Statistics {
    total_bookings: number;
    active_bookings: number;
    total_revenue: number;
    available_rooms: number;
    occupancy_rate: number;
}

// ==================== API CLASS ====================
class EasyHotelAPI {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error ${response.status}: ${error}`);
        }

        return response.json();
    }

    // ==================== AUTH ====================
    async login(username: string, password: string): Promise<{ token: string; staff: Staff }> {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    }

    // ==================== GUESTS ====================
    async getGuests(): Promise<Guest[]> {
        return this.request('/guests');
    }

    async getGuest(id: number): Promise<Guest> {
        return this.request(`/guests/${id}`);
    }

    async createGuest(guest: Omit<Guest, 'id' | 'created_at'>): Promise<Guest> {
        return this.request('/guests', {
            method: 'POST',
            body: JSON.stringify(guest),
        });
    }

    async updateGuest(id: number, guest: Partial<Guest>): Promise<Guest> {
        return this.request(`/guests/${id}`, {
            method: 'PUT',
            body: JSON.stringify(guest),
        });
    }

    // ==================== ROOMS ====================
    async getRooms(): Promise<Room[]> {
        return this.request('/rooms');
    }

    async getAvailableRooms(checkIn: string, checkOut: string): Promise<Room[]> {
        return this.request(`/rooms/available?check_in=${checkIn}&check_out=${checkOut}`);
    }

    async updateRoomStatus(id: number, status: string): Promise<Room> {
        return this.request(`/rooms/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    // ==================== BOOKINGS ====================
    async getBookings(): Promise<Booking[]> {
        return this.request('/bookings');
    }

    async getBooking(id: number): Promise<Booking> {
        return this.request(`/bookings/${id}`);
    }

    async createBooking(booking: {
        guest_id: number;
        room_id: number;
        staff_id: number;
        check_in_date: string;
        check_out_date: string;
        adults: number;
        children: number;
        source?: string;
        special_requests?: string;
    }): Promise<Booking> {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(booking),
        });
    }

    async updateBookingStatus(id: number, status: string): Promise<Booking> {
        return this.request(`/bookings/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    async cancelBooking(id: number): Promise<{ message: string }> {
        return this.request(`/bookings/${id}/cancel`, {
            method: 'PUT',
        });
    }

    async checkOut(bookingId: number): Promise<{ message: string }> {
        return this.request(`/bookings/${bookingId}/checkout`, {
            method: 'POST',
        });
    }

    // ==================== SERVICES ====================
    async getServices(): Promise<Service[]> {
        return this.request('/services');
    }

    async addServiceToBooking(
        bookingId: number,
        serviceId: number,
        quantity: number = 1
    ): Promise<BookingService> {
        return this.request(`/bookings/${bookingId}/services`, {
            method: 'POST',
            body: JSON.stringify({ service_id: serviceId, quantity }),
        });
    }

    async getBookingServices(bookingId: number): Promise<BookingService[]> {
        return this.request(`/bookings/${bookingId}/services`);
    }

    // ==================== PAYMENTS ====================
    async getPaymentMethods(): Promise<PaymentMethod[]> {
        return this.request('/payment-methods');
    }

    async processPayment(
        bookingId: number,
        amount: number,
        paymentMethodId: number,
        staffId: number
    ): Promise<{ message: string; balance_due: number }> {
        return this.request(`/bookings/${bookingId}/payments`, {
            method: 'POST',
            body: JSON.stringify({
                amount,
                payment_method_id: paymentMethodId,
                staff_id: staffId,
            }),
        });
    }

    async getBookingPayments(bookingId: number): Promise<BookingPayment[]> {
        return this.request(`/bookings/${bookingId}/payments`);
    }

    // ==================== STATISTICS ====================
    async getStatistics(): Promise<Statistics> {
        return this.request('/statistics');
    }

    // ==================== REPORTS ====================
    async getRevenueReport(startDate: string, endDate: string): Promise<any> {
        return this.request(`/reports/revenue?start=${startDate}&end=${endDate}`);
    }

    async getOccupancyReport(startDate: string, endDate: string): Promise<any> {
        return this.request(`/reports/occupancy?start=${startDate}&end=${endDate}`);
    }
}

export const api = new EasyHotelAPI();