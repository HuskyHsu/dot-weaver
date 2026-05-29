import { InfiniteCanvas } from './features/canvas/InfiniteCanvas';
import { Toolbar } from './features/toolbar/Toolbar';
import { FloatingPalette } from './features/toolbar/FloatingPalette';

function App() {
  return (
    <div className="w-screen h-dvh overflow-hidden relative no-select">
      <InfiniteCanvas />
      
      {/* UI Overlay layer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 pointer-events-none flex flex-col items-center gap-4 z-20">
        <FloatingPalette />
        <Toolbar />
      </div>
    </div>
  );
}

export default App;
