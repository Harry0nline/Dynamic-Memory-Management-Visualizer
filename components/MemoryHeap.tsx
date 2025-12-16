import React from 'react';
import { Block } from '../types';
import { BLOCK_COLORS, TOTAL_HEAP_SIZE } from '../constants';
import { Hash } from 'lucide-react';

interface MemoryHeapProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onBlockClick: (id: string, startAddr: number, isAllocated: boolean) => void;
}

const MemoryHeap: React.FC<MemoryHeapProps> = ({ blocks, selectedBlockId, onBlockClick }) => {
  // Cycle colors based on start address to keep them deterministic but varied
  const getColor = (block: Block) => {
    if (!block.isAllocated) return 'bg-transparent border-2 border-dashed border-gray-600';
    const colorIndex = block.startAddress % BLOCK_COLORS.length;
    return `${BLOCK_COLORS[colorIndex]} border border-white/10 shadow-lg`;
  };

  return (
    <div className="w-full bg-slate-900/50 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          Heap Memory Map
        </h2>
        <span className="text-xs text-gray-500 font-mono">0x00 ... 0x{TOTAL_HEAP_SIZE.toString(16).toUpperCase()}</span>
      </div>

      <div className="relative w-full h-32 md:h-40 bg-gray-800/50 rounded-lg overflow-hidden flex border border-gray-700 relative">
        {/* Background Grid Lines for ruler effect */}
        <div className="absolute inset-0 pointer-events-none flex">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-gray-700/30 h-full"></div>
            ))}
        </div>

        {blocks.map((block) => {
          const isSelected = block.id === selectedBlockId;
          return (
            <div
                key={block.id}
                onClick={() => onBlockClick(block.id, block.startAddress, block.isAllocated)}
                style={{ 
                    width: `${(block.size / TOTAL_HEAP_SIZE) * 100}%`,
                }}
                className={`
                relative group cursor-pointer transition-all duration-200 ease-out
                ${getColor(block)}
                ${isSelected ? 'z-20 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'hover:opacity-90 hover:scale-[1.02] hover:z-10'}
                `}
                title={`Addr: ${block.startAddress} | Size: ${block.size}`}
            >
                {/* Hover Tooltip/Info Overlay */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <span className="text-[10px] md:text-xs font-mono font-bold text-white drop-shadow-md bg-black/60 px-1 rounded">
                        {block.isAllocated ? `ALLOC (${block.size})` : `FREE (${block.size})`}
                    </span>
                    <span className="text-[8px] font-mono text-gray-200 bg-black/60 px-1 rounded mt-0.5">
                        @{block.startAddress}
                    </span>
                </div>
                
                {/* Small ID indicator for allocated blocks if they are big enough */}
                {block.isAllocated && block.size > 5 && (
                    <div className="absolute top-1 left-1 opacity-50 group-hover:opacity-0">
                        <Hash size={10} className="text-white" />
                    </div>
                )}
            </div>
          );
        })}
      </div>
      
      <div className="flex gap-4 mt-4 justify-end text-xs text-gray-400 font-mono">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-dashed border-gray-500 rounded"></div>
          <span>Free</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded border border-white/10"></div>
          <span>Allocated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 ring-1 ring-white ring-offset-1 ring-offset-slate-900 rounded"></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
};

export default MemoryHeap;