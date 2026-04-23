import React, { useState, useRef, useEffect } from 'react';
import CardGrid from '../../organisms/cardForm/CardGrid';
import Header from '../../templates/Header';
import defaultAvatar from '../../atoms/img/profile.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext/AuthContext';

const MainPage = () => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Аватар из контекста (если есть) или заглушка
    const avatar = user?.avatar || defaultAvatar;

    const handleProfileClick = () => {
        setIsProfileOpen(!isProfileOpen);
    };

    const handleLogout = () => {
        // Полный выход: очистить localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleProfileNavigate = () => {
        navigate('/profile');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <div className="flex justify-between items-center px-8 py-6 relative">
                <h1 className="text-3xl font-bold text-gray-800" />

                <div className="relative" ref={profileRef}>
                    <img
                        className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                        src={avatar}
                        alt="Profile"
                        onClick={handleProfileClick}
                    />

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 animate-fadeIn">
                            <button
                                onClick={handleProfileNavigate}
                                className="block font-kalam w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Мой профиль
                            </button>
                            <button
                                onClick={handleLogout}
                                className="block w-full font-kalam text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Выйти
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <main className="flex-grow flex items-center justify-center pb-12 px-4">
                <CardGrid />
            </main>
            <footer className="py-4 text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} EasyHotel.staff
            </footer>
        </div>
    );
};

export default MainPage;