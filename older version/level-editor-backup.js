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
        this.currentMode = 'paint'; // 'paint', 'selectCell'
        
        // Unified selection system (handles single and multiple cells)
        this.isDraggingCell = false;
        this.dragStartCell = null;
        this.swapMode = true; // Default to swap mode enabled
        
        // Multi-cell rectangle selection
        this.selectionStart = null; // {x, y} in cell coordinates where selection started
        this.selectionEnd = null;   // {x, y} in cell coordinates where selection ends
        this.isSelecting = false;   // Whether we're currently drawing selection rectangle
        this.selectedCells = [];    // Array of selected cell coordinates [{x, y}, ...]
        
        
        
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
        
        
        // Visual settings
        this.showBorders = true;
        this.borderColor = '#4d9fff';
        this.borderWeight = 3; // Stroke weight for cell borders
        this.gridLineColor = '#999999';
        this.checkerColor1 = '#d0d0d0';
        this.checkerColor2 = '#e6f3ff';
        this.showOutlines = true; // Show outline overlay by default
        this.showCenterGuides = true; // Show center grid lines by default
        this.centerGuideColor = '#00008b'; // Dark blue for center guides
        this.centerGuideWeight = 5; // Stroke weight for center guides
        
        // Outline overlay system (visual only, not in tile data)
        this.outlineOverlay = new Set(); // Set of "x,y" strings for tiles that should appear as outline
        
        // Initialize
        this.initializeTileData();
        this.setupEventListeners();
        this.setupUI();
        this.updateCanvasSize();
        this.loadSettings(); // Load visual settings
        this.setMode('paint'); // Initialize with paint mode
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
        
        
        // Grid action buttons
        document.getElementById('clearGrid').addEventListener('click', () => this.clearGrid());
        
        
        // Border controls
        document.getElementById('showBorders').addEventListener('change', (e) => {
            this.showBorders = e.target.checked;
            this.saveSettings();
            this.render();
        });
        
        document.getElementById('showOutlines').addEventListener('change', (e) => {
            this.showOutlines = e.target.checked;
            this.saveSettings();
            this.render(); // Re-render to show/hide outline overlay
        });
        
        document.getElementById('showCenterGuides').addEventListener('change', (e) => {
            this.showCenterGuides = e.target.checked;
            this.saveSettings();
            this.render(); // Re-render to show/hide center guides
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
        
        // Center guide color input
        document.getElementById('centerGuideColor').addEventListener('change', (e) => {
            this.centerGuideColor = e.target.value;
            document.getElementById('centerGuideColorSwatch').style.backgroundColor = e.target.value;
            this.saveSettings();
            this.render();
        });
        
        // Border weight control
        document.getElementById('borderWeight').addEventListener('input', (e) => {
            this.borderWeight = parseInt(e.target.value);
            document.getElementById('borderWeightValue').textContent = this.borderWeight;
            this.saveSettings();
            this.render();
        });
        
        // Center guide weight control
        document.getElementById('centerGuideWeight').addEventListener('input', (e) => {
            this.centerGuideWeight = parseInt(e.target.value);
            document.getElementById('centerGuideWeightValue').textContent = this.centerGuideWeight;
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
        
        // Cell shelf drag and drop disabled
        // this.setupCellShelfDragDrop();
        
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
        
        if (this.currentMode === 'selectCell') {
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
        
        
        // Always update auto-outline overlay (visual display controlled by showOutlines setting)
        this.applyAutoOutline();
        
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
        
        // Draw outline overlay (visual outlines that don't affect tile data)
        this.drawOutlineOverlay(viewStartX, viewStartY, viewEndX, viewEndY);
        
        // Draw grid lines
        this.drawGrid();
        
        // Draw cell borders if enabled
        if (this.showBorders) {
            this.drawCellBorders();
        }
        
        // Draw center guide lines if enabled (after cell borders)
        if (this.showCenterGuides) {
            this.drawCenterGuides();
        }
        
        // Draw unified cell selection highlight
        if (this.selectedCells.length > 0 && this.currentMode === 'selectCell') {
            this.drawMultiCellSelectionHighlight();
            this.drawSelectionArrows();
        }
        
        // Draw selection rectangle while selecting
        if (this.isSelecting && this.selectionStart && this.selectionEnd) {
            this.drawSelectionRectangle();
        }
        
        // Draw brush preview
        if (this.showBrushPreview && this.brushPreviewTile) {
            this.drawBrushPreview();
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
        
    }
    
    drawCenterGuides() {
        // Calculate center positions for 10x10 grid (center is at 5.0 cells)
        const centerCellX = this.totalGridCols / 2; // 5.0 for 10x10 grid
        const centerCellY = this.totalGridRows / 2; // 5.0 for 10x10 grid
        
        const centerPixelX = centerCellX * this.cellWidth * this.tileSize;
        const centerPixelY = centerCellY * this.cellHeight * this.tileSize;
        
        // Set center guide line style
        this.ctx.strokeStyle = this.centerGuideColor;
        this.ctx.lineWidth = this.centerGuideWeight / this.zoom; // Adjust line width for zoom
        
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
        this.ctx.lineWidth = this.borderWeight / this.zoom; // Adjust line width for zoom
        
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
    
    drawOutlineOverlay(viewStartX, viewStartY, viewEndX, viewEndY) {
        if (!this.showOutlines || !this.outlineOverlay || this.outlineOverlay.size === 0) return;
        
        // Set outline style - similar to filled tiles but slightly transparent
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.8)'; // Dark gray with transparency
        
        // Draw each outline tile in the visible area
        for (let worldY = Math.max(0, viewStartY); worldY < viewEndY; worldY++) {
            for (let worldX = Math.max(0, viewStartX); worldX < viewEndX; worldX++) {
                const tileKey = `${worldX},${worldY}`;
                if (this.outlineOverlay.has(tileKey)) {
                    const pixelX = worldX * this.tileSize;
                    const pixelY = worldY * this.tileSize;
                    this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
                }
            }
        }
    }
    
    clearGrid() {
        for (let y = 0; y < this.totalHeight; y++) {
            for (let x = 0; x < this.totalWidth; x++) {
                this.tileData[y][x] = -1; // Clear to transparent
            }
        }
        
        // Clear all cell activity since everything is now transparent
        this.activeCells.clear();
        
        // Clear outline overlay since there are no tiles to outline
        this.outlineOverlay.clear();
        
        this.render();
    }
    
    // Mode management
    setMode(mode) {
        this.currentMode = mode;
        
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
        }
        
        this.render();
    }
    
    handleCellMouseDown(e) {
        // Check if clicking on selection arrows first
        if (this.checkArrowClick(e)) {
            return;
        }
        
        const tile = this.getTileFromMouse(e);
        if (!tile) return;
        
        // Convert tile coordinates to cell coordinates
        const cellX = Math.floor(tile.x / this.cellWidth);
        const cellY = Math.floor(tile.y / this.cellHeight);
        
        
        // Check if clicked on existing selection for dragging
        if (this.selectedCells.length > 0 && this.isCellInSelection(cellX, cellY)) {
            this.isDraggingCell = true;
            this.dragStartCell = { x: cellX, y: cellY };
            this.canvas.style.cursor = 'grabbing';
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
        const tile = this.getTileFromMouse(e);
        if (!tile) {
            this.isDraggingCell = false;
            this.dragStartCell = null;
            this.canvas.style.cursor = 'pointer';
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
        
        // Always update auto-outline overlay after cell operations
        this.applyAutoOutline();
        
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
        
        // Update auto-outline overlay after clearing
        this.applyAutoOutline();
        
        this.render();
    }
    
    
    // Level Library functions disabled
    saveLevel() {
        console.log('Level library disabled');
    }
    
    loadLevel() {
        console.log('Level library disabled');
    }
    
    getSavedLevels() {
        return {};
    }
    
    exportLevelWithOutlines() {
        console.log('Level library disabled');
    }
    
    // Pattern Library functions disabled
    saveCell() {
        console.log('Pattern library disabled');
    }
    
    loadCell() {
        console.log('Pattern library disabled');
    }
    
    getSavedCells() {
        return {};
    }
    
    clearOldPatternLibrary() {
        console.log('Pattern library disabled');
    }
    
    saveSettings() {
        const settings = {
            showBorders: this.showBorders,
            borderColor: this.borderColor,
            borderWeight: this.borderWeight,
            gridLineColor: this.gridLineColor,
            checkerColor1: this.checkerColor1,
            checkerColor2: this.checkerColor2,
            showOutlines: this.showOutlines,
            showCenterGuides: this.showCenterGuides,
            centerGuideColor: this.centerGuideColor,
            centerGuideWeight: this.centerGuideWeight
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
                this.borderWeight = settings.borderWeight ?? 3;
                this.gridLineColor = settings.gridLineColor ?? '#999999';
                this.checkerColor1 = settings.checkerColor1 ?? '#d0d0d0';
                this.checkerColor2 = settings.checkerColor2 ?? '#e6f3ff';
                this.showOutlines = settings.showOutlines ?? true;
                this.showCenterGuides = settings.showCenterGuides ?? true;
                this.centerGuideColor = settings.centerGuideColor ?? '#00008b';
                this.centerGuideWeight = settings.centerGuideWeight ?? 5;
                
                // Update UI controls
                document.getElementById('showBorders').checked = this.showBorders;
                document.getElementById('showOutlines').checked = this.showOutlines;
                document.getElementById('showCenterGuides').checked = this.showCenterGuides;
                document.getElementById('borderColor').value = this.borderColor;
                document.getElementById('borderWeight').value = this.borderWeight;
                document.getElementById('gridLineColor').value = this.gridLineColor;
                document.getElementById('checkerColor1').value = this.checkerColor1;
                document.getElementById('checkerColor2').value = this.checkerColor2;
                document.getElementById('centerGuideColor').value = this.centerGuideColor;
                document.getElementById('centerGuideWeight').value = this.centerGuideWeight;
                
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
            { swatch: 'checkerColor2Swatch', input: 'checkerColor2' },
            { swatch: 'centerGuideColorSwatch', input: 'centerGuideColor' }
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
        document.getElementById('centerGuideColorSwatch').style.backgroundColor = this.centerGuideColor;
    }
    
    resetSettingsToDefaults() {
        // Reset to default values
        this.showBorders = true;
        this.borderColor = '#4d9fff';
        this.borderWeight = 3;
        this.gridLineColor = '#999999';
        this.checkerColor1 = '#d0d0d0';
        this.checkerColor2 = '#e6f3ff';
        this.showOutlines = true;
        this.showCenterGuides = true;
        this.centerGuideColor = '#00008b';
        this.centerGuideWeight = 5;
        
        // Update UI controls
        document.getElementById('showBorders').checked = this.showBorders;
        document.getElementById('showOutlines').checked = this.showOutlines;
        document.getElementById('showCenterGuides').checked = this.showCenterGuides;
        document.getElementById('borderColor').value = this.borderColor;
        document.getElementById('borderWeight').value = this.borderWeight;
        document.getElementById('gridLineColor').value = this.gridLineColor;
        document.getElementById('checkerColor1').value = this.checkerColor1;
        document.getElementById('checkerColor2').value = this.checkerColor2;
        document.getElementById('centerGuideColor').value = this.centerGuideColor;
        document.getElementById('centerGuideWeight').value = this.centerGuideWeight;
        
        // Update color swatches
        this.updateColorSwatches();
        
        // Save and render
        this.saveSettings();
        this.render();
        
        console.log('Settings reset to defaults');
    }
    
    
    applyAutoOutline() {
        // Clear existing outline overlay
        this.outlineOverlay.clear();
        
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
                        this.outlineOverlay.add(`${x},${y}`);
                    }
                }
            }
        }
        
        if (this.outlineOverlay.size > 0) {
            this.render();
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
    
    getSelectionBounds() {
        if (this.selectedCells.length === 0) return null;
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const cell of this.selectedCells) {
            minX = Math.min(minX, cell.x);
            maxX = Math.max(maxX, cell.x);
            minY = Math.min(minY, cell.y);
            maxY = Math.max(maxY, cell.y);
        }
        
        return {
            startX: minX,
            endX: maxX,
            startY: minY,
            endY: maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }
    
    drawSelectionArrows() {
        if (this.currentMode !== 'selectCell' || this.selectedCells.length === 0) return;
        
        const bounds = this.getSelectionBounds();
        if (!bounds) return;
        
        const rectX = bounds.startX * this.cellWidth * this.tileSize;
        const rectY = bounds.startY * this.cellHeight * this.tileSize;
        const rectWidth = bounds.width * this.cellWidth * this.tileSize;
        const rectHeight = bounds.height * this.cellHeight * this.tileSize;
        
        const arrowSize = 40 / this.zoom;
        const arrowOffset = 50 / this.zoom;
        
        this.ctx.fillStyle = '#FF9800';
        this.ctx.strokeStyle = '#F57C00';
        this.ctx.lineWidth = 2 / this.zoom;
        
        // Store arrow positions for click detection
        this.selectionArrows = {
            up: {
                x: rectX + rectWidth / 2 - arrowSize / 2,
                y: rectY - arrowOffset - arrowSize,
                width: arrowSize,
                height: arrowSize,
                direction: 'up'
            },
            down: {
                x: rectX + rectWidth / 2 - arrowSize / 2,
                y: rectY + rectHeight + arrowOffset,
                width: arrowSize,
                height: arrowSize,
                direction: 'down'
            },
            left: {
                x: rectX - arrowOffset - arrowSize,
                y: rectY + rectHeight / 2 - arrowSize / 2,
                width: arrowSize,
                height: arrowSize,
                direction: 'left'
            },
            right: {
                x: rectX + rectWidth + arrowOffset,
                y: rectY + rectHeight / 2 - arrowSize / 2,
                width: arrowSize,
                height: arrowSize,
                direction: 'right'
            }
        };
        
        // Draw arrows
        this.drawArrow(this.selectionArrows.up);
        this.drawArrow(this.selectionArrows.down);
        this.drawArrow(this.selectionArrows.left);
        this.drawArrow(this.selectionArrows.right);
    }
    
    drawArrow(arrow) {
        const { x, y, width, height, direction } = arrow;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const arrowHeadSize = width * 0.3;
        
        this.ctx.beginPath();
        
        // Draw arrow based on direction
        switch(direction) {
            case 'up':
                this.ctx.moveTo(centerX, y);
                this.ctx.lineTo(centerX - arrowHeadSize, y + arrowHeadSize);
                this.ctx.lineTo(centerX - arrowHeadSize * 0.5, y + arrowHeadSize);
                this.ctx.lineTo(centerX - arrowHeadSize * 0.5, y + height);
                this.ctx.lineTo(centerX + arrowHeadSize * 0.5, y + height);
                this.ctx.lineTo(centerX + arrowHeadSize * 0.5, y + arrowHeadSize);
                this.ctx.lineTo(centerX + arrowHeadSize, y + arrowHeadSize);
                break;
            case 'down':
                this.ctx.moveTo(centerX, y + height);
                this.ctx.lineTo(centerX - arrowHeadSize, y + height - arrowHeadSize);
                this.ctx.lineTo(centerX - arrowHeadSize * 0.5, y + height - arrowHeadSize);
                this.ctx.lineTo(centerX - arrowHeadSize * 0.5, y);
                this.ctx.lineTo(centerX + arrowHeadSize * 0.5, y);
                this.ctx.lineTo(centerX + arrowHeadSize * 0.5, y + height - arrowHeadSize);
                this.ctx.lineTo(centerX + arrowHeadSize, y + height - arrowHeadSize);
                break;
            case 'left':
                this.ctx.moveTo(x, centerY);
                this.ctx.lineTo(x + arrowHeadSize, centerY - arrowHeadSize);
                this.ctx.lineTo(x + arrowHeadSize, centerY - arrowHeadSize * 0.5);
                this.ctx.lineTo(x + width, centerY - arrowHeadSize * 0.5);
                this.ctx.lineTo(x + width, centerY + arrowHeadSize * 0.5);
                this.ctx.lineTo(x + arrowHeadSize, centerY + arrowHeadSize * 0.5);
                this.ctx.lineTo(x + arrowHeadSize, centerY + arrowHeadSize);
                break;
            case 'right':
                this.ctx.moveTo(x + width, centerY);
                this.ctx.lineTo(x + width - arrowHeadSize, centerY - arrowHeadSize);
                this.ctx.lineTo(x + width - arrowHeadSize, centerY - arrowHeadSize * 0.5);
                this.ctx.lineTo(x, centerY - arrowHeadSize * 0.5);
                this.ctx.lineTo(x, centerY + arrowHeadSize * 0.5);
                this.ctx.lineTo(x + width - arrowHeadSize, centerY + arrowHeadSize * 0.5);
                this.ctx.lineTo(x + width - arrowHeadSize, centerY + arrowHeadSize);
                break;
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    checkArrowClick(e) {
        if (!this.selectionArrows || this.selectedCells.length === 0) return false;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // Transform canvas coordinates to world coordinates
        const worldX = (canvasX / this.zoom) + (this.viewportX * this.cellWidth * this.tileSize) + this.viewportOffsetX;
        const worldY = (canvasY / this.zoom) + (this.viewportY * this.cellHeight * this.tileSize) + this.viewportOffsetY;
        
        // Check each arrow
        for (const [key, arrow] of Object.entries(this.selectionArrows)) {
            if (worldX >= arrow.x && worldX <= arrow.x + arrow.width &&
                worldY >= arrow.y && worldY <= arrow.y + arrow.height) {
                
                this.shiftSelection(arrow.direction);
                return true;
            }
        }
        
        return false;
    }
    
    shiftSelection(direction) {
        const bounds = this.getSelectionBounds();
        if (!bounds) return;
        
        let deltaX = 0, deltaY = 0;
        
        switch(direction) {
            case 'up':
                deltaY = -1;
                break;
            case 'down':
                deltaY = 1;
                break;
            case 'left':
                deltaX = -1;
                break;
            case 'right':
                deltaX = 1;
                break;
        }
        
        // Check if this is a single cell selection
        if (this.selectedCells.length === 1) {
            this.shiftSingleCell(deltaX, deltaY);
        } else {
            // For multi-cell selections, move just the selected cells as a group
            this.shiftSelectedCells(deltaX, deltaY);
        }
    }
    
    shiftSingleCell(deltaX, deltaY) {
        const cell = this.selectedCells[0];
        const currentX = cell.x;
        const currentY = cell.y;
        
        // Calculate target position with wraparound
        const targetX = (currentX + deltaX + this.totalGridCols) % this.totalGridCols;
        const targetY = (currentY + deltaY + this.totalGridRows) % this.totalGridRows;
        
        // Get both cell data
        const currentCellData = this.getCellData(currentX, currentY);
        const targetCellData = this.getCellData(targetX, targetY);
        
        // Swap the cell contents
        this.setCellData(currentX, currentY, targetCellData);
        this.setCellData(targetX, targetY, currentCellData);
        
        // Update cell activity for both cells
        this.updateCellActivity(currentX, currentY);
        this.updateCellActivity(targetX, targetY);
        
        // Update selection to follow the moved cell
        this.selectedCells = [{ x: targetX, y: targetY }];
        this.updateSelectionUI();
        
        // Always update auto-outline overlay after cell movement
        this.applyAutoOutline();
        
        this.render();
        this.showTemporaryMessage(`Cell moved ${deltaX > 0 ? 'right' : deltaX < 0 ? 'left' : deltaY > 0 ? 'down' : 'up'}`);
    }
    
    shiftSelectedCells(deltaX, deltaY) {
        // Sort cells by position to process them in the correct order
        // When moving down/right, process from bottom/right to top/left
        // When moving up/left, process from top/left to bottom/right
        const sortedCells = [...this.selectedCells].sort((a, b) => {
            if (deltaY > 0) {
                // Moving down: process from bottom to top
                return b.y - a.y;
            } else if (deltaY < 0) {
                // Moving up: process from top to bottom
                return a.y - b.y;
            } else if (deltaX > 0) {
                // Moving right: process from right to left
                return b.x - a.x;
            } else if (deltaX < 0) {
                // Moving left: process from left to right
                return a.x - b.x;
            }
            return 0;
        });
        
        // Process each selected cell individually in the correct order
        for (const cell of sortedCells) {
            const newX = (cell.x + deltaX + this.totalGridCols) % this.totalGridCols;
            const newY = (cell.y + deltaY + this.totalGridRows) % this.totalGridRows;
            
            // Skip if already at target position (shouldn't happen with proper bounds)
            if (newX === cell.x && newY === cell.y) {
                continue;
            }
            
            // Save the selected cell's data
            const selectedCellData = this.getCellData(cell.x, cell.y);
            
            // Clear the selected cell (set to empty)
            this.setCellData(cell.x, cell.y, this.createEmptyCell());
            
            // Move whatever is at the target position to the original position
            const targetCellData = this.getCellData(newX, newY);
            this.setCellData(cell.x, cell.y, targetCellData);
            
            // Move the selected cell to the target position
            this.setCellData(newX, newY, selectedCellData);
        }
        
        // Update selection positions for all cells that were shifted
        this.selectedCells = this.selectedCells.map(cell => {
            const newX = (cell.x + deltaX + this.totalGridCols) % this.totalGridCols;
            const newY = (cell.y + deltaY + this.totalGridRows) % this.totalGridRows;
            return { x: newX, y: newY };
        });
        
        this.updateSelectionUI();
        this.applyAutoOutline();
        this.render();
        
        const direction = deltaX > 0 ? 'right' : deltaX < 0 ? 'left' : deltaY > 0 ? 'down' : 'up';
        this.showTemporaryMessage(`${this.selectedCells.length} cells moved ${direction}`);
    }
    
    shiftRows(deltaY, bounds) {
        // Only shift selected cells within their row bounds
        const selectedCellsInRow = this.selectedCells.filter(cell => 
            cell.y >= bounds.startY && cell.y <= bounds.endY
        );
        
        if (selectedCellsInRow.length === 0) return;
        
        // Process each selected cell individually to avoid circular dependencies
        for (const cell of selectedCellsInRow) {
            const newY = (cell.y + deltaY + this.totalGridRows) % this.totalGridRows;
            
            // Skip if already at target position (shouldn't happen with proper bounds)
            if (newY === cell.y) {
                continue;
            }
            
            // Save the selected cell's data
            const selectedCellData = this.getCellData(cell.x, cell.y);
            
            // Clear the selected cell (set to empty)
            this.setCellData(cell.x, cell.y, this.createEmptyCell());
            
            // Move whatever is at the target position to the original position
            const targetCellData = this.getCellData(cell.x, newY);
            this.setCellData(cell.x, cell.y, targetCellData);
            
            // Move the selected cell to the target position
            this.setCellData(cell.x, newY, selectedCellData);
        }
        
        // Update selection positions for all cells that were shifted
        this.selectedCells = this.selectedCells.map(cell => {
            if (cell.y >= bounds.startY && cell.y <= bounds.endY) {
                const newY = (cell.y + deltaY + this.totalGridRows) % this.totalGridRows;
                return {
                    x: cell.x,
                    y: newY
                };
            }
            return cell;
        });
        
        this.updateSelectionUI();
        this.render();
        this.showTemporaryMessage(`Selected cells shifted ${deltaY > 0 ? 'down' : 'up'}`);
    }
    
    shiftColumns(deltaX, bounds) {
        // Only shift selected cells within their column bounds
        const selectedCellsInCol = this.selectedCells.filter(cell => 
            cell.x >= bounds.startX && cell.x <= bounds.endX
        );
        
        if (selectedCellsInCol.length === 0) return;
        
        // Process each selected cell individually to avoid circular dependencies
        for (const cell of selectedCellsInCol) {
            const newX = (cell.x + deltaX + this.totalGridCols) % this.totalGridCols;
            
            // Skip if already at target position (shouldn't happen with proper bounds)
            if (newX === cell.x) continue;
            
            // Save the selected cell's data
            const selectedCellData = this.getCellData(cell.x, cell.y);
            
            // Clear the selected cell (set to empty)
            this.setCellData(cell.x, cell.y, this.createEmptyCell());
            
            // Move whatever is at the target position to the original position
            const targetCellData = this.getCellData(newX, cell.y);
            this.setCellData(cell.x, cell.y, targetCellData);
            
            // Move the selected cell to the target position
            this.setCellData(newX, cell.y, selectedCellData);
        }
        
        // Update selection positions for all cells that were shifted
        this.selectedCells = this.selectedCells.map(cell => {
            if (cell.x >= bounds.startX && cell.x <= bounds.endX) {
                return {
                    x: (cell.x + deltaX + this.totalGridCols) % this.totalGridCols,
                    y: cell.y
                };
            }
            return cell;
        });
        
        this.updateSelectionUI();
        this.render();
        this.showTemporaryMessage(`Selected cells shifted ${deltaX > 0 ? 'right' : 'left'}`);
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
        
        // Handle delete key for clearing selected cells
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.currentMode === 'selectCell' && this.selectedCells.length > 0) {
                e.preventDefault();
                this.clearSelectedCell();
                this.showTemporaryMessage(`Cleared ${this.selectedCells.length} selected cell${this.selectedCells.length > 1 ? 's' : ''}`);
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
    
    // Cell Shelf Methods disabled
    loadCellShelf() {
        console.log('Cell shelf disabled');
    }
    
    createCellThumbnail(cellName, cellData, container) {
        console.log('Cell shelf disabled');
    }
    
    renderCellPreview(ctx, cellData, width, height) {
        console.log('Cell shelf disabled');
    }
    
    deleteCellFromShelf(cellName) {
        console.log('Cell shelf disabled');
    }
    
    setupCellShelfDragDrop() {
        console.log('Cell shelf disabled');
    }
    
    saveCellToShelf() {
        console.log('Cell shelf disabled');
    }
    
    placeCellFromShelf(e, cellData) {
        console.log('Cell shelf disabled');
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