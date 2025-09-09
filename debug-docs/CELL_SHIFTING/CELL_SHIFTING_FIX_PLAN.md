# Cell Shifting Fix Plan

## **Complete Fix Plan for Cell Shifting**

### **Core Problem Analysis**
The current code is trying to be too clever with displacement logic. We need a simple, reliable approach that:
1. Only moves selected cells within their row/column bounds
2. Properly handles circular shifting (cells that get pushed out wrap around)
3. Maintains all existing functionality from user perspective

### **1. Fix the Core Shifting Logic**

**Current Issues:**
- Displacement detection is backwards and circular
- `willBeOccupied` logic is fundamentally flawed
- Selection updates affect wrong cells

**New Approach:**
```javascript
// For each row/column shift:
1. Save selected cells data
2. Clear selected cells (set to transparent/empty)
3. Calculate target positions for selected cells
4. Move whatever is at target positions to fill gaps left by selected cells
5. Move selected cells to their target positions
6. Update selection coordinates
```

### **2. Fix the `shiftRows` Method**

**Changes Needed:**
- Remove the complex `willBeOccupied` logic
- Remove the `displacedCells` array approach
- Use a simple 3-step process: clear → displace → move
- Fix the selection update to only affect cells that were actually shifted

**New Logic:**
```javascript
shiftRows(deltaY, bounds) {
    1. Filter selected cells to only those in the row bounds
    2. Save their data
    3. Clear selected cells (set to transparent)
    4. For each selected cell:
       - Calculate new position
       - Move whatever is at new position to old position
       - Move selected cell to new position
    5. Update selection coordinates for shifted cells only
}
```

### **3. Fix the `shiftColumns` Method**

**Same approach as shiftRows but for columns:**
- Mirror the row logic but for X coordinates
- Ensure consistent behavior between row and column shifts

### **4. Fix the Selection Update Logic**

**Current Issue:**
- Updates ALL selected cells, not just the ones that were shifted
- Uses original bounds instead of filtered cells

**New Approach:**
- Only update cells that were actually shifted
- Use the filtered cell list, not the original selection
- Maintain selection state correctly

### **5. Fix the Bounds Handling**

**Current Issue:**
- `colBounds` variable is unused in `shiftRows`
- Bounds filtering is inconsistent

**New Approach:**
- Remove unused variables
- Use consistent bounds checking
- Ensure only cells within the shift bounds are affected

### **6. Fix the Cell Activity Updates**

**Current Issue:**
- `updateCellActivity` calls happen in wrong order
- Activity tracking might be incorrect

**New Approach:**
- Update activity after all cell data changes are complete
- Ensure activity tracking reflects the final state

### **7. Fix the Modulo Arithmetic Edge Cases**

**Current Issue:**
- Wrapping behavior might be unexpected near grid edges
- Bounds checking might be incorrect

**New Approach:**
- Add proper bounds checking before modulo operations
- Ensure wrapping behavior is consistent and predictable

### **8. Fix the Displacement Logic**

**Current Issue:**
- Trying to be too smart about which cells to displace
- Complex logic that doesn't work correctly

**New Approach:**
- Simple approach: whatever is at the target position gets moved to fill the gap
- No complex "willBeOccupied" checks
- Direct cell-to-cell movement

### **9. Add Proper Error Handling**

**New Additions:**
- Check if selection is valid before shifting
- Handle edge cases (selection at grid boundaries)
- Ensure bounds are valid before processing

### **10. Maintain All Existing Functionality**

**What Stays the Same:**
- User interface and controls
- Selection system
- Visual feedback
- All other editor features
- The shifting should feel the same to the user

**What Gets Fixed:**
- The underlying shifting logic
- No more cell duplication
- Proper circular shifting
- Reliable behavior

### **11. Testing Strategy**

**Test Cases:**
- Single cell selection shifts
- Multi-cell selection shifts
- Shifts at grid boundaries
- Shifts that cause wrapping
- Mixed row/column selections
- Large selections

### **12. Implementation Order**

1. **First:** Fix `shiftRows` method completely
2. **Second:** Fix `shiftColumns` method (mirror the row logic)
3. **Third:** Fix selection update logic
4. **Fourth:** Add proper error handling
5. **Fifth:** Test with various selection patterns

### **13. Key Principles for the Fix**

1. **Simplicity:** Use the simplest approach that works
2. **Reliability:** Ensure consistent behavior in all cases
3. **Maintainability:** Code should be easy to understand and debug
4. **User Experience:** Maintain all existing functionality
5. **Performance:** Keep the same performance characteristics

### **14. What This Fixes**

- ✅ No more cell duplication
- ✅ Proper circular shifting
- ✅ Only affects selected cells within their bounds
- ✅ Maintains selection state correctly
- ✅ Handles edge cases properly
- ✅ Reliable and predictable behavior

---

**Status:** Planning Complete  
**Next Step:** Implement the fixes in order  
**Priority:** High - Core functionality bug
