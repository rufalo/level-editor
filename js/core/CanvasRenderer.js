/**
 * CanvasRenderer - Handles all canvas drawing operations
 */
export class CanvasRenderer {
    constructor(canvas, settings, gridSystem, viewportManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settings = settings;
        this.gridSystem = gridSystem;
        this.viewportManager = viewportManager;
        
        this.tileSize = this.settings.get('tileSize');
    }
    
    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Draw the grid background
     */
    drawGrid() {
        this.viewportManager.applyTransform();
        
        const bounds = this.gridSystem.getGridBounds();
        const visibleBounds = this.viewportManager.getVisibleTileBounds();
        
        // Draw checker pattern for transparent tiles
        this.drawCheckerPattern(visibleBounds);
        
        this.viewportManager.restoreTransform();
    }
    
    /**
     * Draw tile grid lines
     */
    drawTileGridLines() {
        this.viewportManager.applyTransform();
        
        const visibleBounds = this.viewportManager.getVisibleTileBounds();
        
        // Draw tile grid lines
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 1 / this.viewportManager.getZoom();
        this.ctx.setLineDash([]);
        
        // Vertical lines
        for (let x = visibleBounds.startX; x <= visibleBounds.endX; x++) {
            const screenX = x * this.tileSize;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, visibleBounds.startY * this.tileSize);
            this.ctx.lineTo(screenX, visibleBounds.endY * this.tileSize);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = visibleBounds.startY; y <= visibleBounds.endY; y++) {
            const screenY = y * this.tileSize;
            this.ctx.beginPath();
            this.ctx.moveTo(visibleBounds.startX * this.tileSize, screenY);
            this.ctx.lineTo(visibleBounds.endX * this.tileSize, screenY);
            this.ctx.stroke();
        }
        
        this.viewportManager.restoreTransform();
    }
    
    /**
     * Draw checker pattern for transparent tiles
     */
    drawCheckerPattern(visibleBounds) {
        const checkerColor1 = this.settings.get('checkerColor1');
        const checkerColor2 = this.settings.get('checkerColor2');
        
        for (let y = visibleBounds.startY; y < visibleBounds.endY; y++) {
            for (let x = visibleBounds.startX; x < visibleBounds.endX; x++) {
                const isEven = (x + y) % 2 === 0;
                const color = isEven ? checkerColor1 : checkerColor2;
                
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
            }
        }
    }
    
    /**
     * Draw cell borders
     */
    drawCellBorders() {
        if (!this.settings.get('showBorders')) return;
        
        this.viewportManager.applyTransform();
        
        const borderColor = this.settings.get('borderColor');
        const borderWeight = this.settings.get('borderWeight') / this.viewportManager.getZoom();
        
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = borderWeight;
        this.ctx.setLineDash([]);
        
        const visibleBounds = this.viewportManager.getVisibleTileBounds();
        const cellWidth = this.gridSystem.cellWidth * this.tileSize;
        const cellHeight = this.gridSystem.cellHeight * this.tileSize;
        
        // Draw cell borders
        for (let cellY = 0; cellY < this.gridSystem.totalGridRows; cellY++) {
            for (let cellX = 0; cellX < this.gridSystem.totalGridCols; cellX++) {
                const x = cellX * cellWidth;
                const y = cellY * cellHeight;
                
                // Only draw if cell is visible
                if (x + cellWidth >= visibleBounds.startX * this.tileSize && 
                    x <= visibleBounds.endX * this.tileSize &&
                    y + cellHeight >= visibleBounds.startY * this.tileSize && 
                    y <= visibleBounds.endY * this.tileSize) {
                    
                    this.ctx.strokeRect(x, y, cellWidth, cellHeight);
                }
            }
        }
        
        this.viewportManager.restoreTransform();
    }
    
    /**
     * Draw center guide lines
     */
    drawCenterGuides() {
        if (!this.settings.get('showCenterGuides')) return;
        
        this.viewportManager.applyTransform();
        
        const centerGuideColor = this.settings.get('centerGuideColor');
        const centerGuideWeight = this.settings.get('centerGuideWeight') / this.viewportManager.getZoom();
        
        this.ctx.strokeStyle = centerGuideColor;
        this.ctx.lineWidth = centerGuideWeight;
        this.ctx.setLineDash([]);
        
        const bounds = this.gridSystem.getGridBounds();
        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;
        
        // Vertical center line
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, bounds.height);
        this.ctx.stroke();
        
        // Horizontal center line
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(bounds.width, centerY);
        this.ctx.stroke();
        
        this.viewportManager.restoreTransform();
    }
    
    /**
     * Draw tile data
     */
    drawTiles(tileData) {
        this.viewportManager.applyTransform();
        
        const visibleBounds = this.viewportManager.getVisibleTileBounds();
        
        for (let y = visibleBounds.startY; y < visibleBounds.endY; y++) {
            for (let x = visibleBounds.startX; x < visibleBounds.endX; x++) {
                if (y < tileData.length && x < tileData[y].length) {
                    const tileValue = tileData[y][x];
                    if (tileValue !== -1) {
                        this.drawTile(x, y, tileValue);
                    }
                }
            }
        }
        
        this.viewportManager.restoreTransform();
    }
    
    /**
     * Draw a single tile
     */
    drawTile(tileX, tileY, tileValue) {
        const x = tileX * this.tileSize;
        const y = tileY * this.tileSize;
        
        // Set color based on tile value
        let color = '#ffffff'; // Default white
        switch (tileValue) {
            case 0: color = '#ffffff'; break; // Empty/white tiles (carved spaces)
            case 1: color = '#000000'; break; // Filled/black tiles (solid areas)
            case 2: color = '#0000ff'; break; // Special (blue)
            default: color = '#ffffff'; break;
        }
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
    }
    
    /**
     * Draw cell selection
     */
    drawCellSelection(selectedCells) {
        if (selectedCells.length === 0) return;
        
        this.viewportManager.applyTransform();
        
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 3 / this.viewportManager.getZoom();
        this.ctx.setLineDash([]);
        
        const cellWidth = this.gridSystem.cellWidth * this.tileSize;
        const cellHeight = this.gridSystem.cellHeight * this.tileSize;
        
        selectedCells.forEach(cell => {
            const x = cell.x * cellWidth;
            const y = cell.y * cellHeight;
            this.ctx.strokeRect(x, y, cellWidth, cellHeight);
        });
        
        this.viewportManager.restoreTransform();
    }
    
    /**
     * Draw drag preview
     */
    drawDragPreview(dragPreviewCells, dragConflicts, swapMode = false) {
        if (dragPreviewCells.length === 0) return;
        
        this.viewportManager.applyTransform();
        
        const cellWidth = this.gridSystem.cellWidth * this.tileSize;
        const cellHeight = this.gridSystem.cellHeight * this.tileSize;
        
        // Draw preview cells with different colors based on mode
        if (swapMode) {
            // Swap mode: green for preview, orange for conflicts
            this.ctx.fillStyle = 'rgba(76, 175, 80, 0.3)'; // Semi-transparent green
            this.ctx.strokeStyle = '#4CAF50';
        } else {
            // Overwrite mode: blue for preview, red for conflicts
            this.ctx.fillStyle = 'rgba(33, 150, 243, 0.3)'; // Semi-transparent blue
            this.ctx.strokeStyle = '#2196F3';
        }
        
        this.ctx.lineWidth = 2 / this.viewportManager.getZoom();
        this.ctx.setLineDash([5, 5]); // Dashed line
        
        dragPreviewCells.forEach(cell => {
            const x = cell.x * cellWidth;
            const y = cell.y * cellHeight;
            this.ctx.fillRect(x, y, cellWidth, cellHeight);
            this.ctx.strokeRect(x, y, cellWidth, cellHeight);
        });
        
        // Draw conflict indicators
        if (dragConflicts.length > 0) {
            if (swapMode) {
                // Swap mode: orange for conflicts (will be swapped)
                this.ctx.fillStyle = 'rgba(255, 152, 0, 0.3)'; // Semi-transparent orange
                this.ctx.strokeStyle = '#FF9800';
            } else {
                // Overwrite mode: red for conflicts (will be overwritten)
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red
                this.ctx.strokeStyle = '#ff0000';
            }
            
            this.ctx.lineWidth = 3 / this.viewportManager.getZoom();
            this.ctx.setLineDash([]); // Solid line
            
            dragConflicts.forEach(cell => {
                const x = cell.x * cellWidth;
                const y = cell.y * cellHeight;
                this.ctx.fillRect(x, y, cellWidth, cellHeight);
                this.ctx.strokeRect(x, y, cellWidth, cellHeight);
            });
        }
        
        this.ctx.setLineDash([]); // Reset line dash
        this.viewportManager.restoreTransform();
    }
    
    /**
     * Draw selection rectangle
     */
    drawSelectionRectangle(selectionStart, selectionEnd) {
        if (!selectionStart || !selectionEnd) return;
        
        this.viewportManager.applyTransform();
        
        // Calculate rectangle bounds
        const startX = Math.min(selectionStart.x, selectionEnd.x);
        const endX = Math.max(selectionStart.x, selectionEnd.x);
        const startY = Math.min(selectionStart.y, selectionEnd.y);
        const endY = Math.max(selectionStart.y, selectionEnd.y);
        
        const rectX = startX * this.gridSystem.cellWidth * this.tileSize;
        const rectY = startY * this.gridSystem.cellHeight * this.tileSize;
        const rectWidth = (endX - startX + 1) * this.gridSystem.cellWidth * this.tileSize;
        const rectHeight = (endY - startY + 1) * this.gridSystem.cellHeight * this.tileSize;
        
        // Draw selection rectangle
        this.ctx.strokeStyle = '#2196F3';
        this.ctx.fillStyle = 'rgba(33, 150, 243, 0.1)'; // Semi-transparent blue
        this.ctx.lineWidth = 2 / this.viewportManager.getZoom();
        this.ctx.setLineDash([5, 5]); // Dashed line
        
        this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        this.ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        
        this.ctx.setLineDash([]); // Reset line dash
        
        this.viewportManager.restoreTransform();
    }
    
    /**
     * Draw wall indicators - gray wall suggestions around white tiles
     */
    drawWallIndicators(wallIndicators) {
        if (!this.settings.get('showWallIndicators')) return;
        
        this.viewportManager.applyTransform();
        
        // Draw gray fill for wall indicators
        this.ctx.fillStyle = '#808080'; // Gray color for wall indicators
        this.ctx.fillRect(0, 0, 0, 0); // Reset fill
        
        wallIndicators.forEach(tileKey => {
            const [x, y] = tileKey.split(',').map(Number);
            const screenX = x * this.tileSize;
            const screenY = y * this.tileSize;
            
            // Fill with gray to show wall indicator
            this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
        });
        
        this.viewportManager.restoreTransform();
    }
    
    /**
     * Draw temporary message
     */
    drawTemporaryMessage(message, x, y) {
        this.viewportManager.restoreTransform();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x - 10, y - 25, this.ctx.measureText(message).width + 20, 30);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message, x, y);
        this.ctx.textAlign = 'left';
    }
}
