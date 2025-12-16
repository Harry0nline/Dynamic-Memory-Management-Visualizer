import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Send, Trash2 } from 'lucide-react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  onCommand: (cmd: string) => void;
  onClearLogs: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ logs, onCommand, onClearLogs }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onCommand(input);
    setInput('');
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'system': return 'text-blue-400 font-bold';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-t border-gray-700 md:border-none shadow-xl rounded-lg overflow-hidden font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-gray-700">
        <div className="flex items-center gap-2 text-gray-400">
          <TerminalIcon size={16} />
          <span className="font-semibold text-xs uppercase tracking-wider">System Terminal</span>
        </div>
        <button 
          onClick={onClearLogs}
          className="p-1 hover:bg-slate-700 rounded text-gray-500 hover:text-red-400 transition-colors"
          title="Clear Logs"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-slate-900/50">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-gray-600 select-none min-w-[50px] text-[10px] pt-1">
              {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            <div className={`flex-1 break-words ${getLogColor(log.type)}`}>
              <span className="mr-2 opacity-50 select-none">{'>'}</span>
              <span className="whitespace-pre-wrap">{log.message}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 bg-slate-800 border-t border-gray-700">
        <span className="text-green-500 font-bold px-2 animate-pulse">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-600"
          placeholder="Enter command (e.g., malloc 15)"
          spellCheck={false}
          autoComplete="off"
        />
        <button 
          type="submit" 
          className="p-2 text-blue-500 hover:text-blue-400 disabled:opacity-50"
          disabled={!input.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default Terminal;
