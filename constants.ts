export const TOTAL_HEAP_SIZE = 100; // Abstract units
export const BLOCK_MIN_SIZE = 1;

export const INITIAL_LOG = {
  id: 'init',
  type: 'system' as const,
  message: 'System initialized. Heap size: 100 units. Type "help" for commands.',
  timestamp: new Date(),
};

export const HELP_TEXT = `
Available Commands:
  malloc <size>  Allocate a block of memory (e.g., malloc 10)
  free <addr>    Free a block at address (e.g., free 0)
  defrag         Compact memory (move blocks to eliminate holes)
  analyze        Ask AI to analyze current heap state
  reset          Clear all memory
  clear          Clear terminal logs
`;

export const BLOCK_COLORS = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
];
