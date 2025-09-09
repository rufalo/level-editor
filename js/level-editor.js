class LevelEditor {
    constructor() {
        this.canvas = document.getElementById('tileCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Multi-cell level configuration
        this.totalGridCols = 10;   // Total number of cells horizontally
        this.totalGridRows = 10;   // Total number of cells vertically
        this.cellWidth = 5;       // Tiles per cell width
        this.cellHeight = 5;      // Tiles per cell height
        this.tileSize = 32;       // Pixels per tile
        
        // Viewport configuration
        this.viewportCols = 3;    // Number of cells shown horizontally
        this.viewportRows = 3;    // Number of cells shown vertically
        this.viewportX = 3;       // Viewport position in level grid (center of 10x10)
        this.viewportY = 3;       // Viewport position in level grid (center of 10x10)
        this.zoom = 1.0;          // Zoom level
        
        // Grid margins (allow panning beyond grid edges)
        this.gridMarginX = 400;   // Pixels of margin on left/right
        this.gridMarginY = 300;   // Pixels of margin on top/bottom
        
        // Canvas size (fixed)
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        
        // Calculate viewport offsets to center the grid automatically
        this.calculateCenteredViewport();
        
        // Total dimensions
        this.totalWidth = this.totalGridCols * this.cellWidth;   // 50 tiles (10*5)
        this.totalHeight = this.totalGridRows * this.cellHeight;  // 50 tiles (10*5)
        this.viewportTileWidth = this.viewportCols * this.cellWidth;    // 48 tiles
        this.viewportTileHeight = this.viewportRows * this.cellHeight;  // 30 tiles
        
        // Multi-cell tile data - 2D array (0 = empty, 1 = blockout, 2 = connection)
        this.tileData = [];
        
        // Cell activity state - tracks which cells have content
        this.activeCells = new Set(); // Set of "x,y" strings for active cells
        
        // Drawing modes
        this.currentMode = 'paint'; // 'paint', 'selectCell', 'clone', 'paste'
        
        // Unified selection system (handles single and multiple cells)
        this.isDraggingCell = false;
        this.dragStartCell = null;
        this.swapMode = true; // Default to swap mode enabled
        this.isCloneMode = false;
        
        // Multi-cell rectangle selection
        this.selectionStart = null; // {x, y} in cell coordinates where selection started
        this.selectionEnd = null;   // {x, y} in cell coordinates where selection ends
        this.isSelecting = false;   // Whether we're currently drawing selection rectangle
        this.selectedCells = [];    // Array of selected cell coordinates [{x, y}, ...]
        
        // Copy/paste system
        this.copiedPattern = null;  // Stores copied tile data and dimensions
        this.pastePreviewPos = null; // {x, y} in cell coordinates for paste preview
        
        
        // Drawing state
        this.isDrawing = false;
        this.lastDrawnTile = null;
        this.currentTileType = 1; // 1 = blockout, 2 = cell opening
        this.brushSize = 1; // Brush size for drawing
        this.targetDrawState = null; // For setState mode: target state to apply during current draw session
        this.setStateSampleMode = false; // For setState mode: whether we're sampling (right-click) vs toggling (left-click)
        this.isShiftPressed = false; // Track shift key for eraser mode
        
        // Pan state
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        
        // Brush preview
        this.showBrushPreview = false;
        this.brushPreviewTile = null;
        
        // Canvas drop zone for cell saving
        this.showCanvasDropZone = false;
        
        // Visual settings
        this.showBorders = true;
        this.borderColor = '#4d9fff';
        this.gridLineColor = '#999999';
        this.checkerColor1 = '#d0d0d0';
        this.checkerColor2 = '#e6f3ff';
        this.autoOutline = false;
        
        // Initialize
        this.initializeTileData();
        this.setupEventListeners();
        this.setupUI();
        this.updateCanvasSize();
        this.loadSettings(); // Load visual settings
        this.setMode('paint'); // Initialize with paint mode
        this.clearOldCellLibrary(); // Clear old 8x5 cell library
        this.loadCellShelf(); // Load saved cells into shelf
    }
    
    initializeTileData() {
        this.tileData = [];
        for (let y = 0; y < this.totalHeight; y++) {
            this.tileData[y] = [];
            for (let x = 0; x < this.totalWidth; x++) {
                // All tiles start transparent (-1 = transparent/empty canvas)
                this.tileData[y][x] = -1;
            }
        }
        
        // Initialize all cells as inactive (all transparent by default - no modifications)
        this.activeCells = new Set();
    }
    
    updateCanvasSize() {
        this.totalWidth = this.totalGridCols * this.cellWidth;
        this.totalHeight = this.totalGridRows * this.cellHeight;
        this.viewportTileWidth = this.viewportCols * this.cellWidth;
        this.viewportTileHeight = this.viewportRows * this.cellHeight;
        
        // Canvas size is fixed - only content scales with zoom
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        // Update UI info
        document.getElementById('gridSize').textContent = `${this.totalGridCols}x${this.totalGridRows}`;
        document.getElementById('cellSize').textContent = `${this.cellWidth}x${this.cellHeight}`;
        document.getElementById('totalSize').textContent = `${this.totalWidth}x${this.totalHeight}`;
        document.getElementById('tileSize').textContent = `${this.tileSize}x${this.tileSize}`;
        
        this.render();
    }
    
    setupEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => {
            this.handleMouseUp(e);
            this.showBrushPreview = false;
            this.render();
        });
        
        // Zoom events
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Keyboard events for panning
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
    
    setupUI() {
        // Mode buttons
        document.getElementById('paintMode').addEventListener('click', () => this.setMode('paint'));
        document.getElementById('selectCellMode').addEventListener('click', () => this.setMode('selectCell'));
        document.getElementById('pasteMode').addEventListener('click', () => this.setMode('paste'));
        document.getElementById('cloneMode').addEventListener('click', () => this.setMode('clone'));
        
        // Cell actions
        document.getElementById('clearCell').addEventListener('click', () => this.clearSelectedCell());
        document.getElementById('fillCell').addEventListener('click', () => this.fillSelectedCell());
        
        // Grid action buttons
        document.getElementById('clearGrid').addEventListener('click', () => this.clearGrid());
        
        // Level Library
        document.getElementById('saveLevel').addEventListener('click', () => this.saveLevel());
        document.getElementById('loadLevel').addEventListener('click', () => this.loadLevel());
        
        // Border controls
        document.getElementById('showBorders').addEventListener('change', (e) => {
            this.showBorders = e.target.checked;
            this.saveSettings();
            this.render();
        });
        
        document.getElementById('autoOutline').addEventListener('change', (e) => {
            this.autoOutline = e.target.checked;
            this.saveSettings();
        });
        
        // Color inputs (hidden, triggered by swatches)
        document.getElementById('borderColor').addEventListener('change', (e) => {
            this.borderColor = e.target.value;
            document.getElementById('borderColorSwatch').style.backgroundColor = e.target.value;
            this.saveSettings();
            this.render();
        });
        
        document.getElementById('gridLineColor').addEventListener('change', (e) => {
            this.gridLineColor = e.target.value;
            document.getElementById('gridLineColorSwatch').style.backgroundColor = e.target.value;
            this.saveSettings();
            this.render();
        });
        
        document.getElementById('checkerColor1').addEventListener('change', (e) => {
            this.checkerColor1 = e.target.value;
            document.getElementById('checkerColor1Swatch').style.backgroundColor = e.target.value;
            this.saveSettings();
            this.render();
        });
        
        document.getElementById('checkerColor2').addEventListener('change', (e) => {
            this.checkerColor2 = e.target.value;
            document.getElementById('checkerColor2Swatch').style.backgroundColor = e.target.value;
            this.saveSettings();
            this.render();
        });
        
        // Reset settings button
        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettingsToDefaults();
        });
        
        // Swap mode toggle
        document.getElementById('swapMode').addEventListener('change', (e) => {
            this.swapMode = e.target.checked;
        });
        
        // Brush size control
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeValue').textContent = this.brushSize;
            document.getElementById('brushSizeValue2').textContent = this.brushSize;
        });
        
        // Cell shelf drag and drop
        this.setupCellShelfDragDrop();
        
        // Tab switching
        this.setupTabs();
        
        // Color swatch clicks
        this.setupColorSwatches();
    }
    
    
    getTileFromMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // Convert canvas coordinates to world coordinates accounting for zoom and offset
        const scaledTileSize = this.tileSize * this.zoom;
        const worldPixelX = (canvasX / this.zoom) + (this.viewportX * this.cellWidth * this.tileSize) + this.viewportOffsetX;
        const worldPixelY = (canvasY / this.zoom) + (this.viewportY * this.cellHeight * this.tileSize) + this.viewportOffsetY;
        
        const worldTileX = Math.floor(worldPixelX / this.tileSize);
        const worldTileY = Math.floor(worldPixelY / this.tileSize);
        
        // Bounds check against total world
        if (worldTileX < 0 || worldTileX >= this.totalWidth || worldTileY < 0 || worldTileY >= this.totalHeight) {
            return null;
        }
        
        return { x: worldTileX, y: worldTileY };
    }
    
    handleMouseDown(e) {
        e.preventDefault();
        
        // Middle mouse button for panning
        if (e.button === 1) {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = 'grab';
            return;
        }
        
        if (this.currentMode === 'selectCell' || this.currentMode === 'clone' || this.currentMode === 'paste') {
            this.handleCellMouseDown(e);
            return;
        }
        
        this.isDrawing = true;
        this.lastDrawnTile = null;
        this.targetDrawState = null; // Reset target state for new drawing session
        this.setStateSampleMode = (this.currentMode === 'setState' && e.button === 0); // Left-click in setState mode
        this.drawingMode = e.button === 0 ? 'draw' : 'erase'; // 0 = left click, 2 = right click
        
        
        this.handleTileInteraction(e);
    }
    
    handleMouseMove(e) {
        if (this.isPanning) {
            const deltaX = e.clientX - this.lastPanX;
            const deltaY = e.clientY - this.lastPanY;
            
            // Pan by moving the viewport offset in pixels
            this.viewportOffsetX -= deltaX / this.zoom;
            this.viewportOffsetY -= deltaY / this.zoom;
            
            this.constrainViewport();
            this.render();
            
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            return;
        }
        
        if ((this.isDraggingCell || this.isSelecting) && this.currentMode === 'selectCell') {
            this.handleCellDrag(e);
            return;
        }
        
        if (!this.isDrawing) {
            // Update brush preview
            this.updateBrushPreview(e);
            return;
        }
        this.handleTileInteraction(e);
    }
    
    handleMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'crosshair';
            return;
        }
        
        if (this.isDraggingCell && this.currentMode === 'selectCell') {
            this.handleCellDrop(e);
            return;
        }
        
        if (this.isSelecting && this.currentMode === 'selectCell') {
            // Complete rectangle selection
            this.isSelecting = false;
            this.canvas.style.cursor = 'pointer';
            return;
        }
        
        this.isDrawing = false;
        this.lastDrawnTile = null;
        this.targetDrawState = null; // Clear target state when drawing ends
        this.setStateSampleMode = false; // Reset sample mode
        
        
        // Apply auto-outline if enabled
        if (this.autoOutline) {
            this.applyAutoOutline();
        }
        
        // Update brush preview when not drawing
        if (e) {
            this.updateBrushPreview(e);
        }
    }
    
    handleTileInteraction(e) {
        const tile = this.getTileFromMouse(e);
        if (!tile) return;
        
        // Prevent drawing on the same tile multiple times during drag
        if (this.lastDrawnTile && 
            this.lastDrawnTile.x === tile.x && 
            this.lastDrawnTile.y === tile.y) {
            return;
        }
        
        
        this.lastDrawnTile = tile;
        
        // Apply brush to area around clicked tile
        const affectedCells = new Set();
        
        // Get list of tiles to affect based on brush pattern
        const tilesToAffect = this.getBrushTiles(tile.x, tile.y);
        
        for (const {x: targetX, y: targetY} of tilesToAffect) {
            // Check bounds
            if (targetX >= 0 && targetX < this.totalWidth && targetY >= 0 && targetY < this.totalHeight) {
                    
                    // Handle different drawing modes
                    if (this.currentMode === 'paint') {
                        // Paint mode: direct tile painting with shift eraser
                        if (this.isShiftPressed) {
                            // Shift + paint = filled/black tiles
                            this.tileData[targetY][targetX] = 1;
                        } else if (this.drawingMode === 'draw') {
                            this.tileData[targetY][targetX] = 0; // Left click = empty/white tiles
                        } else if (this.drawingMode === 'erase') {
                            this.tileData[targetY][targetX] = -1; // Right click = eraser mode (transparent)
                        }
                    
                    }
                    
                    // Track affected cells for activity updates
                    const cellX = Math.floor(targetX / this.cellWidth);
                    const cellY = Math.floor(targetY / this.cellHeight);
                    affectedCells.add(`${cellX},${cellY}`);
            }
        }
        
        // Update activity for all affected cells
        for (const cellKey of affectedCells) {
            const [cellX, cellY] = cellKey.split(',').map(Number);
            this.updateCellActivity(cellX, cellY);
        }
        
        // Re-render the entire view to show the change
        this.render();
    }
    
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
    
    updateBrushPreview(e) {
        const tile = this.getTileFromMouse(e);
        if (!tile) {
            this.showBrushPreview = false;
            this.render();
            return;
        }
        
        // Only show brush preview in drawing modes
        if (this.currentMode === 'paint') {
            this.showBrushPreview = true;
            this.brushPreviewTile = tile;
            this.render();
        } else {
            this.showBrushPreview = false;
        }
    }
    
    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0 // Touch always draws (left click equivalent)
        });
        this.handleMouseDown(mouseEvent);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseMove(mouseEvent);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for transformations
        this.ctx.save();
        
        // Apply zoom and pan transformations
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.viewportOffsetX - (this.viewportX * this.cellWidth * this.tileSize), 
                          -this.viewportOffsetY - (this.viewportY * this.cellHeight * this.tileSize));
        
        // Calculate which tiles are visible on screen
        const scaledTileSize = this.tileSize;
        const viewStartX = Math.floor((this.viewportOffsetX + (this.viewportX * this.cellWidth * this.tileSize)) / scaledTileSize);
        const viewStartY = Math.floor((this.viewportOffsetY + (this.viewportY * this.cellHeight * this.tileSize)) / scaledTileSize);
        const viewEndX = Math.min(this.totalWidth, viewStartX + Math.ceil(this.canvas.width / (scaledTileSize * this.zoom)) + 2);
        const viewEndY = Math.min(this.totalHeight, viewStartY + Math.ceil(this.canvas.height / (scaledTileSize * this.zoom)) + 2);
        
        // First render cell backgrounds
        this.renderCellBackgrounds(viewStartX, viewStartY, viewEndX, viewEndY);
        
        // Then render visible tiles on top
        for (let worldY = Math.max(0, viewStartY); worldY < viewEndY; worldY++) {
            for (let worldX = Math.max(0, viewStartX); worldX < viewEndX; worldX++) {
                this.renderTileAtWorld(worldX, worldY);
            }
        }
        
        // Draw grid lines
        this.drawGrid();
        
        // Draw cell borders if enabled
        if (this.showBorders) {
            this.drawCellBorders();
        }
        
        // Draw unified cell selection highlight
        if (this.selectedCells.length > 0 && this.currentMode === 'selectCell') {
            this.drawMultiCellSelectionHighlight();
        }
        
        // Draw selection rectangle while selecting
        if (this.isSelecting && this.selectionStart && this.selectionEnd) {
            this.drawSelectionRectangle();
        }
        
        // Draw brush preview
        if (this.showBrushPreview && this.brushPreviewTile) {
            this.drawBrushPreview();
        }
        
        // Draw canvas drop zone
        if (this.showCanvasDropZone) {
            this.drawCanvasDropZone();
        }
        
        // Restore context
        this.ctx.restore();
    }
    
    renderCellBackgrounds(startTileX, startTileY, endTileX, endTileY) {
        // Calculate which cells are visible
        const startCellX = Math.max(0, Math.floor(startTileX / this.cellWidth));
        const startCellY = Math.max(0, Math.floor(startTileY / this.cellHeight));
        const endCellX = Math.min(this.totalGridCols, Math.ceil(endTileX / this.cellWidth));
        const endCellY = Math.min(this.totalGridRows, Math.ceil(endTileY / this.cellHeight));
        
        // Render cell backgrounds
        for (let cellY = startCellY; cellY < endCellY; cellY++) {
            for (let cellX = startCellX; cellX < endCellX; cellX++) {
                const isActive = this.isCellActive(cellX, cellY);
                
                // Calculate cell position in pixels
                const pixelX = cellX * this.cellWidth * this.tileSize;
                const pixelY = cellY * this.cellHeight * this.tileSize;
                const cellPixelWidth = this.cellWidth * this.tileSize;
                const cellPixelHeight = this.cellHeight * this.tileSize;
                
                // Fill cell background - different colors for active vs inactive
                if (isActive) {
                    this.ctx.fillStyle = '#ffffff'; // White for active cells (with content)
                } else {
                    this.ctx.fillStyle = '#f5f5f5'; // Light gray for inactive cells (no content)
                }
                this.ctx.fillRect(pixelX, pixelY, cellPixelWidth, cellPixelHeight);
            }
        }
    }
    
    renderTileAtWorld(worldX, worldY) {
        // Bounds check - ensure we don't access undefined array elements
        if (worldY < 0 || worldY >= this.totalHeight || worldX < 0 || worldX >= this.totalWidth) {
            return;
        }
        
        const pixelX = worldX * this.tileSize;
        const pixelY = worldY * this.tileSize;
        const tileValue = this.tileData[worldY][worldX];
        
        // All tiles are always rendered now
        const cellX = Math.floor(worldX / this.cellWidth);
        const cellY = Math.floor(worldY / this.cellHeight);
        
        // Render tiles based on their state (all tiles always visible now)
        switch (tileValue) {
            case -1: // Transparent tile - checkered background
                this.drawCheckeredTile(pixelX, pixelY);
                break;
            case 0: // Empty tile - white background
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
                break;
            case 1: // Filled tile - black background
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
                break;
            case 2: // Connection tile - yellow background
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
                break;
        }
    }
    
    renderTile(x, y) {
        // Legacy method - redirect to world renderer for single tile updates
        this.renderTileAtWorld(x, y);
    }
    
    drawCheckeredTile(pixelX, pixelY) {
        // Draw checkered pattern for transparent tiles
        const checkerSize = Math.max(4, this.tileSize / 4); // 4x4 checkers per tile, minimum 4px
        const checksPerRow = Math.floor(this.tileSize / checkerSize);
        
        for (let row = 0; row < checksPerRow; row++) {
            for (let col = 0; col < checksPerRow; col++) {
                const checkX = pixelX + (col * checkerSize);
                const checkY = pixelY + (row * checkerSize);
                
                // Alternate between the two customizable checker colors
                const isEven = (row + col) % 2 === 0;
                this.ctx.fillStyle = isEven ? this.checkerColor1 : this.checkerColor2;
                
                this.ctx.fillRect(checkX, checkY, checkerSize, checkerSize);
            }
        }
    }
    
    calculateCenteredViewport() {
        // Calculate where the center of the grid should appear in world coordinates
        const gridCenterWorldX = (this.totalGridCols / 2) * this.cellWidth * this.tileSize;
        const gridCenterWorldY = (this.totalGridRows / 2) * this.cellHeight * this.tileSize;
        
        // Calculate where we want the grid center to appear on the canvas
        const canvasCenterX = this.canvasWidth / 2;
        const canvasCenterY = this.canvasHeight / 2;
        
        // Calculate the viewport position and offset needed
        // The transformation is: screenPos = worldPos - (viewportX * cellWidth * tileSize) - viewportOffsetX
        // Solving for viewportOffsetX: viewportOffsetX = worldPos - (viewportX * cellWidth * tileSize) - screenPos
        
        const viewportWorldOffsetX = this.viewportX * this.cellWidth * this.tileSize;
        const viewportWorldOffsetY = this.viewportY * this.cellHeight * this.tileSize;
        
        this.viewportOffsetX = gridCenterWorldX - viewportWorldOffsetX - canvasCenterX;
        this.viewportOffsetY = gridCenterWorldY - viewportWorldOffsetY - canvasCenterY;
    }

    drawGrid() {
        this.ctx.strokeStyle = this.gridLineColor;
        this.ctx.lineWidth = 1 / this.zoom; // Adjust line width for zoom
        
        // Calculate visible area in world coordinates
        const viewStartX = Math.floor((this.viewportOffsetX + (this.viewportX * this.cellWidth * this.tileSize)) / this.tileSize);
        const viewStartY = Math.floor((this.viewportOffsetY + (this.viewportY * this.cellHeight * this.tileSize)) / this.tileSize);
        const viewEndX = Math.min(this.totalWidth, viewStartX + Math.ceil(this.canvas.width / (this.tileSize * this.zoom)) + 2);
        const viewEndY = Math.min(this.totalHeight, viewStartY + Math.ceil(this.canvas.height / (this.tileSize * this.zoom)) + 2);
        
        // Vertical lines
        for (let x = Math.max(0, viewStartX); x <= viewEndX; x++) {
            const pixelX = x * this.tileSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, Math.max(0, viewStartY) * this.tileSize);
            this.ctx.lineTo(pixelX, viewEndY * this.tileSize);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = Math.max(0, viewStartY); y <= viewEndY; y++) {
            const pixelY = y * this.tileSize;
            this.ctx.beginPath();
            this.ctx.moveTo(Math.max(0, viewStartX) * this.tileSize, pixelY);
            this.ctx.lineTo(viewEndX * this.tileSize, pixelY);
            this.ctx.stroke();
        }
        
        // Draw center guide lines
        this.drawCenterGuides();
    }
    
    drawCenterGuides() {
        // Calculate center positions for 10x10 grid (center is at 5.0 cells)
        const centerCellX = this.totalGridCols / 2; // 5.0 for 10x10 grid
        const centerCellY = this.totalGridRows / 2; // 5.0 for 10x10 grid
        
        const centerPixelX = centerCellX * this.cellWidth * this.tileSize;
        const centerPixelY = centerCellY * this.cellHeight * this.tileSize;
        
        // Set center guide line style
        this.ctx.strokeStyle = 'rgb(0, 0, 139)'; // Solid dark blue
        this.ctx.lineWidth = 5 / this.zoom; // Even thicker than regular grid lines
        
        // Draw vertical center line
        this.ctx.beginPath();
        this.ctx.moveTo(centerPixelX, 0);
        this.ctx.lineTo(centerPixelX, this.totalHeight * this.tileSize);
        this.ctx.stroke();
        
        // Draw horizontal center line
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerPixelY);
        this.ctx.lineTo(this.totalWidth * this.tileSize, centerPixelY);
        this.ctx.stroke();
    }
    
    drawCellBorders() {
        this.ctx.strokeStyle = this.borderColor;
        this.ctx.lineWidth = 3 / this.zoom; // Adjust line width for zoom
        
        const cellWidth = this.cellWidth * this.tileSize;
        const cellHeight = this.cellHeight * this.tileSize;
        
        // Calculate the world area that's visible
        const worldStartX = (this.viewportOffsetX + (this.viewportX * this.cellWidth * this.tileSize));
        const worldStartY = (this.viewportOffsetY + (this.viewportY * this.cellHeight * this.tileSize));
        const worldEndX = worldStartX + (this.canvas.width / this.zoom);
        const worldEndY = worldStartY + (this.canvas.height / this.zoom);
        
        // Calculate which cells are visible
        const startCellX = Math.max(0, Math.floor(worldStartX / cellWidth));
        const startCellY = Math.max(0, Math.floor(worldStartY / cellHeight));
        const endCellX = Math.min(this.totalGridCols, Math.ceil(worldEndX / cellWidth));
        const endCellY = Math.min(this.totalGridRows, Math.ceil(worldEndY / cellHeight));
        
        // Draw vertical cell borders
        for (let cellX = startCellX; cellX <= endCellX; cellX++) {
            const pixelX = cellX * cellWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, startCellY * cellHeight);
            this.ctx.lineTo(pixelX, endCellY * cellHeight);
            this.ctx.stroke();
        }
        
        // Draw horizontal cell borders
        for (let cellY = startCellY; cellY <= endCellY; cellY++) {
            const pixelY = cellY * cellHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(startCellX * cellWidth, pixelY);
            this.ctx.lineTo(endCellX * cellWidth, pixelY);
            this.ctx.stroke();
        }
    }
    
    clearGrid() {
        for (let y = 0; y < this.totalHeight; y++) {
            for (let x = 0; x < this.totalWidth; x++) {
                this.tileData[y][x] = -1; // Clear to transparent
            }
        }
        this.render();
    }
    
    // Mode management
    setMode(mode) {
        this.currentMode = mode;
        this.isCloneMode = (mode === 'clone');
        
        // Update UI buttons
        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
        
        switch (mode) {
            case 'paint':
                document.getElementById('paintMode').classList.add('active');
                this.canvas.style.cursor = 'crosshair';
                document.getElementById('cellMenu').style.display = 'none';
                break;
            case 'selectCell':
                document.getElementById('selectCellMode').classList.add('active');
                this.canvas.style.cursor = 'pointer';
                break;
            case 'paste':
                document.getElementById('pasteMode').classList.add('active');
                this.canvas.style.cursor = 'crosshair';
                document.getElementById('cellMenu').style.display = 'none';
                break;
            case 'clone':
                document.getElementById('cloneMode').classList.add('active');
                this.canvas.style.cursor = 'copy';
                break;
        }
        
        this.render();
    }
    
    handleCellMouseDown(e) {
        const tile = this.getTileFromMouse(e);
        if (!tile) return;
        
        // Convert tile coordinates to cell coordinates
        const cellX = Math.floor(tile.x / this.cellWidth);
        const cellY = Math.floor(tile.y / this.cellHeight);
        
        // Handle paste mode - paste copied pattern at clicked location
        if (this.currentMode === 'paste') {
            if (this.copiedPattern) {
                this.pastePattern(cellX, cellY);
                this.render();
            } else {
                console.log('No pattern copied to paste');
            }
            return;
        }
        
        // If in clone mode and we have selections, handle cloning
        if (this.isCloneMode && this.selectedCells.length > 0) {
            // TODO: Implement multi-cell cloning
            this.render();
            return;
        }
        
        // Check if clicked on existing selection for dragging
        if (this.selectedCells.length > 0 && this.isCellInSelection(cellX, cellY)) {
            this.isDraggingCell = true;
            this.dragStartCell = { x: cellX, y: cellY };
            this.canvas.style.cursor = 'grabbing';
            // Show canvas drop zone
            this.showCanvasDropZone = true;
            this.render();
            return;
        }
        
        // Start new rectangle selection
        this.isSelecting = true;
        this.selectionStart = { x: cellX, y: cellY };
        this.selectionEnd = { x: cellX, y: cellY };
        this.selectedCells = [{ x: cellX, y: cellY }];
        
        // Update UI for single cell selection
        this.updateSelectionUI();
        document.getElementById('cellMenu').style.display = 'block';
        
        this.render();
    }
    
    handleCellDrag(e) {
        if (this.isSelecting) {
            // Update rectangle selection during drag
            const tile = this.getTileFromMouse(e);
            if (!tile) return;
            
            const cellX = Math.floor(tile.x / this.cellWidth);
            const cellY = Math.floor(tile.y / this.cellHeight);
            
            this.selectionEnd = { x: cellX, y: cellY };
            this.updateSelectedCellsFromRectangle();
            
            // Update UI to show selection size
            this.updateSelectionUI();
            
            this.render();
        } else if (this.isDraggingCell) {
            // Visual feedback during drag - could show preview here
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    handleCellDrop(e) {
        // Check if we're dropping in the canvas drop zone area
        if (this.showCanvasDropZone && this.isDropOnCanvasDropZone(e)) {
            // Dropping on canvas drop zone - save the cell
            this.saveCellToShelf();
            this.isDraggingCell = false;
            this.dragStartCell = null;
            this.canvas.style.cursor = 'pointer';
            // Hide canvas drop zone
            this.showCanvasDropZone = false;
            this.render();
            return;
        }
        
        const tile = this.getTileFromMouse(e);
        if (!tile) {
            this.isDraggingCell = false;
            this.dragStartCell = null;
            this.canvas.style.cursor = 'pointer';
            // Hide canvas drop zone
            this.showCanvasDropZone = false;
            this.render();
            return;
        }
        
        // Convert tile coordinates to cell coordinates
        const targetCellX = Math.floor(tile.x / this.cellWidth);
        const targetCellY = Math.floor(tile.y / this.cellHeight);
        
        // Check if we're dropping on a different cell
        if (this.dragStartCell && (targetCellX !== this.dragStartCell.x || targetCellY !== this.dragStartCell.y)) {
            const isShiftHeld = e.shiftKey;
            
            if (isShiftHeld) {
                // Shift overrides swap mode - always duplicate
                this.duplicateCell(this.dragStartCell.x, this.dragStartCell.y, targetCellX, targetCellY);
            } else if (this.swapMode) {
                this.swapCells(this.dragStartCell.x, this.dragStartCell.y, targetCellX, targetCellY);
            } else {
                this.moveCell(this.dragStartCell.x, this.dragStartCell.y, targetCellX, targetCellY);
            }
            
            // Update selected cell to new position (unless it was a duplication)
            if (!isShiftHeld) {
                this.selectedCells = [{ x: targetCellX, y: targetCellY }];
                this.updateSelectionUI();
            }
        }
        
        this.isDraggingCell = false;
        this.dragStartCell = null;
        this.canvas.style.cursor = 'pointer';
        
        // Hide canvas drop zone
        this.showCanvasDropZone = false;
        
        this.render();
    }
    
    clearSelectedCell() {
        if (this.selectedCells.length === 0) return;
        
        // Clear all selected cells
        for (const cell of this.selectedCells) {
            const startX = cell.x * this.cellWidth;
            const startY = cell.y * this.cellHeight;
            const endX = startX + this.cellWidth;
            const endY = startY + this.cellHeight;
            
            // Reset cell to default state: completely transparent
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    if (y < this.totalHeight && x < this.totalWidth) {
                        this.tileData[y][x] = -1; // Reset to transparent
                    }
                }
            }
            
            // Update cell activity
            this.updateCellActivity(cell.x, cell.y);
        }
        
        this.render();
    }
    
    fillSelectedCell() {
        if (this.selectedCells.length === 0) return;
        
        // Fill all selected cells
        for (const cell of this.selectedCells) {
            const startX = cell.x * this.cellWidth;
            const startY = cell.y * this.cellHeight;
            const endX = startX + this.cellWidth;
            const endY = startY + this.cellHeight;
            
            // Fill entire cell with solid tiles
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    if (y < this.totalHeight && x < this.totalWidth) {
                        this.tileData[y][x] = 1; // Fill with solid black tiles
                    }
                }
            }
            
            // Update cell activity
            this.updateCellActivity(cell.x, cell.y);
        }
        
        this.render();
    }
    
    moveCell(fromCellX, fromCellY, toCellX, toCellY) {
        // Get source cell data
        const cellData = this.getCellData(fromCellX, fromCellY);
        
        // Clear source cell
        this.setCellData(fromCellX, fromCellY, this.createEmptyCell());
        
        // Set target cell
        this.setCellData(toCellX, toCellY, cellData);
    }
    
    duplicateCell(fromCellX, fromCellY, toCellX, toCellY) {
        // Get source cell data
        const cellData = this.getCellData(fromCellX, fromCellY);
        
        // Copy to target cell (don't clear source)
        this.setCellData(toCellX, toCellY, cellData);
    }
    
    swapCells(cellAX, cellAY, cellBX, cellBY) {
        // Get both cell data
        const cellAData = this.getCellData(cellAX, cellAY);
        const cellBData = this.getCellData(cellBX, cellBY);
        
        // Swap them
        this.setCellData(cellAX, cellAY, cellBData);
        this.setCellData(cellBX, cellBY, cellAData);
    }
    
    getCellData(cellX, cellY) {
        const startX = cellX * this.cellWidth;
        const startY = cellY * this.cellHeight;
        const cellData = [];
        
        for (let y = 0; y < this.cellHeight; y++) {
            cellData[y] = [];
            for (let x = 0; x < this.cellWidth; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                
                if (worldX < this.totalWidth && worldY < this.totalHeight) {
                    cellData[y][x] = this.tileData[worldY][worldX];
                } else {
                    cellData[y][x] = 0;
                }
            }
        }
        
        return cellData;
    }
    
    setCellData(cellX, cellY, cellData) {
        const startX = cellX * this.cellWidth;
        const startY = cellY * this.cellHeight;
        
        for (let y = 0; y < this.cellHeight && y < cellData.length; y++) {
            for (let x = 0; x < this.cellWidth && x < cellData[y].length; x++) {
                const worldX = startX + x;
                const worldY = startY + y;
                
                if (worldX < this.totalWidth && worldY < this.totalHeight) {
                    this.tileData[worldY][worldX] = cellData[y][x];
                }
            }
        }
        
        // Update cell activity after setting data
        this.updateCellActivity(cellX, cellY);
    }
    
    createEmptyCell() {
        const cellData = [];
        for (let y = 0; y < this.cellHeight; y++) {
            cellData[y] = [];
            for (let x = 0; x < this.cellWidth; x++) {
                // Create default cell: completely transparent
                cellData[y][x] = -1;
            }
        }
        return cellData;
    }
    
    isOnCellEdge(tileX, tileY) {
        // Calculate which cell this tile belongs to
        const cellX = Math.floor(tileX / this.cellWidth);
        const cellY = Math.floor(tileY / this.cellHeight);
        
        // Calculate tile position within the cell
        const tileInCellX = tileX % this.cellWidth;
        const tileInCellY = tileY % this.cellHeight;
        
        // Check if tile is on any edge of the cell
        const onLeftEdge = tileInCellX === 0;
        const onRightEdge = tileInCellX === this.cellWidth - 1;
        const onTopEdge = tileInCellY === 0;
        const onBottomEdge = tileInCellY === this.cellHeight - 1;
        
        return onLeftEdge || onRightEdge || onTopEdge || onBottomEdge;
    }
    
    isTileOnCellBorder(tileX, tileY) {
        // Calculate which cell this tile belongs to
        const cellX = Math.floor(tileX / this.cellWidth);
        const cellY = Math.floor(tileY / this.cellHeight);
        
        // Calculate tile position within the cell
        const tileInCellX = tileX % this.cellWidth;
        const tileInCellY = tileY % this.cellHeight;
        
        // Check if tile is on any border of the cell
        const onLeftBorder = tileInCellX === 0;
        const onRightBorder = tileInCellX === this.cellWidth - 1;
        const onTopBorder = tileInCellY === 0;
        const onBottomBorder = tileInCellY === this.cellHeight - 1;
        
        return onLeftBorder || onRightBorder || onTopBorder || onBottomBorder;
    }
    
    updateCellActivity(cellX, cellY) {
        // Check if cell has been modified from its default "all transparent" state
        const startX = cellX * this.cellWidth;
        const startY = cellY * this.cellHeight;
        let hasModifiedTiles = false;
        
        for (let y = startY; y < startY + this.cellHeight && y < this.totalHeight; y++) {
            for (let x = startX; x < startX + this.cellWidth && x < this.totalWidth; x++) {
                const tileValue = this.tileData[y][x];
                
                // Any tile state other than the default "transparent" (-1) makes the cell active
                if (tileValue !== -1) {
                    hasModifiedTiles = true;
                    break;
                }
            }
            if (hasModifiedTiles) break;
        }
        
        const cellKey = `${cellX},${cellY}`;
        if (hasModifiedTiles) {
            this.activeCells.add(cellKey);
        } else {
            this.activeCells.delete(cellKey);
        }
    }
    
    isCellActive(cellX, cellY) {
        return this.activeCells.has(`${cellX},${cellY}`);
    }
    
    
    updateSelectedCellsFromRectangle() {
        // Update selectedCells array based on current selection rectangle
        this.selectedCells = [];
        
        if (!this.selectionStart || !this.selectionEnd) return;
        
        const startX = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const endX = Math.max(this.selectionStart.x, this.selectionEnd.x);
        const startY = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const endY = Math.max(this.selectionStart.y, this.selectionEnd.y);
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (x >= 0 && x < this.totalGridCols && y >= 0 && y < this.totalGridRows) {
                    this.selectedCells.push({x, y});
                }
            }
        }
    }
    
    isCellInSelection(cellX, cellY) {
        return this.selectedCells.some(cell => cell.x === cellX && cell.y === cellY);
    }
    
    copySelectedCells() {
        if (this.selectedCells.length === 0) {
            console.log('No cells selected to copy');
            return false;
        }
        
        // Find bounding box of selection
        let minX = this.totalGridCols, maxX = -1;
        let minY = this.totalGridRows, maxY = -1;
        
        for (const cell of this.selectedCells) {
            minX = Math.min(minX, cell.x);
            maxX = Math.max(maxX, cell.x);
            minY = Math.min(minY, cell.y);
            maxY = Math.max(maxY, cell.y);
        }
        
        const patternWidth = maxX - minX + 1;
        const patternHeight = maxY - minY + 1;
        
        // Copy tile data from the selection area
        const patternData = [];
        for (let cellY = 0; cellY < patternHeight; cellY++) {
            patternData[cellY] = [];
            for (let cellX = 0; cellX < patternWidth; cellX++) {
                const sourceCellX = minX + cellX;
                const sourceCellY = minY + cellY;
                
                // Copy entire cell data (5x5 tiles)
                const cellTiles = [];
                for (let tileY = 0; tileY < this.cellHeight; tileY++) {
                    cellTiles[tileY] = [];
                    for (let tileX = 0; tileX < this.cellWidth; tileX++) {
                        const worldTileX = sourceCellX * this.cellWidth + tileX;
                        const worldTileY = sourceCellY * this.cellHeight + tileY;
                        
                        if (worldTileX < this.totalWidth && worldTileY < this.totalHeight) {
                            cellTiles[tileY][tileX] = this.tileData[worldTileY][worldTileX];
                        } else {
                            cellTiles[tileY][tileX] = -1; // Transparent for out-of-bounds
                        }
                    }
                }
                patternData[cellY][cellX] = cellTiles;
            }
        }
        
        this.copiedPattern = {
            data: patternData,
            width: patternWidth,
            height: patternHeight,
            originalSelection: [...this.selectedCells] // Keep for reference
        };
        
        console.log(`Copied ${patternWidth}x${patternHeight} cell pattern`);
        return true;
    }
    
    pastePattern(targetCellX, targetCellY) {
        if (!this.copiedPattern) {
            console.log('No pattern copied to paste');
            return false;
        }
        
        const pattern = this.copiedPattern;
        const affectedCells = new Set();
        
        // Paste the pattern
        for (let cellY = 0; cellY < pattern.height; cellY++) {
            for (let cellX = 0; cellX < pattern.width; cellX++) {
                const destCellX = targetCellX + cellX;
                const destCellY = targetCellY + cellY;
                
                // Check bounds
                if (destCellX >= 0 && destCellX < this.totalGridCols &&
                    destCellY >= 0 && destCellY < this.totalGridRows) {
                    
                    const cellTiles = pattern.data[cellY][cellX];
                    
                    // Paste each tile in the cell
                    for (let tileY = 0; tileY < this.cellHeight; tileY++) {
                        for (let tileX = 0; tileX < this.cellWidth; tileX++) {
                            const worldTileX = destCellX * this.cellWidth + tileX;
                            const worldTileY = destCellY * this.cellHeight + tileY;
                            
                            if (worldTileX < this.totalWidth && worldTileY < this.totalHeight) {
                                const tileValue = cellTiles[tileY][tileX];
                                
                                // Only paste non-transparent tiles
                                if (tileValue !== -1) {
                                    this.tileData[worldTileY][worldTileX] = tileValue;
                                }
                            }
                        }
                    }
                    
                    affectedCells.add(`${destCellX},${destCellY}`);
                }
            }
        }
        
        // Update activity for all affected cells
        for (const cellKey of affectedCells) {
            const [cellX, cellY] = cellKey.split(',').map(Number);
            this.updateCellActivity(cellX, cellY);
        }
        
        console.log(`Pasted pattern at (${targetCellX}, ${targetCellY})`);
        return true;
    }
    
    saveLevel() {
        // Generate auto name with timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const levelName = `level-${timestamp}`;
        
        // Collect level data
        const levelData = {
            name: levelName,
            timestamp: now.toISOString(),
            gridSize: { cols: this.totalGridCols, rows: this.totalGridRows },
            cellSize: { width: this.cellWidth, height: this.cellHeight },
            tileData: this.tileData,
            activeCells: Array.from(this.activeCells),
            version: '1.0'
        };
        
        // Save to localStorage (for now - could be file system later)
        const savedLevels = this.getSavedLevels();
        savedLevels[levelName] = levelData;
        localStorage.setItem('levelLibrary', JSON.stringify(savedLevels));
        
        alert(`Level saved as: ${levelName}`);
    }
    
    loadLevel() {
        const savedLevels = this.getSavedLevels();
        const levelNames = Object.keys(savedLevels);
        
        if (levelNames.length === 0) {
            alert('No saved levels found!');
            return;
        }
        
        // For now, show simple prompt (could be fancy UI later)
        const levelList = levelNames.map((name, index) => `${index + 1}. ${name}`).join('\\n');
        const selection = prompt(`Select level to load:\\n\\n${levelList}\\n\\nEnter number (1-${levelNames.length}):`);
        
        const levelIndex = parseInt(selection) - 1;
        if (isNaN(levelIndex) || levelIndex < 0 || levelIndex >= levelNames.length) {
            alert('Invalid selection!');
            return;
        }
        
        const selectedLevelName = levelNames[levelIndex];
        const levelData = savedLevels[selectedLevelName];
        
        // Load level data
        this.tileData = levelData.tileData;
        this.activeCells = new Set(levelData.activeCells || []);
        
        // Update grid size if different
        if (levelData.gridSize) {
            this.totalGridCols = levelData.gridSize.cols;
            this.totalGridRows = levelData.gridSize.rows;
        }
        if (levelData.cellSize) {
            this.cellWidth = levelData.cellSize.width;
            this.cellHeight = levelData.cellSize.height;
        }
        
        this.updateCanvasSize();
        this.render();
        
        alert(`Level loaded: ${selectedLevelName}`);
    }
    
    getSavedLevels() {
        try {
            const saved = localStorage.getItem('levelLibrary');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading saved rooms:', error);
            return {};
        }
    }
    
    saveCell() {
        if (this.selectedCells.length === 0) {
            alert('Please select a cell first!');
            return;
        }
        
        // Use the first selected cell if multiple are selected
        const selectedCell = this.selectedCells[0];
        
        // Generate auto name with timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const cellName = `cell-${timestamp}`;
        
        // Get cell data
        const cellData = this.getCellData(selectedCell.x, selectedCell.y);
        
        // Create cell library entry
        const cellEntry = {
            name: cellName,
            timestamp: now.toISOString(),
            cellSize: { width: this.cellWidth, height: this.cellHeight },
            data: cellData,
            isActive: this.isCellActive(selectedCell.x, selectedCell.y),
            version: '1.0'
        };
        
        // Save to localStorage
        const savedCells = this.getSavedCells();
        savedCells[cellName] = cellEntry;
        localStorage.setItem('cellLibrary', JSON.stringify(savedCells));
        
        alert(`Cell saved as: ${cellName}`);
    }
    
    loadCell() {
        if (this.selectedCells.length === 0) {
            alert('Please select a target cell first!');
            return;
        }
        
        // Use the first selected cell as the target
        const targetCell = this.selectedCells[0];
        
        const savedCells = this.getSavedCells();
        const cellNames = Object.keys(savedCells);
        
        if (cellNames.length === 0) {
            alert('No saved cells found!');
            return;
        }
        
        // Show selection prompt
        const cellList = cellNames.map((name, index) => `${index + 1}. ${name}`).join('\\n');
        const selection = prompt(`Select cell to load:\\n\\n${cellList}\\n\\nEnter number (1-${cellNames.length}):`);
        
        const cellIndex = parseInt(selection) - 1;
        if (isNaN(cellIndex) || cellIndex < 0 || cellIndex >= cellNames.length) {
            alert('Invalid selection!');
            return;
        }
        
        const selectedCellName = cellNames[cellIndex];
        const cellEntry = savedCells[selectedCellName];
        
        // Load cell data into target cell
        this.setCellData(targetCell.x, targetCell.y, cellEntry.data);
        this.render();
        
        alert(`Cell loaded: ${selectedCellName}`);
    }
    
    getSavedCells() {
        try {
            const saved = localStorage.getItem('cellLibrary');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading saved cells:', error);
            return {};
        }
    }
    
    clearOldCellLibrary() {
        // Clear the old cell library since we changed from 8x5 to 5x5 cells
        localStorage.removeItem('cellLibrary');
        console.log('Cleared old cell library due to cell size change (8x5 → 5x5)');
    }
    
    saveSettings() {
        const settings = {
            showBorders: this.showBorders,
            borderColor: this.borderColor,
            gridLineColor: this.gridLineColor,
            checkerColor1: this.checkerColor1,
            checkerColor2: this.checkerColor2,
            autoOutline: this.autoOutline
        };
        localStorage.setItem('levelEditorSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('levelEditorSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                this.showBorders = settings.showBorders ?? true;
                this.borderColor = settings.borderColor ?? '#4d9fff';
                this.gridLineColor = settings.gridLineColor ?? '#999999';
                this.checkerColor1 = settings.checkerColor1 ?? '#d0d0d0';
                this.checkerColor2 = settings.checkerColor2 ?? '#e6f3ff';
                this.autoOutline = settings.autoOutline ?? false;
                
                // Update UI controls
                document.getElementById('showBorders').checked = this.showBorders;
                document.getElementById('autoOutline').checked = this.autoOutline;
                document.getElementById('borderColor').value = this.borderColor;
                document.getElementById('gridLineColor').value = this.gridLineColor;
                document.getElementById('checkerColor1').value = this.checkerColor1;
                document.getElementById('checkerColor2').value = this.checkerColor2;
                
                // Update color swatches
                this.updateColorSwatches();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab
                e.target.classList.add('active');
                
                // Show corresponding content
                const tabId = e.target.id;
                if (tabId === 'toolsTab') {
                    document.getElementById('toolsContent').classList.add('active');
                } else if (tabId === 'settingsTab') {
                    document.getElementById('settingsContent').classList.add('active');
                }
            });
        });
    }
    
    setupColorSwatches() {
        const swatches = [
            { swatch: 'borderColorSwatch', input: 'borderColor' },
            { swatch: 'gridLineColorSwatch', input: 'gridLineColor' },
            { swatch: 'checkerColor1Swatch', input: 'checkerColor1' },
            { swatch: 'checkerColor2Swatch', input: 'checkerColor2' }
        ];
        
        swatches.forEach(({ swatch, input }) => {
            document.getElementById(swatch).addEventListener('click', () => {
                document.getElementById(input).click();
            });
        });
    }
    
    updateColorSwatches() {
        document.getElementById('borderColorSwatch').style.backgroundColor = this.borderColor;
        document.getElementById('gridLineColorSwatch').style.backgroundColor = this.gridLineColor;
        document.getElementById('checkerColor1Swatch').style.backgroundColor = this.checkerColor1;
        document.getElementById('checkerColor2Swatch').style.backgroundColor = this.checkerColor2;
    }
    
    resetSettingsToDefaults() {
        // Reset to default values
        this.showBorders = true;
        this.borderColor = '#4d9fff';
        this.gridLineColor = '#999999';
        this.checkerColor1 = '#d0d0d0';
        this.checkerColor2 = '#e6f3ff';
        this.autoOutline = false;
        
        // Update UI controls
        document.getElementById('showBorders').checked = this.showBorders;
        document.getElementById('autoOutline').checked = this.autoOutline;
        document.getElementById('borderColor').value = this.borderColor;
        document.getElementById('gridLineColor').value = this.gridLineColor;
        document.getElementById('checkerColor1').value = this.checkerColor1;
        document.getElementById('checkerColor2').value = this.checkerColor2;
        
        // Update color swatches
        this.updateColorSwatches();
        
        // Save and render
        this.saveSettings();
        this.render();
        
        console.log('Settings reset to defaults');
    }
    
    
    applyAutoOutline() {
        const affectedCells = new Set();
        const tilesToOutline = new Set();
        
        // Scan entire grid for -1 tiles adjacent to 0 tiles
        for (let y = 0; y < this.totalHeight; y++) {
            for (let x = 0; x < this.totalWidth; x++) {
                if (this.tileData[y][x] === -1) { // Found transparent tile
                    // Check 4-directional neighbors
                    const neighbors = [
                        [x, y - 1], // up
                        [x, y + 1], // down
                        [x - 1, y], // left
                        [x + 1, y]  // right
                    ];
                    
                    let hasEmptyNeighbor = false;
                    for (const [nx, ny] of neighbors) {
                        if (nx >= 0 && nx < this.totalWidth && ny >= 0 && ny < this.totalHeight) {
                            if (this.tileData[ny][nx] === 0) { // Found empty neighbor
                                hasEmptyNeighbor = true;
                                break;
                            }
                        }
                    }
                    
                    if (hasEmptyNeighbor) {
                        tilesToOutline.add(`${x},${y}`);
                    }
                }
            }
        }
        
        // Convert all marked tiles to filled (1) tiles
        for (const tileKey of tilesToOutline) {
            const [x, y] = tileKey.split(',').map(Number);
            this.tileData[y][x] = 1; // Set to filled/black
            
            // Track affected cells
            const cellX = Math.floor(x / this.cellWidth);
            const cellY = Math.floor(y / this.cellHeight);
            affectedCells.add(`${cellX},${cellY}`);
        }
        
        // Update activity for all affected cells
        for (const cellKey of affectedCells) {
            const [cellX, cellY] = cellKey.split(',').map(Number);
            this.updateCellActivity(cellX, cellY);
        }
        
        if (tilesToOutline.size > 0) {
            this.render();
            console.log(`Auto-outline: ${tilesToOutline.size} transparent tiles converted to filled`);
        }
    }
    
    drawMultiCellSelectionHighlight() {
        if (!this.selectedCells || this.selectedCells.length === 0) return;
        
        this.ctx.strokeStyle = '#FF9800';
        this.ctx.fillStyle = 'rgba(255, 152, 0, 0.1)'; // Semi-transparent orange fill
        this.ctx.lineWidth = 3 / this.zoom;
        
        // Draw highlight for each selected cell
        for (const cell of this.selectedCells) {
            const cellX = cell.x * this.cellWidth * this.tileSize;
            const cellY = cell.y * this.cellHeight * this.tileSize;
            const cellWidth = this.cellWidth * this.tileSize;
            const cellHeight = this.cellHeight * this.tileSize;
            
            // Fill with semi-transparent color
            this.ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
            
            // Draw border
            this.ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);
        }
    }
    
    drawSelectionRectangle() {
        if (!this.selectionStart || !this.selectionEnd) return;
        
        // Calculate rectangle bounds
        const startX = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const endX = Math.max(this.selectionStart.x, this.selectionEnd.x);
        const startY = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const endY = Math.max(this.selectionStart.y, this.selectionEnd.y);
        
        const rectX = startX * this.cellWidth * this.tileSize;
        const rectY = startY * this.cellHeight * this.tileSize;
        const rectWidth = (endX - startX + 1) * this.cellWidth * this.tileSize;
        const rectHeight = (endY - startY + 1) * this.cellHeight * this.tileSize;
        
        // Draw selection rectangle
        this.ctx.strokeStyle = '#2196F3';
        this.ctx.fillStyle = 'rgba(33, 150, 243, 0.1)'; // Semi-transparent blue
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.setLineDash([8 / this.zoom, 4 / this.zoom]);
        
        // Fill and stroke
        this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        this.ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        
        // Reset line dash
        this.ctx.setLineDash([]);
    }
    
    updateSelectionUI() {
        if (this.selectedCells.length === 0) {
            document.getElementById('selectedCellX').textContent = 'None';
            document.getElementById('selectedCellY').textContent = 'selected';
            return;
        }
        
        if (this.selectedCells.length === 1) {
            // Single cell selection - show coordinates
            const cell = this.selectedCells[0];
            document.getElementById('selectedCellX').textContent = `${cell.x}`;
            document.getElementById('selectedCellY').textContent = `${cell.y}`;
        } else {
            // Multiple cell selection - show count
            document.getElementById('selectedCellX').textContent = `${this.selectedCells.length} cells`;
            document.getElementById('selectedCellY').textContent = 'selected';
        }
    }
    
    drawBrushPreview() {
        if (!this.brushPreviewTile) return;
        
        // Get tiles that will be affected by brush
        const tilesToAffect = this.getBrushTiles(this.brushPreviewTile.x, this.brushPreviewTile.y);
        
        // Draw semi-transparent overlay for brush area
        this.ctx.strokeStyle = '#ff6600';
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.globalAlpha = 0.6;
        
        for (const {x: targetX, y: targetY} of tilesToAffect) {
            // Check bounds
            if (targetX >= 0 && targetX < this.totalWidth && targetY >= 0 && targetY < this.totalHeight) {
                const pixelX = targetX * this.tileSize;
                const pixelY = targetY * this.tileSize;
                
                // Draw preview rectangle
                this.ctx.strokeRect(pixelX, pixelY, this.tileSize, this.tileSize);
            }
        }
        
        // Reset alpha
        this.ctx.globalAlpha = 1.0;
    }
    
    drawCanvasDropZone() {
        // Calculate drop zone position at bottom of visible area
        const dropZoneHeight = 60; // Height in world pixels
        const dropZoneWidth = this.canvas.width / this.zoom; // Full width of viewport
        
        // Position at bottom of the visible area
        const worldStartX = (this.viewportOffsetX + (this.viewportX * this.cellWidth * this.tileSize));
        const worldStartY = (this.viewportOffsetY + (this.viewportY * this.cellHeight * this.tileSize));
        const dropZoneY = worldStartY + (this.canvas.height / this.zoom) - dropZoneHeight - 20;
        
        // Draw drop zone background
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
        this.ctx.fillRect(worldStartX + 20, dropZoneY, dropZoneWidth - 40, dropZoneHeight);
        
        // Draw border
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 3 / this.zoom;
        this.ctx.setLineDash([10 / this.zoom, 5 / this.zoom]);
        this.ctx.strokeRect(worldStartX + 20, dropZoneY, dropZoneWidth - 40, dropZoneHeight);
        this.ctx.setLineDash([]); // Reset line dash
        
        // Draw text
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${16 / this.zoom}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const textX = worldStartX + dropZoneWidth / 2;
        const textY = dropZoneY + dropZoneHeight / 2;
        
        // Add text shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillText('📁 Drop here to save cell to library', textX + 1 / this.zoom, textY + 1 / this.zoom);
        
        // Draw main text
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('📁 Drop here to save cell to library', textX, textY);
        
        // Reset text properties
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'alphabetic';
    }
    
    isDropOnCanvasDropZone(e) {
        // Convert mouse coordinates to world coordinates
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        const worldPixelX = (canvasX / this.zoom) + (this.viewportX * this.cellWidth * this.tileSize) + this.viewportOffsetX;
        const worldPixelY = (canvasY / this.zoom) + (this.viewportY * this.cellHeight * this.tileSize) + this.viewportOffsetY;
        
        // Calculate drop zone bounds (same as in drawCanvasDropZone)
        const dropZoneHeight = 60;
        const dropZoneWidth = this.canvas.width / this.zoom;
        const worldStartX = (this.viewportOffsetX + (this.viewportX * this.cellWidth * this.tileSize));
        const worldStartY = (this.viewportOffsetY + (this.viewportY * this.cellHeight * this.tileSize));
        const dropZoneY = worldStartY + (this.canvas.height / this.zoom) - dropZoneHeight - 20;
        
        const dropZoneLeft = worldStartX + 20;
        const dropZoneRight = worldStartX + dropZoneWidth - 20;
        const dropZoneTop = dropZoneY;
        const dropZoneBottom = dropZoneY + dropZoneHeight;
        
        // Check if mouse is within drop zone bounds
        return worldPixelX >= dropZoneLeft && worldPixelX <= dropZoneRight &&
               worldPixelY >= dropZoneTop && worldPixelY <= dropZoneBottom;
    }
    
    // Pan and Zoom Methods
    panViewport(deltaX, deltaY) {
        // Convert cell deltas to pixel offsets
        this.viewportOffsetX -= deltaX * this.cellWidth * this.tileSize;
        this.viewportOffsetY -= deltaY * this.cellHeight * this.tileSize;
        
        this.constrainViewport();
        this.render();
        this.updateViewportInfo();
    }
    
    constrainViewport() {
        // Calculate total world size in pixels (including margins)
        const worldWidth = this.totalWidth * this.tileSize;
        const worldHeight = this.totalHeight * this.tileSize;
        
        // Calculate total offset including viewport position
        const totalOffsetX = (this.viewportX * this.cellWidth * this.tileSize) + this.viewportOffsetX;
        const totalOffsetY = (this.viewportY * this.cellHeight * this.tileSize) + this.viewportOffsetY;
        
        // Calculate constraint bounds (allow margins beyond grid edges)
        const minOffsetX = -this.gridMarginX;
        const minOffsetY = -this.gridMarginY;
        const maxOffsetX = worldWidth + this.gridMarginX - (this.canvas.width / this.zoom);
        const maxOffsetY = worldHeight + this.gridMarginY - (this.canvas.height / this.zoom);
        
        // Apply constraints
        const constrainedOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, totalOffsetX));
        const constrainedOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, totalOffsetY));
        
        // Update viewport position if we hit boundaries
        if (totalOffsetX !== constrainedOffsetX || totalOffsetY !== constrainedOffsetY) {
            this.viewportX = Math.floor(constrainedOffsetX / (this.cellWidth * this.tileSize));
            this.viewportY = Math.floor(constrainedOffsetY / (this.cellHeight * this.tileSize));
            this.viewportOffsetX = constrainedOffsetX - (this.viewportX * this.cellWidth * this.tileSize);
            this.viewportOffsetY = constrainedOffsetY - (this.viewportY * this.cellHeight * this.tileSize);
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        // Check if Ctrl is held for brush size adjustment
        if (e.ctrlKey || e.metaKey) {
            const oldBrushSize = this.brushSize;
            
            if (e.deltaY < 0) {
                // Scroll up - increase brush size
                this.brushSize = Math.min(5, this.brushSize + 1);
            } else {
                // Scroll down - decrease brush size
                this.brushSize = Math.max(1, this.brushSize - 1);
            }
            
            if (this.brushSize !== oldBrushSize) {
                // Update UI slider
                document.getElementById('brushSize').value = this.brushSize;
                document.getElementById('brushSizeValue').textContent = this.brushSize;
                document.getElementById('brushSizeValue2').textContent = this.brushSize;
                
                // Update brush preview if it's being shown
                if (this.showBrushPreview) {
                    this.render();
                }
            }
            return;
        }
        
        // Normal zoom behavior
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomFactor = 1.1;
        const oldZoom = this.zoom;
        
        if (e.deltaY < 0) {
            // Zoom in
            this.zoom = Math.min(5.0, this.zoom * zoomFactor);
        } else {
            // Zoom out
            this.zoom = Math.max(0.1, this.zoom / zoomFactor);
        }
        
        if (this.zoom !== oldZoom) {
            // Zoom toward mouse cursor
            const zoomRatio = this.zoom / oldZoom;
            const worldMouseX = (mouseX / oldZoom) + (this.viewportX * this.cellWidth * this.tileSize) + this.viewportOffsetX;
            const worldMouseY = (mouseY / oldZoom) + (this.viewportY * this.cellHeight * this.tileSize) + this.viewportOffsetY;
            
            const newWorldMouseX = (mouseX / this.zoom) + (this.viewportX * this.cellWidth * this.tileSize) + this.viewportOffsetX;
            const newWorldMouseY = (mouseY / this.zoom) + (this.viewportY * this.cellHeight * this.tileSize) + this.viewportOffsetY;
            
            this.viewportOffsetX += worldMouseX - newWorldMouseX;
            this.viewportOffsetY += worldMouseY - newWorldMouseY;
            
            this.constrainViewport();
            this.render();
            this.updateViewportInfo();
        }
    }
    
    handleKeyDown(e) {
        // Track shift key for eraser mode
        if (e.key === 'Shift') {
            this.isShiftPressed = true;
            if (this.currentMode === 'paint') {
                this.canvas.style.cursor = 'url("data:image/svg+xml,%3csvg width=\'16\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3cpath d=\'m2 2 12 12m0-12L2 14\' stroke=\'%23ff0000\' stroke-width=\'2\' fill=\'none\'/%3e%3c/svg%3e") 8 8, crosshair';
            }
        }
        
        // Handle copy/paste shortcuts
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
            switch(e.key.toLowerCase()) {
                case 'c':
                    e.preventDefault();
                    if (this.selectedCells.length > 0) {
                        this.copySelectedCells();
                        this.showTemporaryMessage('Pattern copied!');
                    }
                    return;
                case 'v':
                    e.preventDefault();
                    if (this.copiedPattern) {
                        this.setMode('paste');
                        this.showTemporaryMessage('Paste mode activated - click to place pattern');
                    } else {
                        this.showTemporaryMessage('No pattern copied to paste');
                    }
                    return;
            }
        }
        
        const panSpeed = 50; // pixels per keypress
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.viewportOffsetX -= panSpeed / this.zoom;
                this.constrainViewport();
                this.render();
                this.updateViewportInfo();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.viewportOffsetX += panSpeed / this.zoom;
                this.constrainViewport();
                this.render();
                this.updateViewportInfo();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                this.viewportOffsetY -= panSpeed / this.zoom;
                this.constrainViewport();
                this.render();
                this.updateViewportInfo();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.viewportOffsetY += panSpeed / this.zoom;
                this.constrainViewport();
                this.render();
                this.updateViewportInfo();
                break;
        }
    }
    
    handleKeyUp(e) {
        // Track shift key for eraser mode
        if (e.key === 'Shift') {
            this.isShiftPressed = false;
            if (this.currentMode === 'paint') {
                this.canvas.style.cursor = 'crosshair';
            }
        }
    }
    
    updateViewportInfo() {
        // Update UI to show current position
        document.getElementById('viewportPos').textContent = `(${this.viewportX.toFixed(1)}, ${this.viewportY.toFixed(1)})`;
        document.getElementById('zoomLevel').textContent = `${this.zoom.toFixed(1)}x`;
    }
    
    // Cell Shelf Methods
    loadCellShelf() {
        const savedCells = this.getSavedCells();
        const shelfElement = document.getElementById('cellShelf');
        shelfElement.innerHTML = '';
        
        Object.keys(savedCells).forEach(cellName => {
            const cellData = savedCells[cellName];
            this.createCellThumbnail(cellName, cellData, shelfElement);
        });
    }
    
    createCellThumbnail(cellName, cellData, container) {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'cell-thumbnail-shelf';
        thumbnail.setAttribute('data-cell-name', cellName);
        
        // Create canvas for cell preview
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        
        // Render cell preview
        this.renderCellPreview(ctx, cellData.data, 80, 50);
        
        // Create name label
        const nameLabel = document.createElement('div');
        nameLabel.className = 'cell-name';
        nameLabel.textContent = cellName.replace('cell-', '').replace(/-/g, ':');
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteCellFromShelf(cellName);
        };
        
        thumbnail.appendChild(canvas);
        thumbnail.appendChild(nameLabel);
        thumbnail.appendChild(deleteBtn);
        
        // Add drag functionality
        thumbnail.draggable = true;
        thumbnail.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', cellName);
            e.dataTransfer.setData('application/cell-data', JSON.stringify(cellData));
            thumbnail.style.opacity = '0.5';
        });
        
        thumbnail.addEventListener('dragend', () => {
            thumbnail.style.opacity = '1';
        });
        
        container.appendChild(thumbnail);
    }
    
    renderCellPreview(ctx, cellData, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        if (!cellData || !cellData.length) return;
        
        const cellHeight = cellData.length;
        const cellWidth = cellData[0] ? cellData[0].length : 0;
        
        const tileWidth = width / cellWidth;
        const tileHeight = height / cellHeight;
        
        // Draw cell background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Draw tiles
        for (let y = 0; y < cellHeight; y++) {
            for (let x = 0; x < cellWidth; x++) {
                const tileValue = cellData[y][x];
                if (tileValue !== 0) {
                    switch (tileValue) {
                        case 1: // Blockout
                            ctx.fillStyle = '#000000';
                            break;
                        case 2: // Connection tile
                            ctx.fillStyle = '#ffff00';
                            break;
                    }
                    ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
                }
            }
        }
    }
    
    deleteCellFromShelf(cellName) {
        if (confirm(`Delete cell "${cellName}"?`)) {
            const savedCells = this.getSavedCells();
            delete savedCells[cellName];
            localStorage.setItem('cellLibrary', JSON.stringify(savedCells));
            this.loadCellShelf(); // Refresh shelf
        }
    }
    
    setupCellShelfDragDrop() {
        const dropZone = document.getElementById('shelfDropZone');
        const canvas = this.canvas;
        
        // Setup drop zone for saving cells
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            // Only allow drop if we have a selected cell
            if (this.selectedCells.length > 0) {
                this.saveCellToShelf();
            } else {
                alert('Please select a cell first!');
            }
        });
        
        // Setup canvas for placing cells
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const cellName = e.dataTransfer.getData('text/plain');
            const cellDataStr = e.dataTransfer.getData('application/cell-data');
            
            if (cellName && cellDataStr) {
                try {
                    const cellData = JSON.parse(cellDataStr);
                    this.placeCellFromShelf(e, cellData);
                } catch (error) {
                    console.error('Error parsing cell data:', error);
                }
            }
        });
    }
    
    saveCellToShelf() {
        if (this.selectedCells.length === 0) return;
        
        // Use the first selected cell
        const selectedCell = this.selectedCells[0];
        
        // Generate auto name with timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const cellName = `cell-${timestamp}`;
        
        // Get cell data
        const cellData = this.getCellData(selectedCell.x, selectedCell.y);
        
        // Create cell library entry
        const cellEntry = {
            name: cellName,
            timestamp: now.toISOString(),
            cellSize: { width: this.cellWidth, height: this.cellHeight },
            data: cellData,
            isActive: this.isCellActive(selectedCell.x, selectedCell.y),
            version: '1.0'
        };
        
        // Save to localStorage
        const savedCells = this.getSavedCells();
        savedCells[cellName] = cellEntry;
        localStorage.setItem('cellLibrary', JSON.stringify(savedCells));
        
        // Refresh shelf to show new cell
        this.loadCellShelf();
        
        // Show feedback
        this.showTemporaryMessage(`Cell saved: ${cellName.replace('cell-', '').replace(/-/g, ':')}`);
    }
    
    placeCellFromShelf(e, cellData) {
        // Get the cell position where the drop occurred
        const tile = this.getTileFromMouse(e);
        if (!tile) return;
        
        const cellX = Math.floor(tile.x / this.cellWidth);
        const cellY = Math.floor(tile.y / this.cellHeight);
        
        // Place the cell data
        this.setCellData(cellX, cellY, cellData.data);
        this.render();
        
        // Select the placed cell
        this.selectedCells = [{ x: cellX, y: cellY }];
        this.updateSelectionUI();
        document.getElementById('cellMenu').style.display = 'block';
        
        // Show feedback
        this.showTemporaryMessage(`Cell placed at (${cellX}, ${cellY})`);
    }
    
    showTemporaryMessage(message) {
        // Create temporary message element
        const msgElement = document.createElement('div');
        msgElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 1000;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        msgElement.textContent = message;
        
        document.body.appendChild(msgElement);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (msgElement.parentNode) {
                msgElement.parentNode.removeChild(msgElement);
            }
        }, 3000);
    }
    
}

// Initialize the editor when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.levelEditor = new LevelEditor();
});