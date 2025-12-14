import React from 'react';
import { GeneratedPost, Platform } from '../types';
import { Linkedin, Twitter, Instagram, Maximize2, RefreshCw } from 'lucide-react';

interface PlatformCardProps {
  post: GeneratedPost;
  onExpand: () => void;
  isLoadingImage?: boolean;
}

const PlatformCard: React.FC<PlatformCardProps> = ({ post, onExpand, isLoadingImage }) => {
  const getIcon = () => {
    switch (post.platform) {
      case Platform.LINKEDIN: return <Linkedin className="w-5 h-5 text-blue-700" />;
      case Platform.TWITTER: return <Twitter className="w-5 h-5 text-sky-500" />;
      case Platform.INSTAGRAM: return <Instagram className="w-5 h-5 text-pink-600" />;
    }
  };

  const getBorderColor = () => {
    switch (post.platform) {
      case Platform.LINKEDIN: return 'border-blue-100 hover:border-blue-300';
      case Platform.TWITTER: return 'border-sky-100 hover:border-sky-300';
      case Platform.INSTAGRAM: return 'border-pink-100 hover:border-pink-300';
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border ${getBorderColor()} p-5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col h-full`}
      onClick={onExpand}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          {getIcon()}
          <span>{post.platform}</span>
        </div>
        <Maximize2 className="w-4 h-4 text-slate-400" />
      </div>

      <div className="mb-4 relative rounded-lg overflow-hidden bg-slate-100 aspect-video group">
        {isLoadingImage ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : post.imageUrl ? (
          <img src={post.imageUrl} alt="Generated" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            Image Pending...
          </div>
        )}
      </div>

      <p className="text-slate-600 text-sm line-clamp-3 mb-3 flex-grow font-medium">
        {post.content}
      </p>

      <div className="flex flex-wrap gap-1 mt-auto">
        {post.hashtags.slice(0, 3).map((tag, idx) => (
          <span key={idx} className="text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">
            {tag}
          </span>
        ))}
        {post.hashtags.length > 3 && (
            <span className="text-xs text-slate-400 px-1 py-1">+{post.hashtags.length - 3}</span>
        )}
      </div>
    </div>
  );
};

export default PlatformCard;
