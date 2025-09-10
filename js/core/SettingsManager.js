/**
 * SettingsManager - Handles all application settings and persistence
 */
export class SettingsManager {
    constructor() {
        this.defaultSettings = {
            // Visual settings
            showBorders: true,
            showWallIndicators: true,
            showCenterGuides: true,
            borderColor: '#000000',
            borderWeight: 3,
            centerGuideColor: '#00008b',
            centerGuideWeight: 5,
            outlineColor: '#ff0000',
            outlineWeight: 2,
            
            // Grid settings
            tileSize: 32,
            cellWidth: 5,
            cellHeight: 5,
            totalGridCols: 10,
            totalGridRows: 10,
            
            // Viewport settings
            viewportCols: 3,
            viewportRows: 3,
            viewportX: 3,
            viewportY: 3,
            zoom: 1.0,
            
            // Canvas settings
            canvasWidth: 800,
            canvasHeight: 600,
            gridMarginX: 400,
            gridMarginY: 300,
            
            // Mode settings
            currentMode: 'selectCell',
            brushSize: 1,
            selectedColor: '#ff0000',
            
            // Checker pattern settings
            checkerColor1: '#d0d0d0',
            checkerColor2: '#e6f3ff',
            
            // Selection settings
            dropAction: 'swap' // Drop action mode: 'swap', 'overwrite', 'duplicate', 'add', 'subtract'
        };
        
        this.settings = { ...this.defaultSettings };
        this.loadSettings();
    }
    
    /**
     * Get a setting value
     */
    get(key) {
        return this.settings[key];
    }
    
    /**
     * Set a setting value
     */
    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }
    
    /**
     * Get all settings
     */
    getAll() {
        return { ...this.settings };
    }
    
    /**
     * Update multiple settings at once
     */
    update(updates) {
        Object.assign(this.settings, updates);
        this.saveSettings();
    }
    
    /**
     * Reset settings to defaults
     */
    resetToDefaults() {
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
        console.log('Settings reset to defaults');
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('levelEditorSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('levelEditorSettings');
            if (saved) {
                const parsedSettings = JSON.parse(saved);
                // Merge with defaults to handle new settings
                this.settings = { ...this.defaultSettings, ...parsedSettings };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = { ...this.defaultSettings };
        }
    }
    
    /**
     * Export settings as JSON
     */
    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }
    
    /**
     * Import settings from JSON
     */
    importSettings(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.settings = { ...this.defaultSettings, ...imported };
            this.saveSettings();
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
}
