# Technical Reference - Level Editor v3.0

## 🏗️ **Architecture Overview**

### **Module Dependencies**
```
LevelEditor (Main)
├── SettingsManager
├── GridSystem
├── ViewportManager
├── CanvasRenderer
│   ├── SettingsManager
│   ├── GridSystem
│   └── ViewportManager
├── EventHandler (minimal)
├── ExportSystem
│   ├── SettingsManager
│   └── GridSystem
├── PatternLibrary (placeholder)
└── BlockoutMode
    ├── SettingsManager
    ├── GridSystem
    ├── ViewportManager
    ├── CanvasRenderer
    ├── EventHandler
    └── ExportSystem
```

## 📋 **API Reference**

### **LevelEditor Class**
```javascript
class LevelEditor {
    constructor()
    setupUI()
    setupVisualSettings()
    setupGridActions()
    setupExportActions()
    setupSettingsActions()
    handleMouseDown(e)
    handleMouseMove(e)
    handleMouseUp(e)
    handleWheel(e)
    handleKeyDown(e)
    render()
    setMode(mode)
    showTemporaryMessage(message)
    updateColorSwatches()
}
```

### **SettingsManager Class**
```javascript
class SettingsManager {
    constructor()
    get(key)
    set(key, value)
    loadSettings()
    saveSettings()
    resetToDefaults()
    update(settings)
}
```

### **GridSystem Class**
```javascript
class GridSystem {
    constructor(settings)
    getTileFromCell(cellX, cellY)
    getCellFromTile(tileX, tileY)
    getCellKey(cellX, cellY)
    parseCellKey(cellKey)
    getCellNeighbors(cellX, cellY)
    getGridBounds()
    getGridWidth()
    getGridHeight()
}
```

### **ViewportManager Class**
```javascript
class ViewportManager {
    constructor(canvas, settings, gridSystem)
    getZoom()
    setZoom(zoom)
    getPan()
    setPan(panX, panY)
    screenToTile(screenX, screenY)
    screenToWorld(screenX, screenY)
    getVisibleTileBounds()
    calculateCenteredViewport()
    startPan(mouseX, mouseY)
    updatePan(mouseX, mouseY)
    stopPan()
    panViewport(deltaX, deltaY)
    constrainViewport()
    applyTransform()
    restoreTransform()
}
```

### **CanvasRenderer Class**
```javascript
class CanvasRenderer {
    constructor(canvas, settings, gridSystem, viewportManager)
    clear()
    drawGrid()
    drawTileGridLines()
    drawCheckerPattern(visibleBounds)
    drawTiles(tileData)
    drawCellBorders()
    drawCenterGuides()
    drawWallIndicators(wallIndicators)
    drawCellSelection(selectedCells)
    drawTemporaryMessage(message, x, y)
}
```

### **BlockoutMode Class**
```javascript
class BlockoutMode {
    constructor(canvas, settings, gridSystem, viewportManager, canvasRenderer, eventHandler, exportSystem)
    handleMouseDown(detail)
    handleMouseMove(detail)
    handleMouseUp(detail)
    handleKeyDown(detail)
    handleTileInteraction(tileX, tileY, cellX, cellY, shiftKey, button)
    getBrushTiles(centerX, centerY)
    handleSelectMode(cellX, cellY, shiftKey)
    applyWallIndicators()
    clearSelectedCell()
    shiftSelectedCells(deltaX, deltaY)
    clearGrid()
    setMode(mode)
    render()
    exportLevel()
    importLevel(jsonString)
    showTemporaryMessage(message)
}
```

## 🎨 **Rendering Pipeline**

### **Render Order**
1. **Clear canvas** - `canvasRenderer.clear()`
2. **Draw grid background** - `canvasRenderer.drawGrid()`
   - Checker pattern for transparent tiles
3. **Draw tiles** - `canvasRenderer.drawTiles(tileData)`
   - White (0), black (1), transparent (-1)
4. **Draw wall indicators** - `canvasRenderer.drawWallIndicators(wallIndicators)`
   - Gray suggestions around white tiles
5. **Draw tile grid lines** - `canvasRenderer.drawTileGridLines()`
   - Thin lines between every tile
6. **Draw cell borders** - `canvasRenderer.drawCellBorders()`
   - Thick lines around 5x5 cell groups
7. **Draw center guides** - `canvasRenderer.drawCenterGuides()`
   - Thick lines through middle
8. **Draw cell selection** - `canvasRenderer.drawCellSelection(selectedCells)`
   - Highlighted selected cells

## 🎮 **Input System**

### **Mouse Events**
```javascript
// LevelEditor handles all mouse events directly
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1) e.preventDefault(); // Prevent middle mouse default
    this.handleMouseDown(e);
});
```

### **Keyboard Events**
```javascript
// Panning with arrow keys and WASD
switch(e.key) {
    case 'ArrowLeft': case 'a': case 'A':
        this.viewportManager.panViewport(-panSpeed / zoom, 0);
        break;
    // ... other directions
}
```

### **Wheel Events**
```javascript
// Ctrl + wheel = brush size, normal wheel = zoom
if (e.ctrlKey || e.metaKey) {
    // Adjust brush size only
} else {
    // Zoom only
}
```

## 🗂️ **Data Structures**

### **Tile Data**
```javascript
// 2D array: tileData[y][x]
// Values: 0 = white/empty, 1 = black/solid, -1 = transparent
this.tileData = [
    [0, 1, -1, 0, 1],
    [1, 0, 0, -1, 0],
    // ... more rows
];
```

### **Wall Indicators**
```javascript
// Set of tile keys: "x,y"
this.wallIndicators = new Set([
    "5,3", "6,3", "7,3",
    "3,5", "4,5", "8,5"
]);
```

### **Active Cells**
```javascript
// Set of cell keys for activity tracking
this.activeCells = new Set([
    "1,1", "2,1", "3,1"
]);
```

### **Selected Cells**
```javascript
// Array of cell objects
this.selectedCells = [
    { x: 1, y: 1 },
    { x: 2, y: 1 }
];
```

## ⚙️ **Settings Reference**

### **Visual Settings**
```javascript
{
    showBorders: true,           // Show cell borders
    showWallIndicators: true,    // Show wall suggestions
    showCenterGuides: true,      // Show center grid lines
    borderColor: '#000000',      // Cell border color
    borderWeight: 3,             // Cell border thickness
    centerGuideColor: '#00008b', // Center guide color
    centerGuideWeight: 5,        // Center guide thickness
    checkerColor1: '#d0d0d0',    // Checker pattern color 1
    checkerColor2: '#e6f3ff'     // Checker pattern color 2
}
```

### **Grid Settings**
```javascript
{
    tileSize: 32,           // Size of each tile in pixels
    cellWidth: 5,           // Tiles per cell (width)
    cellHeight: 5,          // Tiles per cell (height)
    totalGridCols: 10,      // Total grid columns
    totalGridRows: 10,      // Total grid rows
    canvasWidth: 800,       // Canvas width
    canvasHeight: 600       // Canvas height
}
```

### **Mode Settings**
```javascript
{
    currentMode: 'paint',   // Current editing mode
    brushSize: 1,           // Brush size (1-5)
    selectedColor: '#ff0000' // Selection color
}
```

## 🔄 **Event Flow**

### **Mouse Down Event**
1. `LevelEditor.handleMouseDown()`
2. Check for middle mouse (panning)
3. Delegate to `BlockoutMode.handleMouseDown()`
4. Handle mode-specific logic
5. Start drawing/selection/panning

### **Mouse Move Event**
1. `LevelEditor.handleMouseMove()`
2. Delegate to `BlockoutMode.handleMouseMove()`
3. Handle continuous drawing/panning
4. Update wall indicators
5. Render changes

### **Mouse Up Event**
1. `LevelEditor.handleMouseUp()`
2. Delegate to `BlockoutMode.handleMouseUp()`
3. Stop drawing/panning
4. Apply final wall indicators
5. Render final state

## 🎯 **Brush System**

### **Brush Patterns**
```javascript
getBrushTiles(centerX, centerY) {
    // Size 1: Single tile
    // Size 2: Plus pattern (5 tiles)
    // Size 3: 3x3 square (9 tiles)
    // Size 4: 3x3 + extensions (13 tiles)
    // Size 5: 5x5 square (25 tiles)
}
```

### **Drawing Logic**
```javascript
handleTileInteraction(tileX, tileY, cellX, cellY, shiftKey, button) {
    // Get brush tiles based on brush size
    // Apply drawing mode (white/black/transparent)
    // Update cell activity
    // Apply wall indicators
}
```

## 📤 **Export System**

### **JSON Structure**
```javascript
{
    version: "3.0",
    tileData: [[0,1,-1], [1,0,0]],
    activeCells: ["1,1", "2,1"],
    settings: {
        showBorders: true,
        // ... other settings
    },
    metadata: {
        created: "2024-12-XX",
        modified: "2024-12-XX"
    }
}
```

### **Web Storage**
```javascript
// Save level
localStorage.setItem(`level_${name}`, jsonString);

// Load level
const jsonString = localStorage.getItem(`level_${name}`);
```

## 🐛 **Debugging Tips**

### **Common Issues**
1. **Wall indicators not showing** - Check `showWallIndicators` setting
2. **Panning not working** - Verify middle mouse event handling
3. **Brush size not updating** - Check UI slider event listeners
4. **Zoom conflicts** - Ensure only one wheel event handler

### **Debug Tools**
- Browser DevTools for console errors
- Canvas inspection for rendering issues
- Local storage inspection for settings
- Network tab for export/import

### **Performance Monitoring**
- Monitor `render()` calls
- Check wall indicator calculation frequency
- Watch for memory leaks in event listeners
- Profile canvas drawing operations

---

**Last Updated:** December 2024  
**Version:** 3.0 - Modular Architecture
