import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Booking, Guest, Room } from '../../../services/api';

interface DisplayBooking extends Booking {
    guestName: string;
    roomNumber: string;
    roomType: string;
}

const BookingList = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<DisplayBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'current' | 'upcoming' | 'past'>('all');
    const [sortBy, setSortBy] = useState<'checkInDate' | 'guestName'>('checkInDate');
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const loadBookings = async () => {
        try {
            setLoading(true);
            setError('');
            const bookingsData = await api.getBookings();
            const [guests, rooms] = await Promise.all([
                api.getGuests(),
                api.getRooms()
            ]);

            const guestMap = new Map(guests.map(g => [g.id, g]));
            const roomMap = new Map(rooms.map(r => [r.id, r]));

            const enriched = bookingsData.map(b => {
                const guest = guestMap.get(b.guest_id);
                const room = roomMap.get(b.room_id);
                return {
                    ...b,
                    guestName: guest ? `${guest.first_name} ${guest.last_name}` : `Гость ${b.guest_id}`,
                    roomNumber: room?.room_number || '—',
                    roomType: b.room_type || 'Стандарт',
                };
            });
            setBookings(enriched);
        } catch (err) {
            console.error(err);
            setError('Не удалось загрузить бронирования');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const handleCancelBooking = async (id: number) => {
        if (!window.confirm('Вы уверены, что хотите отменить это бронирование?')) return;
        setCancellingId(id.toString());
        try {
            await api.cancelBooking(id);
            await loadBookings();
        } catch (err) {
            setError('Не удалось отменить бронирование');
            console.error(err);
        } finally {
            setCancellingId(null);
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        if (filter === 'current') return checkIn <= today && checkOut >= today;
        if (filter === 'upcoming') return checkIn > today;
        if (filter === 'past') return checkOut < today;
        return true;
    });

    const sortedBookings = [...filteredBookings].sort((a, b) => {
        if (sortBy === 'checkInDate') {
            return new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime();
        } else {
            return a.guestName.localeCompare(b.guestName);
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'checked_out': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Подтверждено';
            case 'pending': return 'Ожидание';
            case 'cancelled': return 'Отменено';
            case 'checked_out': return 'Выселен';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-gray-500">Загрузка бронирований...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                    <button onClick={loadBookings} className="ml-4 bg-red-500 text-white px-3 py-1 rounded">Повторить</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-kalam font-bold text-gray-800">Просмотр бронирований</h1>
                <div className="grid grid-cols-2 gap-5">
                    <button onClick={() => navigate('/main')} className="bg-gray-200 font-kalam hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">
                        Назад
                    </button>
                    <button onClick={() => navigate('/mass-checkout')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
                        Массовое выселение
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex space-x-2">
                        <button onClick={() => setFilter('all')} className={`px-4 font-kalam py-2 rounded-lg ${filter === 'all' ? 'bg-gradient-to-r from-primary-1 to-primary-2 text-white' : 'bg-gray-200'}`}>Все</button>
                        <button onClick={() => setFilter('current')} className={`px-4 py-2 font-kalam rounded-lg ${filter === 'current' ? 'bg-gradient-to-r from-primary-1 to-primary-2 text-white' : 'bg-gray-200'}`}>Текущие</button>
                        <button onClick={() => setFilter('upcoming')} className={`px-4 py-2 font-kalam rounded-lg ${filter === 'upcoming' ? 'bg-gradient-to-r from-primary-1 to-primary-2 text-white' : 'bg-gray-200'}`}>Предстоящие</button>
                        <button onClick={() => setFilter('past')} className={`px-4 py-2 font-kalam rounded-lg ${filter === 'past' ? 'bg-gradient-to-r from-primary-1 to-primary-2 text-white' : 'bg-gray-200'}`}>Завершенные</button>
                    </div>
                    <div className="flex items-center">
                        <label htmlFor="sort" className="mr-2 font-kalam text-gray-700">Сортировать:</label>
                        <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'checkInDate' | 'guestName')} className="border font-kalam rounded-lg px-3 py-2">
                            <option value="checkInDate">По дате заезда</option>
                            <option value="guestName">По имени гостя</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Гость</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Номер</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Даты</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Выселить</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {sortedBookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{booking.guestName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-gray-900 font-kalam">{booking.roomNumber}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-gray-900">{booking.roomType}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-gray-900 font-kalam">
                                        {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                            {getStatusText(booking.status)}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-gray-900 font-kalam">{booking.total_price.toLocaleString()} ₽</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => navigate(`/bookings/${booking.id}`)} className="text-blue-600 font-kalam hover:text-blue-900 mr-3">
                                        Подробнее
                                    </button>
                                    {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                                        <>
                                            <button onClick={() => navigate(`/bookings/${booking.id}/edit`)} className="text-green-600 font-kalam hover:text-green-900 mr-3">
                                                Редактировать
                                            </button>
                                            <button onClick={() => handleCancelBooking(booking.id)} disabled={cancellingId === booking.id.toString()} className="text-red-600 font-kalam hover:text-red-900 disabled:opacity-50">
                                                {cancellingId === booking.id.toString() ? 'Отмена...' : 'Отменить'}
                                            </button>
                                        </>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button onClick={() => navigate(`/bookings/${booking.id}/checkout`)} className="text-red-600 hover:text-red-900 text-sm font-medium">
                                        Выселить
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {sortedBookings.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">Нет бронирований, соответствующих фильтру</div>
            )}
        </div>
    );
};

export default BookingList;