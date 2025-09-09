/**
 * EventHandler - Handles mouse and keyboard events
 */
export class EventHandler {
    constructor(canvas, viewportManager, gridSystem, settings) {
        this.canvas = canvas;
        this.viewportManager = viewportManager;
        this.gridSystem = gridSystem;
        this.settings = settings;
        
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.setupEventListeners();
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        // Wheel events handled by LevelEditor directly
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Handle mouse down events
     */
    handleMouseDown(e) {
        this.isMouseDown = true;
        this.lastMouseX = e.clientX - this.canvas.offsetLeft;
        this.lastMouseY = e.clientY - this.canvas.offsetTop;
        
        const tilePos = this.viewportManager.screenToTile(this.lastMouseX, this.lastMouseY);
        const cellPos = this.gridSystem.getCellFromTile(tilePos.x, tilePos.y);
        
        // Emit custom event
        this.canvas.dispatchEvent(new CustomEvent('cellMouseDown', {
            detail: {
                tileX: tilePos.x,
                tileY: tilePos.y,
                cellX: cellPos.x,
                cellY: cellPos.y,
                button: e.button,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey
            }
        }));
    }
    
    /**
     * Handle mouse move events
     */
    handleMouseMove(e) {
        const mouseX = e.clientX - this.canvas.offsetLeft;
        const mouseY = e.clientY - this.canvas.offsetTop;
        
        if (this.isMouseDown) {
            // Handle panning
            if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
                this.viewportManager.updatePan(mouseX, mouseY);
            }
        }
        
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
        
        // Emit custom event
        const tilePos = this.viewportManager.screenToTile(mouseX, mouseY);
        const cellPos = this.gridSystem.getCellFromTile(tilePos.x, tilePos.y);
        
        this.canvas.dispatchEvent(new CustomEvent('cellMouseMove', {
            detail: {
                tileX: tilePos.x,
                tileY: tilePos.y,
                cellX: cellPos.x,
                cellY: cellPos.y,
                mouseX: mouseX,
                mouseY: mouseY
            }
        }));
    }
    
    /**
     * Handle mouse up events
     */
    handleMouseUp(e) {
        this.isMouseDown = false;
        this.viewportManager.stopPan();
        
        const mouseX = e.clientX - this.canvas.offsetLeft;
        const mouseY = e.clientY - this.canvas.offsetTop;
        const tilePos = this.viewportManager.screenToTile(mouseX, mouseY);
        const cellPos = this.gridSystem.getCellFromTile(tilePos.x, tilePos.y);
        
        // Emit custom event
        this.canvas.dispatchEvent(new CustomEvent('cellMouseUp', {
            detail: {
                tileX: tilePos.x,
                tileY: tilePos.y,
                cellX: cellPos.x,
                cellY: cellPos.y,
                button: e.button
            }
        }));
    }
    
    
    /**
     * Handle key down events
     */
    handleKeyDown(e) {
        // Emit custom event with key information
        this.canvas.dispatchEvent(new CustomEvent('keyDown', {
            detail: {
                key: e.key,
                code: e.code,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                preventDefault: () => e.preventDefault()
            }
        }));
    }
    
    /**
     * Get current mouse position in screen coordinates
     */
    getMousePosition() {
        return {
            x: this.lastMouseX,
            y: this.lastMouseY
        };
    }
    
    /**
     * Get current mouse position in tile coordinates
     */
    getMouseTilePosition() {
        return this.viewportManager.screenToTile(this.lastMouseX, this.lastMouseY);
    }
    
    /**
     * Get current mouse position in cell coordinates
     */
    getMouseCellPosition() {
        const tilePos = this.getMouseTilePosition();
        return this.gridSystem.getCellFromTile(tilePos.x, tilePos.y);
    }
    
    /**
     * Check if mouse is currently down
     */
    isMousePressed() {
        return this.isMouseDown;
    }
    
    /**
     * Remove all event listeners
     */
    destroy() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        // Wheel events handled by LevelEditor directly
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}
