'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Loader2, X } from 'lucide-react';
import Typewriter from '../components/Typewriter';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username,
          password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

      // Store token in cookie
      Cookies.set('token', data.token, { expires: 1 }); // Expires in 1 day
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to club page
      router.push(`/${data.user.clubId}/MailGeneration`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center bg-gray-50">
      {/* Gradient blobs/shadows */}
      <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute top-[30%] right-[-20%] w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-purple-500/20 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-gray-900">Golfkansliets Mejl </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Assistent
              </span>
            </h1>

            <p className="text-gray-600 mb-6">Vänligen logga in eller skapa ett konto för att använda vår Chat Wrapper</p>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg"
              >
                Logga in här
              </button>
              <button 
                onClick={() => setShowContactModal(true)}
                className="px-6 py-3 bg-white text-gray-800 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-lg"
              >
                Kontakt info
              </button>
            </div>
          </div>

          <div className="w-full bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-4 text-left">
              <p className="text-gray-700 font-mono h-6">
                <Typewriter 
                  text="Låt Assistenten hjälpa dig att skriva professionella e-postsvar på några sekunder..." 
                  delay={40}
                  restartDelay={2000}
                />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative animate-fade-in">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Logga in</h2>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Användarnamn
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Ange användarnamn"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Lösenord
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Ange lösenord"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loggar in...
                      </>
                    ) : (
                      'Logga in'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Contact Info Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative animate-fade-in">
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">För att skapa en konto, kontakta oss så lägger vi till din klubb i systemet</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Oscar eller Johan</h3>
                  <p className="text-gray-600">E-post: Johan@majl.se</p>
                  <p className="text-gray-600">Telefon: 08-123455</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">För programutveckling</h3>
                  <p className="text-gray-600">Catalina Software Solutions AB</p>
                  <p className="text-gray-600">oscar.kvissberg@catalinasoftwaresolutions.se</p>
                  <p className="text-gray-600">anton.bjorkegren@catalinasoftwaresolutions.se</p>
                </div>
                
                
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 