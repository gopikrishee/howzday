/**
 * Mobile & Browser Push Notification Service for HowZDay
 * Handles mobile push notifications via ServiceWorker / Notification API
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

const PUSHED_NOTIFS_PREFIX = 'howzday_pushed_checkins_';

export const notificationService = {
  /**
   * Check whether the browser or mobile environment supports notifications
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  /**
   * Check if current user agent is a mobile device
   */
  isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(ua) || (isTouch && window.innerWidth <= 768);
  },

  /**
   * Get current permission state
   */
  getPermission(): NotificationPermissionState {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  /**
   * Request push notification permission from the user
   */
  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      return result;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return Notification.permission || 'denied';
    }
  },

  /**
   * Check if a specific check-in notification has already been pushed to this device today
   */
  hasPushedToday(notifId: string, dateStr: string): boolean {
    try {
      const key = `${PUSHED_NOTIFS_PREFIX}${dateStr}`;
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const list: string[] = JSON.parse(raw);
      return list.includes(notifId);
    } catch {
      return false;
    }
  },

  /**
   * Mark a notification as pushed for today to guarantee once-per-day behavior
   */
  markPushedToday(notifId: string, dateStr: string): void {
    try {
      const key = `${PUSHED_NOTIFS_PREFIX}${dateStr}`;
      const raw = localStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(notifId)) {
        list.push(notifId);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed to record pushed notification:', e);
    }
  },

  /**
   * Push a system notification to the mobile device / desktop
   */
  async pushMobileNotification(
    title: string,
    body: string,
    options?: {
      tag?: string;
      url?: string;
      icon?: string;
      badge?: string;
    }
  ): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    const notificationOptions: NotificationOptions = {
      body,
      icon: options?.icon || './pwa-192x192.png',
      badge: options?.badge || './favicon.svg',
      tag: options?.tag, // Prevents duplicate notices in mobile tray
      data: {
        url: options?.url || './',
        type: 'crood_checkin',
      },
    };

    // Attempt ServiceWorker showNotification first (essential for mobile Chrome / Android / PWA)
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(title, notificationOptions);
          return true;
        }
      }
    } catch (swErr) {
      console.warn('ServiceWorker showNotification failed, falling back to Notification API:', swErr);
    }

    // Fallback to Window Notification API
    try {
      const notif = new Notification(title, notificationOptions);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (winErr) {
      console.warn('Failed to dispatch mobile notification via Notification API:', winErr);
      return false;
    }
  },
};
