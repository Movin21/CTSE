import { useState, useEffect, useRef } from 'react';
import { Server, Radio, Wifi, RefreshCw, Trash2, Circle } from 'lucide-react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3002';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const logEndRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch existing logs on mount
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/notifications/logs');
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch {
      // Service may not be running locally; socket will deliver live logs
    }
  };

  useEffect(() => {
    fetchLogs();

    // Connect to Notification Service Socket.io
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Socket.io] Connected to Notification Service');
    });

    socket.on('disconnect', () => setConnected(false));

    // Receive historical log on connect
    socket.on('log:history', (history) => {
      if (Array.isArray(history)) setLogs(history);
    });

    // Receive live notification events
    socket.on('notification:new', (data) => {
      if (!paused) {
        setLogs((prev) => [
          {
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            orderId: data.orderId,
            eventType: data.eventType || 'ORDER_PLACED',
          },
          ...prev,
        ].slice(0, 100));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll to top when new log arrives (newest first)
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  const formatTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString(); }
    catch { return ts; }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3 mb-1.5">
            <Server size={24} className="text-emerald-400" />
            Admin — Live RabbitMQ Feed
          </h1>
          <p className="text-slate-500 text-sm">Real-time message log from the Order Events queue via Socket.io</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border ${
            connected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-slate-500/10 text-slate-500 border-slate-600/20'
          }`}>
            <Radio size={12} className={connected ? 'animate-pulse' : ''} />
            {connected ? 'Socket Connected' : 'Disconnected'}
          </div>
          <button onClick={() => setPaused((p) => !p)} className="btn-secondary text-xs">
            {paused ? <Wifi size={13} /> : <Circle size={13} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={fetchLogs} className="btn-secondary text-xs">
            <RefreshCw size={13} />
            Refresh
          </button>
          <button onClick={() => setLogs([])} className="btn-danger text-xs">
            <Trash2 size={13} />
            Clear
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-indigo-400">{logs.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Events</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-400">
            {logs.filter((l) => l.eventType === 'ORDER_PLACED').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">ORDER_PLACED</p>
        </div>
        <div className="card text-center">
          <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${connected ? 'bg-emerald-400' : 'bg-slate-600'}`}
            style={connected ? { boxShadow: '0 0 8px #10b981' } : {}} />
          <p className="text-xs text-slate-500">Socket.io</p>
        </div>
      </div>

      {/* Log terminal */}
      <div className="card p-0 overflow-hidden">
        {/* Terminal title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0f1117] border-b border-[rgba(99,102,241,0.1)]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-xs text-slate-500 ml-2 font-mono">notification-service · order_events queue</span>
          {paused && <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">PAUSED</span>}
        </div>

        {/* Log lines */}
        <div className="h-[480px] overflow-y-auto p-4 space-y-1.5 bg-[#0a0b0d] font-mono">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
              <Server size={36} className="opacity-40" />
              <p className="text-sm">Waiting for RabbitMQ events...</p>
              <p className="text-xs text-slate-700">Place an order in the Marketplace to see events here</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="log-line flex gap-3 items-start">
                <span className="text-indigo-600 select-none shrink-0">{formatTime(log.timestamp)}</span>
                <span className="text-emerald-400 font-bold shrink-0 text-[10px] uppercase">[{log.eventType || 'ORDER_PLACED'}]</span>
                <span className="text-slate-300">{log.message}</span>
                {log.orderId && (
                  <span className="ml-auto text-slate-600 text-[10px] shrink-0">
                    #{log.orderId.substring(0, 8)}
                  </span>
                )}
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Architecture note */}
      <div className="card mt-5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Message Flow</h3>
        <p className="text-xs text-slate-600 font-mono">
          Order Service → RabbitMQ Exchange (order_events) → Notification Service Consumer → Socket.io broadcast → This feed
        </p>
      </div>
    </div>
  );
}
