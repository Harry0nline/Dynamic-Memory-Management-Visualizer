import React from 'react';
import { HeapStats } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Layers, Database, Cpu } from 'lucide-react';

interface StatsPanelProps {
  stats: HeapStats;
  aiAnalysis: string | null;
  isAnalyzing: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, aiAnalysis, isAnalyzing }) => {
  const data = [
    { name: 'Used', value: stats.usedSize },
    { name: 'Free', value: stats.freeSize },
  ];

  const COLORS = ['#6366f1', '#334155']; // Indigo-500, Slate-700

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface p-4 rounded-lg border border-gray-700/50 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Database size={16} />
                <span className="text-xs uppercase font-bold">Usage</span>
            </div>
            <div className="text-2xl font-mono text-white">
                {stats.usedSize}<span className="text-gray-500 text-sm">/{stats.totalSize}</span>
            </div>
             <div className="w-full bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full" style={{ width: `${(stats.usedSize/stats.totalSize)*100}%` }}></div>
             </div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-gray-700/50 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Layers size={16} />
                <span className="text-xs uppercase font-bold">Blocks</span>
            </div>
            <div className="text-2xl font-mono text-white">
                {stats.blockCount}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total segments</div>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-gray-700/50 flex flex-col justify-between col-span-2">
             <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Activity size={16} />
                <span className="text-xs uppercase font-bold">Fragmentation</span>
            </div>
             <div className="flex items-center gap-4">
                 <div className="text-2xl font-mono text-white">
                    {(stats.fragmentation * 100).toFixed(0)}%
                </div>
                 <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${stats.fragmentation > 0.5 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${stats.fragmentation * 100}%` }}
                    ></div>
                 </div>
             </div>
        </div>
      </div>

      {/* AI Analysis Box */}
      <div className="bg-surface p-4 rounded-lg border border-gray-700/50 flex flex-col relative overflow-hidden">
        <div className="flex items-center gap-2 text-accent mb-2 z-10">
            <Cpu size={16} />
            <span className="text-xs uppercase font-bold">AI System Analysis</span>
        </div>
        
        <div className="flex-1 bg-slate-900/50 rounded p-3 text-xs md:text-sm text-gray-300 font-mono overflow-y-auto max-h-[140px] z-10">
            {isAnalyzing ? (
                <div className="flex items-center gap-2 text-accent animate-pulse">
                    <span>Analyzing heap state...</span>
                </div>
            ) : aiAnalysis ? (
                 <p>{aiAnalysis}</p>
            ) : (
                <p className="text-gray-600 italic">Run 'analyze' to get insights.</p>
            )}
        </div>
        
        {/* Decorative background element */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
};

export default StatsPanel;
