Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        const contentResults = [];
        const timestamp = new Date().toISOString();

        // Fetch AI papers from arXiv
        try {
            console.log('Fetching AI papers from arXiv...');
            
            // arXiv API search for AI/ML papers
            const arxivResponse = await fetch(
                'http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CV+OR+cat:cs.CL&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending'
            );

            if (arxivResponse.ok) {
                const arxivText = await arxivResponse.text();
                
                // Parse XML manually using regex (since DOMParser is not reliable in Deno)
                const entryRegex = /<entry>(.*?)<\/entry>/gs;
                const titleRegex = /<title>(.*?)<\/title>/s;
                const summaryRegex = /<summary>(.*?)<\/summary>/s;
                const authorRegex = /<name>(.*?)<\/name>/g;
                const linkRegex = /<link href="([^"]*)"/;
                const publishedRegex = /<published>(.*?)<\/published>/s;
                
                let match;
                while ((match = entryRegex.exec(arxivText)) !== null) {
                    const entry = match[1];
                    
                    const titleMatch = titleRegex.exec(entry);
                    const summaryMatch = summaryRegex.exec(entry);
                    const linkMatch = linkRegex.exec(entry);
                    const publishedMatch = publishedRegex.exec(entry);
                    
                    if (titleMatch && summaryMatch && linkMatch) {
                        const authors = [];
                        let authorMatch;
                        while ((authorMatch = authorRegex.exec(entry)) !== null) {
                            authors.push(authorMatch[1].trim());
                        }
                        
                        const title = titleMatch[1].trim().replace(/\n/g, ' ');
                        const summary = summaryMatch[1].trim().replace(/\n/g, ' ');
                        const url = linkMatch[1];
                        const published = publishedMatch ? publishedMatch[1] : timestamp;
                        
                        contentResults.push({
                            title: title,
                            content: summary,
                            summary: summary.substring(0, 300) + '...',
                            url: url,
                            source: 'arxiv',
                            content_type: 'paper',
                            authors: authors,
                            published_at: published,
                            relevance_score: 0.8,
                            created_at: timestamp
                        });
                    }
                }
                
                console.log(`Fetched ${contentResults.length} papers from arXiv`);
            }
        } catch (arxivError) {
            console.error('Error fetching arXiv data:', arxivError.message);
        }

        // Fetch AI news from various tech news sources (using RSS feeds)
        const newsFeeds = [
            {
                url: 'https://feeds.feedburner.com/venturebeat/SZYF',
                source: 'venturebeat_ai',
                type: 'news'
            },
            {
                url: 'https://feeds.feedburner.com/oreilly/radar',
                source: 'oreilly_radar',
                type: 'news'
            }
        ];

        for (const feed of newsFeeds) {
            try {
                console.log(`Fetching news from ${feed.source}...`);
                
                const response = await fetch(feed.url);
                if (!response.ok) {
                    console.log(`Failed to fetch ${feed.source}: ${response.status}`);
                    continue;
                }

                const feedText = await response.text();
                
                // Parse RSS feed manually
                const itemRegex = /<item>(.*?)<\/item>/gs;
                const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/s;
                const linkRegex = /<link>(.*?)<\/link>/s;
                const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s;
                const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/s;
                
                let match;
                let itemCount = 0;
                while ((match = itemRegex.exec(feedText)) !== null && itemCount < 10) {
                    const item = match[1];
                    
                    const titleMatch = titleRegex.exec(item);
                    const linkMatch = linkRegex.exec(item);
                    const descMatch = descRegex.exec(item);
                    const pubDateMatch = pubDateRegex.exec(item);
                    
                    if (titleMatch && linkMatch) {
                        const title = (titleMatch[1] || titleMatch[2] || '').trim();
                        const link = linkMatch[1].trim();
                        const description = (descMatch?.[1] || descMatch?.[2] || '').trim();
                        const pubDate = pubDateMatch ? pubDateMatch[1] : timestamp;
                        
                        // Only include AI-related content
                        const aiKeywords = ['AI', 'artificial intelligence', 'machine learning', 'deep learning', 'neural', 'ChatGPT', 'OpenAI', 'LLM', 'GPT', 'transformer'];
                        const isAIRelated = aiKeywords.some(keyword => 
                            title.toLowerCase().includes(keyword.toLowerCase()) ||
                            description.toLowerCase().includes(keyword.toLowerCase())
                        );
                        
                        if (isAIRelated) {
                            contentResults.push({
                                title: title,
                                content: description,
                                summary: description.substring(0, 300) + '...',
                                url: link,
                                source: feed.source,
                                content_type: feed.type,
                                authors: [],
                                published_at: pubDate,
                                relevance_score: 0.7,
                                created_at: timestamp
                            });
                            itemCount++;
                        }
                    }
                }
                
                console.log(`Fetched ${itemCount} AI news items from ${feed.source}`);
            } catch (feedError) {
                console.error(`Error fetching ${feed.source}:`, feedError.message);
            }
        }

        // Save AI content to database
        if (contentResults.length > 0) {
            // Insert content in batches to avoid conflicts
            const batchSize = 10;
            let savedCount = 0;
            
            for (let i = 0; i < contentResults.length; i += batchSize) {
                const batch = contentResults.slice(i, i + batchSize);
                
                try {
                    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/ai_content`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(batch)
                    });

                    if (insertResponse.ok) {
                        savedCount += batch.length;
                        console.log(`Saved batch of ${batch.length} items`);
                    } else {
                        const errorText = await insertResponse.text();
                        console.error(`Failed to save batch:`, errorText);
                    }
                } catch (batchError) {
                    console.error('Error saving batch:', batchError.message);
                }
            }
            
            console.log(`Successfully saved ${savedCount} out of ${contentResults.length} content items`);
        }

        return new Response(JSON.stringify({
            data: {
                message: `Successfully aggregated ${contentResults.length} AI content items`,
                sources: {
                    arxiv: contentResults.filter(c => c.source === 'arxiv').length,
                    news: contentResults.filter(c => c.content_type === 'news').length
                },
                timestamp: timestamp
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI content aggregation error:', error);

        const errorResponse = {
            error: {
                code: 'AI_CONTENT_AGGREGATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});