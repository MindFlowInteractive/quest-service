import { io } from 'socket.io-client';

const socket = io(
  `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
  {
    auth: {
      token: '<YOUR_AUTH_TOKEN>',
    },
    transports: ['websocket'],
  },
);

socket.on('notification', (notification) => {
  console.log('Notification received:', notification);

  socket.emit('notification:ack', {
    notificationId: notification.id,
  });
});
