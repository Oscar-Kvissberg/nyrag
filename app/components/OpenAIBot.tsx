'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ExampleEmail {
    label: string;
    text: string;
}

interface User {
    username: string;
    clubId: string;
    role: string;
}

export default function OpenAIBot() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [textareaHeight, setTextareaHeight] = useState('300px');
    const [exampleEmails, setExampleEmails] = useState<ExampleEmail[]>([]);
    const responseTextareaRef = useRef<HTMLTextAreaElement>(null);
    const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);
    const [feedbackSent, setFeedbackSent] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
    }, []);

    useEffect(() => {
        // Fetch example emails when user is available
        const fetchExampleEmails = async () => {
            if (!user?.clubId) return;

            try {
                const response = await fetch(`/api/example-questions?clubId=${user.clubId}`);
                const data = await response.json();
                
                if (data.examples) {
                    const formattedExamples = data.examples.map((ex: { label: string; text: string }) => ({
                        label: ex.label,
                        text: ex.text
                    }));
                    setExampleEmails(formattedExamples);
                }
            } catch (err) {
                console.error('Error fetching example emails:', err);
            }
        };

        fetchExampleEmails();
    }, [user?.clubId]);

    const handleExampleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedExample = exampleEmails.find(email => email.label === e.target.value);
        if (selectedExample) {
            setMessage(selectedExample.text);
        }
    };

    const handleClearMessage = () => {
        setMessage('');
        if (selectRef.current) {
            selectRef.current.value = '';
        }
    };

    const adjustTextareaHeight = () => {
        const messageTextarea = messageTextareaRef.current;
        const responseTextarea = responseTextareaRef.current;
        
        if (messageTextarea && responseTextarea) {
            messageTextarea.style.height = 'auto';
            responseTextarea.style.height = 'auto';
            
            const messageHeight = messageTextarea.scrollHeight;
            const responseHeight = responseTextarea.scrollHeight;
            const newHeight = `${Math.max(300, messageHeight, responseHeight)}px`;
            
            setTextareaHeight(newHeight);
            messageTextarea.style.height = newHeight;
            responseTextarea.style.height = newHeight;
        }
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [message, response]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        setError(null);
        setIsLoading(true);
        setFeedbackSent(false);

        try {
            console.log('Sending request to generate response...');
            const res = await fetch('/api/generate-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message.trim()
                }),
            });

            console.log('Got response:', res.status);
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Kunde inte generera svar. Vänligen försök igen.');
            }

            setResponse(data.response);

        } catch (err) {
            console.error('Error details:', err);
            let errorMessage = 'Ett fel uppstod vid anslutning till tjänsten';
            
            if (err instanceof Error) {
                if (err.message.includes('Failed to fetch')) {
                    errorMessage = 'Kunde inte ansluta till servern. Kontrollera din internetanslutning.';
                } else {
                    errorMessage = err.message;
                }
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedback = async (quality: 'good' | 'bad', feedback?: string) => {
        if (feedbackSent) return;

        try {
            const res = await fetch('/api/statistics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clubId: 'default',
                    interactionType: 'feedback',
                    question: message,
                    answer: response,
                    feedback: quality,
                    feedbackText: feedback,
                    responseTimeMs: 0,
                    tokensUsed: 0
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to send feedback');
            }

            setFeedbackSent(true);
        } catch (error) {
            console.error('Error sending feedback:', error);
        }
    };

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-5xl mx-auto">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="grid gap-8 md:grid-cols-2">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Ditt Meddelande</h2>
                        <div className="flex items-center gap-2 mb-4">
                            <select
                                ref={selectRef}
                                onChange={handleExampleSelect}
                                className="text-sm border border-gray-200 rounded-lg p-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-32"
                                defaultValue=""
                            >
                                <option value="" disabled>Exempel</option>
                                {exampleEmails.map((email, index) => (
                                    <option key={index} value={email.label}>
                                        {email.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className={`
                                    px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg
                                    ${isLoading 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity'
                                    }
                                    text-white text-sm
                                `}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Söker i kunskapsbasen...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Generera Svar</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M5 5l7 7-7 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                            {message && (
                                <button
                                    onClick={handleClearMessage}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <textarea
                            ref={messageTextareaRef}
                            className="w-full p-4 border border-gray-200 rounded-lg min-h-[300px] bg-gray-50/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={message}
                            onChange={handleMessageChange}
                            placeholder="Skriv ditt meddelande här..."
                            disabled={isLoading}
                            style={{ resize: 'none', overflow: 'hidden', height: textareaHeight }}
                        />
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Genererat svar</h2>
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                onClick={() => {
                                    if (response) {
                                        navigator.clipboard.writeText(response);
                                        setCopySuccess(true);
                                        setTimeout(() => setCopySuccess(false), 2000);
                                    }
                                }}
                                disabled={!response}
                                className={`
                                    px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg
                                    ${!response 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity'
                                    }
                                    text-white text-sm
                                `}
                                title="Kopiera svar"
                            >
                                {copySuccess ? (
                                    <>
                                        <span>Kopierat!</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </>
                                ) : (
                                    <>
                                        <span>Kopiera Svar</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                    </>
                                )}
                            </button>

                            {response && !feedbackSent && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleFeedback('good')}
                                        className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 transition-colors"
                                        title="Bra svar"
                                    >
                                        👍
                                    </button>
                                    <button
                                        onClick={() => handleFeedback('bad')}
                                        className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                                        title="Dåligt svar"
                                    >
                                        👎
                                    </button>
                                </div>
                            )}

                            {feedbackSent && (
                                <span className="text-sm text-gray-500">
                                    Tack för din feedback!
                                </span>
                            )}
                        </div>
                        <textarea
                            ref={responseTextareaRef}
                            className="w-full p-4 border border-gray-200 rounded-lg min-h-[300px] bg-gray-50/80 backdrop-blur-sm focus:outline-none"
                            value={response}
                            readOnly
                            placeholder={isLoading ? "Söker i kunskapsbasen..." : "Assistentens svar kommer att visas här..."}
                            style={{ resize: 'none', overflow: 'hidden', height: textareaHeight }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
} 