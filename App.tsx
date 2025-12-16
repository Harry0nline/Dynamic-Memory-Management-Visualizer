import React, { useState, useEffect, useCallback } from 'react';
import { Block, LogEntry, HeapStats, CommandType, ParsedCommand } from './types';
import { TOTAL_HEAP_SIZE, INITIAL_LOG, HELP_TEXT } from './constants';
import MemoryHeap from './components/MemoryHeap';
import Terminal from './components/Terminal';
import StatsPanel from './components/StatsPanel';
import { analyzeHeapState } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { Play, RotateCcw, Box, Wand2, Plus, Trash2, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [blocks, setBlocks] = useState<Block[]>([
    { id: uuidv4(), startAddress: 0, size: TOTAL_HEAP_SIZE, isAllocated: false, timestamp: Date.now() },
  ]);
  const [logs, setLogs] = useState<LogEntry[]>([INITIAL_LOG]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // UI State for manual input
  const [manualAllocSize, setManualAllocSize] = useState<string>('10');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Derived state
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // --- Helpers ---
  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs((prev) => [
      ...prev,
      { id: uuidv4(), type, message, timestamp: new Date() },
    ]);
  };

  const getStats = useCallback((): HeapStats => {
    const usedSize = blocks.reduce((acc, b) => (b.isAllocated ? acc + b.size : acc), 0);
    const freeSize = TOTAL_HEAP_SIZE - usedSize;
    const freeBlocks = blocks.filter((b) => !b.isAllocated).length;
    // Simple fragmentation metric: 1 - (largest_free_block / total_free_memory)
    // If we have 1 big free block, frag is 0. If we have many small ones, frag is high.
    const maxFreeBlock = Math.max(...blocks.filter(b => !b.isAllocated).map(b => b.size), 0);
    const fragmentation = freeSize === 0 ? 0 : 1 - (maxFreeBlock / freeSize);

    return {
      totalSize: TOTAL_HEAP_SIZE,
      usedSize,
      freeSize,
      blockCount: blocks.length,
      fragmentation: isNaN(fragmentation) ? 0 : fragmentation,
    };
  }, [blocks]);

  // --- Core Logic ---

  const malloc = (size: number) => {
    if (size <= 0) {
      addLog('error', 'Size must be greater than 0');
      return;
    }

    let allocated = false;
    const newBlocks = [...blocks];

    for (let i = 0; i < newBlocks.length; i++) {
      const block = newBlocks[i];
      if (!block.isAllocated && block.size >= size) {
        // Found a fit (First Fit)
        if (block.size === size) {
          // Exact fit
          newBlocks[i].isAllocated = true;
          newBlocks[i].timestamp = Date.now();
          addLog('success', `Allocated ${size} units at address ${block.startAddress}`);
        } else {
          // Split block
          const newAllocatedBlock: Block = {
            id: uuidv4(),
            startAddress: block.startAddress,
            size: size,
            isAllocated: true,
            timestamp: Date.now(),
          };
          const remainingFreeBlock: Block = {
            id: uuidv4(),
            startAddress: block.startAddress + size,
            size: block.size - size,
            isAllocated: false,
            timestamp: block.timestamp, // inherit age?
          };
          // Replace current block with two new ones
          newBlocks.splice(i, 1, newAllocatedBlock, remainingFreeBlock);
          addLog('success', `Allocated ${size} units at address ${newAllocatedBlock.startAddress}`);
        }
        allocated = true;
        break;
      }
    }

    if (!allocated) {
      addLog('error', `Allocation failed: Not enough contiguous memory for size ${size}`);
    } else {
      setBlocks(newBlocks);
    }
  };

  const free = (address: number) => {
    let found = false;
    let newBlocks = [...blocks];

    for (let i = 0; i < newBlocks.length; i++) {
      if (newBlocks[i].startAddress === address) {
        if (!newBlocks[i].isAllocated) {
          addLog('warning', `Address ${address} is already free.`);
          return;
        }
        newBlocks[i].isAllocated = false;
        newBlocks[i].timestamp = Date.now();
        addLog('success', `Freed memory at address ${address}`);
        found = true;
        break;
      }
    }

    if (!found) {
      addLog('error', `Invalid address: ${address}. Double check the pointer.`);
      return;
    }

    // Coalesce Logic
    // Loop through and merge adjacent free blocks
    // We restart the loop after a merge to keep it simple and safe
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < newBlocks.length - 1; i++) {
        if (!newBlocks[i].isAllocated && !newBlocks[i + 1].isAllocated) {
          // Merge i and i+1
          newBlocks[i].size += newBlocks[i + 1].size;
          newBlocks.splice(i + 1, 1); // remove i+1
          merged = true;
          // Don't break immediately, but it's safer to restart or be careful with indices. 
          // Since we removed i+1, the next iteration will check i (now bigger) and the new i+1.
          // So actually we can just continue but decrement i to re-check this block with the next one.
          i--; 
        }
      }
    }
    setBlocks(newBlocks);
    // If we freed the selected block, clear selection as ID might change or block is now free
    if (selectedBlock && selectedBlock.startAddress === address) {
        setSelectedBlockId(null);
    }
  };

  const defrag = () => {
    // Compacts all allocated blocks to the start
    const allocatedBlocks = blocks.filter(b => b.isAllocated);
    if (allocatedBlocks.length === 0) {
        addLog('info', 'Memory is empty, nothing to defrag.');
        return;
    }

    let currentAddr = 0;
    const compactBlocks: Block[] = allocatedBlocks.map(b => {
        const newBlock = { ...b, startAddress: currentAddr };
        currentAddr += b.size;
        return newBlock;
    });

    const remainingSize = TOTAL_HEAP_SIZE - currentAddr;
    if (remainingSize > 0) {
        compactBlocks.push({
            id: uuidv4(),
            startAddress: currentAddr,
            size: remainingSize,
            isAllocated: false,
            timestamp: Date.now()
        });
    }

    setBlocks(compactBlocks);
    setSelectedBlockId(null); // Clear selection as IDs/Addresses changed
    addLog('system', 'Defragmentation complete. Memory compacted.');
  };

  const reset = () => {
    setBlocks([{ id: uuidv4(), startAddress: 0, size: TOTAL_HEAP_SIZE, isAllocated: false, timestamp: Date.now() }]);
    setSelectedBlockId(null);
    addLog('system', 'Heap reset to initial state.');
  };

  const handleAIAnalyze = async () => {
    setIsAnalyzing(true);
    addLog('system', 'Requesting AI analysis of heap state...');
    const result = await analyzeHeapState(blocks, getStats());
    setAiAnalysis(result);
    addLog('info', 'AI Analysis received.');
    setIsAnalyzing(false);
  };

  const handleManualAlloc = () => {
    const size = parseInt(manualAllocSize);
    if (!isNaN(size)) {
        malloc(size);
    } else {
        addLog('error', 'Invalid size entered.');
    }
  };

  // --- Command Parsing ---

  const handleCommand = (cmdString: string) => {
    addLog('info', cmdString); // Echo command
    
    const parts = cmdString.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'malloc':
      case 'alloc': // alias
      case 'm': // alias
        const size = parseInt(args[0]);
        if (isNaN(size)) {
          addLog('error', 'Usage: malloc <size>');
        } else {
          malloc(size);
        }
        break;
      case 'free':
      case 'f': // alias
        const addr = parseInt(args[0]);
        if (isNaN(addr)) {
            // Try to handle hex if user types 0x...
            const hexAddr = parseInt(args[0], 16);
            if (!isNaN(hexAddr)) {
                free(hexAddr);
            } else {
                addLog('error', 'Usage: free <address>');
            }
        } else {
          free(addr);
        }
        break;
      case 'reset':
        reset();
        break;
      case 'defrag':
      case 'compact':
        defrag();
        break;
      case 'help':
        addLog('system', HELP_TEXT);
        break;
      case 'clear':
      case 'cls':
        setLogs([]);
        break;
      case 'analyze':
        handleAIAnalyze();
        break;
      default:
        addLog('error', `Unknown command: "${cmd}". Type "help" for list.`);
    }
  };

  // --- UI Handlers ---

  const handleBlockClick = (id: string, startAddr: number, isAllocated: boolean) => {
      if (selectedBlockId === id) {
          setSelectedBlockId(null);
      } else {
          setSelectedBlockId(id);
          if (isAllocated) {
              addLog('info', `Selected Block @ ${startAddr}. Click 'Free Memory' to release.`);
          } else {
              addLog('info', `Selected Free Block @ ${startAddr}.`);
          }
      }
  };

  return (
    <div className="min-h-screen bg-background text-gray-200 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* Sidebar / Left Panel (Visuals & Stats) */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto max-h-screen custom-scrollbar">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-2 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg text-primary border border-primary/50">
                <Box size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white">MemVis</h1>
                <p className="text-xs text-gray-500">Dynamic Memory Allocator Simulator</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={reset}
                className="p-2 hover:bg-slate-800 rounded-md text-gray-400 hover:text-white transition-colors"
                title="Reset Heap"
            >
                <RotateCcw size={18} />
            </button>
          </div>
        </header>

        {/* Visualizer */}
        <MemoryHeap 
            blocks={blocks} 
            selectedBlockId={selectedBlockId} 
            onBlockClick={handleBlockClick} 
        />

        {/* Selected Block Inspector */}
        {selectedBlock && (
            <div className="bg-slate-800/80 border border-indigo-500/30 p-4 rounded-lg flex items-center justify-between animate-pulse-slow shadow-lg">
                <div className="flex items-center gap-4">
                    <div className={`w-2 h-10 rounded ${selectedBlock.isAllocated ? 'bg-indigo-500' : 'border-2 border-dashed border-gray-500'}`}></div>
                    <div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                            {selectedBlock.isAllocated ? 'Allocated Block' : 'Free Block'} Selected
                        </div>
                        <div className="text-sm font-mono flex items-center gap-3">
                            <div><span className="text-gray-500">Addr:</span> <span className="text-white font-bold">{selectedBlock.startAddress}</span></div>
                            <div className="w-px h-3 bg-gray-600"></div>
                            <div><span className="text-gray-500">Size:</span> <span className="text-white font-bold">{selectedBlock.size}</span></div>
                        </div>
                    </div>
                </div>
                
                {selectedBlock.isAllocated ? (
                    <button 
                        onClick={() => free(selectedBlock.startAddress)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-500/50 px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 group"
                    >
                        <Trash2 size={16} className="group-hover:text-red-400" />
                        Free
                    </button>
                ) : (
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 italic hidden md:inline">Ready to allocate</span>
                        <ArrowRight size={16} className="text-gray-600 animate-bounce-x" />
                     </div>
                )}
            </div>
        )}

        {/* Stats & Analysis */}
        <StatsPanel 
            stats={getStats()} 
            aiAnalysis={aiAnalysis} 
            isAnalyzing={isAnalyzing} 
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Manual Alloc Control */}
            <div className="col-span-2 flex bg-slate-800 rounded-md border border-gray-700 overflow-hidden focus-within:border-primary/50 transition-colors shadow-sm">
                <div className="bg-slate-700/50 px-3 py-2 flex items-center justify-center border-r border-gray-700">
                    <span className="text-xs font-mono text-gray-400">SIZE</span>
                </div>
                <input 
                    type="number"
                    min="1"
                    max={TOTAL_HEAP_SIZE}
                    value={manualAllocSize}
                    onChange={(e) => setManualAllocSize(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualAlloc()}
                    className="flex-1 bg-transparent text-white px-3 py-2 outline-none text-sm font-mono placeholder-gray-600"
                    placeholder="e.g. 12"
                />
                <button 
                    onClick={handleManualAlloc}
                    className="bg-primary/90 hover:bg-primary text-white px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-1 border-l border-gray-700"
                >
                    Alloc
                </button>
            </div>

            <button onClick={() => malloc(Math.floor(Math.random() * 15) + 5)} className="btn-action bg-slate-800 hover:bg-slate-700 p-3 rounded border border-gray-700 flex items-center justify-center gap-2 text-sm font-medium transition-all hover:border-primary/50">
                <Play size={14} className="text-green-500" />
                Random
            </button>
             <button onClick={defrag} className="btn-action bg-slate-800 hover:bg-slate-700 p-3 rounded border border-gray-700 flex items-center justify-center gap-2 text-sm font-medium transition-all hover:border-primary/50">
                <Box size={14} className="text-orange-500" />
                Defrag
            </button>
            <button onClick={handleAIAnalyze} className="btn-action bg-slate-800 hover:bg-slate-700 p-3 rounded border border-gray-700 flex items-center justify-center gap-2 text-sm font-medium transition-all hover:border-accent/50 col-span-2 md:col-span-4 mt-2 md:mt-0">
                <Wand2 size={14} className="text-accent" />
                AI Analyze Heap
            </button>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded text-xs text-blue-200 mt-auto">
            <strong>Tip:</strong> Click on blocks to see their address. Use the terminal on the right (or bottom on mobile) to execute precise C-style commands.
        </div>
      </div>

      {/* Terminal Panel */}
      <div className="h-[40vh] md:h-screen md:w-[400px] lg:w-[500px] flex-shrink-0 p-4 pt-0 md:pt-4">
        <Terminal 
            logs={logs} 
            onCommand={handleCommand} 
            onClearLogs={() => setLogs([])}
        />
      </div>

    </div>
  );
};

export default App;