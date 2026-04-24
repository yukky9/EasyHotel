import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../templates/Header';
import { api, Booking, Guest, Room } from '../../../services/api';

const EditBooking = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [booking, setBooking] = useState<Booking | null>(null);
    const [guest, setGuest] = useState<Guest | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);

    // Поля формы (редактируемые)
    const [selectedRoomId, setSelectedRoomId] = useState<number>(0);
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [status, setStatus] = useState('confirmed');
    const [specialRequests, setSpecialRequests] = useState('');
    const [roomType, setRoomType] = useState('');

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
                setRooms(roomsData);

                // Заполняем форму существующими значениями
                setSelectedRoomId(bookingData.room_id);
                setCheckInDate(bookingData.check_in_date);
                setCheckOutDate(bookingData.check_out_date);
                setAdults(bookingData.adults ?? 1);
                setChildren(bookingData.children ?? 0);
                setStatus(bookingData.status);
                setSpecialRequests(bookingData.special_requests ?? '');
                setRoomType(bookingData.room_type ?? 'Стандарт');
            } catch (err) {
                console.error(err);
                setError('Не удалось загрузить данные бронирования');
            } finally {
                setLoading(false);
            }
        };
        if (id) loadData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        if (!checkInDate || !checkOutDate) {
            setError('Укажите даты проживания');
            setSaving(false);
            return;
        }
        if (new Date(checkOutDate) <= new Date(checkInDate)) {
            setError('Дата выезда должна быть позже даты заезда');
            setSaving(false);
            return;
        }

        try {
            await api.updateBooking(Number(id), {
                room_id: selectedRoomId,
                check_in_date: checkInDate,
                check_out_date: checkOutDate,
                status: status,
                adults: adults,
                children: children,
                special_requests: specialRequests,
                room_type: roomType,  // ← сохраняем тип номера
            });
            navigate('/bookings');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при сохранении');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (!booking || !guest) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                    Бронирование не найдено
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-kalam font-bold text-gray-800">
                        Редактирование бронирования #{id}
                    </h1>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="bg-gray-200 font-kalam hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                    >
                        Назад
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md overflow-hidden p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Информация о госте (только чтение) */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-kalam font-semibold">Информация о госте</h2>
                            <div>
                                <label className="block font-kalam text-sm font-medium text-gray-700 mb-1">ФИО</label>
                                <input
                                    type="text"
                                    value={`${guest.first_name} ${guest.last_name}`}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block font-kalam text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={guest.email}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block font-kalam text-sm font-medium text-gray-700 mb-1">Телефон</label>
                                <input
                                    type="tel"
                                    value={guest.phone || ''}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                />
                            </div>
                        </div>

                        {/* Детали бронирования (редактируемые) */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-kalam font-semibold">Детали бронирования</h2>
                            <div>
                                <label className="block font-kalam text-sm font-medium text-gray-700 mb-1">Номер комнаты*</label>
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                                    className="w-full font-kalam px-4 py-2 border border-gray-300 rounded-lg"
                                    required
                                >
                                    {rooms.map(room => (
                                        <option key={room.id} value={room.id}>
                                            {room.room_number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-kalam text-sm font-medium text-gray-700 mb-1">Тип номера</label>
                                <select
                                    value={roomType}
                                    onChange={(e) => setRoomType(e.target.value)}
                                    className="w-full font-kalam px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="Стандарт">Стандарт</option>
                                    <option value="Комфорт">Комфорт</option>
                                    <option value="Люкс">Люкс</option>
                                    <option value="Делюкс">Делюкс</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-kalam text-sm font-medium text-gray-700 mb-1">Взрослые</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={adults}
                                        onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block font-kalam text-sm font-medium text-gray-700 mb-1">Дети</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={children}
                                        onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Даты проживания */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-kalam font-semibold">Даты проживания</h2>
                            <div>
                                <label className="block font-kalam text-sm font-medium text-gray-700 mb-1">Дата заезда*</label>
                                <input
                                    type="date"
                                    value={checkInDate}
                                    onChange={(e) => setCheckInDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-kalam text-sm font-medium text-gray-700 mb-1">Дата выезда*</label>
                                <input
                                    type="date"
                                    value={checkOutDate}
                                    onChange={(e) => setCheckOutDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                        </div>

                        {/* Статус и особые пожелания */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-kalam font-semibold">Дополнительно</h2>
                            <div>
                                <label className="block font-kalam text-sm font-medium text-gray-700 mb-1">Статус</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full font-kalam px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="confirmed">Подтверждено</option>
                                    <option value="pending">Ожидание</option>
                                    <option value="cancelled">Отменено</option>
                                    <option value="checked_out">Выселен</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-kalam text-sm font-medium text-gray-700 mb-1">Особые пожелания</label>
                                <textarea
                                    value={specialRequests}
                                    onChange={(e) => setSpecialRequests(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => navigate('/bookings')}
                            disabled={saving}
                            className="bg-gray-200 font-kalam hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-gradient-to-r from-primary-1 to-primary-2 font-kalam hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center"
                        >
                            {saving ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                    </div>
                </form>
            </div>
            <footer className="bg-white py-4 border-t">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    © {new Date().getFullYear()} Система управления бронированиями
                </div>
            </footer>
        </div>
    );
};

export default EditBooking;