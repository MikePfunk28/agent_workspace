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

        const timestamp = new Date().toISOString();
        const today = new Date().toISOString().split('T')[0];
        
        console.log('Starting daily newsletter generation...');

        // Fetch recent AI content (last 24 hours)
        const contentResponse = await fetch(`${supabaseUrl}/rest/v1/ai_content?select=*&created_at=gte.${today}T00:00:00Z&order=created_at.desc&limit=10`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let recentContent = [];
        if (contentResponse.ok) {
            recentContent = await contentResponse.json();
        }

        // Fetch latest stock data for AI companies
        const stockResponse = await fetch(`${supabaseUrl}/rest/v1/stock_data?select=*&timestamp=gte.${today}T00:00:00Z&order=timestamp.desc&limit=10`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let stockData = [];
        if (stockResponse.ok) {
            stockData = await stockResponse.json();
        }

        // Fetch upcoming hackathons
        const hackathonResponse = await fetch(`${supabaseUrl}/rest/v1/hackathons?select=*&start_date=gte.${today}&order=start_date.asc&limit=5`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let hackathons = [];
        if (hackathonResponse.ok) {
            hackathons = await hackathonResponse.json();
        }

        // Generate newsletter content
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        };

        const formatPrice = (price, changePercent) => {
            const change = changePercent >= 0 ? '+' : '';
            const changeColor = changePercent >= 0 ? '#10b981' : '#ef4444';
            return `$${price} (${change}${changePercent}%)`;
        };

        // Create newsletter HTML content
        const newsletterTitle = `Daily AI Intelligence Report - ${formatDate(timestamp)}`;
        
        const newsletterContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${newsletterTitle}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 30px; }
        .section { margin-bottom: 40px; }
        .section-title { font-size: 22px; font-weight: 700; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .item { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 15px; border-radius: 8px; }
        .item-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px; }
        .item-meta { font-size: 14px; color: #6b7280; margin-bottom: 10px; }
        .item-description { color: #374151; }
        .stock-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stock-item { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; }
        .stock-symbol { font-weight: 700; font-size: 16px; color: #1e293b; }
        .stock-price { font-size: 18px; font-weight: 600; margin: 5px 0; }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        .link { color: #3b82f6; text-decoration: none; }
        .link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Daily AI Intelligence</h1>
            <p>Your personalized briefing on AI research, market trends, and opportunities</p>
        </div>
        
        <div class="content">
            <!-- Market Overview Section -->
            <div class="section">
                <div class="section-title">📈 AI/Tech Stock Market Overview</div>
                <div class="stock-grid">
                    ${stockData.slice(0, 6).map(stock => `
                        <div class="stock-item">
                            <div class="stock-symbol">${stock.symbol}</div>
                            <div class="stock-price ${stock.change_percent >= 0 ? 'positive' : 'negative'}">
                                ${formatPrice(stock.price, stock.change_percent)}
                            </div>
                            <div style="font-size: 12px; color: #64748b;">${stock.company_name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- AI Research Section -->
            <div class="section">
                <div class="section-title">🔬 Latest AI Research & Papers</div>
                ${recentContent.filter(c => c.content_type === 'paper').slice(0, 3).map(paper => `
                    <div class="item">
                        <div class="item-title">${paper.title}</div>
                        <div class="item-meta">Source: ${paper.source.toUpperCase()} | Authors: ${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ' et al.' : ''}</div>
                        <div class="item-description">${paper.summary}</div>
                        <a href="${paper.url}" class="link">Read Paper →</a>
                    </div>
                `).join('')}
            </div>

            <!-- AI News Section -->
            <div class="section">
                <div class="section-title">📰 AI Industry News</div>
                ${recentContent.filter(c => c.content_type === 'news').slice(0, 4).map(news => `
                    <div class="item">
                        <div class="item-title">${news.title}</div>
                        <div class="item-meta">Source: ${news.source} | Published: ${new Date(news.published_at).toLocaleDateString()}</div>
                        <div class="item-description">${news.summary}</div>
                        <a href="${news.url}" class="link">Read Article →</a>
                    </div>
                `).join('')}
            </div>

            <!-- Hackathons Section -->
            <div class="section">
                <div class="section-title">🏆 Upcoming AI Hackathons</div>
                ${hackathons.slice(0, 3).map(hackathon => `
                    <div class="item">
                        <div class="item-title">${hackathon.name}</div>
                        <div class="item-meta">${hackathon.platform.toUpperCase()} | ${formatDate(hackathon.start_date)} - ${formatDate(hackathon.end_date)} | Prize: $${hackathon.prize_amount?.toLocaleString() || 'TBD'}</div>
                        <div class="item-description">${hackathon.description}</div>
                        <a href="${hackathon.url}" class="link">Learn More →</a>
                    </div>
                `).join('')}
            </div>

            <!-- Quick Stats -->
            <div class="section">
                <div class="section-title">📊 Daily Highlights</div>
                <div class="item">
                    <div class="item-description">
                        <strong>📄 New Papers:</strong> ${recentContent.filter(c => c.content_type === 'paper').length}<br>
                        <strong>📰 News Articles:</strong> ${recentContent.filter(c => c.content_type === 'news').length}<br>
                        <strong>🏆 Active Hackathons:</strong> ${hackathons.length}<br>
                        <strong>📈 Best Performing Stock:</strong> ${stockData.length > 0 ? stockData.reduce((best, current) => current.change_percent > best.change_percent ? current : best).symbol : 'N/A'}<br>
                        <strong>🎯 Market Sentiment:</strong> ${stockData.length > 0 && stockData.filter(s => s.change_percent > 0).length > stockData.length / 2 ? 'Bullish 🐂' : 'Bearish 🐻'}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated on ${formatDate(timestamp)} | AI Hub Intelligence Platform</p>
            <p>This is an automated newsletter. Reply with feedback to help us improve.</p>
        </div>
    </div>
</body>
</html>`;

        // Fetch all users to generate personalized newsletters
        const usersResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=id,email,full_name,preferences`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let users = [];
        if (usersResponse.ok) {
            users = await usersResponse.json();
        }

        // Generate newsletters for each user
        const newsletters = [];
        for (const user of users) {
            try {
                const newsletter = {
                    user_id: user.id,
                    type: 'daily',
                    title: newsletterTitle,
                    content: newsletterContent,
                    generated_at: timestamp,
                    sent_at: null,
                    is_personalized: true
                };

                newsletters.push(newsletter);
            } catch (userError) {
                console.error(`Error generating newsletter for user ${user.id}:`, userError.message);
            }
        }

        // Save newsletters to database
        if (newsletters.length > 0) {
            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/newsletters`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(newsletters)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                console.error('Failed to save newsletters:', errorText);
                throw new Error(`Failed to save newsletters: ${errorText}`);
            }

            console.log(`Successfully generated ${newsletters.length} daily newsletters`);
        }

        return new Response(JSON.stringify({
            data: {
                message: `Successfully generated ${newsletters.length} daily newsletters`,
                stats: {
                    papers: recentContent.filter(c => c.content_type === 'paper').length,
                    news: recentContent.filter(c => c.content_type === 'news').length,
                    stocks: stockData.length,
                    hackathons: hackathons.length,
                    users: users.length
                },
                timestamp: timestamp
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Daily newsletter generation error:', error);

        const errorResponse = {
            error: {
                code: 'NEWSLETTER_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});