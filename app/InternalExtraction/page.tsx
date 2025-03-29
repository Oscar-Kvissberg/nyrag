'use client';

import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#2563eb',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  listItem: {
    fontSize: 12,
    marginBottom: 5,
    marginLeft: 10,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: 'auto',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 25,
  },
  tableCell: {
    fontSize: 10,
    padding: 5,
  },
});

interface PageData {
  title: string;
  content: string;
  url: string;
}

interface ApiResponse {
  pages: PageData[];
  totalPages: number;
  urlsProcessed: string[];
}

// PDF Document component
const GolfClubPDF = ({ pages }: { pages: PageData[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Golf Club Website Data</Text>
      {pages.map((page, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{page.title}</Text>
          <Text style={styles.text}>URL: {page.url}</Text>
          <Text style={styles.text}>{page.content}</Text>
        </View>
      ))}
    </Page>
  </Document>
);

export default function InternalExtraction() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setResult(null);
    setRawResponse(null);

    try {
      const response = await fetch('/api/ExtractData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      // First get the raw text
      const rawText = await response.text();
      setRawResponse(rawText); // Store raw response for debugging

      // Try to parse it as JSON
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Server returned invalid JSON response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract data');
      }

      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      const errorStack = err instanceof Error ? err.stack || null : null;
      setError(errorMessage);
      setErrorDetails(errorStack);
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Extract Golf Club Website Data</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Enter golf club website URL"
            value={url}
            onChange={handleUrlChange}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Extracting...' : 'Extract Data'}
          </Button>
        </div>
      </form>

      {error && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 mb-2">{error}</p>
            {errorDetails && (
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {errorDetails}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug section */}
      {rawResponse && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Debug: Raw Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {rawResponse.substring(0, 1000)}...
            </pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
            {result.pages.length > 0 && (
              <PDFDownloadLink
                document={<GolfClubPDF pages={result.pages} />}
                fileName="golf-club-data.pdf"
                className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
              </PDFDownloadLink>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                Total pages processed: {result.totalPages}
              </div>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All Pages</TabsTrigger>
                  {result.pages.map((page, index) => (
                    <TabsTrigger key={index} value={`page-${index}`}>
                      {page.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {result.pages.map((page, index) => (
                    <Card key={index} className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          <a href={page.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {page.title}
                          </a>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                          {page.content}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {result.pages.map((page, index) => (
                  <TabsContent key={index} value={`page-${index}`}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          <a href={page.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {page.title}
                          </a>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                          {page.content}
                        </pre>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
