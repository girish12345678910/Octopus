// Lazy loading for components
import { lazy } from 'react';

export const LazyComponents = {
  ChatRoom: lazy(() => import('../components/ChatRoom/ChatRoom')),
  SettingsPanel: lazy(() => import('../components/Settings/SettingsPanel'))
};

// Image optimization
export const optimizeImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Connection quality detection
export const detectConnectionQuality = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return 'unknown';
  
  const { effectiveType, downlink } = connection;
  
  if (effectiveType === '4g' && downlink > 10) return 'excellent';
  if (effectiveType === '4g' || downlink > 5) return 'good';
  if (effectiveType === '3g' || downlink > 1) return 'fair';
  return 'poor';
};
