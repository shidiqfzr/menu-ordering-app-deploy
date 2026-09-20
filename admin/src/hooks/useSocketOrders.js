import { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useSocket } from '../context/SocketContext';

/**
 * Custom Hook: useSocketOrders
 * Connects to the Socket.IO instance to handle real-time push events for orders,
 * triggers audio alerts for new orders, syncs multi-tab instances, and runs a fallback safety heartbeat.
 */
export const useSocketOrders = ({
  onRefresh,
  playOrderChime,
  soundEnabled = true,
  viewScope = 'active',
}) => {
  const { socket, isConnected } = useSocket();

  // Helper to trigger multi-tab update
  const broadcastOrderSync = useCallback(() => {
    try {
      localStorage.setItem('bujang_orders_sync', Date.now().toString());
    } catch {
      // ignore storage quota issues
    }
    window.dispatchEvent(new CustomEvent('orders-changed'));
  }, []);

  // 1. Socket.IO Event Listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order) => {
      console.log('[useSocketOrders] Real-time new order received:', order);

      if (playOrderChime && soundEnabled) {
        playOrderChime();
      }

      const tableText = order.tableNumber ? `Meja ${order.tableNumber}` : 'Takeaway';
      const amountText = order.amount ? ` (Rp ${Number(order.amount).toLocaleString('id-ID')})` : '';
      toast.info(`🔔 Pesanan Baru: ${tableText}${amountText}!`, {
        toastId: `new-order-${order._id || Date.now()}`,
        autoClose: 4000,
      });

      if (onRefresh) onRefresh(true);
    };

    const handleOrderUpdated = (data) => {
      console.log('[useSocketOrders] Real-time order status/payment updated:', data);
      if (onRefresh) onRefresh(true);
    };

    const handleOrderDeleted = (data) => {
      console.log('[useSocketOrders] Real-time order deleted:', data);
      if (onRefresh) onRefresh(true);
    };

    socket.on('order:created', handleNewOrder);
    socket.on('order:status_updated', handleOrderUpdated);
    socket.on('order:payment_updated', handleOrderUpdated);
    socket.on('order:deleted', handleOrderDeleted);

    return () => {
      socket.off('order:created', handleNewOrder);
      socket.off('order:status_updated', handleOrderUpdated);
      socket.off('order:payment_updated', handleOrderUpdated);
      socket.off('order:deleted', handleOrderDeleted);
    };
  }, [socket, playOrderChime, soundEnabled, onRefresh]);

  // 2. Background Safety Heartbeat & Multi-Tab Sync
  useEffect(() => {
    if (viewScope !== 'active') return;

    // Safety interval (every 60s)
    const interval = setInterval(() => {
      if (onRefresh) onRefresh(true);
    }, 60000);

    const handleStorageChange = (e) => {
      if (e.key === 'bujang_orders_sync') {
        if (onRefresh) onRefresh(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [viewScope, onRefresh]);

  return {
    socket,
    isConnected,
    broadcastOrderSync,
  };
};

export default useSocketOrders;
