/**
 * ExportSystem - Handles JSON export and web storage
 */
export class ExportSystem {
    constructor(settings, gridSystem) {
        this.settings = settings;
        this.gridSystem = gridSystem;
    }
    
    /**
     * Export level data to JSON
     */
    exportLevelToJSON(tileData, activeCells, metadata = {}) {
        const exportData = {
            version: "2.0",
            type: "level_skeleton",
            metadata: {
                name: metadata.name || "untitled-level",
                created: new Date().toISOString(),
                gridSize: {
                    cols: this.gridSystem.totalGridCols,
                    rows: this.gridSystem.totalGridRows
                },
                cellSize: {
                    width: this.gridSystem.cellWidth,
                    height: this.gridSystem.cellHeight
                },
                tileSize: this.settings.get('tileSize'),
                ...metadata
            },
            tileData: tileData,
            activeCells: Array.from(activeCells),
            visualSettings: {
                showBorders: this.settings.get('showBorders'),
                showOutlines: this.settings.get('showOutlines'),
                showCenterGuides: this.settings.get('showCenterGuides'),
                borderColor: this.settings.get('borderColor'),
                borderWeight: this.settings.get('borderWeight'),
                centerGuideColor: this.settings.get('centerGuideColor'),
                centerGuideWeight: this.settings.get('centerGuideWeight'),
                outlineColor: this.settings.get('outlineColor'),
                outlineWeight: this.settings.get('outlineWeight')
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * Import level data from JSON
     */
    importLevelFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate data structure
            if (!data.version || !data.tileData || !data.activeCells) {
                throw new Error('Invalid level data format');
            }
            
            // Check version compatibility
            if (data.version !== "2.0") {
                console.warn(`Level version ${data.version} may not be fully compatible`);
            }
            
            return {
                tileData: data.tileData,
                activeCells: new Set(data.activeCells),
                metadata: data.metadata || {},
                visualSettings: data.visualSettings || {}
            };
        } catch (error) {
            console.error('Failed to import level:', error);
            throw new Error('Invalid JSON format or corrupted level data');
        }
    }
    
    /**
     * Save level to localStorage
     */
    saveLevelToStorage(tileData, activeCells, levelName = 'current-level') {
        try {
            const levelData = this.exportLevelToJSON(tileData, activeCells, { name: levelName });
            localStorage.setItem(`level_${levelName}`, levelData);
            return true;
        } catch (error) {
            console.error('Failed to save level to storage:', error);
            return false;
        }
    }
    
    /**
     * Load level from localStorage
     */
    loadLevelFromStorage(levelName = 'current-level') {
        try {
            const levelData = localStorage.getItem(`level_${levelName}`);
            if (!levelData) {
                throw new Error('Level not found in storage');
            }
            return this.importLevelFromJSON(levelData);
        } catch (error) {
            console.error('Failed to load level from storage:', error);
            throw error;
        }
    }
    
    /**
     * Get list of saved levels
     */
    getSavedLevels() {
        const levels = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('level_')) {
                const levelName = key.replace('level_', '');
                try {
                    const levelData = localStorage.getItem(key);
                    const parsed = JSON.parse(levelData);
                    levels.push({
                        name: levelName,
                        created: parsed.metadata?.created || 'Unknown',
                        gridSize: parsed.metadata?.gridSize || { cols: 0, rows: 0 }
                    });
                } catch (error) {
                    console.warn(`Failed to parse level ${levelName}:`, error);
                }
            }
        }
        return levels.sort((a, b) => new Date(b.created) - new Date(a.created));
    }
    
    /**
     * Delete level from storage
     */
    deleteLevelFromStorage(levelName) {
        try {
            localStorage.removeItem(`level_${levelName}`);
            return true;
        } catch (error) {
            console.error('Failed to delete level from storage:', error);
            return false;
        }
    }
    
    /**
     * Download level as JSON file
     */
    downloadLevelAsFile(tileData, activeCells, filename = 'level.json') {
        try {
            const jsonData = this.exportLevelToJSON(tileData, activeCells, { name: filename.replace('.json', '') });
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Failed to download level file:', error);
            return false;
        }
    }
    
    /**
     * Load level from file input
     */
    loadLevelFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const levelData = this.importLevelFromJSON(e.target.result);
                    resolve(levelData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Export settings to JSON
     */
    exportSettings() {
        return this.settings.exportSettings();
    }
    
    /**
     * Import settings from JSON
     */
    importSettings(jsonString) {
        return this.settings.importSettings(jsonString);
    }
    
    /**
     * Clear all stored levels
     */
    clearAllStoredLevels() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('level_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Failed to clear stored levels:', error);
            return false;
        }
    }
}
