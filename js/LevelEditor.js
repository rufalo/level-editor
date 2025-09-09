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
        
        // Outlines
        const showOutlines = document.getElementById('showOutlines');
        if (showOutlines) {
            showOutlines.checked = this.settings.get('showOutlines');
            showOutlines.addEventListener('change', (e) => {
                this.settings.set('showOutlines', e.target.checked);
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
                        this.blockoutMode.applyAutoOutline();
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
        this.blockoutMode.applyAutoOutline();
        this.render();
    }
}

// Initialize the editor when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.levelEditor = new LevelEditor();
});
