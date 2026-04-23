import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Mail, Lock, User as UserIcon, Phone, Calendar, Save } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { api, User } from '../../../services/api';
import profileImage from '../../atoms/img/profile.png';

interface ProfileFormData {
    name: string;
    email: string;
    phone: string;
    birthDate: string;
    avatar: string;
}

const ProfileComponent: React.FC = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<ProfileFormData>({
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        avatar: profileImage,
    });

    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: '',
    });

    // Загружаем данные пользователя из контекста при монтировании и при изменении user
    useEffect(() => {
        if (user) {
            setProfile({
                name: `${user.first_name} ${user.last_name}`,
                email: user.email || `${user.username}@hotel.com`,
                phone: user.phone || '+7 (999) 123-45-67',
                birthDate: user.birth_date || '1990-01-01',
                avatar: user.avatar || profileImage,
            });
        } else {
            // Если пользователь не загружен, попробуем получить через API
            const fetchUser = async () => {
                try {
                    const currentUser = await api.getMe();
                    login(currentUser, localStorage.getItem('access_token') || '');
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                }
            };
            fetchUser();
        }
    }, [user, login]);

    const handleAvatarClick = () => {
        if (isEditing && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setProfile({ ...profile, avatar: event.target.result as string });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile({ ...profile, [name]: value });
    };

    const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Разбиваем полное имя на first_name и last_name
            const [firstName, ...lastNameParts] = profile.name.trim().split(' ');
            const lastName = lastNameParts.join(' ') || '';

            const updatedData: Partial<User> = {
                first_name: firstName,
                last_name: lastName,
                email: profile.email,
                phone: profile.phone,
                birth_date: profile.birthDate,
            };
            if (profile.avatar !== profileImage) {
                updatedData.avatar = profile.avatar;
            }

            await api.updateProfile(updatedData);

            // Получаем свежие данные пользователя
            const freshUser = await api.getMe();
            login(freshUser, localStorage.getItem('access_token') || '');

            alert('Профиль успешно обновлён');
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert('Ошибка при сохранении профиля');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.new !== passwordData.confirm) {
            alert('Новые пароли не совпадают');
            return;
        }
        if (passwordData.new.length < 6) {
            alert('Новый пароль должен содержать не менее 6 символов');
            return;
        }
        setLoading(true);
        try {
            await api.changePassword(passwordData.current, passwordData.new);
            alert('Пароль успешно изменён');
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (error) {
            console.error(error);
            alert('Не удалось сменить пароль. Проверьте текущий пароль.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {/* Заголовок */}
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-800">Мой профиль</h1>
                        <button
                            onClick={() => navigate('/main')}
                            className="bg-gray-200 font-kalam hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
                        >
                            Назад
                        </button>
                    </div>

                    {/* Основное содержимое */}
                    <div className="px-6 py-4">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Аватар */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`relative w-32 h-32 rounded-full overflow-hidden cursor-pointer ${
                                        isEditing ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                    onClick={handleAvatarClick}
                                >
                                    <img
                                        src={profile.avatar}
                                        alt="Аватар пользователя"
                                        className="w-full h-full object-cover"
                                    />
                                    {isEditing && (
                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                            <Camera className="text-white h-8 w-8" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                                {isEditing && (
                                    <button
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                        onClick={handleAvatarClick}
                                    >
                                        Изменить фото
                                    </button>
                                )}
                            </div>

                            {/* Поля профиля */}
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <label className="flex items-center text-sm font-medium text-gray-700">
                                        <UserIcon className="h-4 w-4 mr-2" />
                                        Имя и фамилия
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="name"
                                            value={profile.name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                            placeholder="Иван Иванов"
                                        />
                                    ) : (
                                        <p className="text-gray-900">{profile.name}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="flex items-center text-sm font-medium text-gray-700">
                                        <Mail className="h-4 w-4 mr-2" />
                                        Email
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            name="email"
                                            value={profile.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900">{profile.email}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="flex items-center text-sm font-medium text-gray-700">
                                        <Phone className="h-4 w-4 mr-2" />
                                        Телефон
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={profile.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900">{profile.phone}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="flex items-center text-sm font-medium text-gray-700">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Дата рождения
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            name="birthDate"
                                            value={profile.birthDate}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900">
                                            {new Date(profile.birthDate).toLocaleDateString('ru-RU')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Смена пароля (только в режиме редактирования) */}
                        {isEditing && (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <Lock className="h-5 w-5 mr-2" />
                                    Смена пароля
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Текущий пароль</label>
                                        <input
                                            type="password"
                                            name="current"
                                            value={passwordData.current}
                                            onChange={handlePasswordInputChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Новый пароль</label>
                                        <input
                                            type="password"
                                            name="new"
                                            value={passwordData.new}
                                            onChange={handlePasswordInputChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Подтвердите новый пароль</label>
                                        <input
                                            type="password"
                                            name="confirm"
                                            value={passwordData.confirm}
                                            onChange={handlePasswordInputChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                                        />
                                    </div>
                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={loading}
                                        className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition disabled:opacity-50"
                                    >
                                        Сменить пароль
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Кнопки действий */}
                        <div className="mt-8 flex justify-end space-x-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="px-4 py-2 bg-gradient-to-br from-pink-500 to-orange-400 text-white rounded-md shadow hover:shadow-lg transition flex items-center disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {loading ? 'Сохранение...' : 'Сохранить'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-gradient-to-br from-pink-500 to-orange-400 text-white rounded-md shadow hover:shadow-lg transition"
                                >
                                    Редактировать профиль
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileComponent;