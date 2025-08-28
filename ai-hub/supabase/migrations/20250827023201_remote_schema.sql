drop trigger if exists "update_adaptive_templates_updated_at" on "public"."adaptive_templates";

drop trigger if exists "update_domain_knowledge_updated_at" on "public"."domain_knowledge";

drop trigger if exists "trigger_update_chain_success_rate" on "public"."prompt_executions";

drop trigger if exists "trigger_update_prompt_usage_stats" on "public"."prompt_executions";

drop trigger if exists "weekly_analytics_cleanup" on "public"."user_analytics";

drop trigger if exists "update_user_hackathons_updated_at" on "public"."user_hackathons";

drop trigger if exists "update_workflows_updated_at" on "public"."workflows";

drop policy "Public templates are viewable by everyone" on "public"."adaptive_templates";

drop policy "System can manage templates" on "public"."adaptive_templates";

drop policy "Public AI companies access" on "public"."ai_companies";

drop policy "Public access to AI content" on "public"."ai_content";

drop policy "Authenticated users can read research data" on "public"."domain_knowledge";

drop policy "System can write domain knowledge" on "public"."domain_knowledge";

drop policy "Authenticated users can read extracted knowledge" on "public"."extracted_knowledge";

drop policy "System can write extracted knowledge" on "public"."extracted_knowledge";

drop policy "System can track generated workflows" on "public"."generated_workflows";

drop policy "Users can only access their own hackathon reminders" on "public"."hackathon_reminders";

drop policy "Users can only delete their own hackathon reminders" on "public"."hackathon_reminders";

drop policy "Users can only modify their own hackathon reminders" on "public"."hackathon_reminders";

drop policy "Users can only update their own hackathon reminders" on "public"."hackathon_reminders";

drop policy "Public hackathons access" on "public"."hackathons";

drop policy "Public job market data access" on "public"."job_market_data";

drop policy "Users can only access their own knowledge items" on "public"."knowledge_items";

drop policy "Authenticated users can read learned patterns" on "public"."learned_patterns";

drop policy "System can write learned patterns" on "public"."learned_patterns";

drop policy "Users can only access their own newsletters" on "public"."newsletters";

drop policy "Users can only access their own projects" on "public"."projects";

drop policy "Users can delete their own prompt chains" on "public"."prompt_chains";

drop policy "Users can insert their own prompt chains" on "public"."prompt_chains";

drop policy "Users can update their own prompt chains" on "public"."prompt_chains";

drop policy "Users can view their own and public prompt chains" on "public"."prompt_chains";

drop policy "Users can only access their own prompt executions" on "public"."prompt_executions";

drop policy "Users can only access their own prompt favorites" on "public"."prompt_favorites";

drop policy "Users can access their own prompts and public ones" on "public"."prompt_library";

drop policy "Users can only modify their own prompts" on "public"."prompt_library";

drop policy "Users can only access their own prompt results" on "public"."prompt_results";

drop policy "Users can delete their own prompt templates" on "public"."prompt_templates";

drop policy "Users can insert their own prompt templates" on "public"."prompt_templates";

drop policy "Users can update their own prompt templates" on "public"."prompt_templates";

drop policy "Users can view their own and public prompt templates" on "public"."prompt_templates";

drop policy "Users can manage own feedback" on "public"."research_feedback";

drop policy "Public stock data access" on "public"."stock_data";

drop policy "System can track performance" on "public"."template_performance";

drop policy "Users can only access their own analytics" on "public"."user_analytics";

drop policy "Users can delete own hackathons" on "public"."user_hackathons";

drop policy "Users can insert own hackathons" on "public"."user_hackathons";

drop policy "Users can update own hackathons" on "public"."user_hackathons";

drop policy "Users can view own hackathons" on "public"."user_hackathons";

drop policy "System can manage executions" on "public"."workflow_executions";

drop policy "Users can view own executions" on "public"."workflow_executions";

drop policy "Users can manage their own workflows" on "public"."workflows";

revoke delete on table "public"."adaptive_templates" from "anon";

revoke insert on table "public"."adaptive_templates" from "anon";

revoke references on table "public"."adaptive_templates" from "anon";

revoke select on table "public"."adaptive_templates" from "anon";

revoke trigger on table "public"."adaptive_templates" from "anon";

revoke truncate on table "public"."adaptive_templates" from "anon";

revoke update on table "public"."adaptive_templates" from "anon";

revoke delete on table "public"."adaptive_templates" from "authenticated";

revoke insert on table "public"."adaptive_templates" from "authenticated";

revoke references on table "public"."adaptive_templates" from "authenticated";

revoke select on table "public"."adaptive_templates" from "authenticated";

revoke trigger on table "public"."adaptive_templates" from "authenticated";

revoke truncate on table "public"."adaptive_templates" from "authenticated";

revoke update on table "public"."adaptive_templates" from "authenticated";

revoke delete on table "public"."adaptive_templates" from "service_role";

revoke insert on table "public"."adaptive_templates" from "service_role";

revoke references on table "public"."adaptive_templates" from "service_role";

revoke select on table "public"."adaptive_templates" from "service_role";

revoke trigger on table "public"."adaptive_templates" from "service_role";

revoke truncate on table "public"."adaptive_templates" from "service_role";

revoke update on table "public"."adaptive_templates" from "service_role";

revoke delete on table "public"."cached_ai_content" from "anon";

revoke insert on table "public"."cached_ai_content" from "anon";

revoke references on table "public"."cached_ai_content" from "anon";

revoke select on table "public"."cached_ai_content" from "anon";

revoke trigger on table "public"."cached_ai_content" from "anon";

revoke truncate on table "public"."cached_ai_content" from "anon";

revoke update on table "public"."cached_ai_content" from "anon";

revoke delete on table "public"."cached_ai_content" from "authenticated";

revoke insert on table "public"."cached_ai_content" from "authenticated";

revoke references on table "public"."cached_ai_content" from "authenticated";

revoke select on table "public"."cached_ai_content" from "authenticated";

revoke trigger on table "public"."cached_ai_content" from "authenticated";

revoke truncate on table "public"."cached_ai_content" from "authenticated";

revoke update on table "public"."cached_ai_content" from "authenticated";

revoke delete on table "public"."cached_ai_content" from "service_role";

revoke insert on table "public"."cached_ai_content" from "service_role";

revoke references on table "public"."cached_ai_content" from "service_role";

revoke select on table "public"."cached_ai_content" from "service_role";

revoke trigger on table "public"."cached_ai_content" from "service_role";

revoke truncate on table "public"."cached_ai_content" from "service_role";

revoke update on table "public"."cached_ai_content" from "service_role";

revoke delete on table "public"."cached_funding_data" from "anon";

revoke insert on table "public"."cached_funding_data" from "anon";

revoke references on table "public"."cached_funding_data" from "anon";

revoke select on table "public"."cached_funding_data" from "anon";

revoke trigger on table "public"."cached_funding_data" from "anon";

revoke truncate on table "public"."cached_funding_data" from "anon";

revoke update on table "public"."cached_funding_data" from "anon";

revoke delete on table "public"."cached_funding_data" from "authenticated";

revoke insert on table "public"."cached_funding_data" from "authenticated";

revoke references on table "public"."cached_funding_data" from "authenticated";

revoke select on table "public"."cached_funding_data" from "authenticated";

revoke trigger on table "public"."cached_funding_data" from "authenticated";

revoke truncate on table "public"."cached_funding_data" from "authenticated";

revoke update on table "public"."cached_funding_data" from "authenticated";

revoke delete on table "public"."cached_funding_data" from "service_role";

revoke insert on table "public"."cached_funding_data" from "service_role";

revoke references on table "public"."cached_funding_data" from "service_role";

revoke select on table "public"."cached_funding_data" from "service_role";

revoke trigger on table "public"."cached_funding_data" from "service_role";

revoke truncate on table "public"."cached_funding_data" from "service_role";

revoke update on table "public"."cached_funding_data" from "service_role";

revoke delete on table "public"."cached_job_data" from "anon";

revoke insert on table "public"."cached_job_data" from "anon";

revoke references on table "public"."cached_job_data" from "anon";

revoke select on table "public"."cached_job_data" from "anon";

revoke trigger on table "public"."cached_job_data" from "anon";

revoke truncate on table "public"."cached_job_data" from "anon";

revoke update on table "public"."cached_job_data" from "anon";

revoke delete on table "public"."cached_job_data" from "authenticated";

revoke insert on table "public"."cached_job_data" from "authenticated";

revoke references on table "public"."cached_job_data" from "authenticated";

revoke select on table "public"."cached_job_data" from "authenticated";

revoke trigger on table "public"."cached_job_data" from "authenticated";

revoke truncate on table "public"."cached_job_data" from "authenticated";

revoke update on table "public"."cached_job_data" from "authenticated";

revoke delete on table "public"."cached_job_data" from "service_role";

revoke insert on table "public"."cached_job_data" from "service_role";

revoke references on table "public"."cached_job_data" from "service_role";

revoke select on table "public"."cached_job_data" from "service_role";

revoke trigger on table "public"."cached_job_data" from "service_role";

revoke truncate on table "public"."cached_job_data" from "service_role";

revoke update on table "public"."cached_job_data" from "service_role";

revoke delete on table "public"."cached_stock_data" from "anon";

revoke insert on table "public"."cached_stock_data" from "anon";

revoke references on table "public"."cached_stock_data" from "anon";

revoke select on table "public"."cached_stock_data" from "anon";

revoke trigger on table "public"."cached_stock_data" from "anon";

revoke truncate on table "public"."cached_stock_data" from "anon";

revoke update on table "public"."cached_stock_data" from "anon";

revoke delete on table "public"."cached_stock_data" from "authenticated";

revoke insert on table "public"."cached_stock_data" from "authenticated";

revoke references on table "public"."cached_stock_data" from "authenticated";

revoke select on table "public"."cached_stock_data" from "authenticated";

revoke trigger on table "public"."cached_stock_data" from "authenticated";

revoke truncate on table "public"."cached_stock_data" from "authenticated";

revoke update on table "public"."cached_stock_data" from "authenticated";

revoke delete on table "public"."cached_stock_data" from "service_role";

revoke insert on table "public"."cached_stock_data" from "service_role";

revoke references on table "public"."cached_stock_data" from "service_role";

revoke select on table "public"."cached_stock_data" from "service_role";

revoke trigger on table "public"."cached_stock_data" from "service_role";

revoke truncate on table "public"."cached_stock_data" from "service_role";

revoke update on table "public"."cached_stock_data" from "service_role";

revoke delete on table "public"."data_refresh_log" from "anon";

revoke insert on table "public"."data_refresh_log" from "anon";

revoke references on table "public"."data_refresh_log" from "anon";

revoke select on table "public"."data_refresh_log" from "anon";

revoke trigger on table "public"."data_refresh_log" from "anon";

revoke truncate on table "public"."data_refresh_log" from "anon";

revoke update on table "public"."data_refresh_log" from "anon";

revoke delete on table "public"."data_refresh_log" from "authenticated";

revoke insert on table "public"."data_refresh_log" from "authenticated";

revoke references on table "public"."data_refresh_log" from "authenticated";

revoke select on table "public"."data_refresh_log" from "authenticated";

revoke trigger on table "public"."data_refresh_log" from "authenticated";

revoke truncate on table "public"."data_refresh_log" from "authenticated";

revoke update on table "public"."data_refresh_log" from "authenticated";

revoke delete on table "public"."data_refresh_log" from "service_role";

revoke insert on table "public"."data_refresh_log" from "service_role";

revoke references on table "public"."data_refresh_log" from "service_role";

revoke select on table "public"."data_refresh_log" from "service_role";

revoke trigger on table "public"."data_refresh_log" from "service_role";

revoke truncate on table "public"."data_refresh_log" from "service_role";

revoke update on table "public"."data_refresh_log" from "service_role";

revoke delete on table "public"."domain_knowledge" from "anon";

revoke insert on table "public"."domain_knowledge" from "anon";

revoke references on table "public"."domain_knowledge" from "anon";

revoke select on table "public"."domain_knowledge" from "anon";

revoke trigger on table "public"."domain_knowledge" from "anon";

revoke truncate on table "public"."domain_knowledge" from "anon";

revoke update on table "public"."domain_knowledge" from "anon";

revoke delete on table "public"."domain_knowledge" from "authenticated";

revoke insert on table "public"."domain_knowledge" from "authenticated";

revoke references on table "public"."domain_knowledge" from "authenticated";

revoke select on table "public"."domain_knowledge" from "authenticated";

revoke trigger on table "public"."domain_knowledge" from "authenticated";

revoke truncate on table "public"."domain_knowledge" from "authenticated";

revoke update on table "public"."domain_knowledge" from "authenticated";

revoke delete on table "public"."domain_knowledge" from "service_role";

revoke insert on table "public"."domain_knowledge" from "service_role";

revoke references on table "public"."domain_knowledge" from "service_role";

revoke select on table "public"."domain_knowledge" from "service_role";

revoke trigger on table "public"."domain_knowledge" from "service_role";

revoke truncate on table "public"."domain_knowledge" from "service_role";

revoke update on table "public"."domain_knowledge" from "service_role";

revoke delete on table "public"."extracted_knowledge" from "anon";

revoke insert on table "public"."extracted_knowledge" from "anon";

revoke references on table "public"."extracted_knowledge" from "anon";

revoke select on table "public"."extracted_knowledge" from "anon";

revoke trigger on table "public"."extracted_knowledge" from "anon";

revoke truncate on table "public"."extracted_knowledge" from "anon";

revoke update on table "public"."extracted_knowledge" from "anon";

revoke delete on table "public"."extracted_knowledge" from "authenticated";

revoke insert on table "public"."extracted_knowledge" from "authenticated";

revoke references on table "public"."extracted_knowledge" from "authenticated";

revoke select on table "public"."extracted_knowledge" from "authenticated";

revoke trigger on table "public"."extracted_knowledge" from "authenticated";

revoke truncate on table "public"."extracted_knowledge" from "authenticated";

revoke update on table "public"."extracted_knowledge" from "authenticated";

revoke delete on table "public"."extracted_knowledge" from "service_role";

revoke insert on table "public"."extracted_knowledge" from "service_role";

revoke references on table "public"."extracted_knowledge" from "service_role";

revoke select on table "public"."extracted_knowledge" from "service_role";

revoke trigger on table "public"."extracted_knowledge" from "service_role";

revoke truncate on table "public"."extracted_knowledge" from "service_role";

revoke update on table "public"."extracted_knowledge" from "service_role";

revoke delete on table "public"."generated_workflows" from "anon";

revoke insert on table "public"."generated_workflows" from "anon";

revoke references on table "public"."generated_workflows" from "anon";

revoke select on table "public"."generated_workflows" from "anon";

revoke trigger on table "public"."generated_workflows" from "anon";

revoke truncate on table "public"."generated_workflows" from "anon";

revoke update on table "public"."generated_workflows" from "anon";

revoke delete on table "public"."generated_workflows" from "authenticated";

revoke insert on table "public"."generated_workflows" from "authenticated";

revoke references on table "public"."generated_workflows" from "authenticated";

revoke select on table "public"."generated_workflows" from "authenticated";

revoke trigger on table "public"."generated_workflows" from "authenticated";

revoke truncate on table "public"."generated_workflows" from "authenticated";

revoke update on table "public"."generated_workflows" from "authenticated";

revoke delete on table "public"."generated_workflows" from "service_role";

revoke insert on table "public"."generated_workflows" from "service_role";

revoke references on table "public"."generated_workflows" from "service_role";

revoke select on table "public"."generated_workflows" from "service_role";

revoke trigger on table "public"."generated_workflows" from "service_role";

revoke truncate on table "public"."generated_workflows" from "service_role";

revoke update on table "public"."generated_workflows" from "service_role";

revoke delete on table "public"."hackathon_reminders" from "anon";

revoke insert on table "public"."hackathon_reminders" from "anon";

revoke references on table "public"."hackathon_reminders" from "anon";

revoke select on table "public"."hackathon_reminders" from "anon";

revoke trigger on table "public"."hackathon_reminders" from "anon";

revoke truncate on table "public"."hackathon_reminders" from "anon";

revoke update on table "public"."hackathon_reminders" from "anon";

revoke delete on table "public"."hackathon_reminders" from "authenticated";

revoke insert on table "public"."hackathon_reminders" from "authenticated";

revoke references on table "public"."hackathon_reminders" from "authenticated";

revoke select on table "public"."hackathon_reminders" from "authenticated";

revoke trigger on table "public"."hackathon_reminders" from "authenticated";

revoke truncate on table "public"."hackathon_reminders" from "authenticated";

revoke update on table "public"."hackathon_reminders" from "authenticated";

revoke delete on table "public"."hackathon_reminders" from "service_role";

revoke insert on table "public"."hackathon_reminders" from "service_role";

revoke references on table "public"."hackathon_reminders" from "service_role";

revoke select on table "public"."hackathon_reminders" from "service_role";

revoke trigger on table "public"."hackathon_reminders" from "service_role";

revoke truncate on table "public"."hackathon_reminders" from "service_role";

revoke update on table "public"."hackathon_reminders" from "service_role";

revoke delete on table "public"."learned_patterns" from "anon";

revoke insert on table "public"."learned_patterns" from "anon";

revoke references on table "public"."learned_patterns" from "anon";

revoke select on table "public"."learned_patterns" from "anon";

revoke trigger on table "public"."learned_patterns" from "anon";

revoke truncate on table "public"."learned_patterns" from "anon";

revoke update on table "public"."learned_patterns" from "anon";

revoke delete on table "public"."learned_patterns" from "authenticated";

revoke insert on table "public"."learned_patterns" from "authenticated";

revoke references on table "public"."learned_patterns" from "authenticated";

revoke select on table "public"."learned_patterns" from "authenticated";

revoke trigger on table "public"."learned_patterns" from "authenticated";

revoke truncate on table "public"."learned_patterns" from "authenticated";

revoke update on table "public"."learned_patterns" from "authenticated";

revoke delete on table "public"."learned_patterns" from "service_role";

revoke insert on table "public"."learned_patterns" from "service_role";

revoke references on table "public"."learned_patterns" from "service_role";

revoke select on table "public"."learned_patterns" from "service_role";

revoke trigger on table "public"."learned_patterns" from "service_role";

revoke truncate on table "public"."learned_patterns" from "service_role";

revoke update on table "public"."learned_patterns" from "service_role";

revoke delete on table "public"."prompt_chains" from "anon";

revoke insert on table "public"."prompt_chains" from "anon";

revoke references on table "public"."prompt_chains" from "anon";

revoke select on table "public"."prompt_chains" from "anon";

revoke trigger on table "public"."prompt_chains" from "anon";

revoke truncate on table "public"."prompt_chains" from "anon";

revoke update on table "public"."prompt_chains" from "anon";

revoke delete on table "public"."prompt_chains" from "authenticated";

revoke insert on table "public"."prompt_chains" from "authenticated";

revoke references on table "public"."prompt_chains" from "authenticated";

revoke select on table "public"."prompt_chains" from "authenticated";

revoke trigger on table "public"."prompt_chains" from "authenticated";

revoke truncate on table "public"."prompt_chains" from "authenticated";

revoke update on table "public"."prompt_chains" from "authenticated";

revoke delete on table "public"."prompt_chains" from "service_role";

revoke insert on table "public"."prompt_chains" from "service_role";

revoke references on table "public"."prompt_chains" from "service_role";

revoke select on table "public"."prompt_chains" from "service_role";

revoke trigger on table "public"."prompt_chains" from "service_role";

revoke truncate on table "public"."prompt_chains" from "service_role";

revoke update on table "public"."prompt_chains" from "service_role";

revoke delete on table "public"."prompt_results" from "anon";

revoke insert on table "public"."prompt_results" from "anon";

revoke references on table "public"."prompt_results" from "anon";

revoke select on table "public"."prompt_results" from "anon";

revoke trigger on table "public"."prompt_results" from "anon";

revoke truncate on table "public"."prompt_results" from "anon";

revoke update on table "public"."prompt_results" from "anon";

revoke delete on table "public"."prompt_results" from "authenticated";

revoke insert on table "public"."prompt_results" from "authenticated";

revoke references on table "public"."prompt_results" from "authenticated";

revoke select on table "public"."prompt_results" from "authenticated";

revoke trigger on table "public"."prompt_results" from "authenticated";

revoke truncate on table "public"."prompt_results" from "authenticated";

revoke update on table "public"."prompt_results" from "authenticated";

revoke delete on table "public"."prompt_results" from "service_role";

revoke insert on table "public"."prompt_results" from "service_role";

revoke references on table "public"."prompt_results" from "service_role";

revoke select on table "public"."prompt_results" from "service_role";

revoke trigger on table "public"."prompt_results" from "service_role";

revoke truncate on table "public"."prompt_results" from "service_role";

revoke update on table "public"."prompt_results" from "service_role";

revoke delete on table "public"."research_feedback" from "anon";

revoke insert on table "public"."research_feedback" from "anon";

revoke references on table "public"."research_feedback" from "anon";

revoke select on table "public"."research_feedback" from "anon";

revoke trigger on table "public"."research_feedback" from "anon";

revoke truncate on table "public"."research_feedback" from "anon";

revoke update on table "public"."research_feedback" from "anon";

revoke delete on table "public"."research_feedback" from "authenticated";

revoke insert on table "public"."research_feedback" from "authenticated";

revoke references on table "public"."research_feedback" from "authenticated";

revoke select on table "public"."research_feedback" from "authenticated";

revoke trigger on table "public"."research_feedback" from "authenticated";

revoke truncate on table "public"."research_feedback" from "authenticated";

revoke update on table "public"."research_feedback" from "authenticated";

revoke delete on table "public"."research_feedback" from "service_role";

revoke insert on table "public"."research_feedback" from "service_role";

revoke references on table "public"."research_feedback" from "service_role";

revoke select on table "public"."research_feedback" from "service_role";

revoke trigger on table "public"."research_feedback" from "service_role";

revoke truncate on table "public"."research_feedback" from "service_role";

revoke update on table "public"."research_feedback" from "service_role";

revoke delete on table "public"."template_performance" from "anon";

revoke insert on table "public"."template_performance" from "anon";

revoke references on table "public"."template_performance" from "anon";

revoke select on table "public"."template_performance" from "anon";

revoke trigger on table "public"."template_performance" from "anon";

revoke truncate on table "public"."template_performance" from "anon";

revoke update on table "public"."template_performance" from "anon";

revoke delete on table "public"."template_performance" from "authenticated";

revoke insert on table "public"."template_performance" from "authenticated";

revoke references on table "public"."template_performance" from "authenticated";

revoke select on table "public"."template_performance" from "authenticated";

revoke trigger on table "public"."template_performance" from "authenticated";

revoke truncate on table "public"."template_performance" from "authenticated";

revoke update on table "public"."template_performance" from "authenticated";

revoke delete on table "public"."template_performance" from "service_role";

revoke insert on table "public"."template_performance" from "service_role";

revoke references on table "public"."template_performance" from "service_role";

revoke select on table "public"."template_performance" from "service_role";

revoke trigger on table "public"."template_performance" from "service_role";

revoke truncate on table "public"."template_performance" from "service_role";

revoke update on table "public"."template_performance" from "service_role";

revoke delete on table "public"."user_hackathons" from "anon";

revoke insert on table "public"."user_hackathons" from "anon";

revoke references on table "public"."user_hackathons" from "anon";

revoke select on table "public"."user_hackathons" from "anon";

revoke trigger on table "public"."user_hackathons" from "anon";

revoke truncate on table "public"."user_hackathons" from "anon";

revoke update on table "public"."user_hackathons" from "anon";

revoke delete on table "public"."user_hackathons" from "authenticated";

revoke insert on table "public"."user_hackathons" from "authenticated";

revoke references on table "public"."user_hackathons" from "authenticated";

revoke select on table "public"."user_hackathons" from "authenticated";

revoke trigger on table "public"."user_hackathons" from "authenticated";

revoke truncate on table "public"."user_hackathons" from "authenticated";

revoke update on table "public"."user_hackathons" from "authenticated";

revoke delete on table "public"."user_hackathons" from "service_role";

revoke insert on table "public"."user_hackathons" from "service_role";

revoke references on table "public"."user_hackathons" from "service_role";

revoke select on table "public"."user_hackathons" from "service_role";

revoke trigger on table "public"."user_hackathons" from "service_role";

revoke truncate on table "public"."user_hackathons" from "service_role";

revoke update on table "public"."user_hackathons" from "service_role";

revoke delete on table "public"."workflow_executions" from "anon";

revoke insert on table "public"."workflow_executions" from "anon";

revoke references on table "public"."workflow_executions" from "anon";

revoke select on table "public"."workflow_executions" from "anon";

revoke trigger on table "public"."workflow_executions" from "anon";

revoke truncate on table "public"."workflow_executions" from "anon";

revoke update on table "public"."workflow_executions" from "anon";

revoke delete on table "public"."workflow_executions" from "authenticated";

revoke insert on table "public"."workflow_executions" from "authenticated";

revoke references on table "public"."workflow_executions" from "authenticated";

revoke select on table "public"."workflow_executions" from "authenticated";

revoke trigger on table "public"."workflow_executions" from "authenticated";

revoke truncate on table "public"."workflow_executions" from "authenticated";

revoke update on table "public"."workflow_executions" from "authenticated";

revoke delete on table "public"."workflow_executions" from "service_role";

revoke insert on table "public"."workflow_executions" from "service_role";

revoke references on table "public"."workflow_executions" from "service_role";

revoke select on table "public"."workflow_executions" from "service_role";

revoke trigger on table "public"."workflow_executions" from "service_role";

revoke truncate on table "public"."workflow_executions" from "service_role";

revoke update on table "public"."workflow_executions" from "service_role";

revoke delete on table "public"."workflows" from "anon";

revoke insert on table "public"."workflows" from "anon";

revoke references on table "public"."workflows" from "anon";

revoke select on table "public"."workflows" from "anon";

revoke trigger on table "public"."workflows" from "anon";

revoke truncate on table "public"."workflows" from "anon";

revoke update on table "public"."workflows" from "anon";

revoke delete on table "public"."workflows" from "authenticated";

revoke insert on table "public"."workflows" from "authenticated";

revoke references on table "public"."workflows" from "authenticated";

revoke select on table "public"."workflows" from "authenticated";

revoke trigger on table "public"."workflows" from "authenticated";

revoke truncate on table "public"."workflows" from "authenticated";

revoke update on table "public"."workflows" from "authenticated";

revoke delete on table "public"."workflows" from "service_role";

revoke insert on table "public"."workflows" from "service_role";

revoke references on table "public"."workflows" from "service_role";

revoke select on table "public"."workflows" from "service_role";

revoke trigger on table "public"."workflows" from "service_role";

revoke truncate on table "public"."workflows" from "service_role";

revoke update on table "public"."workflows" from "service_role";

alter table "public"."cached_ai_content" drop constraint "valid_title";

alter table "public"."cached_ai_content" drop constraint "valid_url";

alter table "public"."cached_funding_data" drop constraint "valid_company_name";

alter table "public"."cached_funding_data" drop constraint "valid_funding_amount";

alter table "public"."cached_job_data" drop constraint "valid_role_title";

alter table "public"."cached_job_data" drop constraint "valid_salary";

alter table "public"."cached_stock_data" drop constraint "valid_price";

alter table "public"."cached_stock_data" drop constraint "valid_symbol";

alter table "public"."data_refresh_log" drop constraint "data_refresh_log_status_check";

alter table "public"."data_refresh_log" drop constraint "valid_function_name";

alter table "public"."data_refresh_log" drop constraint "valid_records_count";

alter table "public"."generated_workflows" drop constraint "generated_workflows_workflow_id_fkey";

alter table "public"."hackathon_reminders" drop constraint "hackathon_reminders_hackathon_id_fkey";

alter table "public"."hackathon_reminders" drop constraint "hackathon_reminders_user_id_fkey";

alter table "public"."prompt_chains" drop constraint "prompt_chains_user_id_fkey";

alter table "public"."prompt_executions" drop constraint "prompt_executions_prompt_chain_id_fkey";

alter table "public"."prompt_results" drop constraint "prompt_results_execution_id_fkey";

alter table "public"."prompt_templates" drop constraint "prompt_templates_difficulty_level_check";

alter table "public"."research_feedback" drop constraint "research_feedback_execution_id_fkey";

alter table "public"."research_feedback" drop constraint "research_feedback_rating_check";

alter table "public"."research_feedback" drop constraint "research_feedback_user_id_fkey";

alter table "public"."research_feedback" drop constraint "research_feedback_workflow_id_fkey";

alter table "public"."template_performance" drop constraint "template_performance_execution_id_fkey";

alter table "public"."template_performance" drop constraint "template_performance_template_id_fkey";

alter table "public"."user_hackathons" drop constraint "user_hackathons_hackathon_id_fkey";

alter table "public"."user_hackathons" drop constraint "user_hackathons_user_id_fkey";

alter table "public"."user_hackathons" drop constraint "user_hackathons_user_id_hackathon_id_key";

alter table "public"."workflow_executions" drop constraint "workflow_executions_status_check";

alter table "public"."workflow_executions" drop constraint "workflow_executions_template_id_fkey";

alter table "public"."workflow_executions" drop constraint "workflow_executions_user_id_fkey";

alter table "public"."workflow_executions" drop constraint "workflow_executions_workflow_id_fkey";

alter table "public"."workflows" drop constraint "workflows_user_id_fkey";

alter table "public"."knowledge_items" drop constraint "knowledge_items_user_id_fkey";

alter table "public"."newsletters" drop constraint "newsletters_user_id_fkey";

alter table "public"."projects" drop constraint "projects_user_id_fkey";

alter table "public"."prompt_library" drop constraint "prompt_library_user_id_fkey";

alter table "public"."user_analytics" drop constraint "user_analytics_user_id_fkey";

drop index if exists "public"."idx_research_analytics_unique";

drop index if exists "public"."idx_template_analytics_unique";

drop view if exists "public"."cache_status_summary";

drop function if exists "public"."cleanup_expired_cache"();

drop function if exists "public"."delete_old_analytics"();

drop function if exists "public"."enhanced_prompt_search"(search_term text, category_filter text, limit_results integer);

drop function if exists "public"."full_text_prompt_search"(query_text text);

drop function if exists "public"."fuzzy_prompt_search"(search_term text);

drop function if exists "public"."get_cache_statistics"();

drop function if exists "public"."get_category_breadcrumbs"(child_path text);

drop function if exists "public"."get_category_templates"(parent_category text);

drop function if exists "public"."get_category_tree"();

drop function if exists "public"."get_prompt_subcategories"(parent_path text);

drop function if exists "public"."get_research_system_health"();

drop function if exists "public"."refresh_all_cached_data"();

drop function if exists "public"."refresh_research_analytics"();

drop materialized view if exists "public"."research_analytics";

drop function if exists "public"."semantic_ai_content_search"(query_embedding vector, similarity_threshold double precision);

drop materialized view if exists "public"."template_analytics";

drop function if exists "public"."update_chain_success_rate"();

drop function if exists "public"."update_prompt_usage_stats"();

drop function if exists "public"."update_updated_at_column"();

drop function if exists "public"."validate_password"(password text);

alter table "public"."adaptive_templates" drop constraint "adaptive_templates_pkey";

alter table "public"."cached_ai_content" drop constraint "cached_ai_content_pkey";

alter table "public"."cached_funding_data" drop constraint "cached_funding_data_pkey";

alter table "public"."cached_job_data" drop constraint "cached_job_data_pkey";

alter table "public"."cached_stock_data" drop constraint "cached_stock_data_pkey";

alter table "public"."data_refresh_log" drop constraint "data_refresh_log_pkey";

alter table "public"."domain_knowledge" drop constraint "domain_knowledge_pkey";

alter table "public"."extracted_knowledge" drop constraint "extracted_knowledge_pkey";

alter table "public"."generated_workflows" drop constraint "generated_workflows_pkey";

alter table "public"."hackathon_reminders" drop constraint "hackathon_reminders_pkey";

alter table "public"."learned_patterns" drop constraint "learned_patterns_pkey";

alter table "public"."prompt_chains" drop constraint "prompt_chains_pkey";

alter table "public"."prompt_results" drop constraint "prompt_results_pkey";

alter table "public"."research_feedback" drop constraint "research_feedback_pkey";

alter table "public"."template_performance" drop constraint "template_performance_pkey";

alter table "public"."user_hackathons" drop constraint "user_hackathons_pkey";

alter table "public"."workflow_executions" drop constraint "workflow_executions_pkey";

alter table "public"."workflows" drop constraint "workflows_pkey";

drop index if exists "public"."adaptive_templates_pkey";

drop index if exists "public"."cached_ai_content_pkey";

drop index if exists "public"."cached_funding_data_pkey";

drop index if exists "public"."cached_job_data_pkey";

drop index if exists "public"."cached_stock_data_pkey";

drop index if exists "public"."data_refresh_log_pkey";

drop index if exists "public"."domain_knowledge_pkey";

drop index if exists "public"."extracted_knowledge_pkey";

drop index if exists "public"."generated_workflows_pkey";

drop index if exists "public"."hackathon_reminders_pkey";

drop index if exists "public"."idx_adaptive_templates_base_workflow_gin";

drop index if exists "public"."idx_adaptive_templates_category";

drop index if exists "public"."idx_adaptive_templates_description_fts";

drop index if exists "public"."idx_adaptive_templates_domain";

drop index if exists "public"."idx_adaptive_templates_name_fts";

drop index if exists "public"."idx_adaptive_templates_public";

drop index if exists "public"."idx_adaptive_templates_rating";

drop index if exists "public"."idx_adaptive_templates_usage";

drop index if exists "public"."idx_ai_content_published_at";

drop index if exists "public"."idx_ai_content_source";

drop index if exists "public"."idx_cached_ai_content_cached_at";

drop index if exists "public"."idx_cached_ai_content_expires_at";

drop index if exists "public"."idx_cached_ai_content_source";

drop index if exists "public"."idx_cached_ai_content_type";

drop index if exists "public"."idx_cached_funding_data_cached_at";

drop index if exists "public"."idx_cached_funding_data_company";

drop index if exists "public"."idx_cached_funding_data_expires_at";

drop index if exists "public"."idx_cached_funding_data_industry";

drop index if exists "public"."idx_cached_job_data_cached_at";

drop index if exists "public"."idx_cached_job_data_expires_at";

drop index if exists "public"."idx_cached_job_data_location";

drop index if exists "public"."idx_cached_job_data_remote";

drop index if exists "public"."idx_cached_stock_data_cached_at";

drop index if exists "public"."idx_cached_stock_data_expires_at";

drop index if exists "public"."idx_cached_stock_data_symbol";

drop index if exists "public"."idx_data_refresh_log_completed_at";

drop index if exists "public"."idx_data_refresh_log_function";

drop index if exists "public"."idx_data_refresh_log_status";

drop index if exists "public"."idx_domain_knowledge_created_at";

drop index if exists "public"."idx_domain_knowledge_domain";

drop index if exists "public"."idx_domain_knowledge_intent_fts";

drop index if exists "public"."idx_domain_knowledge_methodologies_gin";

drop index if exists "public"."idx_extracted_knowledge_confidence";

drop index if exists "public"."idx_extracted_knowledge_domain";

drop index if exists "public"."idx_extracted_knowledge_patterns_gin";

drop index if exists "public"."idx_generated_workflows_confidence";

drop index if exists "public"."idx_generated_workflows_domain";

drop index if exists "public"."idx_hackathon_reminders_date";

drop index if exists "public"."idx_hackathon_reminders_user_id";

drop index if exists "public"."idx_knowledge_items_read_status";

drop index if exists "public"."idx_learned_patterns_confidence";

drop index if exists "public"."idx_learned_patterns_domain";

drop index if exists "public"."idx_prompt_chains_config";

drop index if exists "public"."idx_prompt_chains_success";

drop index if exists "public"."idx_prompt_chains_user_id";

drop index if exists "public"."idx_prompt_executions_chain";

drop index if exists "public"."idx_prompt_executions_created_at";

drop index if exists "public"."idx_prompt_executions_response";

drop index if exists "public"."idx_prompt_executions_status";

drop index if exists "public"."idx_prompt_executions_template";

drop index if exists "public"."idx_prompt_executions_user_id";

drop index if exists "public"."idx_prompt_executions_variables";

drop index if exists "public"."idx_prompt_favorites_template";

drop index if exists "public"."idx_prompt_favorites_user_id";

drop index if exists "public"."idx_prompt_library_category";

drop index if exists "public"."idx_prompt_library_user_id";

drop index if exists "public"."idx_prompt_results_execution_id";

drop index if exists "public"."idx_prompt_results_reasoning";

drop index if exists "public"."idx_prompt_results_step";

drop index if exists "public"."idx_prompt_templates_category";

drop index if exists "public"."idx_prompt_templates_category_path";

drop index if exists "public"."idx_prompt_templates_category_public";

drop index if exists "public"."idx_prompt_templates_embedding";

drop index if exists "public"."idx_prompt_templates_gin";

drop index if exists "public"."idx_prompt_templates_rating";

drop index if exists "public"."idx_prompt_templates_search";

drop index if exists "public"."idx_prompt_templates_tags";

drop index if exists "public"."idx_prompt_templates_text_search";

drop index if exists "public"."idx_prompt_templates_usage";

drop index if exists "public"."idx_prompt_templates_user_id";

drop index if exists "public"."idx_prompt_templates_user_private";

drop index if exists "public"."idx_research_feedback_created_at";

drop index if exists "public"."idx_research_feedback_rating";

drop index if exists "public"."idx_stock_data_symbol_timestamp";

drop index if exists "public"."idx_template_performance_success_rate";

drop index if exists "public"."idx_template_performance_template_id";

drop index if exists "public"."idx_user_analytics_event_type";

drop index if exists "public"."idx_user_hackathons_favorites";

drop index if exists "public"."idx_user_hackathons_hackathon_id";

drop index if exists "public"."idx_user_hackathons_reminders";

drop index if exists "public"."idx_user_hackathons_user_id";

drop index if exists "public"."idx_workflow_executions_created_at";

drop index if exists "public"."idx_workflow_executions_domain";

drop index if exists "public"."idx_workflow_executions_status";

drop index if exists "public"."idx_workflow_executions_step_outputs_gin";

drop index if exists "public"."idx_workflow_executions_user_id";

drop index if exists "public"."idx_workflows_created_at";

drop index if exists "public"."idx_workflows_domain";

drop index if exists "public"."idx_workflows_user_id";

drop index if exists "public"."learned_patterns_pkey";

drop index if exists "public"."prompt_chains_pkey";

drop index if exists "public"."prompt_results_pkey";

drop index if exists "public"."research_feedback_pkey";

drop index if exists "public"."template_performance_pkey";

drop index if exists "public"."user_hackathons_pkey";

drop index if exists "public"."user_hackathons_user_id_hackathon_id_key";

drop index if exists "public"."workflow_executions_pkey";

drop index if exists "public"."workflows_pkey";

drop index if exists "public"."idx_prompt_templates_public";

drop table "public"."adaptive_templates";

drop table "public"."cached_ai_content";

drop table "public"."cached_funding_data";

drop table "public"."cached_job_data";

drop table "public"."cached_stock_data";

drop table "public"."data_refresh_log";

drop table "public"."domain_knowledge";

drop table "public"."extracted_knowledge";

drop table "public"."generated_workflows";

drop table "public"."hackathon_reminders";

drop table "public"."learned_patterns";

drop table "public"."prompt_chains";

drop table "public"."prompt_results";

drop table "public"."research_feedback";

drop table "public"."template_performance";

drop table "public"."user_hackathons";

drop table "public"."workflow_executions";

drop table "public"."workflows";

alter table "public"."ai_companies" enable row level security;

alter table "public"."ai_content" drop column "is_read";

alter table "public"."ai_content" drop column "semantic_embedding";

alter table "public"."ai_content" drop column "tags";

alter table "public"."ai_content" enable row level security;

alter table "public"."hackathons" enable row level security;

alter table "public"."job_market_data" enable row level security;

alter table "public"."knowledge_items" drop column "is_read";

alter table "public"."projects" drop column "category_path";

alter table "public"."projects" drop column "progress_metadata";

alter table "public"."projects" drop column "semantic_embedding";

alter table "public"."projects" add column "progress" numeric(5,2) default 0;

alter table "public"."prompt_executions" drop column "prompt_chain_id";

alter table "public"."prompt_executions" alter column "ai_model" set default 'gpt-4'::text;

alter table "public"."prompt_executions" alter column "ai_model" drop not null;

alter table "public"."prompt_executions" alter column "ai_model" set data type text using "ai_model"::text;

alter table "public"."prompt_executions" alter column "execution_time" set default 0;

alter table "public"."prompt_executions" alter column "input_variables" set default '{}'::jsonb;

alter table "public"."prompt_executions" alter column "response_data" set default '{}'::jsonb;

alter table "public"."prompt_executions" alter column "status" set default 'completed'::text;

alter table "public"."prompt_executions" alter column "status" set data type text using "status"::text;

alter table "public"."prompt_executions" alter column "token_usage" set default '{}'::jsonb;

alter table "public"."prompt_templates" drop column "category_path";

alter table "public"."prompt_templates" drop column "difficulty_level";

alter table "public"."prompt_templates" drop column "search_vector";

alter table "public"."prompt_templates" drop column "semantic_embedding";

alter table "public"."prompt_templates" add column "updated_by" uuid;

alter table "public"."prompt_templates" alter column "category" set default 'general'::text;

alter table "public"."prompt_templates" alter column "category" set data type text using "category"::text;

alter table "public"."prompt_templates" alter column "is_public" set default true;

alter table "public"."prompt_templates" alter column "name" set data type text using "name"::text;

alter table "public"."stock_data" enable row level security;

alter table "public"."todos" drop column "is_complete";

alter table "public"."todos" add column "completed" boolean default false;

alter table "public"."todos" alter column "text" set not null;

alter table "public"."users" enable row level security;

CREATE INDEX idx_ai_content_created_at ON public.ai_content USING btree (created_at DESC);

CREATE INDEX idx_ai_content_type_pub ON public.ai_content USING btree (content_type, published_at DESC);

CREATE INDEX idx_exec_user_template ON public.prompt_executions USING btree (user_id, prompt_template_id);

CREATE INDEX idx_fav_user_template ON public.prompt_favorites USING btree (user_id, prompt_template_id);

CREATE INDEX idx_projects_progress ON public.projects USING btree (progress);

CREATE INDEX idx_projects_user ON public.projects USING btree (user_id);

CREATE INDEX idx_projects_user_updated ON public.projects USING btree (user_id, updated_at DESC);

CREATE INDEX idx_prompt_executions_user_template ON public.prompt_executions USING btree (user_id, prompt_template_id, created_at DESC);

CREATE INDEX idx_stock_data_symbol ON public.stock_data USING btree (symbol);

CREATE INDEX idx_templates_public ON public.prompt_templates USING btree (is_public, user_id);

CREATE INDEX idx_prompt_templates_public ON public.prompt_templates USING btree (is_public, user_id);

alter table "public"."projects" add constraint "projects_progress_check" CHECK (((progress >= (0)::numeric) AND (progress <= (100)::numeric))) not valid;

alter table "public"."projects" validate constraint "projects_progress_check";

alter table "public"."prompt_templates" add constraint "prompt_templates_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."prompt_templates" validate constraint "prompt_templates_updated_by_fkey";

alter table "public"."knowledge_items" add constraint "knowledge_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."knowledge_items" validate constraint "knowledge_items_user_id_fkey";

alter table "public"."newsletters" add constraint "newsletters_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."newsletters" validate constraint "newsletters_user_id_fkey";

alter table "public"."projects" add constraint "projects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "projects_user_id_fkey";

alter table "public"."prompt_library" add constraint "prompt_library_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."prompt_library" validate constraint "prompt_library_user_id_fkey";

alter table "public"."user_analytics" add constraint "user_analytics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."user_analytics" validate constraint "user_analytics_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.semantic_search(query_embedding vector, similarity_threshold double precision DEFAULT 0.7)
 RETURNS TABLE(id uuid, title text, content text, similarity double precision)
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY 
    SELECT 
        ai_content.id, 
        ai_content.title, 
        ai_content.content,
        1 - (ai_content.embedding <=> query_embedding) AS similarity
    FROM ai_content
    WHERE ai_content.embedding IS NOT NULL 
    AND 1 - (ai_content.embedding <=> query_embedding) > similarity_threshold
    ORDER BY similarity DESC
    LIMIT 10;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_ai_content_embedding()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- Explicitly set a minimal, secure search path
    SET search_path TO pg_catalog, public;
    
    -- Your existing function logic here
    
    -- Reset the search path to prevent side effects
    RESET search_path;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_ai_content_embedding(content_id uuid, new_embedding vector)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    UPDATE ai_content 
    SET embedding = new_embedding 
    WHERE id = content_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = (SELECT auth.uid());
  RETURN NEW;
END;
$function$
;


  create policy "Embeddings are public"
  on "public"."ai_content"
  as permissive
  for select
  to public
using (true);



  create policy "Public can view ai_content"
  on "public"."ai_content"
  as permissive
  for select
  to public
using (true);



  create policy "knowledge_access_policy"
  on "public"."knowledge_items"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users own newsletters"
  on "public"."newsletters"
  as permissive
  for all
  to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "newsletter_access_policy"
  on "public"."newsletters"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users can only delete own projects"
  on "public"."projects"
  as permissive
  for delete
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can only insert/update own projects"
  on "public"."projects"
  as permissive
  for insert
  to authenticated
with check (((user_id IS NULL) OR (user_id = ( SELECT auth.uid() AS uid))));



  create policy "Users can only select own projects"
  on "public"."projects"
  as permissive
  for select
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can only update own projects"
  on "public"."projects"
  as permissive
  for update
  to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can update project progress"
  on "public"."projects"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check (((progress >= (0)::numeric) AND (progress <= (100)::numeric) AND (( SELECT auth.uid() AS uid) = user_id)));



  create policy "Users own projects"
  on "public"."projects"
  as permissive
  for all
  to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "project_access_policy"
  on "public"."projects"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Users own executions"
  on "public"."prompt_executions"
  as permissive
  for all
  to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users own favorites"
  on "public"."prompt_favorites"
  as permissive
  for all
  to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "prompt_delete_policy"
  on "public"."prompt_library"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "prompt_modify_policy"
  on "public"."prompt_library"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "prompt_select_policy"
  on "public"."prompt_library"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR (is_public = true)));



  create policy "prompt_update_policy"
  on "public"."prompt_library"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Owners can delete prompts"
  on "public"."prompt_templates"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Owners can update prompts"
  on "public"."prompt_templates"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Public can view public prompts"
  on "public"."prompt_templates"
  as permissive
  for select
  to public
using (((is_public = true) OR (( SELECT auth.uid() AS uid) = user_id)));



  create policy "Users can create prompts"
  on "public"."prompt_templates"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Public can view stock_data"
  on "public"."stock_data"
  as permissive
  for select
  to public
using (true);



  create policy "analytics_access_policy"
  on "public"."user_analytics"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_prompt_templates_updated_at BEFORE UPDATE ON public.prompt_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add missing RLS policies for tables with RLS enabled but no policies

CREATE POLICY "Public can view AI companies" ON ai_companies
  AS PERMISSIVE
  FOR SELECT 
  TO public
  USING (true);

CREATE POLICY "Public can view hackathons" ON hackathons
  AS PERMISSIVE  
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view job market data" ON job_market_data
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can access their own data" ON users
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);


