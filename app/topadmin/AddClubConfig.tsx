'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AddClubConfig() {
  const [clubId, setClubId] = useState('');
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [clubRules, setClubRules] = useState('');
  const [clubContext, setClubContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Du måste logga in först');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/admin/add-club-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clubId,
          clubName,
          clubDescription,
          clubRules,
          clubContext
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Något gick fel');
      }

      setSuccess('Klubbkonfiguration sparad');
      setClubId('');
      setClubName('');
      setClubDescription('');
      setClubRules('');
      setClubContext('');
    } catch (error) {
      console.error('Error adding club config:', error);
      setError(error instanceof Error ? error.message : 'Något gick fel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Uppdatera klubbkonfiguration</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="clubId" className="text-sm font-medium">
              Klubb-ID
            </label>
            <Input
              id="clubId"
              value={clubId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClubId(e.target.value)}
              placeholder="t.ex. rattvik"
              required
            />
            <p className="text-xs text-gray-500">
              Ange ID för den klubb vars konfiguration du vill uppdatera.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="clubName" className="text-sm font-medium">
              Klubbnamn
            </label>
            <Input
              id="clubName"
              value={clubName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClubName(e.target.value)}
              placeholder="t.ex. Rättviks Golfklubb"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="clubDescription" className="text-sm font-medium">
              Klubbbeskrivning
            </label>
            <textarea
              id="clubDescription"
              value={clubDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClubDescription(e.target.value)}
              placeholder="Kort beskrivning av klubben"
              className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="clubRules" className="text-sm font-medium">
              Klubbregler
            </label>
            <textarea
              id="clubRules"
              value={clubRules}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClubRules(e.target.value)}
              placeholder="Regler för klubben"
              className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="clubContext" className="text-sm font-medium">
              Klubbkontext
            </label>
            <textarea
              id="clubContext"
              value={clubContext}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClubContext(e.target.value)}
              placeholder="Detaljerad information om klubben som AI:n kan använda för att svara på frågor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[150px]"
            />
          </div>
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Sparar...' : 'Spara konfiguration'}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
} 