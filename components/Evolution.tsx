
import React, { useMemo } from 'react';
import { WorkoutLog } from '../types';
import { ChartBarIcon } from './Icons';

interface ChartData {
  name: string;
  count: number;
}

const StatsChart: React.FC<{
  title: string;
  data: ChartData[];
  barColor?: string;
  iconColor?: string;
  valueFormatter?: (value: number) => string;
}> = ({
  title,
  data,
  barColor = 'fill-sky-500',
  iconColor = 'text-sky-400',
  valueFormatter,
}) => {
  if (data.length === 0) {
    return null; // Don't render chart if there's no data
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;
  const barWidth = 40;
  const barMargin = 20;
  const svgWidth = data.length * (barWidth + barMargin);

  return (
    <div className="bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <ChartBarIcon className={`h-6 w-6 ${iconColor}`} />
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      <div className="overflow-x-auto pb-4">
        <svg width={svgWidth} height={chartHeight + 40} className="font-sans">
          <style>{`
            .bar-group:hover .bar {
              opacity: 1;
            }
          `}</style>
          {data.map((item, index) => {
            const barHeight = (item.count / maxCount) * chartHeight;
            const x = index * (barWidth + barMargin);
            const y = chartHeight - barHeight;

            return (
              <g key={item.name} className="bar-group">
                <rect
                  className={`bar ${barColor} transition-opacity opacity-80`}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  ry="4"
                />
                <text
                  className="fill-white text-xs font-bold"
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                >
                  {item.count > 0 ? (valueFormatter ? valueFormatter(item.count) : item.count.toLocaleString('pt-BR', { maximumFractionDigits: 1 })) : ''}
                </text>
                <text
                  className="fill-slate-400 text-xs capitalize"
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  textAnchor="middle"
                >
                  {item.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};


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
        // FIX: Explicitly convert `count` to a number to prevent potential type errors during the sort operation.
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
              name: date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
              yearMonth,
              count,
            };
          })
          .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
      }, [workoutLogs]);

    const { durationData, distanceData } = useMemo(() => {
        const monthlyCardio: Record<string, { duration: number; distance: number }> = {};
    
        workoutLogs.forEach(log => {
            if (log.cardio && log.cardioCompleted) {
                const date = new Date(log.date);
                const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
                if (!monthlyCardio[yearMonth]) {
                    monthlyCardio[yearMonth] = { duration: 0, distance: 0 };
                }
    
                const durationString = log.cardio.duration || '';
                const distanceString = log.cardio.distance || '';
    
                const duration = parseFloat(durationString.replace(',', '.')) || 0;
                const distance = parseFloat(distanceString.replace(',', '.')) || 0;
    
                if (!isNaN(duration)) monthlyCardio[yearMonth].duration += duration;
                if (!isNaN(distance)) monthlyCardio[yearMonth].distance += distance;
            }
        });
        
        const sortedYearMonths = Object.keys(monthlyCardio).sort();
    
        const formatData = (type: 'duration' | 'distance') => {
            return sortedYearMonths.map(yearMonth => {
                const [year, month] = yearMonth.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return {
                  name: date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
                  count: monthlyCardio[yearMonth][type],
                };
            });
        }
    
        const durationData = formatData('duration');
        const distanceData = formatData('distance').filter(d => d.count > 0);
    
        return { durationData, distanceData };
    }, [workoutLogs]);

  if (workoutLogs.length === 0) {
    return (
      <div className="text-center bg-slate-800 rounded-xl p-8 shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-2">Acompanhe sua evolução.</h2>
        <p className="text-slate-400">Registre alguns treinos para começar a ver seus gráficos de progresso aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <StatsChart 
            title="Treinos por Mês" 
            data={monthlyData}
            barColor="fill-sky-500"
            iconColor="text-sky-400"
            valueFormatter={(count) => `${count} ${count === 1 ? 'treino' : 'treinos'}`}
        />
        <StatsChart 
            title="Exercícios por Grupo Muscular" 
            data={muscleData} 
            barColor="fill-amber-500" 
            iconColor="text-amber-400"
        />
        <StatsChart 
            title="Duração Total de Cardio (minutos)" 
            data={durationData} 
            barColor="fill-rose-500" 
            iconColor="text-rose-400"
        />
        <StatsChart 
            title="Distância Total de Cardio (km)" 
            data={distanceData} 
            barColor="fill-indigo-500" 
            iconColor="text-indigo-400"
        />
    </div>
  );
};

export default Evolution;
