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
        
        // Cell activity state
        this.activeCells = new Set();
        
        // Initialize tile data
        this.tileData = [];
        this.initializeTileData();
        
        // Simple selection system
        this.selectedCells = []; // Array of {x, y} coordinates
        this.isDragging = false;
        this.dragStartPos = null; // {x, y} where drag started
        
        // Rectangle selection
        this.isSelecting = false;
        this.selectionStart = null;
        this.selectionEnd = null;
        
        // Drawing state
        this.isDrawing = false;
        this.lastDrawnTile = null;
        this.isShiftPressed = false;
        
        // Wall indicator system
        this.wallIndicators = new Set();
        
        // Current mode - get from settings
        this.currentMode = this.settings.get('currentMode');
        this.brushSize = this.settings.get('brushSize');
        this.selectedColor = this.settings.get('selectedColor');
        
        this.setupEventListeners();
    }
    
    /**
     * Initialize tile data array with default filled cells
     */
    initializeTileData() {
        this.tileData = [];
        for (let y = 0; y < this.gridSystem.totalHeight; y++) {
            this.tileData[y] = [];
            for (let x = 0; x < this.gridSystem.totalWidth; x++) {
                this.tileData[y][x] = -1; // -1 = transparent
            }
        }
        
        // Add 2 default filled cells in the middle of the grid
        this.addDefaultCells();
    }
    
    /**
     * Add default filled cells for demonstration - 3x3 grid
     */
    addDefaultCells() {
        // Fill 3x3 grid centered on (4,4)
        for (let y = 3; y <= 5; y++) {
            for (let x = 3; x <= 5; x++) {
                this.fillCellWithPattern(x, y);
                this.updateCellActivity(x, y);
            }
        }
    }
    
    /**
     * Fill a cell with a demo pattern
     */
    fillCellWithPattern(cellX, cellY) {
        const tile = this.gridSystem.getTileFromCell(cellX, cellY);
        
        // Create a simple pattern: border filled, center empty
        for (let y = tile.startY; y < tile.endY; y++) {
            for (let x = tile.startX; x < tile.endX; x++) {
                const localX = x - tile.startX;
                const localY = y - tile.startY;
                
                // Border pattern: edges are filled (1), center is empty (0)
                if (localX === 0 || localX === 4 || localY === 0 || localY === 4) {
                    this.tileData[y][x] = 1; // filled
                } else {
                    this.tileData[y][x] = 0; // empty/walkable
                }
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
            
            if (isSelected && this.selectedCells.length > 0) {
                // Start dragging - simple version
                this.isDragging = true;
                this.dragStartPos = { x: cellX, y: cellY };
            } else {
                // Start new rectangle selection
                this.isSelecting = true;
                this.selectionStart = { x: cellX, y: cellY };
                this.selectionEnd = { x: cellX, y: cellY };
                this.selectedCells = [{ x: cellX, y: cellY }];
                this.isDragging = false;
                this.dragStartPos = null;
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
        
        // Handle rectangle selection
        if (this.isSelecting && this.currentMode === 'selectCell') {
            this.selectionEnd = { x: cellX, y: cellY };
            this.updateSelectedCellsFromRectangle();
            this.render();
            return;
        }
        
        // Handle cell dragging - simplified
        if (this.isDragging && this.dragStartPos) {
            // Just track current position for preview, actual move happens on mouse up
            this.render();
            return;
        }
        
        // Handle continuous drawing
        if (this.isDrawing && this.currentMode === 'paint') {
            this.handleTileInteraction(tileX, tileY, cellX, cellY, this.isShiftPressed, this.drawingMode === 'draw' ? 0 : 2);
        }
    }
    
    /**
     * Handle mouse up
     */
    handleMouseUp(detail) {
        const { cellX, cellY } = detail;
        
        // Complete cell dragging - simplified
        if (this.isDragging && this.dragStartPos && this.selectedCells.length > 0) {
            const deltaX = cellX - this.dragStartPos.x;
            const deltaY = cellY - this.dragStartPos.y;
            
            if (deltaX !== 0 || deltaY !== 0) {
                this.moveCells(deltaX, deltaY);
            }
        }
        
        // Reset drag state
        this.isDragging = false;
        this.dragStartPos = null;
        this.viewportManager.stopPan();
        
        // Complete rectangle selection
        if (this.isSelecting && this.currentMode === 'selectCell') {
            this.isSelecting = false;
            this.render();
        }
        
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
     * Update selected cells from rectangle selection
     */
    updateSelectedCellsFromRectangle() {
        this.selectedCells = [];
        
        if (!this.selectionStart || !this.selectionEnd) return;
        
        const startX = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const endX = Math.max(this.selectionStart.x, this.selectionEnd.x);
        const startY = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const endY = Math.max(this.selectionStart.y, this.selectionEnd.y);
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (this.gridSystem.isValidCell(x, y)) {
                    this.selectedCells.push({ x, y });
                }
            }
        }
    }
    
    
    
    
    
    /**
     * Place grabbed cells using clean region-swap approach (fixed order)
     */
    /**
     * Simple cell movement system - pure functional approach
     */
    moveCells(deltaX, deltaY) {
        if (this.selectedCells.length === 0) return;
        
        console.log('🚀 MOVE START:', {
            selectedCells: this.selectedCells,
            deltaX, deltaY,
            dropAction: this.settings.get('dropAction')
        });
        
        // Pure function: input -> output
        const newTileData = this.applyCellMovement(
            this.tileData, 
            this.selectedCells, 
            deltaX, 
            deltaY, 
            this.settings.get('dropAction')
        );
        
        // Update grid state
        this.tileData = newTileData;
        
        // Update selection positions 
        const oldSelection = [...this.selectedCells];
        this.selectedCells = this.selectedCells.map(cell => ({
            x: cell.x + deltaX,
            y: cell.y + deltaY
        })).filter(cell => this.gridSystem.isValidCell(cell.x, cell.y));
        
        console.log('✅ MOVE END:', {
            oldSelection,
            newSelection: this.selectedCells,
            movedCells: this.selectedCells.length
        });
        
        // Update activity and render
        this.selectedCells.forEach(cell => this.updateCellActivity(cell.x, cell.y));
        this.applyWallIndicators();
        this.render();
        
        // Show feedback
        const dropAction = this.settings.get('dropAction');
        const direction = deltaX > 0 ? 'right' : deltaX < 0 ? 'left' : deltaY > 0 ? 'down' : 'up';
        this.showTemporaryMessage(`${dropAction} ${this.selectedCells.length} cells ${direction}`);
    }
    
    /**
     * Pure function: Apply cell movement with drop action
     */
    applyCellMovement(tileData, selectedCells, deltaX, deltaY, dropAction) {
        const newTileData = tileData.map(row => [...row]);
        
        // Extract source regions
        const sourceRegions = this.extractRegions(tileData, selectedCells);
        
        // Calculate destination positions
        const destPositions = selectedCells.map(cell => ({
            x: cell.x + deltaX,
            y: cell.y + deltaY
        })).filter(pos => this.gridSystem.isValidCell(pos.x, pos.y));
        
        // Extract destination regions
        const destRegions = this.extractRegions(tileData, destPositions);
        
        // Apply drop action
        this.applyDropAction(newTileData, sourceRegions, destRegions, selectedCells, destPositions, dropAction);
        
        return newTileData;
    }
    
    /**
     * Extract tile data for given cell positions
     */
    extractRegions(tileData, cellPositions) {
        return cellPositions.map(cell => {
            const tile = this.gridSystem.getTileFromCell(cell.x, cell.y);
            const data = [];
            
            for (let y = tile.startY; y < tile.endY; y++) {
                const row = [];
                for (let x = tile.startX; x < tile.endX; x++) {
                    if (y < tileData.length && x < tileData[y].length) {
                        row.push(tileData[y][x]);
                    } else {
                        row.push(-1);
                    }
                }
                data.push(row);
            }
            
            return { cell, tile, data };
        });
    }
    
    /**
     * Apply drop action between source and destination regions
     */
    applyDropAction(newTileData, sourceRegions, destRegions, sourcePositions, destPositions, dropAction) {
        // Clear all affected regions first
        [...sourceRegions, ...destRegions].forEach(region => {
            this.clearRegion(newTileData, region.tile);
        });
        
        // Apply based on drop action
        switch (dropAction) {
            case 'swap':
                this.applySwap(newTileData, sourceRegions, destRegions);
                break;
            case 'overwrite':
                this.applyOverwrite(newTileData, sourceRegions, destPositions);
                break;
            case 'duplicate':
                this.applyDuplicate(newTileData, sourceRegions, destPositions);
                break;
            case 'add':
                this.applyAdd(newTileData, sourceRegions, destRegions, destPositions);
                break;
            case 'subtract':
                this.applySubtract(newTileData, sourceRegions, destRegions, destPositions);
                break;
        }
    }
    
    /**
     * Clear a tile region
     */
    clearRegion(tileData, tile) {
        for (let y = tile.startY; y < tile.endY; y++) {
            for (let x = tile.startX; x < tile.endX; x++) {
                if (y < tileData.length && x < tileData[y].length) {
                    tileData[y][x] = -1;
                }
            }
        }
    }
    
    /**
     * Place data at tile position
     */
    placeData(tileData, data, tile) {
        for (let y = 0; y < data.length; y++) {
            for (let x = 0; x < data[y].length; x++) {
                const tileX = tile.startX + x;
                const tileY = tile.startY + y;
                
                if (tileY < tileData.length && tileX < tileData[tileY].length) {
                    tileData[tileY][tileX] = data[y][x];
                }
            }
        }
    }
    
    /**
     * Swap: Exchange source and destination data
     */
    applySwap(tileData, sourceRegions, destRegions) {
        sourceRegions.forEach((source, i) => {
            const dest = destRegions[i];
            if (dest) {
                this.placeData(tileData, dest.data, source.tile);
                this.placeData(tileData, source.data, dest.tile);
            } else {
                this.placeData(tileData, source.data, source.tile); // stay in place
            }
        });
    }
    
    /**
     * Overwrite: Move source to destination
     */
    applyOverwrite(tileData, sourceRegions, destPositions) {
        sourceRegions.forEach((source, i) => {
            const destPos = destPositions[i];
            if (destPos) {
                const destTile = this.gridSystem.getTileFromCell(destPos.x, destPos.y);
                this.placeData(tileData, source.data, destTile);
            } else {
                this.placeData(tileData, source.data, source.tile); // stay in place
            }
        });
    }
    
    /**
     * Duplicate: Copy source to destination, keep original
     */
    applyDuplicate(tileData, sourceRegions, destPositions) {
        sourceRegions.forEach((source, i) => {
            // Restore original
            this.placeData(tileData, source.data, source.tile);
            // Copy to destination
            const destPos = destPositions[i];
            if (destPos) {
                const destTile = this.gridSystem.getTileFromCell(destPos.x, destPos.y);
                this.placeData(tileData, source.data, destTile);
            }
        });
    }
    
    /**
     * Add: Combine source with destination
     */
    applyAdd(tileData, sourceRegions, destRegions, destPositions) {
        sourceRegions.forEach((source, i) => {
            const dest = destRegions[i];
            const destPos = destPositions[i];
            
            if (dest && destPos) {
                const combined = this.combineRegions(source.data, dest.data, 'add');
                const destTile = this.gridSystem.getTileFromCell(destPos.x, destPos.y);
                this.placeData(tileData, combined, destTile);
            } else if (destPos) {
                const destTile = this.gridSystem.getTileFromCell(destPos.x, destPos.y);
                this.placeData(tileData, source.data, destTile);
            }
        });
    }
    
    /**
     * Subtract: Remove source from destination
     */
    applySubtract(tileData, sourceRegions, destRegions, destPositions) {
        sourceRegions.forEach((source, i) => {
            const dest = destRegions[i];
            const destPos = destPositions[i];
            
            if (dest && destPos) {
                const subtracted = this.combineRegions(source.data, dest.data, 'subtract');
                const destTile = this.gridSystem.getTileFromCell(destPos.x, destPos.y);
                this.placeData(tileData, subtracted, destTile);
            }
        });
    }
    
    /**
     * Combine two data regions
     */
    combineRegions(sourceData, destData, operation) {
        const result = [];
        for (let y = 0; y < sourceData.length; y++) {
            const row = [];
            for (let x = 0; x < sourceData[y].length; x++) {
                const srcValue = sourceData[y][x];
                const destValue = destData[y] ? destData[y][x] : -1;
                
                if (operation === 'add') {
                    if (srcValue === 1 || destValue === 1) row.push(1);
                    else if (srcValue === 0 || destValue === 0) row.push(0);
                    else row.push(-1);
                } else if (operation === 'subtract') {
                    if (srcValue === 1 && destValue === 1) row.push(0);
                    else if (srcValue === 0 && destValue === 1) row.push(-1);
                    else row.push(destValue);
                }
            }
            result.push(row);
        }
        return result;
    }
    
    
    
    /**
     * Validate that there are no duplicated cells after movement
     */
    validateNoDuplicatedCells() {
        // Check all cells for content
        const cellsWithContent = [];
        for (let cellY = 0; cellY < this.gridSystem.totalGridRows; cellY++) {
            for (let cellX = 0; cellX < this.gridSystem.totalGridCols; cellX++) {
                const tile = this.gridSystem.getTileFromCell(cellX, cellY);
                let hasContent = false;
                
                for (let y = tile.startY; y < tile.endY; y++) {
                    for (let x = tile.startX; x < tile.endX; x++) {
                        if (y < this.tileData.length && x < this.tileData[y].length && this.tileData[y][x] !== -1) {
                            hasContent = true;
                            break;
                        }
                    }
                    if (hasContent) break;
                }
                
                if (hasContent) {
                    cellsWithContent.push({ cellX, cellY });
                }
            }
        }
        
        // Check for duplicates by comparing cell positions
        const cellPositions = cellsWithContent.map(cell => `${cell.cellX},${cell.cellY}`);
        const uniquePositions = [...new Set(cellPositions)];
        
        if (cellPositions.length !== uniquePositions.length) {
            console.error('🚨 DUPLICATED CELLS DETECTED!');
            console.error('Total cells:', cellPositions.length, 'Unique positions:', uniquePositions.length);
            
            // Find the duplicates
            const duplicates = cellPositions.filter((pos, index) => cellPositions.indexOf(pos) !== index);
            console.error('Duplicate positions:', [...new Set(duplicates)]);
        } else {
            console.log('✅ No duplicated cells found');
        }
        
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
        
        // Draw cell selection or drag preview (not both) - fixed visual duplication
        if (this.isDraggingCell && this.dragPreviewCells.length > 0) {
            // ONLY draw drag preview while dragging (no selection)
            const dropAction = this.settings.get('dropAction');
            this.canvasRenderer.drawDragPreview(this.dragPreviewCells, this.dragConflicts, dropAction === 'swap');
        } else if (this.currentMode === 'selectCell' && this.selectedCells.length > 0 && !this.isDraggingCell) {
            // ONLY draw cell selection when not dragging
            this.canvasRenderer.drawCellSelection(this.selectedCells);
        }
        
        // Draw selection rectangle while selecting
        if (this.isSelecting && this.selectionStart && this.selectionEnd) {
            this.canvasRenderer.drawSelectionRectangle(this.selectionStart, this.selectionEnd);
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
