/**
 * Editor - Handles level editing functionality
 */
export class Editor {
    constructor(canvas, settings, gridSystem, viewportManager, canvasRenderer, eventHandler) {
        this.canvas = canvas;
        this.settings = settings;
        this.gridSystem = gridSystem;
        this.viewportManager = viewportManager;
        this.canvasRenderer = canvasRenderer;
        this.eventHandler = eventHandler;
        
        // No cell tracking needed - working directly with tiles
        
        // Initialize tile data
        this.tileData = [];
        this.initializeTileData();
        
        // Drawing state
        this.isDrawing = false;
        this.lastDrawnTile = null;
        this.mouseX = 0;
        this.mouseY = 0;
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
     * Initialize tile data array with empty grid
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
    
    // Default cells removed - starting with clean empty grid
    
    /**
     * Setup event listeners - now handled by main App
     */
    setupEventListeners() {
        // Events are now handled directly by App and delegated here
    }
    
    /**
     * Handle mouse down
     */
    handleMouseDown(detail) {
        const { tileX, tileY, button, ctrlKey, shiftKey } = detail;
        
        if (button === 1) {
            // Start panning (middle-click)
            this.viewportManager.startPan(detail.mouseX, detail.mouseY);
            return;
        }
        
        if (this.currentMode === 'paint') {
            // Start drawing
            this.isDrawing = true;
            this.lastDrawnTile = null;
            this.drawingMode = button === 0 ? 'draw' : 'erase';
            this.isShiftPressed = shiftKey;
            this.handleTileInteraction(tileX, tileY, shiftKey, button);
        }
    }
    
    /**
     * Handle tile interaction (painting)
     */
    handleTileInteraction(tileX, tileY, shiftKey, button) {
        if (!this.gridSystem.isValidTile(tileX, tileY)) return;
        
        // Prevent drawing on the same tile multiple times during drag
        if (this.lastDrawnTile && 
            this.lastDrawnTile.x === tileX && 
            this.lastDrawnTile.y === tileY) {
            return;
        }
        
        this.lastDrawnTile = { x: tileX, y: tileY };
        
        // Get list of tiles to affect based on brush pattern
        const tilesToAffect = this.getBrushTiles(tileX, tileY);
        
        for (const {x: targetX, y: targetY} of tilesToAffect) {
            // Check bounds
            if (this.gridSystem.isValidTile(targetX, targetY)) {
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
            }
        }
        
        // Update wall indicators after tile interaction
        this.applyWallIndicators();
        
        // Always render after tile interaction to ensure visual updates
        this.render();
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
     * Handle mouse move
     */
    handleMouseMove(detail) {
        const { tileX, tileY, mouseX, mouseY } = detail;
        
        // Handle panning
        if (this.viewportManager.isPanning) {
            this.viewportManager.updatePan(mouseX, mouseY);
            this.render();
            return;
        }
        
        // Handle continuous drawing
        if (this.isDrawing && this.currentMode === 'paint') {
            this.handleTileInteraction(tileX, tileY, this.isShiftPressed, this.drawingMode === 'draw' ? 0 : 2);
        }
    }
    
    /**
     * Handle mouse up
     */
    handleMouseUp(detail) {
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
     * Clear entire grid
     */
    clearGrid() {
        this.initializeTileData();
        this.wallIndicators.clear();
        this.render();
    }
    
    /**
     * Set current mode
     */
    setMode(mode) {
        this.currentMode = mode;
        this.render();
    }
    
    /**
     * Update mouse position for brush preview
     */
    updateMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
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
        
        if (this.settings.get('showCenterGuides')) {
            this.canvasRenderer.drawCenterGuides();
        }
        
        // Draw brush preview
        this.canvasRenderer.drawBrushPreview(this.mouseX, this.mouseY, this.brushSize);
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
    
}
