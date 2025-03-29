'use client';

import React, { useState, useEffect, useRef } from 'react';

const EXAMPLE_EMAILS = [
    {
        label: "Medlemskap & Förmåner",
        text: `Hej,

Jag har en fråga kring era medlemskap. Om jag skulle teckna ett Park-medlemskap och ibland vilja spela på TC-banan, är det möjligt att göra det och finns det någon rabatt för Park-medlemmar i sådana fall? Jag är även nyfiken på hur medlemslånen fungerar för TC och Classic-medlemskap. Är det några specifika villkor jag bör känna till?

Tack på förhand för hjälpen!

Vänliga hälsningar,
Mohamed Salah`
    },
    {
        label: "Banstatus & Greenfee",
        text: `Hej,

Jag har ett par frågor angående era banor. Jag såg att Classic Course är under hålpipning och erbjuder reducerad greenfee under läktiden. Hur ofta uppdateras banstatusen på hemsidan, och vad händer om jag bokar en tid och det visar sig vara frost eller banan fortfarande läker?

Jag skulle även vilja veta hur reducerad greenfee fungerar rent praktiskt om man redan har ett medlemskap.

Tack för informationen!

Med vänlig hälsning,
Trent Alexander-Arnold`
    },
    {
        label: "Restaurang & Betalning",
        text: `Hej,

Jag har en fråga kring Vasatorpskortet och era kiosker. Om man glömmer sitt Vasatorpskort hemma, går det att koppla det till en app eller någon annan lösning för att ändå kunna få rabatt när man handlar i kiosken eller restaurangen?

Dessutom undrar jag om det är möjligt att boka bord i restaurangen i förväg, eller om det är först till kvarn som gäller? Vart bokar man detta isåfall?

Tack på förhand!

Vänliga hälsningar,
Andy Robertson`
    },
    {
        label: "Träning & Driving Range",
        text: `Hej,

Jag undrar lite kring era träningsmöjligheter. Hur ofta har jag som vanlig medlem möjlighet att använda Trackman Range, och finns det några begränsningar för när man kan träna där?

Jag har även sett att det erbjuds rabatter på Driving Range under sportlovsveckan. Om jag har ett saldo på GolfMore-appen, gäller rabatten automatiskt när jag köper bollar, eller behöver jag göra något särskilt för att aktivera den?

Tack för hjälpen!

Med vänlig hälsning,
Virgil van Dijk`
    }
];

export default function OpenAIBot() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [textareaHeight, setTextareaHeight] = useState('300px');
    const responseTextareaRef = useRef<HTMLTextAreaElement>(null);
    const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);
    const [responseId, setResponseId] = useState<string | null>(null);
    const [feedbackSent, setFeedbackSent] = useState(false);

    const handleExampleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedExample = EXAMPLE_EMAILS.find(email => email.label === e.target.value);
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
            setResponseId(data.id);

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
        if (!responseId || feedbackSent) return;

        try {
            const res = await fetch('/api/email-examples', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: responseId,
                    quality,
                    feedback
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
                                {EXAMPLE_EMAILS.map((email, index) => (
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