/**
 * BlockoutMode - Handles blockout level editing functionality
 */
export class BlockoutMode {
    constructor(canvas, settings, gridSystem, viewportManager, canvasRenderer, eventHandler, exportSystem) {
        this.canvas = canvas;
        this.settings = settings;
        this.gridSystem = gridSystem;
        this.viewportManager = viewportManager;
        this.canvasRenderer = canvasRenderer;
        this.eventHandler = eventHandler;
        this.exportSystem = exportSystem;
        
        // Initialize tile data
        this.tileData = [];
        this.initializeTileData();
        
        // Cell activity state
        this.activeCells = new Set();
        
        // Selection system
        this.selectedCells = [];
        this.isDraggingCell = false;
        this.dragStartCell = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Drawing state
        this.isDrawing = false;
        this.lastDrawnTile = null;
        this.isShiftPressed = false;
        
        // Wall indicator system
        this.wallIndicators = new Set();
        
        // Current mode
        this.currentMode = 'paint';
        this.brushSize = 1;
        this.selectedColor = '#ff0000';
        
        this.setupEventListeners();
    }
    
    /**
     * Initialize tile data array
     */
    initializeTileData() {
        this.tileData = [];
        for (let y = 0; y < this.gridSystem.totalHeight; y++) {
            this.tileData[y] = [];
            for (let x = 0; x < this.gridSystem.totalWidth; x++) {
                this.tileData[y][x] = -1; // -1 = transparent
            }
        }
    }
    
    /**
     * Setup event listeners - now handled by main LevelEditor
     */
    setupEventListeners() {
        // Events are now handled directly by LevelEditor and delegated here
    }
    
    /**
     * Handle mouse down
     */
    handleMouseDown(detail) {
        const { tileX, tileY, cellX, cellY, button, ctrlKey, shiftKey } = detail;
        
        if (button === 1) {
            // Start panning (middle-click)
            this.viewportManager.startPan(detail.mouseX, detail.mouseY);
            return;
        }
        
        if (this.currentMode === 'selectCell') {
            this.handleSelectMode(cellX, cellY, shiftKey);
            return;
        }
        
        if (this.currentMode === 'paint') {
            // Start drawing
            this.isDrawing = true;
            this.lastDrawnTile = null;
            this.drawingMode = button === 0 ? 'draw' : 'erase';
            this.isShiftPressed = shiftKey;
            this.handleTileInteraction(tileX, tileY, cellX, cellY, shiftKey, button);
        }
    }
    
    /**
     * Handle tile interaction (painting)
     */
    handleTileInteraction(tileX, tileY, cellX, cellY, shiftKey, button) {
        if (!this.gridSystem.isValidTile(tileX, tileY)) return;
        
        // Prevent drawing on the same tile multiple times during drag
        if (this.lastDrawnTile && 
            this.lastDrawnTile.x === tileX && 
            this.lastDrawnTile.y === tileY) {
            return;
        }
        
        this.lastDrawnTile = { x: tileX, y: tileY };
        
        // Apply brush to area around clicked tile
        const affectedCells = new Set();
        
        // Get list of tiles to affect based on brush pattern
        const tilesToAffect = this.getBrushTiles(tileX, tileY);
        
        for (const {x: targetX, y: targetY} of tilesToAffect) {
            // Check bounds
            if (targetX >= 0 && targetX < this.gridSystem.totalWidth && targetY >= 0 && targetY < this.gridSystem.totalHeight) {
                // Handle different drawing modes
                if (this.currentMode === 'paint') {
                    // Paint mode: direct tile painting with shift eraser
                    if (shiftKey) {
                        // Shift + paint = filled/black tiles
                        this.tileData[targetY][targetX] = 1;
                    } else if (this.drawingMode === 'draw') {
                        this.tileData[targetY][targetX] = 0; // Left click = empty/white tiles
                    } else if (this.drawingMode === 'erase') {
                        this.tileData[targetY][targetX] = -1; // Right click = eraser mode (transparent)
                    }
                }
                
                // Track affected cells for activity updates
                const cellX = Math.floor(targetX / this.gridSystem.cellWidth);
                const cellY = Math.floor(targetY / this.gridSystem.cellHeight);
                affectedCells.add(this.gridSystem.getCellKey(cellX, cellY));
            }
        }
        
        // Update cell activity for affected cells
        affectedCells.forEach(cellKey => {
            const { x, y } = this.gridSystem.parseCellKey(cellKey);
            this.updateCellActivity(x, y);
        });
        
        // Update wall indicators after tile interaction (smart rendering)
        this.applyWallIndicators();
    }
    
    /**
     * Get brush tiles for painting - using original brush patterns
     */
    getBrushTiles(centerX, centerY) {
        const tiles = [];
        
        if (this.brushSize === 1) {
            // Size 1: Just center tile
            tiles.push({x: centerX, y: centerY});
        } else if (this.brushSize === 2) {
            // Size 2: Plus pattern (center + 4 directions)
            tiles.push({x: centerX, y: centerY});         // center
            tiles.push({x: centerX - 1, y: centerY});     // left
            tiles.push({x: centerX + 1, y: centerY});     // right
            tiles.push({x: centerX, y: centerY - 1});     // up
            tiles.push({x: centerX, y: centerY + 1});     // down
        } else if (this.brushSize === 3) {
            // Size 3: Full 3x3 square
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    tiles.push({x: centerX + dx, y: centerY + dy});
                }
            }
        } else if (this.brushSize === 4) {
            // Size 4: 3x3 center + extensions (13 tiles total)
            // First add 3x3 center
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    tiles.push({x: centerX + dx, y: centerY + dy});
                }
            }
            // Add extensions in 4 directions
            tiles.push({x: centerX - 2, y: centerY});     // far left
            tiles.push({x: centerX + 2, y: centerY});     // far right
            tiles.push({x: centerX, y: centerY - 2});     // far up
            tiles.push({x: centerX, y: centerY + 2});     // far down
        } else if (this.brushSize === 5) {
            // Size 5: Full 5x5 square
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    tiles.push({x: centerX + dx, y: centerY + dy});
                }
            }
        }
        
        return tiles;
    }
    
    /**
     * Handle select mode
     */
    handleSelectMode(cellX, cellY, shiftKey) {
        if (!this.gridSystem.isValidCell(cellX, cellY)) return;
        
        if (shiftKey) {
            // Add to selection
            if (!this.selectedCells.some(cell => cell.x === cellX && cell.y === cellY)) {
                this.selectedCells.push({ x: cellX, y: cellY });
            }
        } else {
            // Check if clicking on already selected cell
            const isSelected = this.selectedCells.some(cell => cell.x === cellX && cell.y === cellY);
            
            if (isSelected) {
                // Start dragging if clicking on selected cell
                this.isDraggingCell = true;
                this.dragStartCell = { x: cellX, y: cellY };
            } else {
                // Start new selection
                this.selectedCells = [{ x: cellX, y: cellY }];
                this.isDraggingCell = false;
                this.dragStartCell = null;
            }
        }
        
        this.render();
    }
    
    /**
     * Handle mouse move
     */
    handleMouseMove(detail) {
        const { tileX, tileY, cellX, cellY, mouseX, mouseY } = detail;
        
        // Handle panning
        if (this.viewportManager.isPanning) {
            this.viewportManager.updatePan(mouseX, mouseY);
            this.render();
            return;
        }
        
        // Handle cell dragging
        if (this.isDraggingCell && this.dragStartCell) {
            const deltaX = cellX - this.dragStartCell.x;
            const deltaY = cellY - this.dragStartCell.y;
            
            if (deltaX !== 0 || deltaY !== 0) {
                this.shiftSelectedCells(deltaX, deltaY);
                this.dragStartCell = { x: cellX, y: cellY };
            }
            return;
        }
        
        // Handle continuous drawing
        if (this.isDrawing && this.currentMode === 'paint') {
            // Pass the original shift key state for continuous drawing
            this.handleTileInteraction(tileX, tileY, cellX, cellY, this.isShiftPressed, this.drawingMode === 'draw' ? 0 : 2);
        }
    }
    
    /**
     * Handle mouse up
     */
    handleMouseUp(detail) {
        this.isDraggingCell = false;
        this.dragStartCell = null;
        this.viewportManager.stopPan();
        
        // Stop drawing
        if (this.isDrawing) {
            this.isDrawing = false;
            this.lastDrawnTile = null;
            this.applyWallIndicators();
        }
    }
    
    /**
     * Handle key down events
     */
    handleKeyDown(detail) {
        const { key, preventDefault } = detail;
        
        if (key === 'Delete' || key === 'Backspace') {
            if (this.currentMode === 'selectCell' && this.selectedCells.length > 0) {
                preventDefault();
                this.clearSelectedCell();
                this.showTemporaryMessage(`Cleared ${this.selectedCells.length} selected cell${this.selectedCells.length > 1 ? 's' : ''}`);
                return;
            }
        }
    }
    
    /**
     * Update cell activity
     */
    updateCellActivity(cellX, cellY) {
        const cellKey = this.gridSystem.getCellKey(cellX, cellY);
        const tile = this.gridSystem.getTileFromCell(cellX, cellY);
        
        let hasContent = false;
        for (let y = tile.startY; y < tile.endY; y++) {
            for (let x = tile.startX; x < tile.endX; x++) {
                if (y < this.tileData.length && x < this.tileData[y].length) {
                    if (this.tileData[y][x] !== -1) {
                        hasContent = true;
                        break;
                    }
                }
            }
            if (hasContent) break;
        }
        
        if (hasContent) {
            this.activeCells.add(cellKey);
        } else {
            this.activeCells.delete(cellKey);
        }
    }
    
    /**
     * Shift selected cells
     */
    shiftSelectedCells(deltaX, deltaY) {
        if (this.selectedCells.length === 0) return;
        
        // Check if all cells can be moved
        const canMove = this.selectedCells.every(cell => {
            const newX = cell.x + deltaX;
            const newY = cell.y + deltaY;
            return this.gridSystem.isValidCell(newX, newY);
        });
        
        if (!canMove) return;
        
        // Create new tile data with shifted cells
        const newTileData = this.tileData.map(row => [...row]);
        
        // Clear old positions
        this.selectedCells.forEach(cell => {
            const tile = this.gridSystem.getTileFromCell(cell.x, cell.y);
            for (let y = tile.startY; y < tile.endY; y++) {
                for (let x = tile.startX; x < tile.endX; x++) {
                    if (y < newTileData.length && x < newTileData[y].length) {
                        newTileData[y][x] = -1;
                    }
                }
            }
        });
        
        // Place in new positions
        this.selectedCells.forEach(cell => {
            const oldTile = this.gridSystem.getTileFromCell(cell.x, cell.y);
            const newX = cell.x + deltaX;
            const newY = cell.y + deltaY;
            const newTile = this.gridSystem.getTileFromCell(newX, newY);
            
            for (let y = 0; y < this.gridSystem.cellHeight; y++) {
                for (let x = 0; x < this.gridSystem.cellWidth; x++) {
                    const oldTileX = oldTile.startX + x;
                    const oldTileY = oldTile.startY + y;
                    const newTileX = newTile.startX + x;
                    const newTileY = newTile.startY + y;
                    
                    if (oldTileY < this.tileData.length && oldTileX < this.tileData[oldTileY].length &&
                        newTileY < newTileData.length && newTileX < newTileData[newTileY].length) {
                        newTileData[newTileY][newTileX] = this.tileData[oldTileY][oldTileX];
                    }
                }
            }
            
            // Update cell position
            cell.x = newX;
            cell.y = newY;
        });
        
        this.tileData = newTileData;
        
        // Update cell activity
        this.selectedCells.forEach(cell => {
            this.updateCellActivity(cell.x, cell.y);
        });
        
        this.applyWallIndicators();
        this.render();
    }
    
    /**
     * Clear selected cell
     */
    clearSelectedCell() {
        if (this.selectedCells.length === 0) return;
        
        this.selectedCells.forEach(cell => {
            const tile = this.gridSystem.getTileFromCell(cell.x, cell.y);
            for (let y = tile.startY; y < tile.endY; y++) {
                for (let x = tile.startX; x < tile.endX; x++) {
                    if (y < this.tileData.length && x < this.tileData[y].length) {
                        this.tileData[y][x] = -1;
                    }
                }
            }
            this.updateCellActivity(cell.x, cell.y);
        });
        
        this.applyWallIndicators();
        this.render();
    }
    
    /**
     * Apply wall indicators - show gray wall suggestions around white/open tiles
     */
    applyWallIndicators() {
        // Clear existing wall indicators
        this.wallIndicators.clear();
        
        // Scan entire grid for white/open tiles (value 0)
        for (let y = 0; y < this.gridSystem.totalHeight; y++) {
            for (let x = 0; x < this.gridSystem.totalWidth; x++) {
                if (this.tileData[y][x] === 0) { // Found white/open tile
                    // Check 4-directional neighbors for transparent tiles
                    const neighbors = [
                        [x, y - 1], // up
                        [x, y + 1], // down
                        [x - 1, y], // left
                        [x + 1, y]  // right
                    ];
                    
                    for (const [nx, ny] of neighbors) {
                        if (nx >= 0 && nx < this.gridSystem.totalWidth && ny >= 0 && ny < this.gridSystem.totalHeight) {
                            if (this.tileData[ny][nx] === -1) { // Found transparent neighbor
                                // Add this transparent tile as a wall indicator
                                this.wallIndicators.add(`${nx},${ny}`);
                            }
                        }
                    }
                }
            }
        }
        
        // Only render if there are wall indicator changes
        if (this.wallIndicators.size > 0) {
            this.render();
        }
    }
    
    /**
     * Get cell neighbors
     */
    getCellNeighbors(cellX, cellY) {
        const neighbors = [];
        const directions = [
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 }
        ];
        
        directions.forEach(dir => {
            const neighborX = cellX + dir.x;
            const neighborY = cellY + dir.y;
            if (this.gridSystem.isValidCell(neighborX, neighborY)) {
                neighbors.push({ x: neighborX, y: neighborY });
            }
        });
        
        return neighbors;
    }
    
    /**
     * Clear entire grid
     */
    clearGrid() {
        this.initializeTileData();
        this.activeCells.clear();
        this.wallIndicators.clear();
        this.render();
    }
    
    /**
     * Set current mode
     */
    setMode(mode) {
        this.currentMode = mode;
        this.selectedCells = [];
        this.render();
    }
    
    /**
     * Render the current state
     */
    render() {
        this.canvasRenderer.clear();
        this.canvasRenderer.drawGrid();
        this.canvasRenderer.drawTiles(this.tileData);
        
        // Draw wall indicators BEFORE structural grid elements
        this.canvasRenderer.drawWallIndicators(this.wallIndicators);
        
        // Draw tile grid lines UNDER the structural grid elements
        this.canvasRenderer.drawTileGridLines();
        
        if (this.settings.get('showBorders')) {
            this.canvasRenderer.drawCellBorders();
        }
        
        if (this.settings.get('showCenterGuides')) {
            this.canvasRenderer.drawCenterGuides();
        }
        
        if (this.currentMode === 'selectCell' && this.selectedCells.length > 0) {
            this.canvasRenderer.drawCellSelection(this.selectedCells);
        }
    }
    
    /**
     * Show temporary message
     */
    showTemporaryMessage(message) {
        const mousePos = this.eventHandler.getMousePosition();
        this.canvasRenderer.drawTemporaryMessage(message, mousePos.x, mousePos.y);
        
        setTimeout(() => {
            this.render();
        }, 3000);
    }
    
    /**
     * Export current level
     */
    exportLevel() {
        return this.exportSystem.exportLevelToJSON(this.tileData, this.activeCells);
    }
    
    /**
     * Import level
     */
    importLevel(jsonString) {
        try {
            const levelData = this.exportSystem.importLevelFromJSON(jsonString);
            this.tileData = levelData.tileData;
            this.activeCells = levelData.activeCells;
            this.applyWallIndicators();
            this.render();
            return true;
        } catch (error) {
            console.error('Failed to import level:', error);
            return false;
        }
    }
}
