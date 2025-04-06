'use client';

import { useState, useEffect, use } from 'react';
import React from 'react';
import Cookies from 'js-cookie';
import { Loader2 } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'documents' | 'emails' | 'examples'>('documents');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [newDocument, setNewDocument] = useState({ title: '', content: '' });
  const [newEmailExample, setNewEmailExample] = useState({ question: '', answer: '' });
  const [newExampleQuestion, setNewExampleQuestion] = useState({ label: '', text: '' });

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser && parsedUser.clubId) {
          setUser(parsedUser);
        } else {
          setError('Invalid user data');
        }
      } catch (err) {
        setError('Failed to parse user data');
        console.error(err);
      }
    } else {
      setError('No user found. Please log in.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.clubId) return;

      try {
        const token = Cookies.get('token');
        if (!token) {
          setError('No authentication token found');
          return;
        }

        const [documentsRes, emailsRes, examplesRes] = await Promise.all([
          fetch(`/api/documents?clubId=${user.clubId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`/api/qa?clubId=${user.clubId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`/api/example-questions?clubId=${user.clubId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        const [documentsData, emailsData, examplesData] = await Promise.all([
          documentsRes.json(),
          emailsRes.json(),
          examplesRes.json()
        ]);

        if (documentsData.documents) setDocuments(documentsData.documents);
        if (emailsData.examples) setEmailExamples(emailsData.examples);
        if (examplesData.examples) setExampleQuestions(examplesData.examples);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    };

    fetchData();
  }, [user?.clubId]);

  const handleSaveDocuments = async () => {
    if (!user?.clubId) return;

    try {
      setSaveStatus('saving');
      
      // Prepare data without IDs
      const docsWithoutIds = documents.map(({ title, content }) => ({ title, content }));
      
      const response = await fetch(`/api/documents?clubId=${user.clubId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token')}`
        },
        body: JSON.stringify(docsWithoutIds),
      });

      if (!response.ok) {
        throw new Error('Failed to save documents');
      }

      setSaveStatus('success');
      
      // Refresh the data
      const refreshResponse = await fetch(`/api/documents?clubId=${user.clubId}`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });
      const refreshData = await refreshResponse.json();
      if (refreshData.documents) {
        setDocuments(refreshData.documents);
      }

      // Sync to search index
      const syncResponse = await fetch('/api/sync-search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });

      if (!syncResponse.ok) {
        console.error('Failed to sync documents to search index');
      }
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save documents');
      console.error(err);
    }
  };

  const handleSaveEmailExamples = async () => {
    if (!user?.clubId) return;

    try {
      setSaveStatus('saving');
      
      // Prepare data without IDs
      const examplesWithoutIds = emailExamples.map(({ question, answer }) => ({ question, answer }));
      
      const response = await fetch(`/api/qa?clubId=${user.clubId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token')}`
        },
        body: JSON.stringify(examplesWithoutIds),
      });

      if (!response.ok) {
        throw new Error('Failed to save email examples');
      }

      setSaveStatus('success');
      
      // Refresh the data
      const refreshResponse = await fetch(`/api/qa?clubId=${user.clubId}`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });
      const refreshData = await refreshResponse.json();
      if (refreshData.examples) {
        setEmailExamples(refreshData.examples);
      }

      // Sync to search index
      const syncResponse = await fetch('/api/sync-search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });

      if (!syncResponse.ok) {
        console.error('Failed to sync email examples to search index');
      }
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save email examples');
      console.error(err);
    }
  };

  const handleSaveExampleQuestions = async () => {
    if (!user?.clubId) return;

    try {
      setSaveStatus('saving');
      
      // Prepare data without IDs
      const questionsWithoutIds = exampleQuestions.map(({ label, text }) => ({ label, text }));
      
      const response = await fetch(`/api/example-questions?clubId=${user.clubId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token')}`
        },
        body: JSON.stringify(questionsWithoutIds),
      });

      if (!response.ok) {
        throw new Error('Failed to save example questions');
      }

      setSaveStatus('success');
      
      // Refresh the data
      const refreshResponse = await fetch(`/api/example-questions?clubId=${user.clubId}`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });
      const refreshData = await refreshResponse.json();
      if (refreshData.questions) {
        setExampleQuestions(refreshData.questions);
      }

      // Sync to search index
      const syncResponse = await fetch('/api/sync-search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });

      if (!syncResponse.ok) {
        console.error('Failed to sync example questions to search index');
      }
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save example questions');
      console.error(err);
    }
  };

  const addDocument = () => {
    if (newDocument.title && newDocument.content) {
      setDocuments([...documents, { id: Date.now(), ...newDocument }]);
      setNewDocument({ title: '', content: '' });
    }
  };

  const addEmailExample = () => {
    if (newEmailExample.question && newEmailExample.answer) {
      setEmailExamples([...emailExamples, { id: Date.now(), ...newEmailExample }]);
      setNewEmailExample({ question: '', answer: '' });
    }
  };

  const addExampleQuestion = () => {
    if (newExampleQuestion.label && newExampleQuestion.text) {
      setExampleQuestions([...exampleQuestions, { id: Date.now(), ...newExampleQuestion }]);
      setNewExampleQuestion({ label: '', text: '' });
    }
  };

  const removeDocument = (id: number) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const removeEmailExample = (id: number) => {
    setEmailExamples(emailExamples.filter(ex => ex.id !== id));
  };

  const removeExampleQuestion = (id: number) => {
    setExampleQuestions(exampleQuestions.filter(ex => ex.id !== id));
  };

  if (isLoading) {
    return <div className="p-4">Loading user data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!user?.clubId) {
    return <div className="p-4">Please log in to access this page.</div>;
  }

  return (
    <div className="p-8 pt-24">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Laddar data...</span>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Admin - {resolvedParams.club}</h1>
            <div className="flex gap-4">
              <button
                onClick={
                  activeTab === 'documents' ? handleSaveDocuments :
                  activeTab === 'emails' ? handleSaveEmailExamples :
                  handleSaveExampleQuestions
                }
                disabled={saveStatus === 'saving'}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  saveStatus === 'saving' 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {saveStatus === 'saving' ? 'Sparar...' : 'Spara Ändringar'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                activeTab === 'documents'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Dokument
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                activeTab === 'emails'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Frågor & Svar
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                activeTab === 'examples'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Exempelfrågor
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Dokument</h2>
                
                {/* Add new document form */}
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h3 className="text-lg font-medium mb-3">Lägg till nytt dokument</h3>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                    <input
                      type="text"
                      value={newDocument.title}
                      onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      placeholder="Ange titel"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Innehåll</label>
                    <textarea
                      value={newDocument.content}
                      onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                      className="w-full p-2 border rounded-md h-32"
                      placeholder="Ange innehåll"
                    />
                  </div>
                  <button
                    onClick={addDocument}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Lägg till
                  </button>
                </div>
                
                {/* List of documents */}
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium">{doc.title}</h3>
                        <button
                          onClick={() => removeDocument(doc.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Ta bort
                        </button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{doc.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Email Examples Tab */}
            {activeTab === 'emails' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Frågor & Svar</h2>
                
                {/* Add new email example form */}
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h3 className="text-lg font-medium mb-3">Lägg till ny fråga & svar</h3>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fråga</label>
                    <input
                      type="text"
                      value={newEmailExample.question}
                      onChange={(e) => setNewEmailExample({...newEmailExample, question: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      placeholder="Ange fråga"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Svar</label>
                    <textarea
                      value={newEmailExample.answer}
                      onChange={(e) => setNewEmailExample({...newEmailExample, answer: e.target.value})}
                      className="w-full p-2 border rounded-md h-32"
                      placeholder="Ange svar"
                    />
                  </div>
                  <button
                    onClick={addEmailExample}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Lägg till
                  </button>
                </div>
                
                {/* List of email examples */}
                <div className="space-y-4">
                  {emailExamples.map((example) => (
                    <div key={example.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium">{example.question}</h3>
                        <button
                          onClick={() => removeEmailExample(example.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Ta bort
                        </button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{example.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Example Questions Tab */}
            {activeTab === 'examples' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Exempelfrågor</h2>
                
                {/* Add new example question form */}
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h3 className="text-lg font-medium mb-3">Lägg till ny exempelfråga</h3>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Etikett</label>
                    <input
                      type="text"
                      value={newExampleQuestion.label}
                      onChange={(e) => setNewExampleQuestion({...newExampleQuestion, label: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      placeholder="Ange etikett"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                    <textarea
                      value={newExampleQuestion.text}
                      onChange={(e) => setNewExampleQuestion({...newExampleQuestion, text: e.target.value})}
                      className="w-full p-2 border rounded-md h-32"
                      placeholder="Ange text"
                    />
                  </div>
                  <button
                    onClick={addExampleQuestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Lägg till
                  </button>
                </div>
                
                {/* List of example questions */}
                <div className="space-y-4">
                  {exampleQuestions.map((example) => (
                    <div key={example.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium">{example.label}</h3>
                        <button
                          onClick={() => removeExampleQuestion(example.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Ta bort
                        </button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{example.text}</p>
                    </div>
                  ))}
                </div>
              </div>
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
        </>
      )}
    </div>
  );
}
