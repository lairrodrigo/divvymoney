import React, { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000000] animate-out fade-out duration-1000 fill-mode-forwards">
      <div className="relative h-36 w-36 animate-in zoom-in-50 duration-700">
        <img 
          src="/logo.png" 
          alt="DivvyMoney Logo" 
          className="h-full w-full object-contain filter drop-shadow-2xl"
        />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-xl font-bold tracking-tighter text-white">DivvyMoney</span>
        </div>
      </div>
    </div>
  );
}
