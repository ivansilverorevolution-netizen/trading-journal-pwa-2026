
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevenir que el navegador muestre el prompt automáticamente
      e.preventDefault();
      // Guardar el evento para dispararlo luego
      setDeferredPrompt(e);
      
      // Verificar si el usuario ya lo cerró anteriormente en esta "vida" de la app
      const isDismissed = localStorage.getItem('pwa_banner_dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detectar si ya está instalada (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt nativo
    deferredPrompt.prompt();

    // Esperar a la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    // Limpiar el prompt diferido
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[100] animate-in slide-in-from-bottom-10 duration-700 ease-out">
      <div className="bg-blue-600/30 backdrop-blur-2xl border border-blue-400/30 rounded-[2rem] p-5 shadow-2xl shadow-blue-900/40 relative overflow-hidden group">
        {/* Decorative background light */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/20 blur-3xl rounded-full group-hover:bg-blue-400/30 transition-colors"></div>
        
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1 transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div className="bg-blue-500 text-white p-3 rounded-2xl shadow-lg shadow-blue-600/40">
            <Download size={24} className="animate-bounce" />
          </div>
          
          <div className="flex-1 pr-6">
            <h3 className="text-white font-black text-lg leading-tight tracking-tight">
              Instala la Academia
            </h3>
            <p className="text-blue-100/80 text-xs font-medium mt-1 leading-relaxed">
              Acceso rápido desde tu pantalla de inicio y mejor rendimiento.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button 
            onClick={handleInstallClick}
            className="flex-1 bg-white text-blue-700 font-black py-3 rounded-xl text-sm shadow-xl shadow-white/10 hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Smartphone size={16} className="md:hidden" />
            <Monitor size={16} className="hidden md:block" />
            Instalar App
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
