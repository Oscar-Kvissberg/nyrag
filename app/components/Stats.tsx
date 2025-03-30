'use client'

import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

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

interface CategoryStats {
    category: string;
    count: number;
}

interface User {
  username: string;
  clubId: string;
  role: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function Stats() {
    const [stats, setStats] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questionCategories, setQuestionCategories] = useState<QuestionCategory[]>([]);
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
            if (!user?.clubId) return;

            try {
                // Hämta statistik för de senaste 30 dagarna
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);

                const [statsResponse, categoriesResponse] = await Promise.all([
                    fetch(`/api/statistics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&clubId=${user.clubId}`),
                    fetch(`/api/statistics/categories?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&clubId=${user.clubId}`)
                ]);

                const [statsData, categoriesData] = await Promise.all([
                    statsResponse.json(),
                    categoriesResponse.json()
                ]);

                if (!statsData.success) {
                    throw new Error(statsData.error || 'Failed to fetch statistics');
                }

                setStats(statsData.statistics);

                // Beräkna procentuell fördelning av kategorier
                if (categoriesData.success) {
                    const total = categoriesData.categories.reduce((sum: number, cat: CategoryStats) => sum + cat.count, 0);
                    const categoriesWithPercentage = categoriesData.categories.map((cat: CategoryStats) => ({
                        name: `${cat.category} (${Math.round((cat.count / total) * 100)}%)`,
                        value: cat.count
                    }));
                    setQuestionCategories(categoriesWithPercentage);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user?.clubId]);

    const totalInteractions = stats.reduce((sum, day) => sum + day.total_interactions, 0);
    const totalTokens = stats.reduce((sum, day) => sum + day.total_tokens, 0);
    const averageResponseTime = stats.reduce((sum, day) => sum + day.avg_response_time, 0) / stats.length;
    const positiveFeedback = stats.reduce((sum, day) => sum + day.positive_feedback, 0);
    const negativeFeedback = stats.reduce((sum, day) => sum + day.negative_feedback, 0);

    if (loading) return <div className="text-center py-8">Laddar statistik...</div>;
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
    if (!user?.clubId) return <div className="text-center py-8">Du måste vara inloggad för att se statistik.</div>;

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
                        <BarChart data={stats}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="total_interactions" fill="#0088FE" name="Interaktioner" />
                            <Bar dataKey="positive_feedback" fill="#00C49F" name="Positiv Feedback" />
                            <Bar dataKey="negative_feedback" fill="#FF8042" name="Negativ Feedback" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
} 