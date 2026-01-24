import { useCallback } from 'react';

const useNotification = () => {
  const showNotification = useCallback((title, body, type = 'success') => {
    if (window.showNotification) {
      window.showNotification({
        title,
        body,
        type
      });
    } else {
      // Fallback на консоль в development режиме
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${type.toUpperCase()}] ${title}: ${body}`);
      }
    }
  }, []);

  const showSuccess = useCallback((title, body) => {
    showNotification(title, body, 'success');
  }, [showNotification]);

  const showError = useCallback((title, body) => {
    showNotification(title, body, 'error');
  }, [showNotification]);

  const showInfo = useCallback((title, body) => {
    showNotification(title, body, 'info');
  }, [showNotification]);

  return {
    showNotification,
    showSuccess,
    showError,
    showInfo
  };
};

export default useNotification;