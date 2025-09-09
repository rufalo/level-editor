/**
 * LevelEditor - Main application class that coordinates all modules
 */
import { SettingsManager } from './core/SettingsManager.js';
import { GridSystem } from './core/GridSystem.js';
import { ViewportManager } from './core/ViewportManager.js';
import { CanvasRenderer } from './core/CanvasRenderer.js';
import { EventHandler } from './core/EventHandler.js';
import { ExportSystem } from './features/ExportSystem.js';
import { PatternLibrary } from './features/PatternLibrary.js';
import { BlockoutMode } from './modes/BlockoutMode.js';

export class LevelEditor {
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
        
        // Initialize feature modules
        this.exportSystem = new ExportSystem(this.settings, this.gridSystem);
        this.patternLibrary = new PatternLibrary();
        
        // Initialize mode
        this.blockoutMode = new BlockoutMode(
            this.canvas, 
            this.settings, 
            this.gridSystem, 
            this.viewportManager, 
            this.canvasRenderer, 
            this.eventHandler, 
            this.exportSystem
        );
        
        this.currentMode = 'blockout';
        
        // Center the grid
        this.viewportManager.calculateCenteredViewport();
        
        this.setupUI();
        this.render();
    }
    
    /**
     * Setup UI event listeners
     */
    setupUI() {
        // Mode buttons
        document.getElementById('paintMode')?.addEventListener('click', () => this.setMode('paint'));
        document.getElementById('selectCellMode')?.addEventListener('click', () => this.setMode('selectCell'));
        
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
        
        // Export actions
        this.setupExportActions();
        
        // Settings actions
        this.setupSettingsActions();
    }
    
    /**
     * Setup visual settings
     */
    setupVisualSettings() {
        // Borders
        const showBorders = document.getElementById('showBorders');
        if (showBorders) {
            showBorders.checked = this.settings.get('showBorders');
            showBorders.addEventListener('change', (e) => {
                this.settings.set('showBorders', e.target.checked);
                this.render();
            });
        }
        
        
        // Wall indicators
        const showWallIndicators = document.getElementById('showWallIndicators');
        if (showWallIndicators) {
            showWallIndicators.checked = this.settings.get('showWallIndicators');
            showWallIndicators.addEventListener('change', (e) => {
                this.settings.set('showWallIndicators', e.target.checked);
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
        
        // Border color
        const borderColor = document.getElementById('borderColor');
        if (borderColor) {
            borderColor.value = this.settings.get('borderColor');
            borderColor.addEventListener('change', (e) => {
                this.settings.set('borderColor', e.target.value);
                this.updateColorSwatches();
                this.render();
            });
        }
        
        // Border weight
        const borderWeight = document.getElementById('borderWeight');
        if (borderWeight) {
            borderWeight.value = this.settings.get('borderWeight');
            borderWeight.addEventListener('input', (e) => {
                this.settings.set('borderWeight', parseInt(e.target.value));
                document.getElementById('borderWeightValue').textContent = e.target.value;
                this.render();
            });
        }
        
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
        
        // Brush size
        const brushSize = document.getElementById('brushSize');
        if (brushSize) {
            brushSize.value = this.settings.get('brushSize');
            brushSize.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                this.settings.set('brushSize', size);
                document.getElementById('brushSizeValue').textContent = size;
                document.getElementById('brushSizeValue2').textContent = size;
                this.blockoutMode.brushSize = size;
            });
        }
        
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
                this.blockoutMode.clearGrid();
                this.showTemporaryMessage('Grid cleared');
            });
        }
    }
    
    /**
     * Setup export actions
     */
    setupExportActions() {
        // Export JSON
        const exportJSON = document.getElementById('exportJSON');
        if (exportJSON) {
            exportJSON.addEventListener('click', () => {
                const jsonData = this.blockoutMode.exportLevel();
                this.exportSystem.downloadLevelAsFile(
                    this.blockoutMode.tileData, 
                    this.blockoutMode.activeCells, 
                    'level.json'
                );
                this.showTemporaryMessage('Level exported to JSON');
            });
        }
        
        // Save to storage
        const saveToStorage = document.getElementById('saveToStorage');
        if (saveToStorage) {
            saveToStorage.addEventListener('click', () => {
                const levelName = prompt('Enter level name:', 'level-' + Date.now());
                if (levelName) {
                    this.exportSystem.saveLevelToStorage(
                        this.blockoutMode.tileData, 
                        this.blockoutMode.activeCells, 
                        levelName
                    );
                    this.showTemporaryMessage(`Level saved as "${levelName}"`);
                }
            });
        }
        
        // Load from storage
        const loadFromStorage = document.getElementById('loadFromStorage');
        if (loadFromStorage) {
            loadFromStorage.addEventListener('click', () => {
                const levels = this.exportSystem.getSavedLevels();
                if (levels.length === 0) {
                    this.showTemporaryMessage('No saved levels found');
                    return;
                }
                
                const levelName = prompt('Enter level name to load:', levels[0].name);
                if (levelName) {
                    try {
                        const levelData = this.exportSystem.loadLevelFromStorage(levelName);
                        this.blockoutMode.tileData = levelData.tileData;
                        this.blockoutMode.activeCells = levelData.activeCells;
                        this.blockoutMode.applyWallIndicators();
                        this.render();
                        this.showTemporaryMessage(`Level "${levelName}" loaded`);
                    } catch (error) {
                        this.showTemporaryMessage('Failed to load level');
                    }
                }
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
     * Update color swatches
     */
    updateColorSwatches() {
        const borderColorSwatch = document.getElementById('borderColorSwatch');
        if (borderColorSwatch) {
            borderColorSwatch.style.backgroundColor = this.settings.get('borderColor');
        }
        
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
    }
    
    /**
     * Set current mode
     */
    setMode(mode) {
        if (mode === 'paint' || mode === 'selectCell') {
            this.blockoutMode.setMode(mode);
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
        const cellPos = this.gridSystem.getCellFromTile(tilePos.x, tilePos.y);
        
        // Delegate to blockout mode
        this.blockoutMode.handleMouseDown({
            tileX: tilePos.x,
            tileY: tilePos.y,
            cellX: cellPos.x,
            cellY: cellPos.y,
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
        const cellPos = this.gridSystem.getCellFromTile(tilePos.x, tilePos.y);
        
        // Delegate to blockout mode
        this.blockoutMode.handleMouseMove({
            tileX: tilePos.x,
            tileY: tilePos.y,
            cellX: cellPos.x,
            cellY: cellPos.y,
            mouseX: mouseX,
            mouseY: mouseY
        });
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
        const cellPos = this.gridSystem.getCellFromTile(tilePos.x, tilePos.y);
        
        // Delegate to blockout mode
        this.blockoutMode.handleMouseUp({
            tileX: tilePos.x,
            tileY: tilePos.y,
            cellX: cellPos.x,
            cellY: cellPos.y,
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
            const oldBrushSize = this.blockoutMode.brushSize;
            
            if (e.deltaY < 0) {
                // Scroll up - increase brush size
                this.blockoutMode.brushSize = Math.min(5, this.blockoutMode.brushSize + 1);
            } else {
                // Scroll down - decrease brush size
                this.blockoutMode.brushSize = Math.max(1, this.blockoutMode.brushSize - 1);
            }
            
            if (this.blockoutMode.brushSize !== oldBrushSize) {
                // Update UI slider
                const brushSizeInput = document.getElementById('brushSize');
                if (brushSizeInput) {
                    brushSizeInput.value = this.blockoutMode.brushSize;
                    document.getElementById('brushSizeValue').textContent = this.blockoutMode.brushSize;
                    document.getElementById('brushSizeValue2').textContent = this.blockoutMode.brushSize;
                }
                
                // Update settings
                this.settings.set('brushSize', this.blockoutMode.brushSize);
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
                this.blockoutMode.handleKeyDown({
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
        this.blockoutMode.render();
    }
    
    /**
     * Show temporary message
     */
    showTemporaryMessage(message) {
        this.blockoutMode.showTemporaryMessage(message);
    }
    
    /**
     * Get current level data
     */
    getLevelData() {
        return {
            tileData: this.blockoutMode.tileData,
            activeCells: this.blockoutMode.activeCells,
            settings: this.settings.getAll()
        };
    }
    
    /**
     * Set level data
     */
    setLevelData(levelData) {
        if (levelData.tileData) {
            this.blockoutMode.tileData = levelData.tileData;
        }
        if (levelData.activeCells) {
            this.blockoutMode.activeCells = levelData.activeCells;
        }
        if (levelData.settings) {
            this.settings.update(levelData.settings);
        }
        this.blockoutMode.applyWallIndicators();
        this.render();
    }
}

// Initialize the editor when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.levelEditor = new LevelEditor();
});
