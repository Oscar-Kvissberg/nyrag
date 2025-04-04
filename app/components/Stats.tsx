'use client'

import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import Cookies from 'js-cookie'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  ChartLegend
)

interface DailyStats {
  date: string;
  total_interactions: number;
  total_tokens: number;
  avg_response_time: number;
  positive_feedback: number;
  negative_feedback: number;
}

interface QuestionCategory {
  name: string;
  value: number;
}

interface User {
  username: string;
  clubId: string;
  role: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function Stats() {
    const [statistics, setStatistics] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questionCategories] = useState<QuestionCategory[]>([]);
    const [user, setUser] = useState<User | null>(null);
    
    useEffect(() => {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const token = Cookies.get('token');
                if (!token) {
                    setError('No authentication token found');
                    return;
                }

                const response = await fetch('/api/statistics', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch statistics');
                }

                const data = await response.json();
                if (data.success && data.statistics) {
                    setStatistics(data.statistics);
                } else {
                    throw new Error('Invalid data format received');
                }
            } catch (err) {
                console.error('Error fetching statistics:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, []);

    const totalInteractions = statistics.reduce((sum, day) => sum + day.total_interactions, 0);
    const totalTokens = statistics.reduce((sum, day) => sum + day.total_tokens, 0);
    const averageResponseTime = statistics.reduce((sum, day) => sum + day.avg_response_time, 0) / statistics.length;
    const positiveFeedback = statistics.reduce((sum, day) => sum + day.positive_feedback, 0);
    const negativeFeedback = statistics.reduce((sum, day) => sum + day.negative_feedback, 0);

    if (loading) return <div className="text-center py-8">Laddar statistik...</div>;
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
    if (!user?.clubId) return <div className="text-center py-8">Du måste vara inloggad för att se statistik.</div>;

    const chartData = {
        labels: statistics.map(stat => new Date(stat.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Total Interactions',
                data: statistics.map(stat => stat.total_interactions),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
            },
            {
                label: 'Total Tokens',
                data: statistics.map(stat => stat.total_tokens),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
            },
            {
                label: 'Average Response Time (ms)',
                data: statistics.map(stat => stat.avg_response_time),
                borderColor: 'rgb(54, 162, 235)',
                tension: 0.1,
            },
            {
                label: 'Positive Feedback',
                data: statistics.map(stat => stat.positive_feedback),
                borderColor: 'rgb(75, 192, 75)',
                tension: 0.1,
            },
            {
                label: 'Negative Feedback',
                data: statistics.map(stat => stat.negative_feedback),
                borderColor: 'rgb(255, 99, 99)',
                tension: 0.1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Chat Statistics Over Time',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Statistik-kort */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Totalt antal interaktioner</h3>
                <p className="text-3xl font-bold text-blue-600">{totalInteractions}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Totalt tokens använda</h3>
                <p className="text-3xl font-bold text-green-600">{totalTokens}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Genomsnittlig svartid</h3>
                <p className="text-3xl font-bold text-purple-600">{Math.round(averageResponseTime)}ms</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Positiv feedback</h3>
                <div className="flex items-center gap-4">
                    <p className="text-3xl font-bold text-green-600">{positiveFeedback}</p>
                    <p className="text-xl font-bold text-red-600">vs {negativeFeedback}</p>
                </div>
            </div>

            {/* Cirkeldiagram för frågekategorier */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Frågekategorier</h3>
                <div className="h-[250px] -ml-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Pie
                                data={questionCategories}
                                cx="45%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={85}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {questionCategories.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend 
                                layout="vertical" 
                                verticalAlign="middle" 
                                align="right"
                                wrapperStyle={{ 
                                    paddingLeft: '0px',
                                    fontSize: '13px',
                                    lineHeight: '24px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Daglig aktivitet */}
            <div className="md:col-span-2 lg:col-span-4 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Daglig Aktivitet</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <Line data={chartData} options={options} />
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
} 