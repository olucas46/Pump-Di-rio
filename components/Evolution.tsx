
import React, { useMemo, useState } from 'react';
import { WorkoutLog } from '../types';
import { ChartBarIcon, TrophyIcon, FireIcon, CalendarIcon } from './Icons';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, colorClass }) => (
  <div className="bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-700/50 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 ${colorClass}`}>
      {React.cloneElement(icon as React.ReactElement, { className: "w-24 h-24" })}
    </div>
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className={`p-2.5 rounded-xl w-fit mb-3 ${colorClass} bg-opacity-20 text-white`}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  </div>
);

// --- Custom Modern Charts ---

const Tooltip: React.FC<{ x: number; y: number; text: string; visible: boolean }> = ({ x, y, text, visible }) => {
  if (!visible) return null;
  return (
    <div
      className="absolute bg-slate-900 text-white text-xs font-semibold py-1 px-2 rounded shadow-xl border border-slate-700 z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 whitespace-nowrap"
      style={{ left: x, top: y }}
    >
      {text}
      <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-slate-700 transform rotate-45"></div>
    </div>
  );
};

const BarChart: React.FC<{ data: { name: string; count: number; fullDate: string }[], height?: number }> = ({ data, height = 220 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  if (data.length === 0) return <div className="h-full flex items-center justify-center text-slate-500 text-sm">Sem dados suficientes</div>;

  const maxVal = Math.max(...data.map(d => d.count), 1);
  const chartHeight = height - 40; // reserve space for labels
  const barWidth = 32;
  const gap = 20;
  const totalWidth = data.length * (barWidth + gap);

  return (
    <div className="relative w-full overflow-x-auto">
       {/* Y-Axis Grid Lines */}
       <div className="absolute inset-0 pointer-events-none opacity-20" style={{ height: chartHeight }}>
            <div className="border-b border-slate-500 h-1/4 w-full absolute bottom-3/4"></div>
            <div className="border-b border-slate-500 h-1/4 w-full absolute bottom-2/4"></div>
            <div className="border-b border-slate-500 h-1/4 w-full absolute bottom-1/4"></div>
            <div className="border-b border-slate-500 w-full absolute bottom-0"></div>
       </div>

      <svg width={Math.max(totalWidth, 100) + 20} height={height} className="overflow-visible">
        <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
        </defs>
        {data.map((item, index) => {
            const barHeight = (item.count / maxVal) * chartHeight;
            const x = index * (barWidth + gap) + 10;
            const y = chartHeight - barHeight;
            const isHovered = hoveredIndex === index;

            return (
                <g 
                    key={index} 
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                >
                    <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx={6}
                        fill="url(#barGradient)"
                        className={`transition-all duration-300 ${isHovered ? 'opacity-100 filter drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'opacity-80'}`}
                    />
                     {/* Label */}
                    <text
                        x={x + barWidth / 2}
                        y={chartHeight + 20}
                        textAnchor="middle"
                        className="fill-slate-400 text-[10px] font-medium uppercase tracking-wider"
                    >
                        {item.name}
                    </text>
                     {/* Tooltip rendered via React Portal logic or just absolute positioning in parent */}
                </g>
            );
        })}
      </svg>
      {hoveredIndex !== null && (
          <Tooltip 
             visible={true} 
             x={hoveredIndex * (barWidth + gap) + 10 + barWidth / 2} 
             y={height - ((data[hoveredIndex].count / maxVal) * chartHeight) - 30} // rough calc
             text={`${data[hoveredIndex].count} ${data[hoveredIndex].count === 1 ? 'treino' : 'treinos'}`}
          />
      )}
    </div>
  );
};

const HorizontalBarChart: React.FC<{ data: { name: string; count: number }[] }> = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.count), 1);
    
    // Take top 5 for cleaner UI
    const topData = data.slice(0, 5);

    return (
        <div className="flex flex-col gap-4 w-full">
            {topData.map((item, index) => (
                <div key={index} className="group">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-slate-300 capitalize">{item.name}</span>
                        <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-400 transition-colors">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-out group-hover:bg-emerald-400 relative"
                            style={{ width: `${(item.count / maxVal) * 100}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>
                </div>
            ))}
            {data.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Registre treinos para ver dados musculares.</p>}
        </div>
    );
}

const AreaChart: React.FC<{ data: { name: string; count: number }[], color: string }> = ({ data, color }) => {
    if (data.length < 2) return <div className="h-32 flex items-center justify-center text-slate-500 text-sm italic">Dados insuficientes para gráfico de tendência (mín. 2 meses)</div>;

    const height = 150;
    const width = 100; // SVG viewBox width percentage
    const maxVal = Math.max(...data.map(d => d.count), 1);
    
    // Generate Path points
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (d.count / maxVal) * height * 0.8; // Use 80% height to leave headroom
        return `${x},${y}`;
    }).join(' ');
    
    const fillPath = `${points} ${width},${height} 0,${height}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`areaGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`M${points}`} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M ${fillPath}`} fill={`url(#areaGradient-${color})`} stroke="none" />
            {/* Dots */}
            {data.map((d, i) => {
                 const x = (i / (data.length - 1)) * width;
                 const y = height - (d.count / maxVal) * height * 0.8;
                 return (
                    <circle key={i} cx={x} cy={y} r="1.5" fill="white" className="hover:r-2 transition-all" />
                 )
            })}
        </svg>
    )
}

// --- Main Component ---

const Evolution: React.FC<{ workoutLogs: WorkoutLog[] }> = ({ workoutLogs }) => {

    const muscleData = useMemo(() => {
        const counts = workoutLogs.reduce((acc: Record<string, number>, log) => {
            log.exercises.forEach(ex => {
                if (ex.muscle && ex.muscle.trim() !== '') {
                    const muscle = ex.muscle.trim();
                    acc[muscle] = (acc[muscle] || 0) + 1;
                }
            });
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, count]) => ({ name, count: Number(count) })).sort((a, b) => b.count - a.count);
    }, [workoutLogs]);

    const monthlyData = useMemo(() => {
        const counts = workoutLogs.reduce((acc: Record<string, number>, log) => {
          const date = new Date(log.date);
          const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          acc[yearMonth] = (acc[yearMonth] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
    
        return Object.entries(counts)
          .map(([yearMonth, count]) => {
            const [year, month] = yearMonth.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
              name: date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
              fullDate: date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
              yearMonth,
              count,
            };
          })
          .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
      }, [workoutLogs]);

    const cardioData = useMemo(() => {
        const monthlyCardio: Record<string, number> = {};
        let totalDuration = 0;
    
        workoutLogs.forEach(log => {
            if (log.cardio && log.cardioCompleted) {
                const date = new Date(log.date);
                const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
                if (!monthlyCardio[yearMonth]) monthlyCardio[yearMonth] = 0;
    
                const durationString = log.cardio.duration || '';
                const duration = parseFloat(durationString.replace(',', '.')) || 0;
                if (!isNaN(duration)) {
                    monthlyCardio[yearMonth] += duration;
                    totalDuration += duration;
                }
            }
        });
        
        const sortedTrend = Object.keys(monthlyCardio).sort().map(yearMonth => ({
             name: yearMonth,
             count: monthlyCardio[yearMonth]
        }));

        return { trend: sortedTrend, totalDuration };
    }, [workoutLogs]);

  if (workoutLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-800 rounded-3xl shadow-2xl border border-slate-700/50">
        <div className="bg-slate-700/50 p-6 rounded-full mb-6 animate-bounce">
            <TrophyIcon className="h-12 w-12 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Comece sua Jornada</h2>
        <p className="text-slate-400 max-w-md text-center">Registre seu primeiro treino hoje para desbloquear estatísticas detalhadas e gráficos de evolução.</p>
      </div>
    );
  }

  const favoriteMuscle = muscleData.length > 0 ? muscleData[0].name : 'N/A';
  const totalWorkouts = workoutLogs.length;
  
  // Calculate average workouts per week (rough estimate based on date range)
  const firstDate = new Date(workoutLogs[workoutLogs.length - 1].date);
  const lastDate = new Date(workoutLogs[0].date);
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  const diffWeeks = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)), 1);
  const avgWorkouts = (totalWorkouts / diffWeeks).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Header Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title="Total de Treinos" 
                value={totalWorkouts.toString()} 
                icon={<TrophyIcon />} 
                colorClass="bg-amber-500 text-amber-500"
            />
            <StatCard 
                title="Músculo Favorito" 
                value={favoriteMuscle} 
                icon={<FireIcon />} 
                colorClass="bg-rose-500 text-rose-500"
            />
            <StatCard 
                title="Cardio Total" 
                value={`${Math.round(cardioData.totalDuration / 60)}h ${Math.round(cardioData.totalDuration % 60)}m`} 
                subtitle="Tempo acumulado"
                icon={<CalendarIcon />} 
                colorClass="bg-sky-500 text-sky-500"
            />
            <StatCard 
                title="Frequência Média" 
                value={avgWorkouts} 
                subtitle="Treinos por semana"
                icon={<ChartBarIcon />} 
                colorClass="bg-emerald-500 text-emerald-500"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Progress Chart */}
            <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700/50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Consistência Mensal</h3>
                        <p className="text-sm text-slate-400">Volume de treinos realizados por mês</p>
                    </div>
                </div>
                <BarChart data={monthlyData} height={250} />
            </div>

            {/* Muscle Distribution */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700/50">
                 <h3 className="text-xl font-bold text-white mb-2">Foco Muscular</h3>
                 <p className="text-sm text-slate-400 mb-6">Top 5 grupos musculares treinados</p>
                 <HorizontalBarChart data={muscleData} />
            </div>
        </div>

        {/* Cardio Trend */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700/50 overflow-hidden relative">
             <div className="flex items-center gap-2 mb-4 relative z-10">
                <h3 className="text-xl font-bold text-white">Tendência de Cardio</h3>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">Minutos / Mês</span>
             </div>
             <AreaChart data={cardioData.trend} color="#818cf8" />
        </div>
    </div>
  );
};

export default Evolution;
