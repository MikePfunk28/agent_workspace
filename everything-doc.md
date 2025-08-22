ok so this is my app, and AI-Hub, and we have some features, but they are not fully fleshed out or implemented, and I have supabase setup but we need to define the workflow, I should  │
│    be able to add sources from URL, from download, or whatever.  I should be able to customize the dash, the metrics, add metrics, add categories, like prompts, or workflows, or          │
│    projects, and have it load status and metadata and whatever about the repository, and if it is working, active, and info about it.  I want it to know what I am working on and even get │
│     schedule tasks from openai and incorporate that, it needs to be super easy to add to openAI custom gpts, and the actions section, or use our own MCP to handle not only internal       │
│    communications, metrics and such, but also have one or this one handle integrating ai model, other applications, or whatever.  However, make the normal actions, and I imagine I would  │
│    have to add, forgot my password, and I am not sure about payment or pricing as of now.  However make the functionality we have built in UI, and the 13 tables, in supabase and have     │
│    these workflow working. so adding, deleting, modifying, whatever other functionalities we need.  Once we have it all working, so I can use the buttons and click and drag etc, we will  │
│    all customization, filtering, sorting of the AI categories, and even inside each category.  Let me know if you have any questions.  Remember check /docs /code /data /memory /sub_taks  │
│    /imgs /extract and such and make sure you know everything and is working, and you can look at design docs and research and everything.

sorry yes you continue from where you left off I just wanted to add one thing, make sure there is a way to look up, find, create reminders for, etc for hackathons, current, and      │
│    coming up, and you can search now and add them, but we should have the mcp there and the ability to use a local ai model to do a search.  It should be able to probably connect to    │
│    ollama, lmstudio, llama.cpp, or better yet, have the ability, within the browser, to open a browser for auth for gemini cli and qwen cli, as you should be able to use those for free │
│     for everything that is needed.  Try to guide them as much as poossible, making it as easy as possible to use qwen, gemini, or really any cli tool as if it is just a terminal        │
│    itself, or has it inside it, which then can connect, but the workspace can interact with even though it is in the cli, so we wrap it, then it can even display this in our own window │
│     to keep it looking smooth and such.  If they have a local model then it should be able to connect to that and detect it, but it should be just as easy to connect to the others.  As │
│     if it inherits your cli and settings then it would work from cli, but maybe we handle the UI over it.  However we need to get all the basic, and any feature that it needs to be     │
│    able to do or makes it seamless, better, streamlined, or whatever that makes the interaction more intuitive and intelligent.

but also do those, starting with hackathon after we implement the basic functionality for all the features that are built, like the buttons do not work, this is  │
│    basically the mockup, now we need the functionality added.  All the basic, and any obvious, then even advanced that will enhance the experience and seamlessness, and usability, etc.  │
│     From there then work on the hackathon and 1. First, I'll enhance the hackathon functionality to allow users to search, find, and create reminders for hackathons                      │
│       2. Then I'll implement AI model integration capabilities (Ollama, LM Studio, Qwen CLI, etc.)                                                                                        │
│       3. Finally, I'll enhance the UI to make all features more intuitive and user-friendly  ------------- and then these, but we need to make all the internal working.  The AI model    │
│    you should 100% make sure it can do a bunch of workflows we define, analysis, getting the latest results off the internet, searching my local files, academic papers, etc and such,    │
│    use mcp server to implement it, store as much locally as possible, esp if youre loading work or searching for AI related material on their machine then categorize it for them, and    │
│    essentially giving insights and interact with all the AI subjects in different areas, creating a single pane of glass view and infographics or actual knowledge graphs, and be able to │
│     analyze the inner workings of your ai workflows, or running instances, and even be able to implement analysis and update the memory bank or cache and file list our codebase is       │
│    using, so we can fix it outside the editor, and transparent view, metrics, categorize, and even use the data we have locally or inside the hub and get questions answered, be able to  │
│    tell which AI tool or model worked the best for you.  Again this is AFTER you implement every intuitive and basic feature and such, then move to the hackathon and those 3 and then    │
│    anything I mentioned here.  Again continue where you left off

also I thought having a feature to explain the research papers for you or summarize them.  Again accuracy needs to be important here.  So maybe we copy paragraph by paragraph and get answers each paragraph and then put it together for the model, then we can mark them read.  Now I added a file at the root which is              │
│   everything I have said, everything-doc.md,

## Supabase PAT for MCP or whatever
AI-Hub

sbp_c8c13f054577426e5a5fba06abe5c3bbd7863c6d
sbp_c8c13f054577426e5a5fba06abe5c3bbd7863c6d

I did not run the sql for vector creation yet.  This is an agent research hub where you can do everything we have added with biomedical agent, human gene, or many agents, that you can build, string together or use the predefined workflows defined as hugging face pipelines using chatml for templates with a system prompt and an assistant, and other configurations already done, and will use a local model inside the app using koboldcpp or llama.cpp to run it inside, then connect to larger for more complex tasks.  Also the ability to use the agents and workflows anywhere, on any platform, with any model, so if we need to have an integration or wrapper layer do so.  It has all the features currently install, with special workflows designed like the cytosolve algorithm, using RAG to get the data.  The ability to get data from anywhere and run operations on it, we can use this paper and define protocols for multiple agent async on the same project without causing issues because of the comm protocol, and we should use the mcp-agent and mcp-inspector to do so, even the gmail mcp.  Break things down into subtasks until you have a confidence level above 95% on implementing it.  I would also love to be able to upload a paper, and have a Classifier agent that will classify the prompt, paper, video, text, whatever, and then a orchestrator agent that assigns you to the best agent for the job.

well we would need to use https://arxiv.org/html/2505.02279v1 this paper and maybe these protocols for agent communication and to communicate with agents running at the same time or even agents running elsewhere, models.
