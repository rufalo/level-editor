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
        
        // Draw grid lines
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
        let color = '#ff0000'; // Default red
        switch (tileValue) {
            case 0: color = '#ff0000'; break; // Blockout
            case 1: color = '#00ff00'; break; // Connection
            case 2: color = '#0000ff'; break; // Special
            default: color = '#ff0000'; break;
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
     * Draw outline overlay
     */
    drawOutlineOverlay(outlineOverlay) {
        if (!this.settings.get('showOutlines')) return;
        
        this.viewportManager.applyTransform();
        
        const outlineColor = this.settings.get('outlineColor');
        const outlineWeight = this.settings.get('outlineWeight') / this.viewportManager.getZoom();
        
        this.ctx.strokeStyle = outlineColor;
        this.ctx.lineWidth = outlineWeight;
        this.ctx.setLineDash([]);
        
        outlineOverlay.forEach(cellKey => {
            const { x, y } = this.gridSystem.parseCellKey(cellKey);
            const tile = this.gridSystem.getTileFromCell(x, y);
            const cellWidth = this.gridSystem.cellWidth * this.tileSize;
            const cellHeight = this.gridSystem.cellHeight * this.tileSize;
            
            this.ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
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
