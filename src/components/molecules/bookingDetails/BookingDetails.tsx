import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../templates/Header';
import { api, Booking, Guest, Room } from '../../../services/api';

const BookingDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState('');
    const [booking, setBooking] = useState<Booking | null>(null);
    const [guest, setGuest] = useState<Guest | null>(null);
    const [room, setRoom] = useState<Room | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const bookingData = await api.getBooking(Number(id));
                setBooking(bookingData);

                const [guestData, roomsData] = await Promise.all([
                    api.getGuest(bookingData.guest_id),
                    api.getRooms()
                ]);
                setGuest(guestData);
                const roomData = roomsData.find(r => r.id === bookingData.room_id);
                setRoom(roomData || null);
                setError('');
            } catch (err) {
                setError('Не удалось загрузить данные бронирования');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (id) loadData();
    }, [id]);

    const handleCancel = async () => {
        if (!window.confirm('Вы уверены, что хотите отменить это бронирование?')) return;
        setCancelling(true);
        setError('');
        try {
            await api.cancelBooking(Number(id));
            navigate('/bookings', { state: { message: 'Бронирование успешно отменено' } });
        } catch (err) {
            setError('Не удалось отменить бронирование');
            console.error(err);
        } finally {
            setCancelling(false);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'checked_out': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusText = (paymentStatus: string) => {
        switch (paymentStatus) {
            case 'paid': return 'Оплачено';
            case 'partial': return 'Частичная оплата';
            case 'pending': return 'Ожидает оплаты';
            case 'refunded': return 'Возврат';
            default: return paymentStatus || '—';
        }
    };

    const getPaymentStatusColor = (paymentStatus: string) => {
        switch (paymentStatus) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'partial': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'refunded': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const calculateNights = (checkIn: string, checkOut: string) => {
        const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    if (loading) {
        return (
            <div>
                <Header />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error || !booking || !guest) {
        return (
            <div>
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                        {error || 'Бронирование не найдено'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Заголовок */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-kalam font-bold text-gray-800">
                        Детали бронирования #{booking.id}
                    </h1>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="bg-gray-200 font-kalam hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                    >
                        Назад к списку
                    </button>
                </div>

                {/* Карточка с информацией */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {/* Шапка со статусом */}
                    <div className={`px-6 py-3 ${
                        booking.status === 'cancelled' ? 'bg-red-50' :
                            booking.status === 'checked_out' ? 'bg-gray-50' : 'bg-green-50'
                    } border-b`}>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Статус бронирования</span>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                {getStatusText(booking.status)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                        {/* Информация о госте */}
                        <div>
                            <h2 className="text-xl font-kalam font-semibold mb-4 text-primary-1">Информация о госте</h2>
                            <div className="space-y-3">
                                <p><span className="font-kalam font-medium">ФИО:</span> {guest.first_name} {guest.last_name}</p>
                                <p><span className="font-kalam font-medium">Email:</span> {guest.email}</p>
                                <p><span className="font-kalam font-medium">Телефон:</span> {guest.phone || '—'}</p>
                                <p><span className="font-kalam font-medium">Страна/Город:</span> {guest.country || '—'} / {guest.city || '—'}</p>
                            </div>
                        </div>

                        {/* Информация о номере */}
                        <div>
                            <h2 className="text-xl font-kalam font-semibold mb-4 text-primary-1">Информация о номере</h2>
                            <div className="space-y-3">
                                <p><span className="font-kalam font-medium">Номер комнаты:</span> {room?.room_number || '—'}</p>
                                <p><span className="font-kalam font-medium">Тип номера:</span> {booking.room_type || '—'}</p>
                                <p><span className="font-kalam font-medium">Дата заезда:</span> {new Date(booking.check_in_date).toLocaleDateString()}</p>
                                <p><span className="font-kalam font-medium">Дата выезда:</span> {new Date(booking.check_out_date).toLocaleDateString()}</p>
                                <p><span className="font-kalam font-medium">Количество ночей:</span> {calculateNights(booking.check_in_date, booking.check_out_date)} ночей</p>
                                <p><span className="font-kalam font-medium">Гостей:</span> {booking.adults || 1} взрослых, {booking.children || 0} детей</p>
                            </div>
                        </div>

                        {/* Финансовая информация */}
                        <div>
                            <h2 className="text-xl font-kalam font-semibold mb-4 text-primary-1">Финансы</h2>
                            <div className="space-y-3">
                                <p><span className="font-kalam font-medium">Общая стоимость:</span> <span className="font-bold text-lg">{booking.total_price.toLocaleString()} ₽</span></p>
                                <p><span className="font-kalam font-medium">Оплачено:</span> {booking.amount_paid.toLocaleString()} ₽</p>
                                <p><span className="font-kalam font-medium">Остаток:</span> <span className={booking.balance_due > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{booking.balance_due.toLocaleString()} ₽</span></p>
                                <p><span className="font-kalam font-medium">Статус оплаты:</span>
                                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status || 'pending')}`}>
                                        {getPaymentStatusText(booking.payment_status || 'pending')}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Дополнительная информация */}
                        <div>
                            <h2 className="text-xl font-kalam font-semibold mb-4 text-primary-1">Дополнительно</h2>
                            <div className="space-y-3">
                                <p><span className="font-kalam font-medium">Сотрудник (ID):</span> {booking.staff_id}</p>
                                <p><span className="font-kalam font-medium">Особые пожелания:</span> {booking.special_requests || 'Нет'}</p>
                                <p><span className="font-kalam font-medium">Дата создания:</span> {booking.created_at ? new Date(booking.created_at).toLocaleString() : '—'}</p>
                                {booking.source && <p><span className="font-kalam font-medium">Источник:</span> {booking.source}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                        {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                            <>
                                <button
                                    onClick={() => navigate(`/bookings/${booking.id}/edit`)}
                                    className="bg-blue-600 font-kalam hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                >
                                    Редактировать
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className="bg-red-600 font-kalam hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center"
                                >
                                    {cancelling ? 'Отмена...' : 'Отменить бронирование'}
                                </button>
                            </>
                        )}
                    </div>
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 m-4 rounded">
                            {error}
                        </div>
                    )}
                </div>
            </div>
            <footer className="bg-white py-4 border-t mt-8">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    © {new Date().getFullYear()} Система управления бронированиями
                </div>
            </footer>
        </div>
    );
};

export default BookingDetails;