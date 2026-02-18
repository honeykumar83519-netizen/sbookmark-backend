import fetch from 'node-fetch';

interface LinkMetadata {
    title: string;
    description: string;
    imageUrl: string;
    siteName?: string;
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();

        // Extract metadata using regex
        const metadata: LinkMetadata = {
            title: extractMetaTag(html, 'og:title') || extractTitle(html) || '',
            description: extractMetaTag(html, 'og:description') ||
                extractMetaTag(html, 'description') || '',
            imageUrl: extractMetaTag(html, 'og:image') || '',
            siteName: extractMetaTag(html, 'og:site_name'),
        };
        console.log(metadata.imageUrl, "imageUrl");

        return metadata;
    } catch (error: any) {
        throw new Error(`Failed to fetch metadata: ${error.message}`);
    }
}

function extractMetaTag(html: string, property: string): string {
    // Try Open Graph tags (check if property already has og: prefix)
    const ogProperty = property.startsWith('og:') ? property : `og:${property}`;
    const ogRegex = new RegExp(
        `<meta\\s+property=["']${ogProperty}["']\\s+content=["']([^"']+)["']`,
        'i'
    );
    let match = html.match(ogRegex);
    if (match) return match[1];

    // Try standard meta tags
    const metaRegex = new RegExp(
        `<meta\\s+name=["']${property}["']\\s+content=["']([^"']+)["']`,
        'i'
    );
    match = html.match(metaRegex);
    if (match) return match[1];

    // Try reversed order (content before name/property)
    const reverseOgRegex = new RegExp(
        `<meta\\s+content=["']([^"']+)["']\\s+property=["']${ogProperty}["']`,
        'i'
    );
    match = html.match(reverseOgRegex);
    if (match) return match[1];

    const reverseMetaRegex = new RegExp(
        `<meta\\s+content=["']([^"']+)["']\\s+name=["']${property}["']`,
        'i'
    );
    match = html.match(reverseMetaRegex);
    if (match) return match[1];

    return '';
}

function extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
}
