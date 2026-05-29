import { Edit2, Eraser, Eye, Hand, PaintBucket, Pencil, Redo, RotateCw, Trash2, Undo } from 'lucide-react';
import React from 'react';
import { Tool, useAppStore } from '../../store/useAppStore';
import { useBeadsStore } from '../../store/useBeadsStore';
import { useCanvasStore } from '../../store/useCanvasStore';

export const Toolbar: React.FC = () => {
  const { mode, setMode, activeTool, setActiveTool, pegboardSize, setPegboardSize, setHighlightQuery, clickHighlightMode, setClickHighlightMode } = useAppStore();
  const { beads, undo, redo, clear, undoStack, redoStack } = useBeadsStore();
  const { rotate } = useCanvasStore();

  const stats = React.useMemo(() => {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    Object.keys(beads).forEach((coord) => {
      const [x, y] = coord.split(',').map(Number);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
    return {
      width: minX === Infinity ? 0 : maxX - minX + 1,
      height: minY === Infinity ? 0 : maxY - minY + 1,
    };
  }, [beads]);

  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
    if (mode === 'view') setMode('edit');
  };

  return (
    <div className='w-full bg-white border-b border-gray-200 shadow-sm p-2 flex items-center justify-between z-10 select-none'>
      <div className='flex items-center space-x-4'>
        {/* Mode Toggle */}
        <div className='flex bg-gray-100 rounded-lg p-1'>
          <button
            onClick={() => {
              setMode('edit');
              setHighlightQuery({ type: null, value: null });
              setClickHighlightMode('none');
            }}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'edit' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Edit2 size={16} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setMode('view')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'view' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Eye size={16} />
            <span>View</span>
          </button>
        </div>

        <div className='h-6 w-px bg-gray-300' />

        {/* Dynamic Tools based on Mode */}
        {mode === 'edit' ? (
          <div className='flex space-x-1'>
            <ToolButton icon={<Hand size={18} />} active={activeTool === 'pan'} onClick={() => handleToolChange('pan')} title='Pan (Move Canvas)' />
            <ToolButton icon={<Pencil size={18} />} active={activeTool === 'draw'} onClick={() => handleToolChange('draw')} title='Draw' />
            <ToolButton icon={<Eraser size={18} />} active={activeTool === 'erase'} onClick={() => handleToolChange('erase')} title='Erase' />
            <ToolButton icon={<PaintBucket size={18} />} active={activeTool === 'fill'} onClick={() => handleToolChange('fill')} title='Fill' />
          </div>
        ) : (
          <div className='flex items-center space-x-2'>
            <span className='text-xs text-gray-500 font-medium ml-1'>Highlight:</span>
            <button
              onClick={() => {
                setClickHighlightMode(clickHighlightMode === 'row' ? 'none' : 'row');
                setHighlightQuery({ type: null, value: null });
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${clickHighlightMode === 'row' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
            >
              Row
            </button>
            <button
              onClick={() => {
                setClickHighlightMode(clickHighlightMode === 'col' ? 'none' : 'col');
                setHighlightQuery({ type: null, value: null });
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${clickHighlightMode === 'col' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
            >
              Col
            </button>
          </div>
        )}
      </div>

      <div className='flex items-center space-x-4'>
        {/* Size Indicator */}
        {stats.width > 0 && (
          <div className='text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md flex items-center space-x-1 border border-gray-200'>
            <span>{stats.width}W</span>
            <span className='text-gray-400'>×</span>
            <span>{stats.height}H</span>
          </div>
        )}
        {/* Pegboard Config */}
        <select
          value={pegboardSize}
          onChange={(e) => setPegboardSize(Number(e.target.value))}
          className='text-sm border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500'
        >
          <option value={0}>Grid: Infinite</option>
          <option value={14}>Pegboard: 14x14</option>
          <option value={29}>Pegboard: 29x29</option>
          <option value={58}>Pegboard: 58x58</option>
        </select>

        <div className='h-6 w-px bg-gray-300' />

        {/* Actions */}
        <div className='flex space-x-1'>
          <ToolButton icon={<Undo size={18} />} disabled={undoStack.length === 0} onClick={undo} title='Undo' />
          <ToolButton icon={<Redo size={18} />} disabled={redoStack.length === 0} onClick={redo} title='Redo' />
          <ToolButton icon={<RotateCw size={18} />} onClick={() => rotate(90)} title='Rotate View 90°' />
          <ToolButton
            icon={<Trash2 size={18} />}
            onClick={() => {
              if (confirm('Clear all beads?')) clear();
            }}
            title='Clear All'
            className='text-red-500 hover:bg-red-50'
          />
        </div>
      </div>
    </div>
  );
};

const ToolButton = ({ icon, active, disabled, onClick, title, className = '' }: any) => (
  <button
    disabled={disabled}
    onClick={onClick}
    title={title}
    className={`p-2 rounded-md transition-colors flex items-center justify-center
      ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}
      ${active ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}
      ${className}
    `}
  >
    {icon}
  </button>
);
