import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    Calendly: any;
  }
}

const CalendlyWidget = () => {
  const location = useLocation();

  useEffect(() => {
    // Only show Calendly widget on homepage
    if (location.pathname !== '/') {
      // Clean up any existing Calendly widgets
      const calendlyBadge = document.querySelector('.calendly-badge-widget');
      if (calendlyBadge) {
        calendlyBadge.remove();
      }
      
      const calendlyScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      const calendlyStyle = document.querySelector('link[href="https://assets.calendly.com/assets/external/widget.css"]');
      
      if (calendlyScript) calendlyScript.remove();
      if (calendlyStyle) calendlyStyle.remove();
      
      return;
    }

    // Load Calendly CSS
    const link = document.createElement('link');
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load Calendly JS
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    
    script.onload = () => {
      if (window.Calendly) {
        window.Calendly.initBadgeWidget({
          url: 'https://calendly.com/kris-mediastreet/30min',
          text: 'Book a Live Demo',
          color: '#0069ff',
          textColor: '#ffffff',
          branding: true
        });
      }
    };
    
    document.body.appendChild(script);

    // Cleanup function
    return () => {
      // Remove Calendly widget if it exists
      const calendlyBadge = document.querySelector('.calendly-badge-widget');
      if (calendlyBadge) {
        calendlyBadge.remove();
      }
      
      // Remove scripts and styles
      const calendlyScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      const calendlyStyle = document.querySelector('link[href="https://assets.calendly.com/assets/external/widget.css"]');
      
      if (calendlyScript) calendlyScript.remove();
      if (calendlyStyle) calendlyStyle.remove();
      
      // Destroy Calendly instance if it exists
      if (window.Calendly && window.Calendly.destroyBadgeWidget) {
        try {
          window.Calendly.destroyBadgeWidget();
        } catch (e) {
          console.log('Calendly cleanup:', e);
        }
      }
    };
  }, [location.pathname]);

  return null;
};

export default CalendlyWidget;