# Cell Shifting Fix - Attempt 3

## **What I Did This Time**

### **Problem Analysis**
After reviewing the previous attempts, I identified the root cause of the cell shifting bug:

1. **Circular Dependencies**: The `willBeOccupied` logic created circular dependencies where cells would check each other's target positions
2. **Backwards Displacement Logic**: The displacement calculation was moving cells in the wrong direction
3. **Complex Batch Processing**: Trying to process all cells at once led to confusion about which cells should be displaced where

### **The Fix I Implemented**

I completely rewrote both `shiftRows` and `shiftColumns` methods with a simple, per-cell approach:

```javascript
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
        if (newY === cell.y) continue;
        
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
            return {
                x: cell.x,
                y: (cell.y + deltaY + this.totalGridRows) % this.totalGridRows
            };
        }
        return cell;
    });
    
    this.updateSelectionUI();
    this.render();
    this.showTemporaryMessage(`Selected cells shifted ${deltaY > 0 ? 'down' : 'up'}`);
}
```

### **Key Changes Made**

1. **Removed Complex Logic**: Eliminated the `willBeOccupied` checks and `displacedCells` array
2. **Individual Processing**: Each selected cell is processed one at a time in a simple loop
3. **Direct Movement**: Uses the same pattern as the working `moveCell` method
4. **Proper Order**: Clear → Move displaced → Move selected
5. **No Circular Dependencies**: Each cell is processed independently

### **Why I Thought This Would Work**

1. **Simple and Reliable**: The logic is straightforward and follows the same pattern as the working `moveCell` method
2. **No Circular Dependencies**: Each cell is processed independently, so there's no confusion about which cells are being moved where
3. **Proper Displacement**: When a selected cell moves to a new position, whatever was at that position gets moved to fill the gap left by the selected cell
4. **Maintains Selection State**: The selection coordinates are updated correctly after all the cell data has been moved

### **What This Should Have Fixed**

- ✅ No more cell duplication - Each cell is moved exactly once
- ✅ Proper circular shifting - Cells that get pushed out wrap around correctly  
- ✅ No data loss - Whatever is at the target position gets moved to fill the gap
- ✅ Reliable behavior - Simple logic that works consistently
- ✅ Maintains all existing functionality - User experience stays the same

### **Result: Still Doesn't Work**

Despite the simplified approach, the cell shifting bug persists. This suggests there may be a deeper issue that I haven't identified yet.

## **Next Steps Needed**

1. **Debug the Actual Behavior**: Need to add console.log statements to see exactly what's happening during the shift
2. **Test with Simple Cases**: Test with single cell, then two cells, etc. to isolate the issue
3. **Check Data Integrity**: Verify that cell data is actually moving correctly
4. **Check Selection State**: Verify that selection coordinates are updating correctly
5. **Investigate Edge Cases**: Test with cells at grid boundaries

## **Potential Issues Not Yet Addressed**

1. **Modulo Arithmetic Edge Cases**: The wrapping behavior might be causing unexpected results
2. **Cell Activity Updates**: The `updateCellActivity()` calls might be happening in wrong order
3. **Selection Update Logic**: The selection coordinate updates might be affecting the wrong cells
4. **Data Structure Issues**: There might be issues with how cell data is being saved/restored
5. **Bounds Checking**: The bounds filtering might not be working as expected

## **Files Modified**

- `js/level-editor.js` - Lines 2022-2110 (shiftRows and shiftColumns methods)

## **Current State**

- ❌ Cell shifting still broken
- ❌ Duplication bug still present
- ✅ Simplified logic implemented
- ✅ Removed complex displacement calculations
- ❓ Need to investigate deeper root cause

---

**Status:** Fix Attempted - Still Broken  
**Next Step:** Add debug logging to understand what's actually happening  
**Priority:** High - Core functionality bug persists
