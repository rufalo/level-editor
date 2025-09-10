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
        
        // Don't store tileSize here - always get it from gridSystem
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
            const screenX = x * this.gridSystem.tileSize;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, visibleBounds.startY * this.gridSystem.tileSize);
            this.ctx.lineTo(screenX, visibleBounds.endY * this.gridSystem.tileSize);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = visibleBounds.startY; y <= visibleBounds.endY; y++) {
            const screenY = y * this.gridSystem.tileSize;
            this.ctx.beginPath();
            this.ctx.moveTo(visibleBounds.startX * this.gridSystem.tileSize, screenY);
            this.ctx.lineTo(visibleBounds.endX * this.gridSystem.tileSize, screenY);
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
        const checkerSize = this.gridSystem.tileSize / 2; // Half the size of main tiles
        
        for (let y = visibleBounds.startY; y < visibleBounds.endY; y++) {
            for (let x = visibleBounds.startX; x < visibleBounds.endX; x++) {
                // Draw 4 checker squares per tile (2x2 grid)
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        const checkerX = x * this.gridSystem.tileSize + dx * checkerSize;
                        const checkerY = y * this.gridSystem.tileSize + dy * checkerSize;
                        const isEven = ((x * 2 + dx) + (y * 2 + dy)) % 2 === 0;
                        const color = isEven ? checkerColor1 : checkerColor2;
                        
                        this.ctx.fillStyle = color;
                        this.ctx.fillRect(checkerX, checkerY, checkerSize, checkerSize);
                    }
                }
            }
        }
    }
    
    
    /**
     * Draw brush preview at cursor position
     */
    drawBrushPreview(mouseX, mouseY, brushSize) {
        if (!this.settings.get('showBrushPreview')) return;
        
        // Convert screen coordinates to tile coordinates
        const tilePos = this.viewportManager.screenToTile(mouseX, mouseY);
        const tileX = tilePos.x;
        const tileY = tilePos.y;
        
        // Check if tile is valid
        if (!this.gridSystem.isValidTile(tileX, tileY)) return;
        
        // Get brush tiles using the same pattern as the actual brush
        const brushTiles = this.getBrushTiles(tileX, tileY, brushSize);
        
        // Draw brush preview
        this.ctx.save();
        this.ctx.strokeStyle = '#ff6b35';
        this.ctx.fillStyle = 'rgba(100, 255, 53, 0.2)';
        this.ctx.lineWidth = 0;
        this.ctx.setLineDash([4, 4]);
        
        for (const {x, y} of brushTiles) {
            if (this.gridSystem.isValidTile(x, y)) {
                const screenPos = this.viewportManager.tileToScreen(x, y);
                const tileSize = this.gridSystem.tileSize * this.viewportManager.getZoom();
                
                // Fill
                this.ctx.fillRect(screenPos.x, screenPos.y, tileSize, tileSize);
                
                // Border
                this.ctx.strokeRect(screenPos.x, screenPos.y, tileSize, tileSize);
            }
        }
        
        this.ctx.restore();
    }
    
    /**
     * Get brush tiles for preview - using the same pattern as Editor.getBrushTiles
     */
    getBrushTiles(centerX, centerY, brushSize) {
        const tiles = [];
        
        if (brushSize === 1) {
            // Size 1: Just center tile
            tiles.push({x: centerX, y: centerY});
        } else if (brushSize === 2) {
            // Size 2: Plus pattern (center + 4 directions)
            tiles.push({x: centerX, y: centerY});         // center
            tiles.push({x: centerX - 1, y: centerY});     // left
            tiles.push({x: centerX + 1, y: centerY});     // right
            tiles.push({x: centerX, y: centerY - 1});     // up
            tiles.push({x: centerX, y: centerY + 1});     // down
        } else if (brushSize === 3) {
            // Size 3: Full 3x3 square
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    tiles.push({x: centerX + dx, y: centerY + dy});
                }
            }
        } else if (brushSize === 4) {
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
        } else if (brushSize === 5) {
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
                    // -1 tiles are transparent and show the checker pattern background
                    // No need to draw anything for them
                }
            }
        }
        
        this.viewportManager.restoreTransform();
    }
    
    /**
     * Draw a single tile
     */
    drawTile(tileX, tileY, tileValue) {
        const x = tileX * this.gridSystem.tileSize;
        const y = tileY * this.gridSystem.tileSize;
        
        
        // Set color based on tile value
        let color = '#ffffff'; // Default white
        switch (tileValue) {
            case 0: color = '#ffffff'; break; // Empty/white tiles (carved spaces)
            case 1: color = '#000000'; break; // Filled/black tiles (solid areas)
            case 2: color = '#0000ff'; break; // Special (blue)
            default: color = '#ffffff'; break;
        }
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, this.gridSystem.tileSize, this.gridSystem.tileSize);
    }
    
    /**
     * Draw wall indicators - gray wall suggestions around white tiles
     */
    drawWallIndicators(wallIndicators) {
        if (!this.settings.get('showWallIndicators')) return;
        
        this.viewportManager.applyTransform();
        
        // Draw wall indicators with customizable color
        this.ctx.fillStyle = this.settings.get('wallIndicatorColor');
        this.ctx.fillRect(0, 0, 0, 0); // Reset fill
        
        wallIndicators.forEach(tileKey => {
            const [x, y] = tileKey.split(',').map(Number);
            const screenX = x * this.gridSystem.tileSize;
            const screenY = y * this.gridSystem.tileSize;
            
            // Fill with gray to show wall indicator
            this.ctx.fillRect(screenX, screenY, this.gridSystem.tileSize, this.gridSystem.tileSize);
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
