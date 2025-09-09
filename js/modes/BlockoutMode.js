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
        
        // Outline system
        this.outlineOverlay = new Set();
        
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
     * Setup event listeners
     */
    setupEventListeners() {
        this.canvas.addEventListener('cellMouseDown', (e) => this.handleCellMouseDown(e.detail));
        this.canvas.addEventListener('cellMouseMove', (e) => this.handleCellMouseMove(e.detail));
        this.canvas.addEventListener('cellMouseUp', (e) => this.handleCellMouseUp(e.detail));
        this.canvas.addEventListener('keyDown', (e) => this.handleKeyDown(e.detail));
    }
    
    /**
     * Handle cell mouse down
     */
    handleCellMouseDown(detail) {
        const { tileX, tileY, cellX, cellY, button, ctrlKey, shiftKey } = detail;
        
        if (button === 1 || (button === 0 && ctrlKey)) {
            // Start panning
            this.viewportManager.startPan(this.eventHandler.lastMouseX, this.eventHandler.lastMouseY);
            return;
        }
        
        if (button === 0) {
            if (this.currentMode === 'paint') {
                this.handlePaintMode(tileX, tileY, cellX, cellY, shiftKey);
            } else if (this.currentMode === 'selectCell') {
                this.handleSelectMode(cellX, cellY, shiftKey);
            }
        }
    }
    
    /**
     * Handle paint mode
     */
    handlePaintMode(tileX, tileY, cellX, cellY, shiftKey) {
        if (!this.gridSystem.isValidTile(tileX, tileY)) return;
        
        const tileValue = shiftKey ? 1 : 0; // Shift = connection, normal = blockout
        
        // Apply brush size
        for (let dy = 0; dy < this.brushSize; dy++) {
            for (let dx = 0; dx < this.brushSize; dx++) {
                const brushX = tileX + dx;
                const brushY = tileY + dy;
                
                if (this.gridSystem.isValidTile(brushX, brushY)) {
                    this.tileData[brushY][brushX] = tileValue;
                }
            }
        }
        
        this.updateCellActivity(cellX, cellY);
        this.render();
    }
    
    /**
     * Handle select mode
     */
    handleSelectMode(cellX, cellY, shiftKey) {
        if (!this.gridSystem.isValidCell(cellX, cellY)) return;
        
        if (shiftKey) {
            // Add to selection
            const cellKey = this.gridSystem.getCellKey(cellX, cellY);
            if (!this.selectedCells.some(cell => cell.x === cellX && cell.y === cellY)) {
                this.selectedCells.push({ x: cellX, y: cellY });
            }
        } else {
            // Start new selection or drag
            this.selectedCells = [{ x: cellX, y: cellY }];
            this.isDraggingCell = true;
            this.dragStartCell = { x: cellX, y: cellY };
        }
        
        this.render();
    }
    
    /**
     * Handle cell mouse move
     */
    handleCellMouseMove(detail) {
        if (this.isDraggingCell && this.dragStartCell) {
            const { cellX, cellY } = detail;
            const deltaX = cellX - this.dragStartCell.x;
            const deltaY = cellY - this.dragStartCell.y;
            
            if (deltaX !== 0 || deltaY !== 0) {
                this.shiftSelectedCells(deltaX, deltaY);
                this.dragStartCell = { x: cellX, y: cellY };
            }
        }
    }
    
    /**
     * Handle cell mouse up
     */
    handleCellMouseUp(detail) {
        this.isDraggingCell = false;
        this.dragStartCell = null;
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
            this.updateCellActivity(cell.x, cellY);
        });
        
        this.applyAutoOutline();
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
        
        this.applyAutoOutline();
        this.render();
    }
    
    /**
     * Apply auto outline
     */
    applyAutoOutline() {
        this.outlineOverlay.clear();
        
        this.activeCells.forEach(cellKey => {
            const { x, y } = this.gridSystem.parseCellKey(cellKey);
            const neighbors = this.getCellNeighbors(x, y);
            
            // Check if cell has any empty neighbors
            const hasEmptyNeighbor = neighbors.some(neighbor => {
                const neighborKey = this.gridSystem.getCellKey(neighbor.x, neighbor.y);
                return !this.activeCells.has(neighborKey);
            });
            
            if (hasEmptyNeighbor) {
                this.outlineOverlay.add(cellKey);
            }
        });
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
        this.outlineOverlay.clear();
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
        
        if (this.settings.get('showBorders')) {
            this.canvasRenderer.drawCellBorders();
        }
        
        if (this.settings.get('showCenterGuides')) {
            this.canvasRenderer.drawCenterGuides();
        }
        
        if (this.currentMode === 'selectCell' && this.selectedCells.length > 0) {
            this.canvasRenderer.drawCellSelection(this.selectedCells);
        }
        
        if (this.settings.get('showOutlines')) {
            this.canvasRenderer.drawOutlineOverlay(this.outlineOverlay);
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
            this.applyAutoOutline();
            this.render();
            return true;
        } catch (error) {
            console.error('Failed to import level:', error);
            return false;
        }
    }
}
