import asyncio
import concurrent.futures
from external_api.data_sources.client import get_client

async def search_scholar_papers():
    """Search for academic papers on newsletter systems and AI content curation."""
    client = get_client()
    
    # Define search queries for different aspects
    search_tasks = [
        client.scholar.search_scholar(
            query="automated content curation AI newsletter systems",
            num_results=20,
            start_year="2020",
            end_year="2025"
        ),
        client.scholar.search_scholar(
            query="personalized recommendation systems content filtering",
            num_results=20,
            start_year="2020",
            end_year="2025"
        ),
        client.scholar.search_scholar(
            query="automated report generation machine learning",
            num_results=20,
            start_year="2020",
            end_year="2025"
        ),
        client.scholar.search_scholar(
            query="financial data visualization real-time analytics",
            num_results=20,
            start_year="2020",
            end_year="2025"
        ),
        client.scholar.search_scholar(
            query="content aggregation news summarization NLP",
            num_results=20,
            start_year="2020",
            end_year="2025"
        )
    ]
    
    # Execute all searches concurrently
    results = await asyncio.gather(*search_tasks)
    
    return {
        "content_curation": results[0],
        "recommendation_systems": results[1],
        "automated_reporting": results[2],
        "financial_visualization": results[3],
        "content_aggregation": results[4]
    }

def run_async_with_thread_pool():
    """Execute async scholar searches using thread pool."""
    with concurrent.futures.ThreadPoolExecutor() as executor:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            results = loop.run_until_complete(search_scholar_papers())
            return results
        finally:
            loop.close()

if __name__ == "__main__":
    # Run the scholar searches
    scholar_results = run_async_with_thread_pool()
    
    # Save results to file
    import json
    
    with open('/workspace/data/scholar_research_results.json', 'w') as f:
        json.dump(scholar_results, f, indent=2)
    
    # Print summary
    for category, results in scholar_results.items():
        if results.get('success'):
            paper_count = len(results.get('data', {}).get('papers', []))
            print(f"{category}: Found {paper_count} papers")
        else:
            print(f"{category}: Search failed - {results.get('error', 'Unknown error')}")
