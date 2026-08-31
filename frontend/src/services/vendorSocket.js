import { io } from 'socket.io-client';

let socket = null;

function socketUrl() {
  return import.meta.env.VITE_SOCKET_URL || window.location.origin;
}

export function connectVendorSocket() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  if (socket?.connected) return socket;

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(socketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectVendorSocket() {
  if (!socket) return;
  socket.disconnect();
}

export function getVendorSocket() {
  return socket;
}
