import { useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  type: NotificationType;
  message: string;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = useCallback((type: NotificationType, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  return { notification, showNotification, setNotification };
}
