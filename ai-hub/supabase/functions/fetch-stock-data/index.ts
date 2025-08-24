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

        // AI/Tech company stock symbols to track
        const stockSymbols = [
            'NVDA',   // NVIDIA
            'GOOGL',  // Google/Alphabet
            'MSFT',   // Microsoft
            'AAPL',   // Apple
            'TSLA',   // Tesla
            'META',   // Meta/Facebook
            'AMZN',   // Amazon
            'NFLX',   // Netflix
            'AMD',    // Advanced Micro Devices
            'INTC',   // Intel
            'CRM',    // Salesforce
            'ORCL',   // Oracle
            'IBM',    // IBM
            'NOW',    // ServiceNow
            'ADBE',   // Adobe
            'SNOW',   // Snowflake
            'PLTR',   // Palantir
            'AI',     // C3.ai
            'UPST',   // Upstart
            'PATH'    // UiPath
        ];

        const stockDataResults = [];
        const timestamp = new Date().toISOString();

        // Fetch stock data for each symbol using Yahoo Finance API
        for (const symbol of stockSymbols) {
            try {
                // Using Yahoo Finance API (free tier)
                const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
                
                if (!response.ok) {
                    console.log(`Failed to fetch data for ${symbol}: ${response.status}`);
                    continue;
                }

                const data = await response.json();
                const result = data.chart?.result?.[0];
                
                if (!result) {
                    console.log(`No data available for ${symbol}`);
                    continue;
                }

                const meta = result.meta;
                const quote = result.indicators?.quote?.[0];
                
                if (!meta || !quote) {
                    console.log(`Invalid data structure for ${symbol}`);
                    continue;
                }

                const currentPrice = meta.regularMarketPrice;
                const previousClose = meta.previousClose || meta.chartPreviousClose;
                const changePercent = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
                const volume = quote.volume?.[quote.volume.length - 1] || 0;
                const marketCap = meta.marketCap || 0;

                const stockData = {
                    symbol: symbol,
                    company_name: meta.longName || meta.symbol,
                    price: parseFloat(currentPrice?.toFixed(2) || '0'),
                    change_percent: parseFloat(changePercent.toFixed(2)),
                    volume: parseInt(volume.toString()),
                    market_cap: parseInt(marketCap.toString()),
                    sector: 'technology',
                    is_ai_related: true,
                    timestamp: timestamp
                };

                stockDataResults.push(stockData);
                console.log(`Successfully fetched data for ${symbol}: $${currentPrice}`);

            } catch (symbolError) {
                console.error(`Error fetching data for ${symbol}:`, symbolError.message);
                continue;
            }
        }

        // Save stock data to database
        if (stockDataResults.length > 0) {
            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/stock_data`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(stockDataResults)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                console.error('Failed to save stock data:', errorText);
                throw new Error(`Failed to save stock data: ${errorText}`);
            }

            console.log(`Successfully saved ${stockDataResults.length} stock records`);
        }

        return new Response(JSON.stringify({
            data: {
                message: `Successfully fetched and saved ${stockDataResults.length} stock records`,
                symbols: stockDataResults.map(s => `${s.symbol}: $${s.price} (${s.change_percent > 0 ? '+' : ''}${s.change_percent}%)`),
                timestamp: timestamp
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Stock data fetch error:', error);

        const errorResponse = {
            error: {
                code: 'STOCK_DATA_FETCH_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});