/**
 * GridSystem - Handles grid calculations and tile management
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
        this.tileSize = this.settings.get('tileSize');
        this.totalWidth = this.settings.get('totalGridWidth');
        this.totalHeight = this.settings.get('totalGridHeight');
        
        // Viewport dimensions
        this.viewportWidth = this.settings.get('viewportWidth');
        this.viewportHeight = this.settings.get('viewportHeight');
    }
    
    /**
     * Check if tile coordinates are valid
     */
    isValidTile(tileX, tileY) {
        return tileX >= 0 && tileX < this.totalWidth && 
               tileY >= 0 && tileY < this.totalHeight;
    }
    
    /**
     * Get tile key string for Set operations
     */
    getTileKey(tileX, tileY) {
        return `${tileX},${tileY}`;
    }
    
    /**
     * Parse tile key string back to coordinates
     */
    parseTileKey(key) {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
    }
    
    /**
     * Get all tiles in a rectangular area
     */
    getTilesInArea(startX, startY, endX, endY) {
        const tiles = [];
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (this.isValidTile(x, y)) {
                    tiles.push({ x, y });
                }
            }
        }
        
        return tiles;
    }
    
    /**
     * Get grid bounds for rendering
     */
    getGridBounds() {
        return {
            width: this.totalWidth * this.tileSize,
            height: this.totalHeight * this.tileSize,
            tileSize: this.tileSize
        };
    }
    
    /**
     * Calculate centered viewport position
     */
    calculateCenteredViewport() {
        const viewportX = Math.floor((this.totalWidth - this.viewportWidth) / 2);
        const viewportY = Math.floor((this.totalHeight - this.viewportHeight) / 2);
        
        this.settings.set('viewportX', viewportX);
        this.settings.set('viewportY', viewportY);
    }
}


