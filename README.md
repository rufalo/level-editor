# Level Editor

A professional hierarchical level editor for rapid level creation and modular world building.

## 🎨 **Features**

### **Level Blockout Mode**
- **10x10 Cell Grid** system for rapid prototyping
- **Inverted Drawing** - cells start filled, drawing creates walkable space
- **Star Pattern Brushes** with 5 different sizes (1x1 to 5x5)
- **Real-time Preview** showing affected tiles
- **Simplified Interface** - focused on core functionality

### **Drawing Tools**
- **Paint Mode** - Primary tool for carving empty spaces and filling solid areas
- **Visual Outline System** - Auto-outline mode creates visual borders without modifying tile data
- **Cell Management** - Select, move, swap, and clear cells with directional arrows
- **Brush Control** - Size adjustment with slider or Ctrl+Scroll
- **Shift Eraser** - Hold Shift while painting to fill tiles

### **Visual Design**
- **Active/Inactive Cells** - White for modified, gray for defaults
- **Zoom & Pan** - Mouse wheel zoom (0.1x-5.0x), WASD/middle-click pan
- **Smart Grid** - Customizable grid line colors
- **Cell Borders** - Customizable border colors and weights
- **Center Guidelines** - Customizable center lines for alignment
- **Visual Outlines** - Semi-transparent overlay system for auto-outlining
- **Checker Pattern** - Customizable transparent tile backgrounds

### **Simplified Interface**
- **Two Modes Only** - Paint Mode and Select Cell Mode
- **Streamlined Controls** - Removed complex library systems
- **Focus on Core** - Essential tools for rapid level creation

## 🎮 **Controls**

### **Navigation**
- **Pan** → WASD, Arrow Keys, or Middle Mouse + Drag
- **Zoom** → Mouse Wheel
- **Brush Size** → Ctrl + Scroll Wheel or Slider

### **Drawing**
- **Empty Space** → Left Click (creates walkable area)
- **Solid Space** → Right Click (creates filled area)
- **Fill Tiles** → Shift + Left Click (fills with solid tiles)
- **Brush Preview** → Hover to see affected tiles

### **Modes**
- **Paint Mode** → Primary drawing tool
- **Select Cell Mode** → Click cell to select and manage

### **Cell Operations**
- **Select Cells** → Click to select single or rectangle select multiple
- **Move Cells** → Drag selected cells to new positions
- **Swap Cells** → Toggle "Swap cells when dragging" for cell swapping
- **Clear Cells** → Delete key to clear selected cells
- **Cell Shifting** → Click directional arrows around selection to shift content
- **Multi-Selection** → Rectangle selection with unified operations

## 🎨 **Visual Settings**

### **Customizable Elements**
- **Cell Borders** - Toggle, color, and weight control
- **Center Guide Lines** - Toggle, color, and weight control
- **Grid Lines** - Color customization
- **Checker Pattern** - Two-color customization for transparent tiles
- **Outline Overlay** - Toggle visual outline system

### **Settings Management**
- **Persistent Settings** - All visual preferences saved automatically
- **Reset to Defaults** - One-click restoration of original settings
- **Real-time Updates** - Changes apply immediately

## 🚀 **Getting Started**

1. **Open `level-editor.html`** in your browser
2. **Use left-click** to carve empty spaces
3. **Use right-click** to fill solid spaces
4. **Hold Shift + left-click** to fill tiles
5. **Adjust brush size** with the slider
6. **Select cells** to move, swap, or clear them
7. **Customize visuals** in the Visual Settings tab

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
- **Layered Drawing** → Proper z-order for visual elements

### **Simplified Architecture**
- **Minimal Codebase** → Streamlined for core functionality
- **No External Dependencies** → Pure HTML5/JavaScript
- **Clean Interface** → Focus on essential tools
- **Performance Optimized** → Efficient rendering and event handling

## 📁 **Files**

- **`level-editor.html`** → Complete level editor implementation
- **`js/level-editor.js`** → Main editor controller (2000+ lines)

## 🎯 **Best For**

- **Rapid level prototyping** and iteration
- **Modular level design** with reusable components
- **Visual level creation** without coding
- **Professional level design** workflow
- **Clean, focused** level editing experience

## 🔄 **Development Status**

### **Current Version** ✅
- **Streamlined Interface** - Removed complex library systems
- **Core Drawing Tools** - Paint mode with brush controls
- **Cell Management** - Select, move, swap, and clear operations
- **Visual Customization** - Full control over colors and weights
- **Auto-Outline System** - Visual overlay for better design
- **Settings Persistence** - All preferences saved automatically

### **Key Improvements** 🆕
- **Simplified UI** - Focus on essential tools only
- **Enhanced Visual Controls** - Customizable colors and weights
- **Better Performance** - Optimized rendering and event handling
- **Cleaner Codebase** - Removed unused functionality
- **Improved UX** - Streamlined workflow for rapid iteration

---

**Version:** Level Editor v2.0  
**Status:** Streamlined & Enhanced  
**Last Updated:** 2025-01-09