import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import AuthButton from '../../atoms/buttons/AuthButton/AuthButton';
import LoginInput from '../../atoms/inputs/AuthInputs/LoginInput';
import PasswordInput from '../../atoms/inputs/AuthInputs/PasswordInput';

const LoginForm = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ login: '', password: '' });
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validate = () => {
        let valid = true;
        const newErrors = { login: '', password: '' };
        if (!login.trim()) { newErrors.login = 'Введите логин'; valid = false; }
        else if (login.length < 3) { newErrors.login = 'Логин слишком короткий'; valid = false; }
        if (!password.trim()) { newErrors.password = 'Введите пароль'; valid = false; }
        else if (password.length < 6) { newErrors.password = 'Пароль слишком короткий'; valid = false; }
        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setServerError('');
        try {
            const data = await api.login(login, password);
            // Сохраняем токен (хоть он и фейковый) и данные пользователя
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/main');
        } catch (err: any) {
            setServerError(err.message || 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="w-full max-w-md" onSubmit={handleSubmit}>
            <div className="mb-6">
                <label className="block font-kalam mb-3 text-center text-lg">Login</label>
                <LoginInput value={login} onChange={(e) => setLogin(e.target.value)} hasError={!!errors.login} />
                {errors.login && <p className="text-red-600 text-sm text-center">{errors.login}</p>}
            </div>
            <div className="mb-12">
                <label className="block font-kalam mb-3 text-center text-lg">Password</label>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} hasError={!!errors.password} />
                {errors.password && <p className="text-red-600 text-sm text-center">{errors.password}</p>}
            </div>
            {serverError && <div className="text-red-600 text-center mb-4">{serverError}</div>}
            <div className="text-center">
                <AuthButton type="submit" />
            </div>
        </form>
    );
};

export default LoginForm;