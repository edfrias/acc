export const performanceUtils = {
  measureLCP: () => {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              console.log('LCP:', entry.startTime, 'ms');
            }
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('Performance observation not supported');
      }
    }
  },

  preloadCriticalResources: () => {
    const criticalImages = [
      '/assets/images/logo_acc.jpg'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  },

  optimizeFontLoading: () => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    }
  }
};

export const initPerformance = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceUtils.measureLCP();
      performanceUtils.preloadCriticalResources();
      performanceUtils.optimizeFontLoading();
    });
  } else {
    performanceUtils.measureLCP();
    performanceUtils.preloadCriticalResources();
    performanceUtils.optimizeFontLoading();
  }
};
