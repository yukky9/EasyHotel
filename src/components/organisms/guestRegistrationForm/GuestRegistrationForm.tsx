import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, AvailableRoom } from '../../../services/api';

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    documentNumber: string;
    documentType: string;
    arrivalDate: string;
    departureDate: string;
    roomId: string;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    documentNumber?: string;
    arrivalDate?: string;
    departureDate?: string;
    roomId?: string;
}

const GuestRegistrationForm: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        documentNumber: '',
        documentType: 'passport',
        arrivalDate: '',
        departureDate: '',
        roomId: '',
    });

    const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (formData.arrivalDate && formData.departureDate) {
            const loadRooms = async () => {
                setLoadingRooms(true);
                try {
                    const rooms = await api.getAvailableRoomsByDates(formData.arrivalDate, formData.departureDate);
                    setAvailableRooms(rooms);
                    if (!rooms.some((room) => room.id.toString() === formData.roomId)) {
                        setFormData((prev) => ({ ...prev, roomId: '' }));
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoadingRooms(false);
                }
            };
            loadRooms();
        } else {
            setAvailableRooms([]);
        }
    }, [formData.arrivalDate, formData.departureDate]);

    const validate = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'Обязательное поле';
        if (!formData.lastName.trim()) newErrors.lastName = 'Обязательное поле';
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Некорректный email';
        if (!formData.phone.trim()) newErrors.phone = 'Обязательное поле';
        if (!formData.documentNumber.trim()) newErrors.documentNumber = 'Обязательное поле';
        if (!formData.arrivalDate) newErrors.arrivalDate = 'Укажите дату заезда';
        if (!formData.departureDate) newErrors.departureDate = 'Укажите дату выезда';
        if (formData.arrivalDate && formData.departureDate &&
            new Date(formData.departureDate) <= new Date(formData.arrivalDate)) {
            newErrors.departureDate = 'Дата выезда должна быть позже даты заезда';
        }
        if (!formData.roomId) newErrors.roomId = 'Выберите номер';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        setSubmitError('');
        try {
            const guest = await api.createGuest({
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                country: '',
                city: '',
            });

            const selectedRoom = availableRooms.find(r => r.id.toString() === formData.roomId);
            const roomType = selectedRoom?.room_type || 'Стандарт';

            await api.createBooking({
                guest_id: guest.id,
                room_id: parseInt(formData.roomId),
                staff_id: 1,
                check_in_date: formData.arrivalDate,
                check_out_date: formData.departureDate,
                adults: 1,
                children: 0,
                source: 'registration_form',
                special_requests: `Документ: ${formData.documentType} ${formData.documentNumber}`,
                room_type: roomType,
            });
            navigate('/bookings');
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Ошибка регистрации');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 border border-primary-1">
            <h2 className="text-4xl font-kalam font-bold text-center mb-6 bg-gradient-to-r from-primary-1 via-primary-2 to-secondary text-transparent bg-clip-text">
                Регистрация гостя
            </h2>

            {submitError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
                    {submitError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block font-kalam text-sm font-medium text-gray-700">Имя*</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.firstName ? 'border-red-500' : 'border-dark-grey'}`}
                        />
                        {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block font-kalam text-sm font-medium text-gray-700">Фамилия*</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.lastName ? 'border-red-500' : 'border-dark-grey'}`}
                        />
                        {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block font-kalam text-sm font-medium text-gray-700">Email*</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-dark-grey'}`}
                        />
                        {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block font-kalam text-sm font-medium text-gray-700">Телефон*</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+7 (___) ___-____"
                            className={`w-full px-3 py-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-dark-grey'}`}
                        />
                        {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block font-kalam text-sm font-medium text-gray-700">Тип документа</label>
                        <select
                            name="documentType"
                            value={formData.documentType}
                            onChange={handleChange}
                            className="w-full font-kalam px-3 py-2 border border-dark-grey rounded-md"
                        >
                            <option value="passport">Паспорт</option>
                            <option value="international-passport">Загранпаспорт</option>
                            <option value="driver-license">Водительские права</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block font-kalam text-sm font-medium text-gray-700">Номер документа*</label>
                        <input
                            type="text"
                            name="documentNumber"
                            value={formData.documentNumber}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.documentNumber ? 'border-red-500' : 'border-dark-grey'}`}
                        />
                        {errors.documentNumber && <p className="text-red-500 text-xs">{errors.documentNumber}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block font-kalam text-sm font-medium text-gray-700">Дата заезда*</label>
                        <input
                            type="date"
                            name="arrivalDate"
                            value={formData.arrivalDate}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.arrivalDate ? 'border-red-500' : 'border-dark-grey'}`}
                        />
                        {errors.arrivalDate && <p className="text-red-500 text-xs">{errors.arrivalDate}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block font-kalam text-sm font-medium text-gray-700">Дата выезда*</label>
                        <input
                            type="date"
                            name="departureDate"
                            value={formData.departureDate}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md ${errors.departureDate ? 'border-red-500' : 'border-dark-grey'}`}
                        />
                        {errors.departureDate && <p className="text-red-500 text-xs">{errors.departureDate}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block font-kalam text-sm font-medium text-gray-700">Номер*</label>
                        {loadingRooms ? (
                            <p className="text-gray-500">Загрузка доступных номеров...</p>
                        ) : (
                            <select
                                name="roomId"
                                value={formData.roomId}
                                onChange={handleChange}
                                className="w-full font-kalam px-3 py-2 border border-dark-grey rounded-md"
                                disabled={availableRooms.length === 0}
                            >
                                <option value="">-- Выберите номер --</option>
                                {availableRooms.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        {room.room_number} ({room.room_type}) - {room.base_price}₽/ночь
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.roomId && <p className="text-red-500 text-xs">{errors.roomId}</p>}
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 font-kalam border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Назад
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 font-kalam text-white bg-gradient-to-br from-pink-500 to-orange-400 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-pink-200 font-medium rounded-lg text-center disabled:opacity-50"
                    >
                        {isSubmitting ? 'Регистрация...' : 'Зарегистрировать'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GuestRegistrationForm;