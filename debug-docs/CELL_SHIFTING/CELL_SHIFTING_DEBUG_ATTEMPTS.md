# Cell Shifting Debug - Attempts Made

## **Problem Description**
Cell shifting with multiple selected cells causes duplication bugs. When shifting selected cells in a direction, cells that are in the way should be moved to the other side of the selected cells, but instead some selected cells get duplicated.

## **Attempt 1: Complete Rewrite with Simple 3-Step Approach**

### **What I Tried:**
- Completely rewrote both `shiftRows` and `shiftColumns` methods
- Used a simple approach: Save → Clear → Move
- Removed complex displacement logic
- Added input validation

### **Code Changes:**
```javascript
shiftRows(deltaY, bounds) {
    // Step 1: Save selected cells data
    const selectedCellData = new Map();
    for (const cell of selectedCellsInRow) {
        selectedCellData.set(`${cell.x},${cell.y}`, this.getCellData(cell.x, cell.y));
    }
    
    // Step 2: Clear selected cells (set to transparent)
    for (const cell of selectedCellsInRow) {
        this.setCellData(cell.x, cell.y, this.createEmptyCell());
    }
    
    // Step 3: Move cells in the way and then move selected cells
    for (const cell of selectedCellsInRow) {
        const newY = (cell.y + deltaY + this.totalGridRows) % this.totalGridRows;
        
        // Move whatever is at target position to fill gap
        const cellDataAtTarget = this.getCellData(cell.x, newY);
        this.setCellData(cell.x, cell.y, cellDataAtTarget);
        
        // Move selected cell to new position
        const savedCellData = selectedCellData.get(`${cell.x},${cell.y}`);
        this.setCellData(cell.x, newY, savedCellData);
    }
}
```

### **Issues Found:**
1. **Data Structure Mismatch**: Initially passed `-1` directly to `setCellData()` instead of proper cell data structure
2. **Fixed**: Changed to use `this.createEmptyCell()` for proper 2D array structure

### **Result:** Still doesn't work

## **Attempt 2: Fixed Data Structure Issue**

### **What I Fixed:**
- Changed `this.setCellData(cell.x, cell.y, -1)` to `this.setCellData(cell.x, cell.y, this.createEmptyCell())`
- This ensures proper 2D array structure is passed to `setCellData()`

### **Code After Fix:**
```javascript
// Step 2: Clear selected cells (set to transparent)
for (const cell of selectedCellsInRow) {
    this.setCellData(cell.x, cell.y, this.createEmptyCell());
}
```

### **Result:** Still doesn't work

## **Current Status: Still Broken**

### **What We Know:**
1. ✅ Data structure issue was fixed
2. ✅ Input validation added
3. ✅ Simple 3-step approach implemented
4. ❌ Cell shifting still causes duplication

### **Potential Issues Not Yet Addressed:**

#### **Issue 1: Circular Reference in Data Saving**
```javascript
const savedCellData = selectedCellData.get(`${cell.x},${cell.y}`);
```
- This gets the data from the Map using the ORIGINAL cell coordinates
- But we're trying to use it after the cell has been cleared
- The Map key is still the original position, but we need the data

#### **Issue 2: Order of Operations**
The current approach:
1. Save data from original positions
2. Clear original positions  
3. Move target data to original positions
4. Move saved data to target positions

**Problem:** Step 3 might be overwriting data that step 4 needs.

#### **Issue 3: Modulo Arithmetic Edge Cases**
```javascript
const newY = (cell.y + deltaY + this.totalGridRows) % this.totalGridRows;
```
- Wrapping behavior might cause unexpected results
- Cells might wrap to wrong positions

#### **Issue 4: Cell Activity Updates**
- `updateCellActivity()` calls might be happening in wrong order
- Activity tracking might be getting corrupted

#### **Issue 5: Selection Update Logic**
```javascript
this.selectedCells = this.selectedCells.map(cell => {
    if (cell.y >= bounds.startY && cell.y <= bounds.endY) {
        return {
            x: cell.x,
            y: (cell.y + deltaY + this.totalGridRows) % this.totalGridRows
        };
    }
    return cell;
});
```
- This updates ALL selected cells, not just the ones that were shifted
- Might be causing selection state corruption

## **Root Cause Analysis Needed**

### **Questions to Investigate:**
1. **What exactly is happening during the shift?**
   - Are cells being moved to wrong positions?
   - Are cells being duplicated?
   - Are cells being lost?

2. **Is the issue with the data movement or the selection update?**
   - Does the cell data move correctly but selection gets corrupted?
   - Or does the cell data itself get corrupted?

3. **Are there edge cases with the modulo arithmetic?**
   - What happens when cells wrap around the grid edges?
   - Are bounds being calculated correctly?

4. **Is the issue with empty vs filled cells?**
   - Does it work differently for empty cells vs filled cells?
   - Are empty cells being handled correctly?

## **Next Steps Needed**

1. **Add Debug Logging** - Add console.log statements to track exactly what's happening
2. **Test with Simple Cases** - Test with single cell, then two cells, etc.
3. **Check Data Integrity** - Verify that cell data is actually moving correctly
4. **Check Selection State** - Verify that selection coordinates are updating correctly
5. **Test Edge Cases** - Test with cells at grid boundaries

## **Alternative Approaches to Consider**

### **Approach A: Two-Pass Algorithm**
1. First pass: Move all displaced cells to temporary positions
2. Second pass: Move selected cells to their new positions
3. Third pass: Move displaced cells from temporary to final positions

### **Approach B: Use Existing Working Code**
- Look at other cell movement methods in the codebase
- See if there's already working logic we can adapt

### **Approach C: Simpler Circular Shift**
- Instead of trying to be smart about displacement
- Just do a simple circular shift of all cells in the row/column

## **Files Modified**
- `js/level-editor.js` - Lines 2022-2120 (shiftRows and shiftColumns methods)

## **Current State**
- ❌ Cell shifting still broken
- ❌ Duplication bug still present
- ✅ Data structure issues fixed
- ✅ Input validation added
- ❓ Need to investigate root cause further
