import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useUser } from './UserContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { currentUser } = useUser();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const onBannedRef = useRef(null);

  const setOnBanned = (cb) => {
    onBannedRef.current = cb;
  };

  useEffect(() => {
    // Очищаем предыдущий таймаут
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (!currentUser?.id) {
      console.log('🔌 SocketProvider: Нет пользователя, WebSocket не подключается');
      
      // Закрываем существующее соединение если есть
      if (socketRef.current) {
        console.log('🔌 SocketProvider: Закрытие существующего соединения');
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Если уже есть активное соединение для этого пользователя - не переподключаемся
    if (socketRef.current && socketRef.current.connected) {
      console.log('🔌 SocketProvider: WebSocket уже подключен для пользователя:', currentUser.id);
      return;
    }

    console.log('🔌 SocketProvider: Инициализация глобального WebSocket подключения для пользователя:', currentUser.id);

    // Создаем единственное подключение
    const newSocket = io('/', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ SocketProvider: WebSocket подключен, socket.id:', newSocket.id);
      setIsConnected(true);
      
      // Аутентификация
      newSocket.emit('authenticate', {
        userId: currentUser.id,
        nickname: currentUser.nickname
      });
      
      // Присоединяемся к комнате пользователя
      const roomName = `user:${currentUser.id}`;
      console.log('📍 SocketProvider: Присоединяемся к комнате:', roomName);
      newSocket.emit('join:room', roomName);
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ SocketProvider: Аутентификация успешна:', data);
    });

    newSocket.on('room:joined', (data) => {
      console.log('✅ SocketProvider: Успешно присоединились к комнате:', data);
      console.log('   roomId:', data.roomId);
      console.log('   success:', data.success);
      console.log('   timestamp:', data.timestamp);
    });

    newSocket.on('test:notification', (data) => {
      console.log('🧪 SocketProvider: Получено тестовое уведомление:', data);
    });

    newSocket.on('user:banned', (data) => {
      console.log('🚫 SocketProvider: Получено событие бана:', data);
      if (onBannedRef.current) {
        onBannedRef.current(data);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 SocketProvider: WebSocket отключен:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ SocketProvider: Ошибка подключения WebSocket:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log('🔌 SocketProvider: Закрытие глобального WebSocket подключения');
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [currentUser?.id]); // Зависим только от ID пользователя

  // Убираем избыточное логирование рендера
  // console.log('🔌 SocketProvider: Рендер, socket:', !!socket, 'isConnected:', isConnected, 'currentUser:', !!currentUser);

  return (
    <SocketContext.Provider value={{ socket, isConnected, setOnBanned }}>
      {children}
    </SocketContext.Provider>
  );
};
