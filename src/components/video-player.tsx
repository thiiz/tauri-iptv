import Hls from 'hls.js';
import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Video is ready to play
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <div className={`w-full ${className}`}>
      <video
        ref={videoRef}
        controls
        className='aspect-video w-full bg-black'
        preload='metadata'
      />
    </div>
  );
};

export default VideoPlayer;
