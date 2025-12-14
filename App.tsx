import React, { useState } from 'react';
import { CampaignData, Tone, GeneratedPost, Platform, AspectRatio } from './types';
import { generateCampaignText, generateImage } from './services/geminiService';
import PlatformCard from './components/PlatformCard';
import DetailedView from './components/DetailedView';
import { Sparkles, Send, Layout, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.PROFESSIONAL);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [selectedPost, setSelectedPost] = useState<GeneratedPost | null>(null);
  const [loadingImages, setLoadingImages] = useState<Record<Platform, boolean>>({
    [Platform.LINKEDIN]: false,
    [Platform.TWITTER]: false,
    [Platform.INSTAGRAM]: false
  });

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    
    setIsGenerating(true);
    setCampaign(null);
    setLoadingImages({
       [Platform.LINKEDIN]: true,
       [Platform.TWITTER]: true,
       [Platform.INSTAGRAM]: true
    });

    try {
      // 1. Generate Text Content
      const textData = await generateCampaignText(idea, tone);
      
      const initialCampaign: CampaignData = {
          linkedin: { ...textData.linkedin },
          twitter: { ...textData.twitter },
          instagram: { ...textData.instagram }
      };
      setCampaign(initialCampaign);
      setIsGenerating(false); // Text is ready, images load in bg

      // 2. Trigger Parallel Image Generation
      // We don't await these here to allow UI to show text immediately
      generateAndAttachImage(initialCampaign.linkedin);
      generateAndAttachImage(initialCampaign.twitter);
      generateAndAttachImage(initialCampaign.instagram);

    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate campaign. Please check your API key and try again.");
      setIsGenerating(false);
      setLoadingImages({
         [Platform.LINKEDIN]: false,
         [Platform.TWITTER]: false,
         [Platform.INSTAGRAM]: false
      });
    }
  };

  const generateAndAttachImage = async (post: GeneratedPost) => {
      try {
          const imageUrl = await generateImage(post.imagePrompt, post.aspectRatio);
          
          setCampaign(prev => {
              if (!prev) return null;
              // Map platform to key
              const key = post.platform === Platform.LINKEDIN ? 'linkedin' : 
                          post.platform === Platform.TWITTER ? 'twitter' : 'instagram';
              
              return {
                  ...prev,
                  [key]: { ...prev[key as keyof CampaignData], imageUrl }
              };
          });
      } catch (e) {
          console.error(`Image generation failed for ${post.platform}`, e);
      } finally {
          setLoadingImages(prev => ({ ...prev, [post.platform]: false }));
      }
  };

  const handleUpdatePost = (updated: GeneratedPost) => {
    setCampaign(prev => {
        if (!prev) return null;
        const key = updated.platform === Platform.LINKEDIN ? 'linkedin' : 
                    updated.platform === Platform.TWITTER ? 'twitter' : 'instagram';
        return {
            ...prev,
            [key]: updated
        };
    });
    setSelectedPost(updated); // Update the modal view too
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <Layout className="w-5 h-5" />
             </div>
             <h1 className="font-bold text-xl text-slate-800 tracking-tight">SocialSync AI</h1>
           </div>
           <div className="text-sm text-slate-500 hidden sm:block">
              Powered by Google Gemini 2.5 Flash & 3 Pro
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-8">
        
        {/* Input Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 transition-all">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
               <h2 className="text-3xl font-bold text-slate-900">Create content that connects</h2>
               <p className="text-slate-500">Generate tailored posts and images for LinkedIn, Twitter, and Instagram in seconds.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="idea" className="block text-sm font-medium text-slate-700 mb-1">What's on your mind?</label>
                <textarea
                  id="idea"
                  rows={3}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-4 border bg-slate-50 text-slate-900 resize-none"
                  placeholder="e.g., We just launched a new eco-friendly coffee cup line..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Tone</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                       {Object.values(Tone).map((t) => (
                         <button
                           key={t}
                           onClick={() => setTone(t)}
                           className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                             tone === t 
                               ? 'bg-indigo-600 text-white border-indigo-600' 
                               : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                           }`}
                         >
                           {t}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !idea.trim()}
                className="w-full py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 font-semibold text-lg"
              >
                {isGenerating ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin" />
                     Generating Magic...
                   </>
                ) : (
                   <>
                     <Sparkles className="w-5 h-5" />
                     Generate Campaign
                   </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Results Section */}
        {campaign && (
           <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PlatformCard 
                 post={campaign.linkedin} 
                 isLoadingImage={loadingImages[Platform.LINKEDIN]}
                 onExpand={() => setSelectedPost(campaign.linkedin)} 
              />
              <PlatformCard 
                 post={campaign.twitter} 
                 isLoadingImage={loadingImages[Platform.TWITTER]}
                 onExpand={() => setSelectedPost(campaign.twitter)} 
              />
              <PlatformCard 
                 post={campaign.instagram} 
                 isLoadingImage={loadingImages[Platform.INSTAGRAM]}
                 onExpand={() => setSelectedPost(campaign.instagram)} 
              />
           </section>
        )}
      </main>

      {/* Detail Modal */}
      {selectedPost && (
        <DetailedView 
           post={selectedPost} 
           onClose={() => setSelectedPost(null)} 
           onUpdatePost={handleUpdatePost}
        />
      )}
    </div>
  );
};

export default App;
