import React from 'react';

export const YouTubeEmbed: React.FC<{ videoId: string }> = ({ videoId }) => (
  <div className="relative mb-4 overflow-hidden rounded-lg border border-gray-200">
    <div className="relative pb-[56.25%]">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?si=hZtyMKQ4jBS6qXg3`}
        title="YouTube video player"
        className="absolute inset-0 h-full w-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  </div>
);

export const markdownComponents = {
  p: ({ children }: { children: React.ReactNode }) => {
    // Handle array of children
    const content = Array.isArray(children) ? children.join('') : children;
    
    if (typeof content === 'string') {
      // Only match :youtube[ID] format
      const youtubeMatch = content.match(/:youtube\[([a-zA-Z0-9_-]{11})\]/);
      if (youtubeMatch) {
        return <YouTubeEmbed videoId={youtubeMatch[1]} />;
      }
    }
    return <p>{children}</p>;
  }
};