import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchPage(url: string, baseUrl: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'no-cache',
    },
    next: { revalidate: 0 },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (text.includes('challenge-platform') || text.includes('cloudflare')) {
    throw new Error('Website is protected by Cloudflare. Please try a different website or contact the administrator.');
  }

  return text;
}

function extractLinks($: ReturnType<typeof cheerio.load>, baseUrl: string): string[] {
  const links: string[] = [];
  const relevantKeywords = [
    // General information
    'about', 'om', 'info', 'information', 'kontakt', 'contact',
    // Golf specific
    'course', 'banan', 'banor', 'holes', 'hål', 'golfbanan', 'golfbanor',
    'facilities', 'anläggning', 'anläggningar', 'faciliteter',
    'services', 'tjanster', 'tjänster', 'service',
    'membership', 'medlemskap', 'medlem', 'medlemmar',
    'greenfee', 'priser', 'pris', 'prislista', 'prislistor',
    'booking', 'bokning', 'tee', 'tee-time', 'tee-times',
    'proshop', 'shop', 'butik', 'golfshop',
    'restaurant', 'restaurang', 'cafe', 'café', 'bar',
    'events', 'evenemang', 'turneringar', 'tournaments',
    'lessons', 'lektioner', 'undervisning', 'teaching',
    'pro', 'proffs', 'pros', 'golfpro',
    'rules', 'regler', 'reglemente',
    'handicap', 'handikapp',
    'scorecard', 'score', 'resultat',
    'weather', 'väder', 'väderlek',
    'directions', 'vägbeskrivning', 'hitta', 'find',
    'opening', 'öppettider', 'hours', 'tider'
  ];
  
  // First try to find navigation menus
  const navMenus = $('nav, .nav, .menu, .navigation, #nav, #menu, #navigation');
  
  // Extract links from navigation menus first
  navMenus.find('a').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const absoluteUrl = new URL(href, baseUrl).toString();
      if (absoluteUrl.startsWith(baseUrl) && 
          relevantKeywords.some(keyword => absoluteUrl.toLowerCase().includes(keyword))) {
        links.push(absoluteUrl);
      }
    }
  });

  // Then try to find links in the main content area
  const mainContent = $('main, article, .content, .main-content, #content, #main-content, .article, .post');
  mainContent.find('a').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const absoluteUrl = new URL(href, baseUrl).toString();
      if (absoluteUrl.startsWith(baseUrl) && 
          relevantKeywords.some(keyword => absoluteUrl.toLowerCase().includes(keyword))) {
        links.push(absoluteUrl);
      }
    }
  });

  // Finally, check the footer for important links
  const footer = $('footer, .footer, #footer');
  footer.find('a').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const absoluteUrl = new URL(href, baseUrl).toString();
      if (absoluteUrl.startsWith(baseUrl) && 
          relevantKeywords.some(keyword => absoluteUrl.toLowerCase().includes(keyword))) {
        links.push(absoluteUrl);
      }
    }
  });

  return Array.from(new Set(links)); // Remove duplicates
}

function extractText($: ReturnType<typeof cheerio.load>, pageUrl: string): { title: string; content: string; url: string } {
  // Remove unwanted elements
  $('script, style, nav, footer, header, .header, .footer, .nav, .menu, .sidebar, .social, .cookie-notice').remove();
  
  // Get page title
  const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
  
  // Focus on main content areas
  const mainContent = $('main, article, .content, .main-content, #content, #main-content, .article, .post');
  
  let content = '';
  if (mainContent.length > 0) {
    // Process headings first
    mainContent.find('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const heading = $(element).text().trim();
      if (heading) {
        content += `\n\n## ${heading}\n`;
      }
    });

    // Then process paragraphs
    mainContent.find('p').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        content += `${text}\n\n`;
      }
    });

    // Process lists
    mainContent.find('ul, ol').each((_, element) => {
      $(element).find('li').each((_, li) => {
        const text = $(li).text().trim();
        if (text) {
          content += `- ${text}\n`;
        }
      });
      content += '\n';
    });

    // Process tables
    mainContent.find('table').each((_, element) => {
      const rows = $(element).find('tr');
      rows.each((_, row) => {
        const cells = $(row).find('td, th');
        if (cells.length > 0) {
          const rowText = cells.map((_, cell) => $(cell).text().trim()).get().join(' | ');
          content += `${rowText}\n`;
        }
      });
      content += '\n';
    });
  } else {
    // Fallback to body if no main content found
    content = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Clean up the content
  content = content
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  return {
    title,
    content,
    url: pageUrl
  };
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log('Starting extraction from:', url);

    const baseUrl = new URL(url).origin;
    const visitedUrls = new Set<string>();
    const pages: Array<{ title: string; content: string; url: string }> = [];

    // Function to process a single page
    const processPage = async (pageUrl: string) => {
      if (visitedUrls.has(pageUrl)) return;
      visitedUrls.add(pageUrl);

      console.log('Processing page:', pageUrl);
      const html = await fetchPage(pageUrl, baseUrl);
      const $ = cheerio.load(html);
      
      // Extract structured text from this page
      const pageData = extractText($, pageUrl);
      if (pageData.content) {
        pages.push(pageData);
      }

      // Extract and process links
      const links = extractLinks($, baseUrl);
      console.log('Found links on page:', links);
      
      // Process up to 5 additional pages
      if (visitedUrls.size < 6) {
        for (const link of links) {
          if (!visitedUrls.has(link)) {
            try {
              await processPage(link);
            } catch (error) {
              console.error(`Error processing ${link}:`, error);
            }
          }
        }
      }
    };

    // Start processing from the main URL
    await processPage(url);

    console.log('Total pages processed:', visitedUrls.size);

    if (pages.length === 0) {
      throw new Error('No content found on any pages');
    }

    return NextResponse.json({
      pages: pages,
      totalPages: pages.length,
      urlsProcessed: Array.from(visitedUrls),
    });

  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to extract data',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
