/**
 * GridSystem - Handles grid calculations and cell management
 */
export class GridSystem {
    constructor(settings) {
        this.settings = settings;
        this.updateDimensions();
    }
    
    /**
     * Update grid dimensions based on settings
     */
    updateDimensions() {
        this.cellWidth = this.settings.get('cellWidth');
        this.cellHeight = this.settings.get('cellHeight');
        this.totalGridCols = this.settings.get('totalGridCols');
        this.totalGridRows = this.settings.get('totalGridRows');
        this.tileSize = this.settings.get('tileSize');
        
        // Calculate total dimensions
        this.totalWidth = this.totalGridCols * this.cellWidth;
        this.totalHeight = this.totalGridRows * this.cellHeight;
        
        // Viewport dimensions
        this.viewportCols = this.settings.get('viewportCols');
        this.viewportRows = this.settings.get('viewportRows');
        this.viewportTileWidth = this.viewportCols * this.cellWidth;
        this.viewportTileHeight = this.viewportRows * this.cellHeight;
    }
    
    /**
     * Get cell coordinates from tile coordinates
     */
    getCellFromTile(tileX, tileY) {
        return {
            x: Math.floor(tileX / this.cellWidth),
            y: Math.floor(tileY / this.cellHeight)
        };
    }
    
    /**
     * Get tile coordinates from cell coordinates
     */
    getTileFromCell(cellX, cellY) {
        return {
            startX: cellX * this.cellWidth,
            startY: cellY * this.cellHeight,
            endX: (cellX + 1) * this.cellWidth,
            endY: (cellY + 1) * this.cellHeight
        };
    }
    
    /**
     * Check if cell coordinates are valid
     */
    isValidCell(cellX, cellY) {
        return cellX >= 0 && cellX < this.totalGridCols && 
               cellY >= 0 && cellY < this.totalGridRows;
    }
    
    /**
     * Check if tile coordinates are valid
     */
    isValidTile(tileX, tileY) {
        return tileX >= 0 && tileX < this.totalWidth && 
               tileY >= 0 && tileY < this.totalHeight;
    }
    
    /**
     * Get cell key string for Set operations
     */
    getCellKey(cellX, cellY) {
        return `${cellX},${cellY}`;
    }
    
    /**
     * Parse cell key string back to coordinates
     */
    parseCellKey(key) {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
    }
    
    /**
     * Get all cells in a rectangular area
     */
    getCellsInArea(startX, startY, endX, endY) {
        const cells = [];
        const startCell = this.getCellFromTile(startX, startY);
        const endCell = this.getCellFromTile(endX, endY);
        
        for (let y = startCell.y; y <= endCell.y; y++) {
            for (let x = startCell.x; x <= endCell.x; x++) {
                if (this.isValidCell(x, y)) {
                    cells.push({ x, y });
                }
            }
        }
        
        return cells;
    }
    
    /**
     * Get center coordinates of a cell
     */
    getCellCenter(cellX, cellY) {
        const tile = this.getTileFromCell(cellX, cellY);
        return {
            x: (tile.startX + tile.endX) / 2,
            y: (tile.startY + tile.endY) / 2
        };
    }
    
    /**
     * Get grid bounds for rendering
     */
    getGridBounds() {
        return {
            width: this.totalWidth * this.tileSize,
            height: this.totalHeight * this.tileSize,
            cellWidth: this.cellWidth * this.tileSize,
            cellHeight: this.cellHeight * this.tileSize
        };
    }
    
    /**
     * Calculate centered viewport position
     */
    calculateCenteredViewport() {
        const viewportX = Math.floor((this.totalGridCols - this.viewportCols) / 2);
        const viewportY = Math.floor((this.totalGridRows - this.viewportRows) / 2);
        
        this.settings.set('viewportX', viewportX);
        this.settings.set('viewportY', viewportY);
    }
}
