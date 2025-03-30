'use client';

import { useState, useEffect, use } from 'react';
import React from 'react';

interface Document {
  id: number;
  title: string;
  content: string;
}

interface EmailExample {
  id: number;
  question: string;
  answer: string;
}

interface ExampleQuestion {
  id: number;
  label: string;
  text: string;
}

interface User {
  username: string;
  clubId: string;
  role: string;
}

export default function ClubDataPage({ params }: { params: Promise<{ club: string }> }) {
  const resolvedParams = use(params);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [emailExamples, setEmailExamples] = useState<EmailExample[]>([]);
  const [exampleQuestions, setExampleQuestions] = useState<ExampleQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'documents' | 'emails' | 'examples'>('documents');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    // Fetch data from database
    const fetchData = async () => {
      if (!user?.clubId) return;

      try {
        // Fetch documents
        const docsResponse = await fetch(`/api/documents?clubId=${user.clubId}`);
        const docsData = await docsResponse.json();
        if (docsData.documents) {
          // Remove IDs from documents
          const docsWithoutIds = docsData.documents.map(({ title, content }: Document) => ({ title, content }));
          setDocuments(docsData.documents);
          setJsonData(JSON.stringify(docsWithoutIds, null, 2));
        }

        // Fetch Q&A
        const qaResponse = await fetch(`/api/qa?clubId=${user.clubId}`);
        const qaData = await qaResponse.json();
        if (qaData.examples) {
          // Remove IDs from examples
          const qaWithoutIds = qaData.examples.map(({ question, answer }: EmailExample) => ({ question, answer }));
          setEmailExamples(qaData.examples);
          setJsonData(JSON.stringify(qaWithoutIds, null, 2));
        }

        // Fetch example questions
        const examplesResponse = await fetch(`/api/example-questions?clubId=${user.clubId}`);
        const examplesData = await examplesResponse.json();
        if (examplesData.examples) {
          // Remove IDs from examples
          const examplesWithoutIds = examplesData.examples.map(({ label, text }: ExampleQuestion) => ({ label, text }));
          setExampleQuestions(examplesData.examples);
          setJsonData(JSON.stringify(examplesWithoutIds, null, 2));
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      }
    };

    fetchData();
    setLoading(false);
  }, [user?.clubId]);

  const handleSave = async () => {
    if (!user?.clubId) return;

    try {
      setSaveStatus('saving');
      const parsedData = JSON.parse(jsonData);
      
      // Validate data structure based on active tab
      if (activeTab === 'documents') {
        if (!Array.isArray(parsedData) || !parsedData.every(doc => 
          typeof doc.title === 'string' && typeof doc.content === 'string'
        )) {
          throw new Error('Ogiltig dokumentstruktur. Varje dokument måste ha title och content.');
        }
      } else if (activeTab === 'emails') {
        if (!Array.isArray(parsedData) || !parsedData.every(qa => 
          typeof qa.question === 'string' && typeof qa.answer === 'string'
        )) {
          throw new Error('Ogiltig mejlstruktur. Varje mejl måste ha question och answer.');
        }
      } else {
        if (!Array.isArray(parsedData) || !parsedData.every(ex => 
          typeof ex.label === 'string' && typeof ex.text === 'string'
        )) {
          throw new Error('Ogiltig exempelstruktur. Varje exempel måste ha label och text.');
        }
      }

      // Update data based on active tab
      const endpoint = activeTab === 'documents' ? '/api/documents' : 
                      activeTab === 'emails' ? '/api/qa' : '/api/example-questions';
      
      const response = await fetch(`${endpoint}?clubId=${user.clubId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      setSaveStatus('success');
      setIsEditing(false);
      
      // Refresh the data
      const refreshResponse = await fetch(`${endpoint}?clubId=${user.clubId}`);
      const refreshData = await refreshResponse.json();
      if (activeTab === 'documents' && refreshData.documents) {
        setDocuments(refreshData.documents);
        setJsonData(JSON.stringify(refreshData.documents, null, 2));
      } else if (activeTab === 'emails' && refreshData.examples) {
        setEmailExamples(refreshData.examples);
        setJsonData(JSON.stringify(refreshData.examples, null, 2));
      } else if (activeTab === 'examples' && refreshData.examples) {
        setExampleQuestions(refreshData.examples);
        setJsonData(JSON.stringify(refreshData.examples, null, 2));
      }
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!user?.clubId) return <div className="p-8">Du måste vara inloggad för att se denna sida.</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin - {resolvedParams.club}</h1>
        <div className="flex gap-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  saveStatus === 'saving' 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {saveStatus === 'saving' ? 'Sparar...' : 'Spara Ändringar'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSaveStatus('idle');
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white"
              >
                Avbryt
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              Redigera
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => {
            setActiveTab('documents');
            // Remove IDs when switching to documents tab
            const docsWithoutIds = documents.map(({ title, content }: Document) => ({ title, content }));
            setJsonData(JSON.stringify(docsWithoutIds, null, 2));
          }}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'documents'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Dokument
        </button>
        <button
          onClick={() => {
            setActiveTab('emails');
            // Remove IDs when switching to emails tab
            const qaWithoutIds = emailExamples.map(({ question, answer }: EmailExample) => ({ question, answer }));
            setJsonData(JSON.stringify(qaWithoutIds, null, 2));
          }}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'emails'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Frågor & Svar
        </button>
        <button
          onClick={() => {
            setActiveTab('examples');
            // Remove IDs when switching to examples tab
            const examplesWithoutIds = exampleQuestions.map(({ label, text }: ExampleQuestion) => ({ label, text }));
            setJsonData(JSON.stringify(examplesWithoutIds, null, 2));
          }}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'examples'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Exempelfrågor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {isEditing ? (
          <textarea
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            className="w-full h-[calc(100vh-200px)] p-4 font-mono text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            spellCheck="false"
            placeholder={activeTab === 'emails' ? 
              `[
  {
    "question": "Måste jag boka plats på Trackman Range?",
    "answer": "Nej det behöver du inte. Det är first-come-first-serve. Användandet av Trackman Range ingår i bollpriset på rangen."
  }
]` : activeTab === 'examples' ?
  `[
  {
    "label": "Medlemskap & Förmåner",
    "text": "Hej,\\n\\nJag har en fråga kring era medlemskap..."
  }
]` : undefined}
          />
        ) : (
          <pre className="whitespace-pre-wrap overflow-x-auto text-sm">
            {jsonData}
          </pre>
        )}
      </div>

      {saveStatus === 'success' && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Ändringar sparade!
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
