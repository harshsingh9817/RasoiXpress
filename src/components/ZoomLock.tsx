
"use client";

import { useEffect } from 'react';

const ZoomLock = () => {
  useEffect(() => {
    const lockZoom = () => {
      // Block pinch zoom on desktop trackpads
      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
          e.preventDefault();
        }
      };

      // Block gesture events on touch devices
      const preventGesture = (e: Event) => e.preventDefault();

      // Block double-tap zoom
      let lastTouchEnd = 0;
      const handleTouchEnd = (e: TouchEvent) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      };

      // Block pinch-zoom on touch devices
      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };
      
      // Block multi-touch start on iOS PWAs
      const handleTouchStart = (e: TouchEvent) => {
          if (e.touches.length > 1) {
              e.preventDefault();
          }
      }

      document.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('gesturestart', preventGesture, { passive: false });
      document.addEventListener('gesturechange', preventGesture, { passive: false });
      document.addEventListener('gestureend', preventGesture, { passive: false });
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
    };

    // Initial attachment
    lockZoom();

    // Re-attach on visibility change and focus to combat potential overrides
    document.addEventListener('visibilitychange', lockZoom);
    window.addEventListener('focus', lockZoom);

    // Final failsafe: A watchdog to reset zoom if it ever changes
    const viewportWatchdog = setInterval(() => {
      if (window.visualViewport && window.visualViewport.scale !== 1) {
        // This is a forceful reset. It's a fallback, not the primary method.
        (document.body.style as any).zoom = 1;
      }
    }, 250); // Check every 250ms

    // Cleanup function to remove all listeners and the interval
    return () => {
      // Note: We don't remove the listeners here because they are stateless 
      // and re-attaching them via lockZoom() is harmless. Removing them could
      // cause a brief window where zoom is possible if the component re-renders.
      // The watchdog, however, should be cleaned up.
      clearInterval(viewportWatchdog);
      document.removeEventListener('visibilitychange', lockZoom);
      window.removeEventListener('focus', lockZoom);
    };
  }, []);

  return null;
};

export default ZoomLock;
