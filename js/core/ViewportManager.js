/**
 * ViewportManager - Handles zoom, pan, and viewport calculations
 */
export class ViewportManager {
    constructor(canvas, settings, gridSystem) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settings = settings;
        this.gridSystem = gridSystem;
        
        this.zoom = this.settings.get('zoom');
        this.viewportX = this.settings.get('viewportX');
        this.viewportY = this.settings.get('viewportY');
        // Don't store tileSize here - always get it from gridSystem
        
        this.canvasWidth = this.settings.get('canvasWidth');
        this.canvasHeight = this.settings.get('canvasHeight');
        this.gridMarginX = this.settings.get('gridMarginX');
        this.gridMarginY = this.settings.get('gridMarginY');
        
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
    }
    
    /**
     * Set zoom level
     */
    setZoom(newZoom) {
        this.zoom = Math.max(0.1, Math.min(5.0, newZoom));
        
        // Only save zoom if saveZoomLevel setting is enabled
        if (this.settings.get('saveZoomLevel')) {
            this.settings.set('zoom', this.zoom);
        }
    }
    
    /**
     * Get current zoom level
     */
    getZoom() {
        return this.zoom;
    }
    
    /**
     * Set viewport position
     */
    setViewport(x, y) {
        this.viewportX = Math.max(0, Math.min(this.gridSystem.totalWidth - this.gridSystem.viewportWidth, x));
        this.viewportY = Math.max(0, Math.min(this.gridSystem.totalHeight - this.gridSystem.viewportHeight, y));
        this.settings.set('viewportX', this.viewportX);
        this.settings.set('viewportY', this.viewportY);
    }
    
    /**
     * Get viewport position
     */
    getViewport() {
        return { x: this.viewportX, y: this.viewportY };
    }
    
    /**
     * Start panning
     */
    startPan(mouseX, mouseY) {
        this.isPanning = true;
        this.lastPanX = mouseX;
        this.lastPanY = mouseY;
    }
    
    /**
     * Update panning
     */
    updatePan(mouseX, mouseY) {
        if (!this.isPanning) return;
        
        const deltaX = mouseX - this.lastPanX;
        const deltaY = mouseY - this.lastPanY;
        
        this.panX += deltaX;
        this.panY += deltaY;
        
        this.lastPanX = mouseX;
        this.lastPanY = mouseY;
    }
    
    /**
     * Stop panning
     */
    stopPan() {
        this.isPanning = false;
    }
    
    /**
     * Pan viewport by delta amount
     */
    panViewport(deltaX, deltaY) {
        this.panX += deltaX;
        this.panY += deltaY;
        this.constrainViewport();
    }
    
    /**
     * Constrain viewport to grid bounds
     */
    constrainViewport() {
        const gridWidth = this.gridSystem.totalWidth;
        const gridHeight = this.gridSystem.totalHeight;
        const tileSize = this.gridSystem.tileSize;
        
        const maxPanX = (gridWidth * tileSize) - this.canvas.width / this.zoom;
        const maxPanY = (gridHeight * tileSize) - this.canvas.height / this.zoom;
        
        this.panX = Math.max(0, Math.min(maxPanX, this.panX));
        this.panY = Math.max(0, Math.min(maxPanY, this.panY));
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        const worldX = (screenX - this.panX) / this.zoom;
        const worldY = (screenY - this.panY) / this.zoom;
        return { x: worldX, y: worldY };
    }
    
    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        const screenX = worldX * this.zoom + this.panX;
        const screenY = worldY * this.zoom + this.panY;
        return { x: screenX, y: screenY };
    }
    
    /**
     * Convert screen coordinates to tile coordinates
     */
    screenToTile(screenX, screenY) {
        const world = this.screenToWorld(screenX, screenY);
        const tileSize = this.gridSystem.tileSize;
        const tileX = Math.floor(world.x / tileSize);
        const tileY = Math.floor(world.y / tileSize);
        return { x: tileX, y: tileY };
    }
    
    /**
     * Convert tile coordinates to screen coordinates
     */
    tileToScreen(tileX, tileY) {
        const tileSize = this.gridSystem.tileSize;
        const worldX = tileX * tileSize;
        const worldY = tileY * tileSize;
        return this.worldToScreen(worldX, worldY);
    }
    
    /**
     * Get visible tile bounds
     */
    getVisibleTileBounds() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const topLeft = this.screenToTile(0, 0);
        const bottomRight = this.screenToTile(canvasWidth, canvasHeight);
        
        return {
            startX: Math.max(0, topLeft.x),
            startY: Math.max(0, topLeft.y),
            endX: Math.min(this.gridSystem.totalWidth, bottomRight.x + 1),
            endY: Math.min(this.gridSystem.totalHeight, bottomRight.y + 1)
        };
    }
    
    /**
     * Apply viewport transformation to canvas
     */
    applyTransform() {
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
    }
    
    /**
     * Restore canvas transformation
     */
    restoreTransform() {
        this.ctx.restore();
    }
    
    /**
     * Center viewport on a specific tile
     */
    centerOnTile(tileX, tileY) {
        const centerX = tileX - Math.floor(this.gridSystem.viewportWidth / 2);
        const centerY = tileY - Math.floor(this.gridSystem.viewportHeight / 2);
        this.setViewport(centerX, centerY);
    }
    
    /**
     * Fit entire grid in viewport
     */
    fitToGrid() {
        const tileSize = this.gridSystem.tileSize;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const scaleX = canvasWidth / (this.gridSystem.totalWidth * tileSize);
        const scaleY = canvasHeight / (this.gridSystem.totalHeight * tileSize);
        const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave some margin
        
        this.setZoom(scale);
        this.setViewport(0, 0);
        this.panX = (canvasWidth - this.gridSystem.totalWidth * tileSize * this.zoom) / 2;
        this.panY = (canvasHeight - this.gridSystem.totalHeight * tileSize * this.zoom) / 2;
    }
    
    /**
     * Calculate centered viewport position
     */
    calculateCenteredViewport() {
        const viewportX = Math.floor((this.gridSystem.totalWidth - this.gridSystem.viewportWidth) / 2);
        const viewportY = Math.floor((this.gridSystem.totalHeight - this.gridSystem.viewportHeight) / 2);
        
        this.settings.set('viewportX', viewportX);
        this.settings.set('viewportY', viewportY);
        this.viewportX = viewportX;
        this.viewportY = viewportY;
    }
    
    /**
     * Reset viewport to default position
     */
    resetViewport() {
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;
        this.settings.set('zoom', this.zoom);
        this.calculateCenteredViewport();
    }
}
