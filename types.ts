export interface Block {
  id: string;
  startAddress: number;
  size: number;
  isAllocated: boolean;
  highlight?: boolean; // For animation/visual emphasis
  timestamp: number; // To track age for gradient or color shifts
}

export interface LogEntry {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'system';
  message: string;
  timestamp: Date;
}

export interface HeapStats {
  totalSize: number;
  usedSize: number;
  freeSize: number;
  blockCount: number;
  fragmentation: number; // 0 to 1
}

export enum CommandType {
  MALLOC = 'MALLOC',
  FREE = 'FREE',
  RESET = 'RESET',
  HELP = 'HELP',
  DEFRAG = 'DEFRAG',
  ANALYZE = 'ANALYZE',
  UNKNOWN = 'UNKNOWN'
}

export interface ParsedCommand {
  type: CommandType;
  args: string[];
}
