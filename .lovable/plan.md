

## Fix: Block Drag-and-Drop Reordering

### Root Cause
The `handleDrop` function reads `dragIdx` from React state, but React state updates are asynchronous. By the time `handleDrop` fires, `dragIdx` may still be `null` or stale, causing the drop to silently do nothing (`if (fromIdx === null) return`).

The irony is that `handleBlockDragStart` already writes the source index to `e.dataTransfer.setData("block-drag", String(idx))` — but `handleDrop` never reads it. It relies on `dragIdx` state instead.

### Fix (single file: `ManageCurriculum.tsx`)

1. **Read source index from `dataTransfer` in `handleDrop`** instead of relying on `dragIdx` state:
   - Parse `e.dataTransfer.getData("block-drag")` to get the true source index
   - Fall back to `dragIdx` state only if `dataTransfer` is empty
   - This guarantees the correct source index regardless of React's async state timing

2. **Restrict `draggable` to the grip handle only** to prevent accidental drags when clicking buttons, inputs, or other interactive elements inside the block card:
   - Remove `draggable` from the outer block div
   - Add `draggable` + `onDragStart` to the `GripVertical` handle span only
   - Keep `onDragEnter`, `onDragLeave`, `onDragOver`, `onDrop` on the outer div (these are drop-target events)

3. **Use a ref for `dragIdx`** alongside the state so all handlers always have the current value without depending on React's render cycle.

### Technical Details

```text
Before (broken):
  handleBlockDragStart → setState(dragIdx)     [async, may not update in time]
  handleDrop           → reads dragIdx state    [may be null/stale]

After (fixed):
  handleBlockDragStart → setState + ref + dataTransfer.setData
  handleDrop           → reads dataTransfer.getData("block-drag")  [always correct]
                          fallback: reads ref
```

**File**: `src/pages/admin/ManageCurriculum.tsx`

