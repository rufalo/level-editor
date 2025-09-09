# Level Editor

A professional hierarchical level editor for rapid level creation and modular world building.

## 🎨 **Features**

### **Level Blockout Mode**
- **10x10 Cell Grid** system for rapid prototyping
- **Inverted Drawing** - cells start filled, drawing creates walkable space
- **Star Pattern Brushes** with 5 different sizes (1x1 to 5x5)
- **Real-time Preview** showing affected tiles
- **Visual Cell Library** with drag-and-drop functionality

### **Drawing Tools**
- **Blockout Mode** - Primary tool for carving empty spaces
- **Connection Tiles** - Place yellow connection markers
- **Visual Outline System** - Auto-outline mode creates visual borders without modifying tile data
- **Cell Management** - Select, move, swap, clear, and fill cells with directional arrows
- **Brush Control** - Size adjustment with slider or Ctrl+Scroll

### **Visual Design**
- **Active/Inactive Cells** - White for modified, gray for defaults
- **Zoom & Pan** - Mouse wheel zoom (0.1x-5.0x), WASD/middle-click pan
- **Smart Grid** - Darker grid lines visible on all cell types
- **Cell Borders** - Light blue borders distinguish cell boundaries
- **Center Guidelines** - Dark blue center lines for alignment
- **Visual Outlines** - Semi-transparent overlay system for auto-outlining

### **Cell Library System**
- **Save System** - Drag selected cells to green drop zone
- **Load System** - Drag thumbnails from shelf to canvas
- **Persistence** - Auto-saved to localStorage with timestamps
- **Management** - Hover delete, visual previews, organized shelf

## 🎮 **Controls**

### **Navigation**
- **Pan** → WASD, Arrow Keys, or Middle Mouse + Drag
- **Zoom** → Mouse Wheel
- **Brush Size** → Ctrl + Scroll Wheel or Slider

### **Drawing**
- **Carve/Draw** → Left Click (creates empty space)
- **Fill** → Right Click (creates solid space)
- **Brush Preview** → Hover to see affected tiles

### **Modes**
- **Blockout Mode** → Primary drawing tool
- **Connection Tile** → Place yellow connectors
- **Select Cell** → Click cell to select
- **Clone Mode** → Duplicate cells

### **Cell Operations**
- **Save Cell** → Drag selected cell to green drop zone
- **Load Cell** → Drag thumbnail to canvas
- **Delete Cell** → Hover thumbnail → click × or Delete key
- **Cell Management** → Clear Cell, Fill Cell buttons
- **Cell Shifting** → Click directional arrows around selection to shift content
- **Multi-Selection** → Rectangle selection with unified operations

## 🚀 **Getting Started**

1. **Open `level-editor.html`** in your browser
2. **Use left-click** to carve empty spaces
3. **Use right-click** to fill solid spaces
4. **Adjust brush size** with the slider
5. **Save cells** by dragging to the green drop zone
6. **Load cells** by dragging from the shelf

## 🔧 **Technical Features**

### **Grid System**
- **Level Grid** → 10x10 cells (configurable)
- **Cell Size** → 5x5 tiles per cell
- **Total Resolution** → 50x50 tiles (1600x1600 pixels)
- **Coordinate System** → Proper world coordinate transformations
- **Visual Overlay** → Separate rendering layer for non-destructive outlines

### **Rendering**
- **Canvas Rendering** → HTML5 Canvas 2D with layered system
- **Efficient Rendering** → Viewport culling, only renders visible elements
- **Data Structure** → Simple 2D arrays for tile data
- **Event System** → Mouse/keyboard interaction with proper drag handling

### **Storage**
- **localStorage** → Auto-saved with timestamps
- **JSON Format** → Human-readable level data
- **Cell Library** → Persistent thumbnail system
- **Level Management** → Save/load complete level states
- **Export System** → Convert visual outlines to permanent tiles on export

## 📁 **Files**

- **`level-editor.html`** → Complete level editor implementation
- **`js/level-editor.js`** → Main editor controller (2000+ lines)

## 🎯 **Best For**

- **Rapid level prototyping** and iteration
- **Modular level design** with reusable components
- **Visual level creation** without coding
- **Professional level design** workflow

## 🔄 **Development Roadmap**

### **Current Status** ✅
- Level Blockout Mode complete
- Visual cell library system
- Drawing tools and brushes
- Save/load functionality
- Visual outline system with export capability
- Advanced selection system with directional shifting
- Center guidelines and improved viewport management

### **Next Phase** 🔄
- Detailed Level Editor (16x10 tile resolution)
- Seamless zoom from level skeleton to tile level
- Tile-level refinement tools

### **Future Phases** 🔮
- Multi-level world composition
- World map interface
- Level generation for game integration

---

**Version:** Level Editor v1.1  
**Status:** Visual Outline System complete  
**Last Updated:** 2025-01-09
