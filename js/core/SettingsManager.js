/**
 * SettingsManager - Handles all application settings and persistence
 */
export class SettingsManager {
    constructor() {
        this.defaultSettings = {
            // Visual settings
            showWallIndicators: true,
            showCenterGuides: true,
            centerGuideColor: '#00008b',
            centerGuideWeight: 5,
            outlineColor: '#ff0000',
            outlineWeight: 2,
            wallIndicatorColor: '#808080',
            
            // Grid settings
            tileSize: 64,
            totalGridWidth: 50,
            totalGridHeight: 50,
            
            // Viewport settings
            viewportWidth: 12,
            viewportHeight: 9,
            viewportX: 19,
            viewportY: 20,
            zoom: 1.0,
            saveZoomLevel: true,
            
            // Canvas settings
            canvasWidth: 800,
            canvasHeight: 600,
            gridMarginX: 400,
            gridMarginY: 300,
            
            // Mode settings
            currentMode: 'paint',
            brushSize: 1,
            showBrushPreview: true,
            
            // Checker pattern settings
            checkerColor1: '#d0d0d0',
            checkerColor2: '#e6f3ff'
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
                
                // Only reset zoom to 1.0 if saveZoomLevel is false
                if (!this.settings.saveZoomLevel) {
                    this.settings.zoom = 1.0;
                }
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
