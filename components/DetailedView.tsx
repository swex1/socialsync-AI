import React, { useState, useEffect } from 'react';
import { GeneratedPost, ImageSize, AspectRatio, VeoState } from '../types';
import { X, RefreshCw, Video, Download, Sparkles, AlertCircle } from 'lucide-react';
import { generateImage, generateVideo, checkApiKeySelection, requestApiKeySelection } from '../services/geminiService';

interface DetailedViewProps {
  post: GeneratedPost;
  onClose: () => void;
  onUpdatePost: (updatedPost: GeneratedPost) => void;
}

const DetailedView: React.FC<DetailedViewProps> = ({ post, onClose, onUpdatePost }) => {
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(post.aspectRatio);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  
  const [veoState, setVeoState] = useState<VeoState>({
    isGenerating: false,
    videoUrl: null,
    error: null,
    progressMessage: ''
  });

  const handleRegenerateImage = async () => {
    setIsRegeneratingImage(true);
    try {
      // Check for paid key if requesting high res
      if (imageSize !== ImageSize.SIZE_1K) {
         const hasKey = await checkApiKeySelection();
         if (!hasKey) {
             await requestApiKeySelection();
             // Assuming success after modal interaction for simplicity, 
             // in production might need a listener or callback
         }
      }

      const newImageUrl = await generateImage(post.imagePrompt, aspectRatio, imageSize);
      onUpdatePost({ ...post, imageUrl: newImageUrl, aspectRatio });
    } catch (err) {
      console.error(err);
      alert("Failed to regenerate image. Ensure you have access to the model.");
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!post.imageUrl) return;

    // Veo requires paid key check
    const hasKey = await checkApiKeySelection();
    if (!hasKey) {
        await requestApiKeySelection();
        // Optimistically proceed or ask user to click again. 
        // For better UX, let's stop and ask to click again to be safe.
        return;
    }

    setVeoState({ isGenerating: true, videoUrl: null, error: null, progressMessage: 'Initializing Veo...' });
    
    try {
        // Veo supports 16:9 or 9:16
        const videoRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
        
        setVeoState(prev => ({ ...prev, progressMessage: 'Generating video (this takes a minute)...' }));
        
        const videoUrl = await generateVideo(post.imageUrl, `Animate this ${post.platform} post image cinematically`, videoRatio);
        
        setVeoState({ 
            isGenerating: false, 
            videoUrl, 
            error: null, 
            progressMessage: '' 
        });

    } catch (e: any) {
        setVeoState({ 
            isGenerating: false, 
            videoUrl: null, 
            error: e.message || "Video generation failed", 
            progressMessage: '' 
        });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Image & Media */}
        <div className="w-full md:w-1/2 bg-slate-100 p-6 flex flex-col overflow-y-auto border-r border-slate-200">
          <div className="flex justify-between items-center mb-4 md:hidden">
            <h3 className="font-bold text-lg text-slate-800">{post.platform} Post</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200"><X /></button>
          </div>

          <div className="rounded-xl overflow-hidden shadow-sm bg-white border border-slate-200 mb-6 relative group">
             {post.imageUrl ? (
                veoState.videoUrl ? (
                   <video controls className="w-full h-auto" autoPlay loop src={veoState.videoUrl} /> 
                ) : (
                   <img src={post.imageUrl} alt="Content" className="w-full h-auto object-contain" />
                )
             ) : (
                 <div className="aspect-square flex items-center justify-center text-slate-400">No Image Available</div>
             )}
             
             {isRegeneratingImage && (
                 <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                     <RefreshCw className="animate-spin text-indigo-600 w-8 h-8" />
                 </div>
             )}
          </div>

          {/* Controls */}
          <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
             <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Image Settings</label>
                <div className="grid grid-cols-2 gap-3">
                    <select 
                        value={imageSize} 
                        onChange={(e) => setImageSize(e.target.value as ImageSize)}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-slate-50"
                    >
                        <option value={ImageSize.SIZE_1K}>1K (Standard)</option>
                        <option value={ImageSize.SIZE_2K}>2K (High Res)</option>
                        <option value={ImageSize.SIZE_4K}>4K (Ultra)</option>
                    </select>

                    <select 
                        value={aspectRatio} 
                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-slate-50"
                    >
                        <option value="1:1">1:1 (Square)</option>
                        <option value="4:3">4:3 (Landscape)</option>
                        <option value="3:4">3:4 (Portrait)</option>
                        <option value="16:9">16:9 (Widescreen)</option>
                        <option value="9:16">9:16 (Story/Reel)</option>
                    </select>
                </div>
                
                <button 
                    onClick={handleRegenerateImage}
                    disabled={isRegeneratingImage || veoState.isGenerating}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                    <RefreshCw className={`w-4 h-4 ${isRegeneratingImage ? 'animate-spin' : ''}`} />
                    Regenerate Image
                </button>
             </div>

             <hr className="border-slate-100" />

             <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                        <Video className="w-3 h-3" /> Veo Animation
                    </label>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 underline">Requires Paid Key</a>
                 </div>
                 
                 {veoState.error && (
                     <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {veoState.error}
                     </div>
                 )}

                 {veoState.isGenerating ? (
                      <div className="w-full py-3 bg-slate-100 text-slate-600 rounded-lg text-sm text-center animate-pulse border border-slate-200">
                          {veoState.progressMessage}
                      </div>
                 ) : (
                     <button 
                        onClick={handleGenerateVideo}
                        disabled={!post.imageUrl || isRegeneratingImage}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-lg hover:from-pink-600 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md text-sm font-medium"
                     >
                        <Sparkles className="w-4 h-4" />
                        Animate with Veo
                     </button>
                 )}
                 
                 {veoState.videoUrl && (
                     <a 
                        href={veoState.videoUrl} 
                        download="social-sync-video.mp4"
                        className="flex items-center justify-center gap-2 w-full py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                     >
                        <Download className="w-4 h-4" /> Download Video
                     </a>
                 )}
             </div>
          </div>
        </div>

        {/* Right Side: Text Content */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-full bg-white relative">
           <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 hidden md:block">
             <X className="w-6 h-6" />
           </button>

           <div className="mb-6">
             <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider">
               {post.platform}
             </span>
             <h2 className="text-2xl font-bold text-slate-900 mt-2">Drafted Content</h2>
           </div>

           <div className="flex-grow overflow-y-auto pr-2">
              <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Post Caption</label>
                      <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium font-sans">
                          {post.content}
                      </p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Suggested Hashtags</label>
                      <div className="flex flex-wrap gap-2">
                          {post.hashtags.map(t => (
                              <span key={t} className="text-indigo-600 bg-white border border-indigo-100 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                                  {t.startsWith('#') ? t : `#${t}`}
                              </span>
                          ))}
                      </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">AI Image Prompt</label>
                       <p className="text-slate-600 text-sm italic">
                           "{post.imagePrompt}"
                       </p>
                  </div>
              </div>
           </div>
           
           <div className="mt-6 pt-6 border-t border-slate-100 text-center text-slate-400 text-sm">
               Generated by Gemini 2.5 Flash & Gemini 3 Pro
           </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedView;
