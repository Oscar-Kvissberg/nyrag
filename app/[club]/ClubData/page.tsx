'use client';

import { useState, useEffect, use } from 'react';
import React from 'react';

interface Document {
  title: string;
  content: string;
}

interface EmailExample {
  question: string;
  answer: string;
}

interface SearchResponse {
  documents?: {
    documents: Array<{
      title: string;
      content: string;
    }>;
  };
  examples?: EmailExample[];
}

export default function ClubDataPage({ params }: { params: Promise<{ club: string }> }) {
  const resolvedParams = use(params);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [emailExamples, setEmailExamples] = useState<EmailExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'documents' | 'emails'>('documents');

  useEffect(() => {
    // Fetch documents from search index
    const fetchData = async () => {
      try {
        // Fetch documents
        const docsResponse = await fetch('/api/search-index');
        const docsData = await docsResponse.json() as SearchResponse;
        if (docsData.documents?.documents) {
          const simpleDocs = docsData.documents.documents.map(doc => ({
            title: doc.title,
            content: doc.content
          }));
          setDocuments(simpleDocs);
        }

        // Fetch email examples
        const emailsResponse = await fetch('/api/email-examples');
        const emailsData = await emailsResponse.json() as SearchResponse;
        if (emailsData.examples) {
          setEmailExamples(emailsData.examples);
          setJsonData(JSON.stringify(emailsData.examples, null, 2));
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      }
    };

    fetchData();
    setLoading(false);
  }, []);

  const handleSave = async () => {
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
      } else {
        if (!Array.isArray(parsedData) || !parsedData.every(email => 
          typeof email.question === 'string' && typeof email.answer === 'string'
        )) {
          throw new Error('Ogiltig mejlstruktur. Varje mejl måste ha question och answer.');
        }
      }

      // Update data based on active tab
      const endpoint = activeTab === 'documents' ? '/api/search-index' : '/api/email-examples';
      const response = await fetch(endpoint, {
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
      const refreshResponse = await fetch(endpoint);
      const refreshData = await refreshResponse.json() as SearchResponse;
      if (activeTab === 'documents' && refreshData.documents?.documents) {
        const simpleDocs = refreshData.documents.documents.map(doc => ({
          title: doc.title,
          content: doc.content
        }));
        setDocuments(simpleDocs);
        setJsonData(JSON.stringify(simpleDocs, null, 2));
      } else if (activeTab === 'emails' && refreshData.examples) {
        setEmailExamples(refreshData.examples);
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
            setJsonData(JSON.stringify(documents, null, 2));
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
            setJsonData(JSON.stringify(emailExamples, null, 2));
          }}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'emails'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Frågor & Svar
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
