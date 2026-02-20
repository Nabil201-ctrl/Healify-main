/**
 * A tiny event bridge that lets non-React code (e.g. Axios interceptors)
 * trigger auth events that the AuthProvider can react to.
 *
 * Usage:
 *   // In axios interceptor
 *   authEvents.emit('unauthorized');
 *
 *   // In AuthProvider
 *   authEvents.on('unauthorized', handleUnauthorized);
 *   authEvents.off('unauthorized', handleUnauthorized);
 */

type AuthEventType = 'unauthorized';
type Listener = () => void;

const listeners: Record<string, Listener[]> = {};

export const authEvents = {
    on(event: AuthEventType, listener: Listener) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(listener);
    },
    off(event: AuthEventType, listener: Listener) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(l => l !== listener);
    },
    emit(event: AuthEventType) {
        (listeners[event] ?? []).forEach(l => l());
    },
};
