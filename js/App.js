/**
 * App - Main application class that coordinates all modules
 */
import { SettingsManager } from './core/SettingsManager.js';
import { GridSystem } from './core/GridSystem.js';
import { ViewportManager } from './core/ViewportManager.js';
import { CanvasRenderer } from './core/CanvasRenderer.js';
import { EventHandler } from './core/EventHandler.js';
import { Editor } from './Editor.js';

export class App {
    constructor() {
        this.canvas = document.getElementById('tileCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize core modules
        this.settings = new SettingsManager();
        
        // Set canvas size
        this.canvas.width = this.settings.get('canvasWidth');
        this.canvas.height = this.settings.get('canvasHeight');
        this.gridSystem = new GridSystem(this.settings);
        this.viewportManager = new ViewportManager(this.canvas, this.settings, this.gridSystem);
        this.canvasRenderer = new CanvasRenderer(this.canvas, this.settings, this.gridSystem, this.viewportManager);
        this.eventHandler = new EventHandler(this.canvas, this.viewportManager, this.gridSystem, this.settings);
        
        
        // Initialize editor
        this.editor = new Editor(
            this.canvas, 
            this.settings, 
            this.gridSystem, 
            this.viewportManager, 
            this.canvasRenderer, 
            this.eventHandler
        );
        
        this.currentMode = 'blockout';
        
        // Center the grid
        this.viewportManager.calculateCenteredViewport();
        
        this.setupUI();
        
        // Set initial mode from settings
        this.setMode(this.settings.get('currentMode'));
        
        this.render();
    }
    
    /**
     * Setup UI event listeners
     */
    setupUI() {
        // Mode buttons
        document.getElementById('paintMode')?.addEventListener('click', () => this.setMode('paint'));
        
        // Canvas mouse events - direct handling
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1) e.preventDefault(); // Prevent default middle mouse behavior
            this.handleMouseDown(e);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (e.button === 1) e.preventDefault(); // Prevent default middle mouse behavior
            this.handleMouseMove(e);
        });
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 1) e.preventDefault(); // Prevent default middle mouse behavior
            this.handleMouseUp(e);
        });
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Visual settings
        this.setupVisualSettings();
        
        // Grid actions
        this.setupGridActions();
        
        
        // Settings actions
        this.setupSettingsActions();
    }
    
    /**
     * Setup visual settings
     */
    setupVisualSettings() {
        // Borders removed - no more cells
        
        
        // Wall indicators
        const showWallIndicators = document.getElementById('showWallIndicators');
        if (showWallIndicators) {
            showWallIndicators.checked = this.settings.get('showWallIndicators');
            showWallIndicators.addEventListener('change', (e) => {
                this.settings.set('showWallIndicators', e.target.checked);
                this.render();
            });
        }
        
        // Wall indicator color
        const wallIndicatorColor = document.getElementById('wallIndicatorColor');
        if (wallIndicatorColor) {
            wallIndicatorColor.value = this.settings.get('wallIndicatorColor');
            wallIndicatorColor.addEventListener('change', (e) => {
                this.settings.set('wallIndicatorColor', e.target.value);
                this.updateColorSwatches();
                this.render();
            });
        }
        
        // Center guides
        const showCenterGuides = document.getElementById('showCenterGuides');
        if (showCenterGuides) {
            showCenterGuides.checked = this.settings.get('showCenterGuides');
            showCenterGuides.addEventListener('change', (e) => {
                this.settings.set('showCenterGuides', e.target.checked);
                this.render();
            });
        }
        
        // Border settings removed - no more cells
        
        // Center guide color
        const centerGuideColor = document.getElementById('centerGuideColor');
        if (centerGuideColor) {
            centerGuideColor.value = this.settings.get('centerGuideColor');
            centerGuideColor.addEventListener('change', (e) => {
                this.settings.set('centerGuideColor', e.target.value);
                this.updateColorSwatches();
                this.render();
            });
        }
        
        // Center guide weight
        const centerGuideWeight = document.getElementById('centerGuideWeight');
        if (centerGuideWeight) {
            centerGuideWeight.value = this.settings.get('centerGuideWeight');
            centerGuideWeight.addEventListener('input', (e) => {
                this.settings.set('centerGuideWeight', parseInt(e.target.value));
                document.getElementById('centerGuideWeightValue').textContent = e.target.value;
                this.render();
            });
        }
        
        // Checker color 1
        const checkerColor1 = document.getElementById('checkerColor1');
        if (checkerColor1) {
            checkerColor1.value = this.settings.get('checkerColor1');
            checkerColor1.addEventListener('change', (e) => {
                this.settings.set('checkerColor1', e.target.value);
                this.updateColorSwatches();
                this.render();
            });
        }
        
        // Checker color 2
        const checkerColor2 = document.getElementById('checkerColor2');
        if (checkerColor2) {
            checkerColor2.value = this.settings.get('checkerColor2');
            checkerColor2.addEventListener('change', (e) => {
                this.settings.set('checkerColor2', e.target.value);
                this.updateColorSwatches();
                this.render();
            });
        }
        
        // Tile size
        const tileSize = document.getElementById('tileSize');
        if (tileSize) {
            tileSize.value = this.settings.get('tileSize');
            document.getElementById('tileSizeValue').textContent = this.settings.get('tileSize');
            tileSize.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                this.settings.set('tileSize', size);
                document.getElementById('tileSizeValue').textContent = size;
                
                // Update grid system with new tile size
                this.gridSystem.tileSize = size;
                this.gridSystem.updateDimensions();
                
                // Recalculate viewport to maintain visual consistency
                this.viewportManager.calculateCenteredViewport();
                
                this.render();
            });
        }
        
        // Save zoom level checkbox
        const saveZoomLevel = document.getElementById('saveZoomLevel');
        if (saveZoomLevel) {
            saveZoomLevel.checked = this.settings.get('saveZoomLevel');
            saveZoomLevel.addEventListener('change', (e) => {
                this.settings.set('saveZoomLevel', e.target.checked);
            });
        }
        
        // Reset zoom button
        const resetZoom = document.getElementById('resetZoom');
        if (resetZoom) {
            resetZoom.addEventListener('click', () => {
                this.viewportManager.setZoom(1.0);
                this.viewportManager.calculateCenteredViewport();
                this.render();
                this.showTemporaryMessage('Zoom reset to 1.0');
            });
        }
        
        // Brush size
        const brushSize = document.getElementById('brushSize');
        if (brushSize) {
            brushSize.value = this.settings.get('brushSize');
            brushSize.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                this.settings.set('brushSize', size);
                document.getElementById('brushSizeValue').textContent = size;
                document.getElementById('brushSizeValue2').textContent = size;
                this.editor.brushSize = size;
                this.updateBrushPreview();
            });
        }
        
        // Show brush preview checkbox
        const showBrushPreview = document.getElementById('showBrushPreview');
        if (showBrushPreview) {
            showBrushPreview.checked = this.settings.get('showBrushPreview');
            showBrushPreview.addEventListener('change', (e) => {
                this.settings.set('showBrushPreview', e.target.checked);
                this.render(); // Re-render to show/hide brush preview
            });
        }
        
        // Initialize brush preview
        this.updateBrushPreview();
        
        this.updateColorSwatches();
    }
    
    /**
     * Setup grid actions
     */
    setupGridActions() {
        // Clear all
        const clearAll = document.getElementById('clearAll');
        if (clearAll) {
            clearAll.addEventListener('click', () => {
                this.editor.clearGrid();
                this.showTemporaryMessage('Grid cleared');
            });
        }
    }
    
    
    /**
     * Setup settings actions
     */
    setupSettingsActions() {
        // Reset settings
        const resetSettings = document.getElementById('resetSettings');
        if (resetSettings) {
            resetSettings.addEventListener('click', () => {
                if (confirm('Reset all settings to defaults?')) {
                    this.settings.resetToDefaults();
                    this.setupVisualSettings();
                    this.render();
                    this.showTemporaryMessage('Settings reset to defaults');
                }
            });
        }
    }
    
    /**
     * Update brush preview canvas
     */
    updateBrushPreview() {
        const canvas = document.getElementById('brushPreviewCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const size = this.settings.get('brushSize');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up grid
        const tileSize = 20; // Fixed size for preview
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Draw grid background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        for (let x = 0; x <= canvas.width; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Get brush tiles using the same pattern as the actual brush
        const brushTiles = this.getBrushTilesForPreview(size);
        
        // Draw brush preview
        ctx.fillStyle = 'rgba(0, 150, 255, 0.3)';
        ctx.strokeStyle = '#0096ff';
        ctx.lineWidth = 2;
        
        for (const {x, y} of brushTiles) {
            const brushX = centerX + (x * tileSize) - (tileSize / 2);
            const brushY = centerY + (y * tileSize) - (tileSize / 2);
            
            // Brush fill
            ctx.fillRect(brushX, brushY, tileSize, tileSize);
            
            // Brush border
            ctx.strokeRect(brushX, brushY, tileSize, tileSize);
        }
        
        // Center crosshair
        ctx.strokeStyle = '#0096ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 5, centerY);
        ctx.lineTo(centerX + 5, centerY);
        ctx.moveTo(centerX, centerY - 5);
        ctx.lineTo(centerX, centerY + 5);
        ctx.stroke();
    }
    
    /**
     * Get brush tiles for preview - using the same pattern as Editor.getBrushTiles
     */
    getBrushTilesForPreview(brushSize) {
        const tiles = [];
        
        if (brushSize === 1) {
            // Size 1: Just center tile
            tiles.push({x: 0, y: 0});
        } else if (brushSize === 2) {
            // Size 2: Plus pattern (center + 4 directions)
            tiles.push({x: 0, y: 0});         // center
            tiles.push({x: -1, y: 0});        // left
            tiles.push({x: 1, y: 0});         // right
            tiles.push({x: 0, y: -1});        // up
            tiles.push({x: 0, y: 1});         // down
        } else if (brushSize === 3) {
            // Size 3: Full 3x3 square
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    tiles.push({x: dx, y: dy});
                }
            }
        } else if (brushSize === 4) {
            // Size 4: 3x3 center + extensions (13 tiles total)
            // First add 3x3 center
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    tiles.push({x: dx, y: dy});
                }
            }
            // Add extensions in 4 directions
            tiles.push({x: -2, y: 0});        // far left
            tiles.push({x: 2, y: 0});         // far right
            tiles.push({x: 0, y: -2});        // far up
            tiles.push({x: 0, y: 2});         // far down
        } else if (brushSize === 5) {
            // Size 5: Full 5x5 square
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    tiles.push({x: dx, y: dy});
                }
            }
        }
        
        return tiles;
    }
    
    /**
     * Update color swatches
     */
    updateColorSwatches() {
        // Border color swatch removed - no more cells
        
        const centerGuideColorSwatch = document.getElementById('centerGuideColorSwatch');
        if (centerGuideColorSwatch) {
            centerGuideColorSwatch.style.backgroundColor = this.settings.get('centerGuideColor');
        }
        
        const checkerColor1Swatch = document.getElementById('checkerColor1Swatch');
        if (checkerColor1Swatch) {
            checkerColor1Swatch.style.backgroundColor = this.settings.get('checkerColor1');
        }
        
        const checkerColor2Swatch = document.getElementById('checkerColor2Swatch');
        if (checkerColor2Swatch) {
            checkerColor2Swatch.style.backgroundColor = this.settings.get('checkerColor2');
        }
        
        const wallIndicatorColorSwatch = document.getElementById('wallIndicatorColorSwatch');
        if (wallIndicatorColorSwatch) {
            wallIndicatorColorSwatch.style.backgroundColor = this.settings.get('wallIndicatorColor');
        }
    }
    
    /**
     * Set current mode
     */
    setMode(mode) {
        if (mode === 'paint') {
            this.editor.setMode(mode);
            this.currentMode = 'blockout';
        }
    }
    
    /**
     * Handle mouse down events
     */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to tile coordinates
        const tilePos = this.viewportManager.screenToTile(mouseX, mouseY);
        
        // Delegate to editor
        this.editor.handleMouseDown({
            tileX: tilePos.x,
            tileY: tilePos.y,
            button: e.button,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            mouseX: mouseX,
            mouseY: mouseY
        });
    }
    
    /**
     * Handle mouse move events
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Handle panning
        this.viewportManager.updatePan(mouseX, mouseY);
        
        // Convert to tile coordinates
        const tilePos = this.viewportManager.screenToTile(mouseX, mouseY);
        
        // Update editor mouse position for brush preview
        this.editor.updateMousePosition(mouseX, mouseY);
        
        // Delegate to editor
        this.editor.handleMouseMove({
            tileX: tilePos.x,
            tileY: tilePos.y,
            mouseX: mouseX,
            mouseY: mouseY
        });
        
        // Re-render to show brush preview
        this.render();
    }
    
    /**
     * Handle mouse up events
     */
    handleMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to tile coordinates
        const tilePos = this.viewportManager.screenToTile(mouseX, mouseY);
        
        // Delegate to editor
        this.editor.handleMouseUp({
            tileX: tilePos.x,
            tileY: tilePos.y,
            button: e.button
        });
    }
    
    
    /**
     * Handle wheel events for zooming and brush size
     */
    handleWheel(e) {
        e.preventDefault();
        
        // Check if Ctrl is held for brush size adjustment
        if (e.ctrlKey || e.metaKey) {
            // Brush size adjustment - NO ZOOM
            const oldBrushSize = this.editor.brushSize;
            
            if (e.deltaY < 0) {
                // Scroll up - increase brush size
                this.editor.brushSize = Math.min(5, this.editor.brushSize + 1);
            } else {
                // Scroll down - decrease brush size
                this.editor.brushSize = Math.max(1, this.editor.brushSize - 1);
            }
            
            if (this.editor.brushSize !== oldBrushSize) {
                // Update UI slider
                const brushSizeInput = document.getElementById('brushSize');
                if (brushSizeInput) {
                    brushSizeInput.value = this.editor.brushSize;
                    document.getElementById('brushSizeValue').textContent = this.editor.brushSize;
                    document.getElementById('brushSizeValue2').textContent = this.editor.brushSize;
                }
                
                // Update settings
                this.settings.set('brushSize', this.editor.brushSize);
            }
            
            // Only render, don't zoom
            this.render();
        } else {
            // Normal zoom - only when Ctrl is NOT held
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = this.viewportManager.getZoom() * delta;
            this.viewportManager.setZoom(newZoom);
            this.render();
        }
    }
    
    /**
     * Handle key down events
     */
    handleKeyDown(e) {
        // Handle keyboard panning
        const panSpeed = 50; // pixels per keypress
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.viewportManager.panViewport(-panSpeed / this.viewportManager.getZoom(), 0);
                this.render();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.viewportManager.panViewport(panSpeed / this.viewportManager.getZoom(), 0);
                this.render();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                this.viewportManager.panViewport(0, -panSpeed / this.viewportManager.getZoom());
                this.render();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.viewportManager.panViewport(0, panSpeed / this.viewportManager.getZoom());
                this.render();
                break;
            default:
                // Delegate other keys to blockout mode
                this.editor.handleKeyDown({
                    key: e.key,
                    code: e.code,
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey,
                    altKey: e.altKey,
                    preventDefault: () => e.preventDefault()
                });
                break;
        }
    }
    
    /**
     * Render the current state
     */
    render() {
        this.editor.render();
    }
    
    /**
     * Show temporary message
     */
    showTemporaryMessage(message) {
        this.editor.showTemporaryMessage(message);
    }
    
    /**
     * Get current level data
     */
    getLevelData() {
        return {
            tileData: this.editor.tileData,
            settings: this.settings.getAll()
        };
    }
    
    /**
     * Set level data
     */
    setLevelData(levelData) {
        if (levelData.tileData) {
            this.editor.tileData = levelData.tileData;
        }
        if (levelData.settings) {
            this.settings.update(levelData.settings);
        }
        this.editor.applyWallIndicators();
        this.render();
    }
}

// Initialize the editor when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.levelEditor = new App();
});
