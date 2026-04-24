import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const GuestCheckout = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const mode: 'single' | 'multi' = bookingId ? 'single' : 'multi';
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [guests, setGuests] = useState<CheckoutGuest[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchGuests = async () => {
            try {
                setLoading(true);

                if (mode === 'single' && bookingId) {
                    const booking = await api.getBooking(Number(bookingId));
                    const guest = await api.getGuest(booking.guest_id);
                    const rooms = await api.getRooms();
                    const room = rooms.find(r => r.id === booking.room_id);

                    setGuests([{
                        id: guest.id,
                        name: `${guest.first_name} ${guest.last_name}`,
                        roomNumber: room?.room_number || '—',
                        roomType: booking.room_type || 'Стандарт',
                        checkInDate: booking.check_in_date,
                        checkOutDate: booking.check_out_date,
                        bookingId: booking.id,
                        roomId: booking.room_id,
                        isChecked: true
                    }]);
                } else {
                    const bookings = await api.getBookings();
                    const confirmedBookings = bookings.filter(b =>
                        b.status === 'confirmed'
                    );

                    const guestsData: CheckoutGuest[] = await Promise.all(
                        confirmedBookings.map(async (b) => {
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
                }
            } catch (err) {
                setError('Ошибка загрузки данных');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchGuests();
    }, [bookingId, mode]);

    const selectedCount = guests.filter(g => g.isChecked).length;

    const handleToggleGuest = (index: number) => {
        setGuests(guests.map((guest, i) =>
            i === index ? { ...guest, isChecked: !guest.isChecked } : guest
        ));
    };

    const handleToggleAll = () => {
        const allChecked = guests.every(g => g.isChecked);
        setGuests(guests.map(g => ({ ...g, isChecked: !allChecked })));
    };

    const handleCheckOut = async () => {
        const guestsToCheckout = mode === 'single'
            ? guests.filter(g => g.isChecked)
            : guests.filter(g => g.isChecked);

        if (guestsToCheckout.length === 0) {
            setError('Выберите хотя бы одного гостя');
            return;
        }

        const confirmMessage = mode === 'single'
            ? 'Подтверждаете выселение гостя?'
            : `Подтверждаете выселение ${guestsToCheckout.length} гостей?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setProcessing(true);
        setError('');

        try {
            for (const guest of guestsToCheckout) {
                // 1. Обновляем статус бронирования на "checked_out"
                await api.checkoutBooking(guest.bookingId);

                // 2. Обновляем статус комнаты на "available"
                await api.updateRoomStatus(guest.roomId, 'available');
            }

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
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                        {mode === 'single' ? 'Гость успешно выселен' : 'Выселение выполнено!'}
                    </h3>
                    <p className="mt-1 text-gray-500">Перенаправление на страницу бронирований...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {mode === 'single' ? 'Выселение гостя' : 'Массовое выселение'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {mode === 'single'
                            ? 'Подтвердите выселение гостя из системы'
                            : 'Выберите гостей для выселения'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div className="px-4 py-5 sm:p-6">
                    {mode === 'multi' ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 w-10">
                                            <input
                                                type="checkbox"
                                                checked={guests.length > 0 && guests.every(g => g.isChecked)}
                                                onChange={handleToggleAll}
                                                className="h-4 w-4 text-blue-600 rounded"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Гость</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Номер</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Тип</th>
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
                        </>
                    ) : (
                        guests.length > 0 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Гость</h4>
                                        <p className="mt-1 text-sm text-gray-900">{guests[0].name}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Номер</h4>
                                        <p className="mt-1 text-sm text-gray-900">{guests[0].roomNumber} ({guests[0].roomType})</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Дата заезда</h4>
                                        <p className="mt-1 text-sm text-gray-900">{guests[0].checkInDate}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Дата выезда</h4>
                                        <p className="mt-1 text-sm text-gray-900">{guests[0].checkOutDate}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Примечания</label>
                                    <textarea
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Дополнительная информация..."
                                    />
                                </div>
                            </div>
                        )
                    )}
                </div>

                <div className="px-4 py-4 bg-gray-50 flex justify-between items-center">
                    <button
                        onClick={() => navigate(-1)}
                        disabled={processing}
                        className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Назад
                    </button>
                    <button
                        onClick={handleCheckOut}
                        disabled={processing || (mode === 'multi' && selectedCount === 0)}
                        className={`px-4 py-2 rounded-md text-white ${
                            processing || (mode === 'multi' && selectedCount === 0)
                                ? 'bg-red-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        {processing ? 'Обработка...' : (mode === 'single' ? 'Подтвердить выселение' : `Выселить (${selectedCount})`)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuestCheckout;