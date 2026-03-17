import { useState, useEffect } from 'react';
import { Activity, Server, CheckCircle2, XCircle, RefreshCw, Cpu, Database, MessageSquare, Shield } from 'lucide-react';

const SERVICE_CHECKS = [
  {
    name: 'API Gateway',
    url: '/health',
    icon: Server,
    color: '#6366f1',
    description: 'Node.js · Port 8080',
    tech: 'Express + Helmet',
  },
  {
    name: 'Identity Service',
    url: '/api/auth/health',
    icon: Shield,
    color: '#8b5cf6',
    description: 'Spring Boot · Port 8081',
    tech: 'JWT + BCrypt',
  },
  {
    name: 'Product Service',
    url: '/actuator/health',
    icon: Database,
    color: '#f59e0b',
    description: 'Spring Boot · Port 8082',
    tech: 'JPA + PostgreSQL',
  },
  {
    name: 'Order Service',
    url: '/api/orders',
    icon: Cpu,
    color: '#ec4899',
    description: 'Node.js/TS · Port 3001',
    tech: 'Prisma + RabbitMQ',
  },
  {
    name: 'Notification Service',
    url: '/api/notifications',
    icon: MessageSquare,
    color: '#10b981',
    description: 'Node.js/TS · Port 3002',
    tech: 'Socket.io + AMQP',
  },
];

function ServiceCard({ service, index }) {
  const Icon = service.icon;
  const isUp = service.status === 'UP';
  const isLoading = service.status === 'CHECKING';

  return (
    <div
      className="card animate-[fadeIn_0.3s_ease-in-out] cursor-default group"
      style={{ animationDelay: `${index * 80}ms`, borderTopColor: service.color, borderTopWidth: 2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${service.color}20` }}
        >
          <Icon size={20} style={{ color: service.color }} />
        </div>
        <div>
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5 bg-slate-500/15 text-slate-400 text-xs font-semibold px-2.5 py-1 rounded-full">
              <RefreshCw size={10} className="animate-spin" />
              Checking
            </span>
          ) : isUp ? (
            <span className="badge-up">
              <span className="glow-dot bg-emerald-400 w-1.5 h-1.5" />
              UP
            </span>
          ) : (
            <span className="badge-down">
              <span className="glow-dot bg-rose-400 w-1.5 h-1.5" />
              DOWN
            </span>
          )}
        </div>
      </div>

      <h3 className="font-bold text-slate-100 mb-1">{service.name}</h3>
      <p className="text-xs text-slate-500 mb-2">{service.description}</p>
      <div
        className="text-xs font-medium px-2 py-0.5 rounded inline-block"
        style={{ background: `${service.color}15`, color: service.color }}
      >
        {service.tech}
      </div>

      {!isLoading && (
        <div className="mt-4 flex items-center gap-1.5 text-xs" style={{ color: isUp ? '#10b981' : '#f43f5e' }}>
          {isUp
            ? <><CheckCircle2 size={12} /> Service healthy</>
            : <><XCircle size={12} /> Service unreachable</>
          }
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [services, setServices] = useState(
    SERVICE_CHECKS.map((s) => ({ ...s, status: 'CHECKING' }))
  );
  const [lastChecked, setLastChecked] = useState(null);

  const checkServices = async () => {
    const results = await Promise.all(
      SERVICE_CHECKS.map(async (svc) => {
        try {
          const res = await fetch(svc.url, { signal: AbortSignal.timeout(4000) });
          return { ...svc, status: res.ok ? 'UP' : 'DOWN' };
        } catch {
          return { ...svc, status: 'DOWN' };
        }
      })
    );
    setServices(results);
    setLastChecked(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 15000);
    return () => clearInterval(interval);
  }, []);

  const upCount = services.filter((s) => s.status === 'UP').length;
  const total = services.length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3 mb-1.5">
            <Activity size={24} className="text-indigo-400" />
            System Dashboard
          </h1>
          <p className="text-slate-500 text-sm">Real-time health monitoring of all microservices</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`text-2xl font-bold ${upCount === total ? 'text-emerald-400' : 'text-amber-400'}`}>
            {upCount}/{total}
          </div>
          <p className="text-xs text-slate-500">services healthy</p>
          {lastChecked && (
            <p className="text-xs text-slate-600">Last checked: {lastChecked}</p>
          )}
        </div>
      </div>

      {/* Overall health bar */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-300">Overall System Health</span>
          <span className="text-sm font-bold text-indigo-400">{Math.round((upCount / total) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-[#1e2130] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(upCount / total) * 100}%`,
              background: upCount === total
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : upCount > 0
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, #f43f5e, #fb7185)',
            }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 size={11} /> {upCount} Online
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <XCircle size={11} /> {total - upCount} Offline
          </span>
          <span className="flex-1" />
          <button
            onClick={checkServices}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      </div>

      {/* Service cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {services.map((svc, i) => (
          <ServiceCard key={svc.name} service={svc} index={i} />
        ))}
      </div>

      {/* Architecture info */}
      <div className="mt-8 card">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Architecture Overview</h3>
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          {[
            { label: 'Frontend', value: 'React + Vite + Tailwind' },
            { label: 'Gateway', value: 'Node.js Express' },
            { label: 'Identity', value: 'Spring Boot + JWT' },
            { label: 'Products', value: 'Spring Boot + JPA' },
            { label: 'Orders', value: 'Node.js + Prisma' },
            { label: 'Notifications', value: 'Node.js + Socket.io' },
            { label: 'Message Broker', value: 'RabbitMQ' },
            { label: 'Databases', value: 'PostgreSQL ×4' },
            { label: 'Container', value: 'Docker Compose' },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-slate-600 uppercase tracking-wide text-[10px]">{label}</span>
              <span className="text-slate-300 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
