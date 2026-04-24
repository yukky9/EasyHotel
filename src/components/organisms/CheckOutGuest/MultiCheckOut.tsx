import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Booking, Guest, Room } from '../../../services/api';

interface CheckoutGuest {
    id: number;
    name: string;
    roomNumber: string;
    roomType: string;
    checkInDate: string;
    checkOutDate: string;
    bookingId: number;
    roomId: number;
    isChecked?: boolean;
}

const MultiCheckOut = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [guests, setGuests] = useState<CheckoutGuest[]>([]);

    useEffect(() => {
        const fetchGuests = async () => {
            try {
                setLoading(true);
                const bookings = await api.getBookings();
                // Показываем только подтверждённые и заселенные бронирования (не выселенные и не отменённые)
                const activeBookings = bookings.filter(b =>
                    b.status === 'confirmed' || b.status === 'checked_in'
                );

                const guestsData: CheckoutGuest[] = await Promise.all(
                    activeBookings.map(async (b) => {
                        const guest = await api.getGuest(b.guest_id);
                        const rooms = await api.getRooms();
                        const room = rooms.find(r => r.id === b.room_id);
                        return {
                            id: guest.id,
                            name: `${guest.first_name} ${guest.last_name}`,
                            roomNumber: room?.room_number || '—',
                            roomType: b.room_type || 'Стандарт',
                            checkInDate: b.check_in_date,
                            checkOutDate: b.check_out_date,
                            bookingId: b.id,
                            roomId: b.room_id,
                            isChecked: false
                        };
                    })
                );
                setGuests(guestsData);
            } catch (err) {
                setError('Ошибка загрузки данных');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGuests();
    }, []);

    const selectedCount = guests.filter(g => g.isChecked).length;
    const allChecked = guests.length > 0 && guests.every(g => g.isChecked);

    const handleToggleGuest = (index: number) => {
        setGuests(guests.map((guest, i) =>
            i === index ? { ...guest, isChecked: !guest.isChecked } : guest
        ));
    };

    const handleToggleAll = () => {
        setGuests(guests.map(g => ({ ...g, isChecked: !allChecked })));
    };

    const handleCheckout = async () => {
        const guestsToCheckout = guests.filter(g => g.isChecked);
        if (guestsToCheckout.length === 0) {
            setError('Выберите хотя бы одного гостя');
            return;
        }

        if (!window.confirm(`Подтверждаете выселение ${guestsToCheckout.length} гостей?`)) {
            return;
        }

        setProcessing(true);
        setError('');

        try {
            const bookingIds = guestsToCheckout.map(g => g.bookingId);
            await api.massCheckout(bookingIds);
            setSuccess(true);
            setTimeout(() => navigate('/bookings'), 2000);
        } catch (err) {
            setError('Ошибка при выселении');
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Выселение выполнено!</h3>
                    <p className="mt-1 text-gray-500">Перенаправление на страницу бронирований...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Массовое выселение</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Выберите гостей для выселения
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div className="px-4 py-5 sm:p-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allChecked}
                                        onChange={handleToggleAll}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Гость</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Номер</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Тип</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Дата заезда</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Дата выезда</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {guests.map((guest, index) => (
                                <tr key={guest.bookingId} className={guest.isChecked ? 'bg-blue-50' : undefined}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={!!guest.isChecked}
                                            onChange={() => handleToggleGuest(index)}
                                            className="h-4 w-4 text-blue-600 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {guest.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {guest.roomNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {guest.roomType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {guest.checkInDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {guest.checkOutDate}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        Выбрано: <span className="font-medium">{selectedCount}</span> из <span className="font-medium">{guests.length}</span>
                    </div>
                </div>

                <div className="px-4 py-4 bg-gray-50 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/bookings')}
                        disabled={processing}
                        className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Назад
                    </button>
                    <button
                        onClick={handleCheckout}
                        disabled={processing || selectedCount === 0}
                        className={`px-4 py-2 rounded-md text-white ${
                            processing || selectedCount === 0
                                ? 'bg-red-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        {processing ? 'Обработка...' : `Выселить (${selectedCount})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MultiCheckOut;