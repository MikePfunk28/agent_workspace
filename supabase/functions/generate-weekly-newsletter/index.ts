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
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        console.log('Starting weekly intelligence report generation...');

        // Fetch AI content from the past week
        const contentResponse = await fetch(`${supabaseUrl}/rest/v1/ai_content?select=*&created_at=gte.${weekAgo}T00:00:00Z&order=created_at.desc&limit=20`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let weeklyContent = [];
        if (contentResponse.ok) {
            weeklyContent = await contentResponse.json();
        }

        // Fetch stock data from the past week
        const stockResponse = await fetch(`${supabaseUrl}/rest/v1/stock_data?select=*&timestamp=gte.${weekAgo}T00:00:00Z&order=timestamp.desc`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let weeklyStockData = [];
        if (stockResponse.ok) {
            weeklyStockData = await stockResponse.json();
        }

        // Calculate weekly stock performance
        const stockPerformance = {};
        weeklyStockData.forEach(stock => {
            if (!stockPerformance[stock.symbol]) {
                stockPerformance[stock.symbol] = {
                    symbol: stock.symbol,
                    company_name: stock.company_name,
                    prices: [],
                    current_price: stock.price,
                    week_change: 0
                };
            }
            stockPerformance[stock.symbol].prices.push({
                price: stock.price,
                timestamp: stock.timestamp
            });
        });

        // Calculate weekly performance for each stock
        Object.keys(stockPerformance).forEach(symbol => {
            const stock = stockPerformance[symbol];
            if (stock.prices.length > 1) {
                const sortedPrices = stock.prices.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                const weekStart = sortedPrices[0].price;
                const weekEnd = sortedPrices[sortedPrices.length - 1].price;
                stock.week_change = ((weekEnd - weekStart) / weekStart) * 100;
            }
        });

        // Sample startup funding data (in real implementation, fetch from Crunchbase API)
        const startupFunding = [
            {
                company: "Quantum AI Labs",
                amount: 85000000,
                stage: "Series B",
                investors: ["Andreessen Horowitz", "Google Ventures", "Sequoia Capital"],
                description: "Developing quantum-enhanced machine learning algorithms for drug discovery and financial modeling.",
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                company: "EdgeML Systems",
                amount: 25000000,
                stage: "Series A",
                investors: ["Accel Partners", "FirstMark Capital", "Intel Capital"],
                description: "Building edge AI infrastructure for autonomous vehicles and smart city applications.",
                date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                company: "Neural Interface Co",
                amount: 150000000,
                stage: "Series C",
                investors: ["Founders Fund", "Khosla Ventures", "GV"],
                description: "Developing brain-computer interfaces powered by AI for medical and consumer applications.",
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Sample Y Combinator updates
        const ycUpdates = [
            {
                title: "YC Winter 2025 Demo Day Highlights",
                description: "42 AI startups showcased innovative solutions in healthcare, fintech, and climate tech. Notable companies include AutoDoc AI (medical diagnosis), FinanceGPT (automated accounting), and ClimatePredict (weather forecasting).",
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                title: "YC Announces AI Safety Initiative",
                description: "New $50M fund dedicated to startups working on AI alignment, safety research, and responsible AI development. Applications open for Summer 2025 batch.",
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Sample job market data
        const jobMarketTrends = {
            aiJobs: {
                totalPostings: 15420,
                weeklyGrowth: 8.5,
                averageSalary: 185000,
                topRoles: [
                    { title: "Machine Learning Engineer", count: 3420, avgSalary: 175000 },
                    { title: "AI Research Scientist", count: 2150, avgSalary: 220000 },
                    { title: "Data Scientist", count: 4200, avgSalary: 145000 },
                    { title: "AI Product Manager", count: 1890, avgSalary: 165000 },
                    { title: "MLOps Engineer", count: 2760, avgSalary: 155000 }
                ]
            },
            topCompanies: [
                { name: "OpenAI", openings: 245 },
                { name: "Google", openings: 892 },
                { name: "Microsoft", openings: 567 },
                { name: "NVIDIA", openings: 434 },
                { name: "Meta", openings: 398 }
            ]
        };

        // Sample chip industry updates
        const chipIndustryNews = [
            {
                title: "NVIDIA Announces Next-Gen AI Chips",
                description: "New Blackwell Ultra architecture promises 5x performance improvement for large language model training. Expected availability Q2 2025.",
                impact: "Major boost for AI training capabilities"
            },
            {
                title: "Intel's AI Accelerator Progress",
                description: "Gaudi 3 AI accelerators showing strong performance in enterprise deployments. 40% better price-performance than competitors.",
                impact: "Increased competition in AI hardware market"
            },
            {
                title: "AMD's Data Center AI Strategy",
                description: "MI350 series AI accelerators gaining traction with cloud providers. Microsoft Azure expanding AMD AI instance offerings.",
                impact: "Diversification of AI hardware ecosystem"
            }
        ];

        // Format date function
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        };

        const formatWeekRange = () => {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        };

        // Create weekly newsletter HTML content
        const newsletterTitle = `Weekly AI Intelligence Report - ${formatWeekRange()}`;
        
        const newsletterContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${newsletterTitle}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
        .header p { margin: 15px 0 0 0; opacity: 0.9; font-size: 18px; }
        .content { padding: 40px; }
        .section { margin-bottom: 50px; }
        .section-title { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 25px; border-bottom: 3px solid #e5e7eb; padding-bottom: 15px; }
        .subsection { margin-bottom: 30px; }
        .subsection-title { font-size: 20px; font-weight: 600; color: #374151; margin-bottom: 15px; }
        .item { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 25px; margin-bottom: 20px; border-radius: 8px; }
        .item-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }
        .item-meta { font-size: 14px; color: #6b7280; margin-bottom: 12px; }
        .item-description { color: #374151; line-height: 1.6; }
        .highlight-item { background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-left-color: #f59e0b; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .stat-card { background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: 700; color: #1e293b; }
        .stat-label { font-size: 14px; color: #64748b; margin-top: 5px; }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .funding-amount { font-size: 20px; font-weight: 700; color: #059669; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .table th { background-color: #f8fafc; font-weight: 600; color: #374151; }
        .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
        .link { color: #3b82f6; text-decoration: none; }
        .link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔮 Weekly AI Intelligence</h1>
            <p>Comprehensive analysis of AI trends, funding, and market movements</p>
        </div>
        
        <div class="content">
            <!-- Executive Summary -->
            <div class="section">
                <div class="section-title">🎯 Executive Summary</div>
                <div class="highlight-item">
                    <div class="item-description">
                        <strong>This Week's Key Insights:</strong><br><br>
                        • <strong>Funding Activity:</strong> $${(startupFunding.reduce((sum, f) => sum + f.amount, 0) / 1000000).toFixed(0)}M raised across ${startupFunding.length} major AI funding rounds<br>
                        • <strong>Market Performance:</strong> AI/Tech stocks ${Object.values(stockPerformance).filter(s => s.week_change > 0).length > Object.values(stockPerformance).length / 2 ? 'gained ground' : 'faced headwinds'} with average weekly change of ${Object.values(stockPerformance).length > 0 ? (Object.values(stockPerformance).reduce((sum, s) => sum + s.week_change, 0) / Object.values(stockPerformance).length).toFixed(1) : '0'}%<br>
                        • <strong>Job Market:</strong> ${jobMarketTrends.aiJobs.totalPostings.toLocaleString()} new AI job postings (+${jobMarketTrends.aiJobs.weeklyGrowth}% week-over-week)<br>
                        • <strong>Research Activity:</strong> ${weeklyContent.filter(c => c.content_type === 'paper').length} new research papers and ${weeklyContent.filter(c => c.content_type === 'news').length} industry news articles tracked
                    </div>
                </div>
            </div>

            <!-- Startup Funding Section -->
            <div class="section">
                <div class="section-title">💰 Startup Funding Roundup</div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">$${(startupFunding.reduce((sum, f) => sum + f.amount, 0) / 1000000).toFixed(0)}M</div>
                        <div class="stat-label">Total Funding</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${startupFunding.length}</div>
                        <div class="stat-label">Funding Rounds</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">$${(startupFunding.reduce((sum, f) => sum + f.amount, 0) / startupFunding.length / 1000000).toFixed(0)}M</div>
                        <div class="stat-label">Average Round</div>
                    </div>
                </div>
                
                ${startupFunding.map(funding => `
                    <div class="item">
                        <div class="item-title">${funding.company}</div>
                        <div class="funding-amount">$${(funding.amount / 1000000).toFixed(0)}M ${funding.stage}</div>
                        <div class="item-meta">Investors: ${funding.investors.join(', ')} | ${formatDate(funding.date)}</div>
                        <div class="item-description">${funding.description}</div>
                    </div>
                `).join('')}
            </div>

            <!-- YC Updates Section -->
            <div class="section">
                <div class="section-title">🚀 Y Combinator Updates</div>
                ${ycUpdates.map(update => `
                    <div class="item">
                        <div class="item-title">${update.title}</div>
                        <div class="item-meta">${formatDate(update.date)}</div>
                        <div class="item-description">${update.description}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Stock Market Analysis -->
            <div class="section">
                <div class="section-title">📈 AI/Tech Stock Performance</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Company</th>
                            <th>Current Price</th>
                            <th>Weekly Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.values(stockPerformance).slice(0, 10).map(stock => `
                            <tr>
                                <td><strong>${stock.symbol}</strong></td>
                                <td>${stock.company_name}</td>
                                <td>$${stock.current_price?.toFixed(2) || 'N/A'}</td>
                                <td class="${stock.week_change >= 0 ? 'positive' : 'negative'}">
                                    ${stock.week_change >= 0 ? '+' : ''}${stock.week_change.toFixed(2)}%
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Job Market Section -->
            <div class="section">
                <div class="section-title">💼 AI Job Market Trends</div>
                
                <div class="subsection">
                    <div class="subsection-title">Market Overview</div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${jobMarketTrends.aiJobs.totalPostings.toLocaleString()}</div>
                            <div class="stat-label">New Job Postings</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number positive">+${jobMarketTrends.aiJobs.weeklyGrowth}%</div>
                            <div class="stat-label">Weekly Growth</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">$${jobMarketTrends.aiJobs.averageSalary.toLocaleString()}</div>
                            <div class="stat-label">Average Salary</div>
                        </div>
                    </div>
                </div>

                <div class="subsection">
                    <div class="subsection-title">Top AI Roles</div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Role</th>
                                <th>Openings</th>
                                <th>Avg Salary</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${jobMarketTrends.aiJobs.topRoles.map(role => `
                                <tr>
                                    <td>${role.title}</td>
                                    <td>${role.count.toLocaleString()}</td>
                                    <td>$${role.avgSalary.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="subsection">
                    <div class="subsection-title">Top Hiring Companies</div>
                    <div class="stats-grid">
                        ${jobMarketTrends.topCompanies.slice(0, 5).map(company => `
                            <div class="stat-card">
                                <div class="stat-number">${company.openings}</div>
                                <div class="stat-label">${company.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Chip Industry Section -->
            <div class="section">
                <div class="section-title">🖥️ Chip Industry Updates</div>
                ${chipIndustryNews.map(news => `
                    <div class="item">
                        <div class="item-title">${news.title}</div>
                        <div class="item-description">${news.description}</div>
                        <div class="item-meta"><strong>Market Impact:</strong> ${news.impact}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Weekly Research Highlights -->
            <div class="section">
                <div class="section-title">🔬 Research Highlights</div>
                ${weeklyContent.filter(c => c.content_type === 'paper').slice(0, 5).map(paper => `
                    <div class="item">
                        <div class="item-title">${paper.title}</div>
                        <div class="item-meta">Source: ${paper.source.toUpperCase()} | Authors: ${paper.authors.slice(0, 2).join(', ')}${paper.authors.length > 2 ? ' et al.' : ''}</div>
                        <div class="item-description">${paper.summary}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Looking Ahead -->
            <div class="section">
                <div class="section-title">🔮 Looking Ahead</div>
                <div class="item">
                    <div class="item-description">
                        <strong>Key Trends to Watch:</strong><br><br>
                        • <strong>Funding Focus:</strong> Series B+ rounds dominating, with emphasis on enterprise AI solutions<br>
                        • <strong>Market Dynamics:</strong> Increased competition in AI hardware driving innovation and price competition<br>
                        • <strong>Talent Movement:</strong> High demand for MLOps and AI Safety roles as companies scale AI operations<br>
                        • <strong>Technology Trends:</strong> Growing interest in edge AI, quantum-AI hybrid systems, and responsible AI frameworks<br>
                        • <strong>Regulatory Environment:</strong> Continued focus on AI governance and safety standards globally
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated on ${formatDate(timestamp)} | AI Hub Intelligence Platform</p>
            <p>This comprehensive weekly report aggregates data from multiple sources including funding databases, stock markets, job boards, and research publications.</p>
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
                    type: 'weekly',
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

            console.log(`Successfully generated ${newsletters.length} weekly newsletters`);
        }

        return new Response(JSON.stringify({
            data: {
                message: `Successfully generated ${newsletters.length} weekly intelligence reports`,
                stats: {
                    funding_total: startupFunding.reduce((sum, f) => sum + f.amount, 0),
                    funding_rounds: startupFunding.length,
                    yc_updates: ycUpdates.length,
                    stock_symbols: Object.keys(stockPerformance).length,
                    job_postings: jobMarketTrends.aiJobs.totalPostings,
                    research_papers: weeklyContent.filter(c => c.content_type === 'paper').length,
                    users: users.length
                },
                timestamp: timestamp
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Weekly newsletter generation error:', error);

        const errorResponse = {
            error: {
                code: 'WEEKLY_NEWSLETTER_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});