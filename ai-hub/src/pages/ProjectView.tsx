import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function ProjectView() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-white mb-2">Project not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <span className={`text-sm px-3 py-1 rounded-full bg-gray-800 text-gray-300`}>
                {project.status}
              </span>
            </div>
            <p className="text-gray-400 mb-6">{project.description}</p>

            {project.progress && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
                <ul className="text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <strong>Created:</strong>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </li>
                  {project.github_url && (
                    <li className="flex items-center gap-2">
                      <strong>GitHub:</strong>
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {project.github_url}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
