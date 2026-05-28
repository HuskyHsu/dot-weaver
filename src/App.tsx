import { InfiniteCanvas } from './features/canvas/InfiniteCanvas';
import { Toolbar } from './features/toolbar/Toolbar';
import { FloatingPalette } from './features/toolbar/FloatingPalette';

function App() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col no-select">
      <Toolbar />
      <div className="flex-1 relative">
        <InfiniteCanvas />
        <FloatingPalette />
      </div>
    </div>
  );
}

export default App;
