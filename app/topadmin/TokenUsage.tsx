'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

interface TokenUsage {
  club_id: string;
  total_tokens: number;
  total_interactions: number;
  last_activity: string;
}

interface DailyUsage {
  club_id: string;
  date: string;
  total_tokens_used: number;
  total_interactions: number;
}

export default function TokenUsage() {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenUsage = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) {
          setError('No authentication token found');
          return;
        }

        const response = await fetch('/api/admin/token-usage', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch token usage');
        }

        const data = await response.json();
        if (data.success) {
          setTokenUsage(data.tokenUsage);
          setDailyUsage(data.dailyUsage);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch token usage');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenUsage();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        Error: {error}
      </div>
    );
  }

  // Beräkna total token-användning för alla klubbar
  const totalTokensUsed = tokenUsage.reduce((sum, usage) => sum + usage.total_tokens, 0);
  const totalInteractions = tokenUsage.reduce((sum, usage) => sum + usage.total_interactions, 0);

  return (
    <div className="space-y-8">
      {/* Sammanfattning av total token-användning */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Sammanfattning av Token-användning</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Totala Tokens Använda</p>
            <p className="text-2xl font-bold text-blue-700">{totalTokensUsed.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Totala Interaktioner</p>
            <p className="text-2xl font-bold text-green-700">{totalInteractions.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Total Token-användning per Klubb</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klubb
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Totala Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interaktioner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Senaste Aktivitet
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tokenUsage.map((usage) => (
                <tr key={usage.club_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {usage.club_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usage.total_tokens.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usage.total_interactions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(usage.last_activity).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Daglig Token-användning (Senaste 30 dagarna)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klubb
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interaktioner
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyUsage.map((usage, index) => (
                <tr key={`${usage.club_id}-${usage.date}-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(usage.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {usage.club_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usage.total_tokens_used.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usage.total_interactions.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 