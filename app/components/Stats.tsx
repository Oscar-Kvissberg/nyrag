'use client'

import React, { useEffect, useState } from 'react'
import { Pie, Line } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Loader2 } from 'lucide-react'
import Cookies from 'js-cookie'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface DailyStats {
  date: string;
  total_interactions: number;
  total_tokens: number;
}

interface CategoryStats {
  category: string;
  count: number;
}

interface StatsResponse {
  success: boolean;
  statistics: DailyStats[];
  categories: CategoryStats[];
}

interface User {
  username: string;
  clubId: string;
  role: string;
}

export default function Stats() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<DailyStats[]>([]);
    const [categories, setCategories] = useState<CategoryStats[]>([]);
    const [user, setUser] = useState<User | null>(null);
    
    useEffect(() => {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
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

                const data: StatsResponse = await response.json();
                if (data.success) {
                    setStats(data.statistics);
                    setCategories(data.categories || []);
                } else {
                    throw new Error('Invalid data format received');
                }
            } catch (err) {
                console.error('Error fetching statistics:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const totalInteractions = stats.reduce((sum, day) => sum + day.total_interactions, 0);
    const totalTokens = stats.reduce((sum, day) => sum + day.total_tokens, 0);
   

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-16 pt-24">
                <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Laddar statistik...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-16 pt-24">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (!user?.clubId) return <div className="text-center py-8">Du måste vara inloggad för att se statistik.</div>;

    const lineChartData: ChartData<'line'> = {
        labels: stats.map(day => day.date).reverse(),
        datasets: [
            {
                label: 'Interaktioner',
                data: stats.map(day => day.total_interactions).reverse(),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
            }
        ]
    };

    const chartOptions: ChartOptions<'line'> = {
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    const pieChartOptions: ChartOptions<'pie'> = {
        maintainAspectRatio: false
    };

    return (
        <div className="container mx-auto px-4">
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-700">Totala interaktioner (genererade svar)</h3>
                    <p className="text-3xl font-bold text-purple-600">{totalInteractions}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-700">Totalt Använda tokens</h3>
                    <p className="text-3xl font-bold text-purple-600">{totalTokens}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-700">Estimerad sparad tid (5 minuter per interaktion)</h3>
                    <p className="text-3xl font-bold text-purple-600">{totalInteractions * 5} minuter</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Frågekategorier</h3>
                    <div className="h-64">
                        {categories.length > 0 ? (
                            <Pie 
                                data={{
                                    labels: categories.map(cat => cat.category),
                                    datasets: [{
                                        data: categories.map(cat => cat.count),
                                        backgroundColor: [
                                            'rgba(255, 99, 132, 0.5)',
                                            'rgba(54, 162, 235, 0.5)',
                                            'rgba(255, 206, 86, 0.5)',
                                            'rgba(75, 192, 192, 0.5)',
                                            'rgba(153, 102, 255, 0.5)',
                                        ],
                                        borderColor: [
                                            'rgba(255, 99, 132, 1)',
                                            'rgba(54, 162, 235, 1)',
                                            'rgba(255, 206, 86, 1)',
                                            'rgba(75, 192, 192, 1)',
                                            'rgba(153, 102, 255, 1)',
                                        ],
                                        borderWidth: 1
                                    }]
                                } as ChartData<'pie'>}
                                options={pieChartOptions}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Inga kategorier tillgängliga
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Daglig aktivitet</h3>
                    <div className="h-64">
                        <Line 
                            data={lineChartData}
                            options={chartOptions}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
} 