'use client'

import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

const TOP_QUESTIONS = [
    "Hur kan jag boka en tid?",
    "Vad kostar greenfee?",
    "Vilka är öppettiderna?",
    "Finns det proffsshop?",
    "Hur kommer jag hit?"
]

// Exempel-data för cirkeldiagram
const questionCategories = [
    { name: 'Bokning (35%)', value: 35 },
    { name: 'Priser (25%)', value: 25 },
    { name: 'Öppettider (20%)', value: 20 },
    { name: 'Faciliteter (15%)', value: 15 },
    { name: 'Vägbeskrivning (5%)', value: 5 }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function Stats() {
    const [emailCount, setEmailCount] = useState(0)
    const [timeSaved, setTimeSaved] = useState(0)
    
    useEffect(() => {
        // Ladda statistik från localStorage
        const count = parseInt(localStorage.getItem('emailGenerationCount') || '0')
        setEmailCount(count)
        
        // Beräkna tid sparad (5 minuter per mail)
        setTimeSaved(count * 5)
    }, [])

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Statistik-kort */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Antal genererade mail</h3>
                <p className="text-3xl font-bold text-blue-600">{emailCount}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Estimerad tid sparad</h3>
                <p className="text-3xl font-bold text-green-600">{timeSaved} min</p>
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

            {/* Vanliga frågor */}
            <div className="md:col-span-2 lg:col-span-4 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Vanliga Frågor</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {TOP_QUESTIONS.map((question, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700">{question}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
} 