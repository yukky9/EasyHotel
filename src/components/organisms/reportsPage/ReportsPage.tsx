import React, { useState, useEffect } from 'react';
import { DownloadIcon, RefreshCwIcon, FileTextIcon, BarChart2Icon, UsersIcon, CreditCardIcon } from 'lucide-react';
import { format } from 'date-fns';
import { api, Report, ReportStats } from '../../../services/api';

const ReportsPage = () => {
    const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [reportType, setReportType] = useState<string>('all');
    const [reportFormat, setReportFormat] = useState<string>('CSV');
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    useEffect(() => {
        loadStats();
        loadReports();
    }, [startDate, endDate]);

    const loadStats = async () => {
        try {
            const data = await api.getReportStats(startDate, endDate);
            setStats(data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const loadReports = async () => {
        setLoadingReports(true);
        try {
            const data = await api.getReports();
            setReports(data);
        } catch (err) {
            console.error('Failed to load reports:', err);
        } finally {
            setLoadingReports(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!reportType || reportType === 'all') {
            alert('Выберите тип отчета');
            return;
        }
        setIsLoading(true);
        try {
            await api.generateReport(reportType, startDate, endDate, reportFormat);
            await loadReports();
            alert('Отчет успешно сформирован');
        } catch (err) {
            alert('Ошибка при формировании отчета');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadReport = async (reportId: number, reportName: string) => {
        try {
            const blob = await api.downloadReport(reportId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportName}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            alert('Ошибка при скачивании отчета');
            console.error(err);
        }
    };

    const displayStats = [
        {
            name: 'Заполняемость',
            value: `${stats?.occupancy_rate || 0}%`,
            change: `${(stats?.occupancy_change || 0) >= 0 ? '+' : ''}${stats?.occupancy_change || 0}%`,
            icon: BarChart2Icon,
            positive: (stats?.occupancy_change || 0) >= 0
        },
        {
            name: 'Средний чек',
            value: `${Math.round(stats?.average_check || 0).toLocaleString()} ₽`,
            change: `${(stats?.check_change || 0) >= 0 ? '+' : ''}${stats?.check_change || 0}%`,
            icon: CreditCardIcon,
            positive: (stats?.check_change || 0) >= 0
        },
        {
            name: 'Новые гости',
            value: `${stats?.new_guests || 0}`,
            change: `${(stats?.guests_change || 0) >= 0 ? '+' : ''}${stats?.guests_change || 0}%`,
            icon: UsersIcon,
            positive: (stats?.guests_change || 0) >= 0
        },
        {
            name: 'Отмены',
            value: `${stats?.cancellations || 0}`,
            change: `${(stats?.cancellations_change || 0) >= 0 ? '+' : ''}${stats?.cancellations_change || 0}%`,
            icon: FileTextIcon,
            positive: (stats?.cancellations_change || 0) <= 0
        },
    ];

    const getReportTypeName = (type: string) => {
        const types: Record<string, string> = {
            financial: 'Финансовый',
            occupancy: 'Заполняемость',
            guests: 'Гости',
            bookings: 'Бронирования'
        };
        return types[type] || type;
    };

    const filteredReports = reportType === 'all'
        ? reports
        : reports.filter(r => r.type === reportType);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Отчеты</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.href = '/main'}
                        className="bg-gray-200 font-kalam hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                    >
                        Назад
                    </button>
                    <button
                        onClick={handleGenerateReport}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-gradient-to-br from-pink-500 to-orange-400 hover:bg-gradient-to-bl text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                                Формирование...
                            </>
                        ) : (
                            <>
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                Сформировать отчет
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Фильтры */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Тип отчета</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        >
                            <option value="all">Все отчеты</option>
                            <option value="financial">Финансовый</option>
                            <option value="occupancy">Заполняемость</option>
                            <option value="guests">Гости</option>
                            <option value="bookings">Бронирования</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Формат</label>
                        <select
                            value={reportFormat}
                            onChange={(e) => setReportFormat(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        >
                            <option value="CSV">CSV</option>
                            <option value="PDF">PDF</option>
                            <option value="Excel">Excel</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayStats.map((stat, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className={`p-3 rounded-full ${index === 0 ? 'bg-blue-100' : index === 1 ? 'bg-green-100' : index === 2 ? 'bg-purple-100' : 'bg-red-100'}`}>
                                <stat.icon className={`h-6 w-6 ${index === 0 ? 'text-blue-600' : index === 1 ? 'text-green-600' : index === 2 ? 'text-purple-600' : 'text-red-600'}`} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                                <p className={`text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                                    {stat.change} с прошлого периода
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Таблица отчетов */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Доступные отчеты</h2>
                    <button onClick={loadReports} className="text-blue-600 hover:text-blue-800 flex items-center">
                        <RefreshCwIcon className="h-4 w-4 mr-1" />
                        Обновить
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Период</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Формат</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Размер</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredReports.map((report) => (
                            <tr key={report.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {report.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {getReportTypeName(report.type)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(report.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {report.period_start} - {report.period_end}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {report.format}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {report.size}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleDownloadReport(report.id, report.name)}
                                        className="text-blue-600 hover:text-blue-900 flex items-center ml-auto"
                                    >
                                        <DownloadIcon className="h-4 w-4 mr-1" />
                                        Скачать
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                        Показано {filteredReports.length} из {reports.length} отчетов
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;