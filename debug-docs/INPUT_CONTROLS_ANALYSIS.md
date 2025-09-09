# Input Controls Analysis

## 🎯 **Current Input Controls**

### **Paint Mode**
- **Left-click drag** = White tiles (carve open spaces)
- **Right-click drag** = Erase (transparent)
- **Shift + left-click drag** = Black tiles (fill solid areas)
- **Brush Size Slider** = 1x1 to 5x5 brush sizes
- **Ctrl + Mouse Wheel** = Adjust brush size (scroll up = bigger, down = smaller)

### **Pan & Zoom**
- **Middle-click drag** = Pan view
- **Arrow keys / WASD** = Pan view
- **Mouse wheel** = Zoom in/out

### **Select Mode** (not implemented yet)
- **Left-click** = Select cell
- **Shift + left-click** = Add to selection
- **Click selected cell + drag** = Move cell

### **Brush Patterns** (Fixed!)
- **Size 1** = Single tile
- **Size 2** = Plus pattern (center + 4 directions)
- **Size 3** = 3x3 square
- **Size 4** = 3x3 center + 4 extensions (13 tiles total)
- **Size 5** = 5x5 square

## ✅ **Fixed Issues**

1. **Brush Size Implementation** - Now uses original brush patterns (plus, square, extensions)
2. **Outline Update Timing** - Called after completed actions (mouse up, not during drawing)
3. **Ctrl + Scroll** - Added brush size adjustment with mouse wheel
4. **Input Conflicts** - Fixed right-click conflict (now only erases, middle-click pans)
5. **Keyboard Panning** - Added Arrow keys and WASD for panning
6. **Input Consistency** - All inputs now work as expected without conflicts

## 📝 **Outline Update Reminder**

**Call `this.applyAutoOutline()` after COMPLETED actions that change the grid:**
- After mouse up (in `handleMouseUp`) - when drawing stroke is complete
- After cell clearing (in `clearSelectedCell`)
- After cell shifting (in `shiftSelectedCells`)
- After grid clearing (in `clearGrid`)
- After level import (in `importLevel`)

**DO NOT call during continuous actions like:**
- During tile painting (in `handleTileInteraction`) - too heavy!
- During mouse move - only call on mouse up
