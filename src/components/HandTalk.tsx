'use client';

import { useEffect } from 'react';

const TradutorLibras = () => {
  useEffect(() => {
    // Carregar script do HandTalk
    const script = document.createElement('script');
    script.src = 'https://plugin.handtalk.me/web/latest/handtalk.min.js';
    script.async = true;

    script.onload = () => {
      // Inicializar HandTalk
      if (window.HT) {
        window.ht = new window.HT({
          token: '9fba9e0aeb6cfa1c845289baf93a6b30',
          avatar: 'MAYA'

        });
      }
    };

    document.head.appendChild(script);
  }, []);

  return null;
};

export default TradutorLibras;

// Tipos
declare global {
  interface Window {
    HT: any;
    ht: any;
  }
}
