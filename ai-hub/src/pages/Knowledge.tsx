import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { KnowledgeItem } from '@/lib/supabase';
import { BookOpen, Search, Star, Plus, Tag, FileText, Lightbulb } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NewKnowledgeItemModal } from '@/components/NewKnowledgeItemModal';

export function Knowledge() {
  const { user } = useAuth();
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewItemModal, setShowNewItemModal] = useState(false);

  useEffect(() => {
    const fetchKnowledgeItems = async () => {
      try {
        const { data, error } = await supabase
          .from('knowledge_items')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setKnowledgeItems(data || []);
      } catch (error) {
        console.error('Error fetching knowledge items:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchKnowledgeItems();
    }
  }, [user]);

  const toggleFavorite = async (itemId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('knowledge_items')
        .update({ is_favorite: !isFavorite })
        .eq('id', itemId);

      if (error) throw error;

      setKnowledgeItems(prev =>
        prev.map(item => (item.id === itemId ? { ...item, is_favorite: !isFavorite } : item))
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredKnowledgeItems = knowledgeItems
    .filter(item => !selectedCategory || item.item_type === selectedCategory)
    .filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.content && item.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Knowledge Base</h1>
            <p className="text-gray-400">
              Organize and search your AI research, prompts, and templates
            </p>
          </div>
          <button onClick={() => setShowNewItemModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Add Knowledge
          </button>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div onClick={() => setSelectedCategory(null)} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
            <h3 className="text-white font-semibold">All</h3>
          </div>
          <div onClick={() => setSelectedCategory('paper')} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
            <h3 className="text-white font-semibold">Research Papers</h3>
          </div>
          <div onClick={() => setSelectedCategory('prompt')} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
            <h3 className="text-white font-semibold">AI Prompts</h3>
          </div>
          <div onClick={() => setSelectedCategory('template')} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
            <h3 className="text-white font-semibold">Code Templates</h3>
          </div>
          <div onClick={() => setSelectedCategory('note')} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
            <h3 className="text-white font-semibold">Notes</h3>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search your knowledge base..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKnowledgeItems.map(item => (
              <div key={item.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-white mb-2 pr-2">{item.title}</h3>
                  <Star
                    className={`w-5 h-5 cursor-pointer ${item.is_favorite ? 'text-yellow-400 fill-current' : 'text-gray-500'}`}
                    onClick={() => toggleFavorite(item.id, item.is_favorite)}
                  />
                </div>
                <p className="text-gray-400 text-sm">{item.item_type}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <NewKnowledgeItemModal
        isOpen={showNewItemModal}
        onClose={() => setShowNewItemModal(false)}
        onKnowledgeItemCreated={() => {
          fetchKnowledgeItems();
          setShowNewItemModal(false);
        }}
      />
    </Layout>
  );
}