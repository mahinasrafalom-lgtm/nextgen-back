import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Consultation from './models/Consultation.js';
import { env } from './config/env.js';

let io = null;

const roomFor = (consultationId) => `consultation:${consultationId}`;
const ADMIN_ROOM = 'admins';

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: env.clientOrigins, credentials: true, methods: ['GET', 'POST'] }
  });

  // Authenticate every socket with the same JWT the REST API uses.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('unauthorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user.role === 'admin') socket.join(ADMIN_ROOM);

    socket.on('consultation:join', async (consultationId) => {
      try {
        const consultation = await Consultation.findById(consultationId).select('user');
        if (!consultation) return;
        const isOwner = String(consultation.user) === String(socket.user._id);
        if (!isOwner && socket.user.role !== 'admin') return;
        socket.join(roomFor(consultationId));
      } catch {
        /* ignore malformed ids */
      }
    });

    socket.on('consultation:leave', (consultationId) => socket.leave(roomFor(consultationId)));

    socket.on('typing', ({ consultationId, isTyping }) => {
      if (!consultationId) return;
      socket.to(roomFor(consultationId)).emit('typing', {
        isTyping: Boolean(isTyping),
        from: socket.user.role === 'admin' ? 'support' : 'user'
      });
    });
  });

  return io;
}

export function emitMessage(consultationId, message) {
  if (io) io.to(roomFor(consultationId)).emit('message:new', message);
}

export function emitConsultationUpdate(consultationId, payload) {
  if (io) io.to(roomFor(consultationId)).emit('consultation:update', payload);
}

export function notifyAdmins(event, payload) {
  if (io) io.to(ADMIN_ROOM).emit(event, payload);
}
