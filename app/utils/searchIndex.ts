// This file is kept for reference but is no longer in use since we're using Azure OpenAI directly

import { AzureKeyCredential, SearchClient } from '@azure/search-documents';

// Type definition for our documents
export interface GolfDocument {
  chunk_id: string;
  parent_id?: string;
  content: string;
  title: string;
  url?: string;
  filepath?: string;
}

// Type definition for email examples
export interface EmailExample {
  id: string;
  email: string;
  response: string;
  category: string;
  quality: 'good' | 'bad' | 'unknown';
  feedback?: string;
  timestamp: string;
}

// Initialize the search client with proper error handling
const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT || '',
  'index01',
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY || '')
);

// Function to clear and reload the entire index
export async function resetAndUploadDocuments(documents: GolfDocument[]) {
  try {
    console.log('Starting document upload with config:', {
      endpoint: process.env.AZURE_SEARCH_ENDPOINT,
      hasKey: !!process.env.AZURE_SEARCH_KEY,
      documentCount: documents.length
    });

    // First, delete all documents
    const results = await searchClient.search('*', { 
      top: 1000,
      select: ['chunk_id']
    });
    
    const existingDocs = [];
    for await (const result of results.results) {
      existingDocs.push({ chunk_id: (result.document as GolfDocument).chunk_id });
    }
    
    if (existingDocs.length > 0) {
      console.log(`Deleting ${existingDocs.length} existing documents...`);
      await searchClient.deleteDocuments(existingDocs);
    }

    // Then upload new documents
    console.log(`Uploading ${documents.length} new documents...`);
    const uploadResult = await searchClient.uploadDocuments(documents);
    console.log('Upload completed:', uploadResult);

    return { success: true, message: `Uploaded ${documents.length} documents successfully` };
  } catch (error) {
    console.error('Error resetting and uploading documents:', error);
    return { success: false, message: String(error) };
  }
}

// Function to view all documents in the index
export async function listAllDocuments() {
  try {
    console.log('Attempting to list documents with config:', {
      endpoint: process.env.AZURE_SEARCH_ENDPOINT,
      hasKey: !!process.env.AZURE_SEARCH_KEY
    });

    const results = await searchClient.search('*', { 
      top: 1000,
      select: ['chunk_id', 'parent_id', 'title', 'content', 'url', 'filepath']
    });
    
    const documents = [];
    for await (const result of results.results) {
      documents.push(result.document);
    }
    
    return { 
      success: true, 
      documents,
      count: documents.length
    };
  } catch (error) {
    console.error('Error listing documents:', error);
    return { 
      success: false, 
      documents: [],
      count: 0,
      error: String(error)
    };
  }
}

export const documents: GolfDocument[] = [
  {
    chunk_id: "faq-1",
    parent_id: "faqs",
    title: "Vanliga frågor och svar",
    content: "För att underlätta för våra medlemmar och gäster har vi här sammanställt de vanligaste frågorna samt svar.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/general.md"
  },
  {
    chunk_id: "faq-2",
    parent_id: "faqs",
    title: "Medlemskap 2025",
    content: "Jag är intresserad av medlemskap 2025. Hur går jag tillväga? Klicka på denna url https://vasatorp.golf/medlemskap/ för att hitta information gällande medlemskap. Längst ned på sidan kan du sedan skicka in din ansökan. Du är välkommen att maila övriga frågor till kansli@vasatorp.golf.",
    url: "https://vasatorp.golf/medlemskap/",
    filepath: "/faqs/membership.md"
  },
  {
    chunk_id: "faq-3",
    parent_id: "faqs",
    title: "Plats för fler medlemmar",
    content: "Det är alltid viss omsättning av medlemmar varje år och nu på hösten gör vi intag av medlemmar. I nuläget ser det ut som vi har plats i de flesta medlemskap inför 2025.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/membership.md"
  },
  {
    chunk_id: "faq-4",
    parent_id: "faqs",
    title: "Medlemskapsavgifter 2025",
    content: "2025 års avgifter fastställs på höstårsmötet den 24 oktober.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/membership.md"
  },
  {
    chunk_id: "faq-5",
    parent_id: "faqs",
    title: "Friskvårdskvitto",
    content: "Om du har fått en faktura från oss genom FINQR och betalt den som faktura loggar du in på ditt konto på FINQR. Där kan du sedan printa ut ett kvitto på din betalning.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/payment.md"
  },
  {
    chunk_id: "faq-6",
    parent_id: "faqs",
    title: "Laddstolpar för elbil",
    content: "I nuläget kan vi inte erbjuda laddning för elbilar men hoppas snart kunna ha det på plats.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/electric-car.md"
  },
  {
    chunk_id: "faq-7",
    parent_id: "faqs",
    title: "Greenfeesamarbete",
    content: "Klicka här för att läsa mer om våra vänklubbar.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/greenfee.md"
  },
  {
    chunk_id: "faq-8",
    parent_id: "faqs",
    title: "Träna på övningsområdet",
    content: "Om du är gäst som endast vill använda våra övningsområde och inte spela på banorna betalar du 150 kr per dag för att utnyttja träningsanläggningen.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/training.md"
  },
  {
    chunk_id: "faq-9",
    parent_id: "faqs",
    title: "Trackman Range",
    content: "Måste jag boka plats på Trackman Range? Nej det behöver du inte. Det är first-come-first-serve. Användandet av Trackman Range ingår i bollpriset på rangen.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/trackman-range.md"
  },
  {
    chunk_id: "allmant-om-medlemskap",
    parent_id: "faqs",
    title: "Allmänt om medlemskap",
    content: "För att bli medlem hos oss, vänligen ansök via vår hemsida. Medlemskap för 2025 fastställs efter höstårsmötet den 24 oktober. Du kan anmäla dig via vår webbsida eller genom att maila kansli@vasatorp.golf. 2025 års avgifter kommer att publiceras efter höstårsmötet.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/membership.md"
  },
  {
    chunk_id: "tc-medlemskap",
    parent_id: "faqs",
    title: "TC Medlemskap",
    content: "I TC medlemskapen ingår spel på alla anläggningens banor (Classic, Park 12 och Västra 9:an). Priser: Alla Dagar: 10,900 Kr (med lån) / 11,900 Kr (utan lån), Vardag: 8,200 Kr (med lån) / 9,100 Kr (utan lån), 22-26 år Alla Dagar: 7,000 Kr, 22-26 år Vardag: 5,400 Kr, Junior TC (0-15 år): 2,400 Kr, Junior TC (16-21 år): 3,600 Kr. Lån avser ett räntefritt medlemslån på 8,000 kr.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/membership.md"
  },
  {
    chunk_id: "classic-medlemskap",
    parent_id: "faqs",
    title: "Classic Medlemskap",
    content: "I Classic medlemskapen ingår spel på Classic, Park 12 och Västra 9:an. Vid spel på TC betalar du 50% av ordinarie greenfee. Priser: Alla Dagar: 7,800 Kr (med lån) / 8,600 Kr (utan lån), Vardag: 6,000 Kr (med lån) / 6,600 Kr (utan lån), 22-26 år Alla Dagar: 5,300 Kr, 22-26 år Vardag: 4,300 Kr. Lån avser ett räntefritt medlemslån på 8,000 kr.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/membership.md"
  },
  {
    chunk_id: "park-medlemskap",
    parent_id: "faqs",
    title: "Park 12+9 Medlemskap",
    content: "I Park medlemskapen ingår spel på Park-12 och Västra 9:an. Vid spel på TC och Classic betalar du 50% av ordinarie greenfee. Priser: Alla Dagar: 4,900 Kr, Vardag: 3,900 Kr, 22-26 år Alla Dagar: 3,700 Kr.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/membership.md"
  },
  {
    chunk_id: "practice-medlemskap",
    parent_id: "faqs",
    title: "Practice Medlemskap",
    content: "Detta medlemskap berättigar dig till spel på vår Pay & Play bana Västra 9:an. I detta medlemskap ingår ett saldo om 300 kr på GolfMore konto på Driving Rangen. För övrigt spel på våra andra banor betalar Practicemedlemmar full greenfee. Priser: Junior (0-15 år): 300 Kr, Junior (16-21 år): 1,800 Kr, Park 12+9 (0-15 år): 1,000 Kr, Park 12+9 (16-21 år): 1,700 Kr.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/membership.md"
  },
  {
    chunk_id: "experience-medlemskap",
    parent_id: "faqs",
    title: "Experience Medlemskap",
    content: "Detta medlemskap berättigar dig till spel på Västra 9:an samt en personlig pott på 2500 kr för att spela på andra banor. Efter att potten är använd gäller 50% greenfee-rabatt på övriga banor. Pris: 3,700 Kr.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/membership.md"
  },
  {
    chunk_id: "formaner",
    parent_id: "faqs",
    title: "Förmåner",
    content: "Medlemmar på Vasatorp har fri tillgång till alla banor, övningsområden, samt rabatter i restaurang och butik. Fritt inträde till tävlingsdagarna under Volvo Car Scandinavian Mixed 2024. Medlemmar får reducerad greenfee på andra klubbar enligt samarbetsavtal.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/membership.md"
  },
  {
    chunk_id: "traningsomraden",
    parent_id: "faqs",
    title: "Träningsområden",
    content: "Som medlem på Vasatorp får du tillgång till alla övningsområden, inklusive driving range och Trackman Range. Träning från gräs är tillgänglig under specifika tider. Priser för rangebollar: 25 bollar – 35 Kr, 45 bollar – 55 Kr, 65 bollar – 65 Kr. Bollar kan köpas genom GolfMore appen eller direkt vid bollmaskinen.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/training.md"
  },
  {
    chunk_id: "restaurang-och-shop",
    parent_id: "faqs",
    title: "Restaurang och Shop",
    content: "Restaurangens Öppettider: Måndag – Fredag 08:00 – 15:00, Lunch serveras mellan 11:00 – 14:00. Kiosk på Park öppen 08:00 – 17:00. Kiosker på TC och Classic är stängda. Kontakt: restaurang@vasatorp.golf, Telefon: 042-450 85 00. Shopens Öppettider: Måndag – Söndag 06:00 – 21:00.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/restaurant.md"
  },
  {
    chunk_id: "reception-och-kansli",
    parent_id: "faqs",
    title: "Reception och Kansli",
    content: "Öppettider Reception: Måndag – Torsdag 09:00 – 13:00, Fredag – Söndag 08:00 – 15:00. Telefontider: Måndag & Fredag 09:00 – 15:00, Tisdag – Torsdag STÄNGT (Lunchstängt 12:30 – 13:00). Kontakt Kansli: kansli@vasatorp.golf. Kontakt Reception: info@vasatorp.golf.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/reception.md"
  },
  {
    chunk_id: "bokningsinformation",
    parent_id: "faqs",
    title: "Bokningsinformation",
    content: "För att boka starttider och hotell, använd vår hemsida. Vi assisterar inte med hotellbokningar men kan hjälpa till med konferensbokningar och bord. Spela Tournament Course på Trackman Range. Logga in med din profil och välj Tournament Course för att fortsätta spela även under vintermånaderna.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/booking.md"
  },
  {
    chunk_id: "nyheter-och-uppdateringar",
    parent_id: "faqs",
    title: "Nyheter och Uppdateringar",
    content: "Volvo Car Scandinavian Mixed 2024: Fritt inträde för medlemmar under tävlingsdagarna. Receptionen erbjuder assistans med registrering av biljetter. Träningskortet 2024: Träning i grupp om 8 personer med ca 30 timmar per vecka mellan 10 april och 15 september. Pris: 2 999 kr per person. Övningsområdena: För icke-medlemmar kostar det 150 kr per dag att utnyttja träningsanläggningen. Betalning sker via receptionen eller Swish till nummer 123 542 26 54.",
    url: "https://vasatorp.golf/faq",
    filepath: "/faqs/news.md"
  }


 // {
  //  id: "xxx",
  //  title: "xxx",
  //  content: "xxx"
  //}



];

