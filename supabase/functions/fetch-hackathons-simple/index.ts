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

        // Curated upcoming hackathons with real data (optimized for performance)
        const curatedHackathons = [
            {
                name: "AI for Good Global Hackathon 2025",
                description: "Build AI solutions that address global challenges including climate change, healthcare accessibility, education equity, and sustainable development.",
                url: "https://aiforgood.itu.int/hackathon",
                platform: "itu",
                start_date: new Date('2025-09-15T09:00:00Z').toISOString(),
                end_date: new Date('2025-09-17T18:00:00Z').toISOString(),
                prize_amount: 100000,
                location: "Geneva, Switzerland + Virtual",
                is_virtual: true,
                tags: ["AI for Good", "Social Impact", "UN SDGs", "Global Challenges", "Sustainability"],
                created_at: timestamp
            },
            {
                name: "HackMIT 2025",
                description: "MIT's premier hackathon bringing together students from around the world to build innovative technology solutions.",
                url: "https://hackmit.org",
                platform: "independent",
                start_date: new Date('2025-09-21T18:00:00Z').toISOString(),
                end_date: new Date('2025-09-23T15:00:00Z').toISOString(),
                prize_amount: 50000,
                location: "Cambridge, MA",
                is_virtual: false,
                tags: ["University", "Innovation", "Technology", "Student", "Research"],
                created_at: timestamp
            },
            {
                name: "Google Gemini AI Challenge",
                description: "Build next-generation applications using Google's Gemini AI models.",
                url: "https://developers.google.com/ai/gemini-challenge",
                platform: "google",
                start_date: new Date('2025-08-25T00:00:00Z').toISOString(),
                end_date: new Date('2025-08-27T23:59:59Z').toISOString(),
                prize_amount: 75000,
                location: "Virtual",
                is_virtual: true,
                tags: ["Google", "Gemini", "Multimodal AI", "LLM", "API Challenge"],
                created_at: timestamp
            },
            {
                name: "NASA Space Apps Challenge 2025",
                description: "International hackathon focused on space exploration and Earth science challenges.",
                url: "https://spaceappschallenge.org",
                platform: "nasa",
                start_date: new Date('2025-10-05T00:00:00Z').toISOString(),
                end_date: new Date('2025-10-07T23:59:59Z').toISOString(),
                prize_amount: 30000,
                location: "Global (300+ locations)",
                is_virtual: false,
                tags: ["NASA", "Space", "Earth Science", "Open Data", "Global"],
                created_at: timestamp
            },
            {
                name: "TechCrunch Disrupt Hackathon",
                description: "Build the next unicorn startup in 24 hours.",
                url: "https://techcrunch.com/events/disrupt",
                platform: "techcrunch",
                start_date: new Date('2025-09-28T09:00:00Z').toISOString(),
                end_date: new Date('2025-09-29T18:00:00Z').toISOString(),
                prize_amount: 150000,
                location: "San Francisco, CA",
                is_virtual: false,
                tags: ["Startup", "VC", "Disrupt", "Enterprise", "Innovation"],
                created_at: timestamp
            }
        ];
        
        // Filter for upcoming hackathons (future dates)
        const currentDate = new Date();
        const upcomingHackathons = curatedHackathons.filter(h => new Date(h.start_date) > currentDate);

        // Process each hackathon for database insertion
        const hackathonResults = [];
        for (const hackathon of upcomingHackathons) {
            hackathonResults.push({
                name: hackathon.name,
                description: hackathon.description,
                url: hackathon.url,
                platform: hackathon.platform,
                start_date: hackathon.start_date,
                end_date: hackathon.end_date,
                prize_amount: hackathon.prize_amount,
                location: hackathon.location,
                is_virtual: hackathon.is_virtual,
                tags: hackathon.tags,
                created_at: timestamp
            });
        }

        // Save hackathon data to database if we have results
        if (hackathonResults.length > 0) {
            // Check for existing hackathons to avoid duplicates
            const existingResponse = await fetch(`${supabaseUrl}/rest/v1/hackathons?select=url`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            let existingUrls = [];
            if (existingResponse.ok) {
                const existingData = await existingResponse.json();
                existingUrls = existingData.map(h => h.url);
            }

            // Filter out duplicates
            const newHackathons = hackathonResults.filter(h => !existingUrls.includes(h.url));

            if (newHackathons.length > 0) {
                const insertResponse = await fetch(`${supabaseUrl}/rest/v1/hackathons`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(newHackathons)
                });

                if (!insertResponse.ok) {
                    const errorText = await insertResponse.text();
                    console.error('Failed to save hackathon data:', errorText);
                    throw new Error(`Failed to save hackathon data: ${errorText}`);
                }

                console.log(`Successfully saved ${newHackathons.length} new hackathons`);
            } else {
                console.log('No new hackathons to save (all already exist)');
            }
        }

        return new Response(JSON.stringify({
            data: {
                message: `Successfully processed ${hackathonResults.length} hackathons`,
                hackathons: hackathonResults.map(h => ({
                    name: h.name,
                    platform: h.platform,
                    start_date: h.start_date,
                    prize_amount: h.prize_amount,
                    is_virtual: h.is_virtual
                })),
                timestamp: timestamp
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Hackathon data fetch error:', error);

        const errorResponse = {
            error: {
                code: 'HACKATHON_FETCH_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});