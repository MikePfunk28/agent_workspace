-- Sample Prompt Templates for AI Hub
-- Run this in Supabase SQL Editor after authentication is set up

-- Insert sample prompt templates
INSERT INTO prompt_templates (name, description, template, variables, category, tags, is_public, user_id) VALUES
(
  'Code Review Assistant',
  'Analyze code for bugs, performance issues, and best practices',
  'Please review the following {{language}} code for:\n- Potential bugs\n- Performance issues\n- Code quality and best practices\n- Security vulnerabilities\n\nCode to review:\n```{{language}}\n{{code}}\n```\n\nProvide specific suggestions for improvement.',
  '[
    {"name": "language", "type": "select", "required": true, "description": "Programming language", "options": ["JavaScript", "Python", "Java", "C++", "TypeScript", "Go", "Rust"]},
    {"name": "code", "type": "textarea", "required": true, "description": "Code to review"}
  ]',
  'development',
  ARRAY['code', 'review', 'debugging', 'development'],
  true,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Research Paper Summarizer',
  'Generate concise summaries of research papers with key insights',
  'Please provide a comprehensive summary of this research paper:\n\nTitle: {{title}}\nAbstract: {{abstract}}\nFull Text: {{content}}\n\nPlease include:\n1. Main research question and hypothesis\n2. Key findings and results\n3. Methodology used\n4. Practical implications\n5. Limitations and future research directions\n\nKeep the summary concise but thorough.',
  '[
    {"name": "title", "type": "text", "required": true, "description": "Paper title"},
    {"name": "abstract", "type": "textarea", "required": true, "description": "Paper abstract"},
    {"name": "content", "type": "textarea", "required": false, "description": "Full paper content (optional)"}
  ]',
  'research',
  ARRAY['research', 'summary', 'academic', 'analysis'],
  true,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Business Proposal Generator',
  'Create compelling business proposals based on key requirements',
  'Create a professional business proposal for:\n\nProject: {{project_name}}\nClient: {{client_name}}\nBudget Range: {{budget}}\nTimeline: {{timeline}}\n\nRequirements:\n{{requirements}}\n\nPlease structure the proposal with:\n1. Executive Summary\n2. Project Scope and Objectives\n3. Methodology and Approach\n4. Timeline and Deliverables\n5. Investment and ROI\n6. Why Choose Us\n7. Next Steps\n\nMake it professional, persuasive, and client-focused.',
  '[
    {"name": "project_name", "type": "text", "required": true, "description": "Project name"},
    {"name": "client_name", "type": "text", "required": true, "description": "Client company name"},
    {"name": "budget", "type": "text", "required": true, "description": "Budget range"},
    {"name": "timeline", "type": "text", "required": true, "description": "Project timeline"},
    {"name": "requirements", "type": "textarea", "required": true, "description": "Project requirements and scope"}
  ]',
  'productivity',
  ARRAY['business', 'proposal', 'sales', 'professional'],
  true,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Creative Writing Prompt',
  'Generate creative stories based on themes and characters',
  'Write a {{genre}} story with the following elements:\n\nSetting: {{setting}}\nMain Character: {{character}}\nConflict: {{conflict}}\nTone: {{tone}}\n\nTarget length: {{length}} words\n\nPlease create an engaging narrative that:\n- Develops the character meaningfully\n- Builds tension around the conflict\n- Uses vivid, descriptive language\n- Has a satisfying resolution\n- Maintains the specified tone throughout\n\nFocus on showing rather than telling, and create emotional resonance with the reader.',
  '[
    {"name": "genre", "type": "select", "required": true, "description": "Story genre", "options": ["Fantasy", "Sci-Fi", "Mystery", "Romance", "Thriller", "Drama", "Adventure"]},
    {"name": "setting", "type": "text", "required": true, "description": "Where and when the story takes place"},
    {"name": "character", "type": "text", "required": true, "description": "Main character description"},
    {"name": "conflict", "type": "text", "required": true, "description": "Central conflict or challenge"},
    {"name": "tone", "type": "select", "required": true, "description": "Story tone", "options": ["Dark", "Humorous", "Mysterious", "Uplifting", "Melancholic", "Suspenseful"]},
    {"name": "length", "type": "select", "required": true, "description": "Target word count", "options": ["500", "1000", "1500", "2000"]}
  ]',
  'creative',
  ARRAY['writing', 'story', 'creative', 'fiction'],
  true,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Technical Documentation Writer',
  'Generate comprehensive technical documentation',
  'Create technical documentation for:\n\n{{doc_type}}: {{title}}\nTarget Audience: {{audience}}\nComplexity Level: {{complexity}}\n\nTechnical Details:\n{{details}}\n\nPlease create documentation that includes:\n1. Overview and purpose\n2. Prerequisites and requirements\n3. Step-by-step instructions\n4. Code examples (if applicable)\n5. Common issues and troubleshooting\n6. Best practices and tips\n7. Additional resources\n\nUse clear, concise language appropriate for {{audience}} with {{complexity}} complexity level.',
  '[
    {"name": "doc_type", "type": "select", "required": true, "description": "Documentation type", "options": ["API Documentation", "User Guide", "Installation Guide", "Tutorial", "Reference Manual", "Troubleshooting Guide"]},
    {"name": "title", "type": "text", "required": true, "description": "Documentation title"},
    {"name": "audience", "type": "select", "required": true, "description": "Target audience", "options": ["Developers", "End Users", "System Administrators", "Technical Writers", "Product Managers"]},
    {"name": "complexity", "type": "select", "required": true, "description": "Complexity level", "options": ["Beginner", "Intermediate", "Advanced", "Expert"]},
    {"name": "details", "type": "textarea", "required": true, "description": "Technical details and specifications"}
  ]',
  'productivity',
  ARRAY['documentation', 'technical', 'writing', 'guides'],
  true,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Data Analysis Insights',
  'Analyze data and provide actionable business insights',
  'Analyze this {{data_type}} data and provide business insights:\n\nDataset: {{dataset_name}}\nData Overview: {{data_overview}}\nBusiness Context: {{business_context}}\nKey Questions: {{questions}}\n\nRaw Data:\n{{data}}\n\nPlease provide:\n1. Data quality assessment\n2. Key patterns and trends identified\n3. Statistical insights and correlations\n4. Business implications\n5. Actionable recommendations\n6. Potential risks or concerns\n7. Suggested next steps for analysis\n\nFocus on practical insights that drive business decisions.',
  '[
    {"name": "data_type", "type": "select", "required": true, "description": "Type of data", "options": ["Sales Data", "Customer Data", "Financial Data", "Marketing Data", "Operational Data", "Survey Data", "Web Analytics"]},
    {"name": "dataset_name", "type": "text", "required": true, "description": "Dataset name or identifier"},
    {"name": "data_overview", "type": "textarea", "required": true, "description": "Brief overview of the data structure and size"},
    {"name": "business_context", "type": "textarea", "required": true, "description": "Business context and objectives"},
    {"name": "questions", "type": "textarea", "required": true, "description": "Key business questions to answer"},
    {"name": "data", "type": "textarea", "required": true, "description": "Raw data or data summary"}
  ]',
  'analysis',
  ARRAY['data', 'analysis', 'insights', 'business', 'statistics'],
  true,
  '00000000-0000-0000-0000-000000000000'
);

-- Update usage counts to make them look realistic
UPDATE prompt_templates SET usage_count = floor(random() * 50 + 10) WHERE is_public = true;