

## Plan: YouTube Checkpoint Support + Video Block Integration Across All Modes

### Problem Summary
1. **YouTube checkpoints don't work** -- currently shows a warning and skips them
2. **Teacher Live Session** renders video blocks with a simple `VideoEmbed` instead of `VideoCheckpointStep`, so checkpoints never trigger
3. **Student Live View** doesn't handle `video` blocks as interactive -- it shows "Look Up" instead of rendering the video+checkpoints on their device
4. **`isInteractiveBlock()` in both live views** doesn't include `video`, so video blocks with checkpoints are treated as non-interactive

### Changes

#### 1. Add YouTube IFrame API support to `VideoCheckpointStep.tsx`
- Replace the "YouTube checkpoints not supported" branch with a working YouTube Player API integration
- Load the YouTube IFrame API script dynamically (`https://www.youtube.com/iframe_api`)
- Use `YT.Player` with `onStateChange` and a polling interval to track `getCurrentTime()` for checkpoint detection
- Pause via `player.pauseVideo()`, resume via `player.playVideo()` when checkpoint completes
- Keep the existing HTML5 `<video>` path unchanged for direct URLs

#### 2. Update `TeacherLiveSession.tsx` -- render video blocks with checkpoints
- Import `VideoCheckpointStep` and its config type
- Replace the current simple `VideoEmbed` rendering for `video` blocks with `VideoCheckpointStep` when the block has checkpoints in its config
- Keep the simple `VideoEmbed` for video blocks without checkpoints (teacher just shows the video)

#### 3. Update `StudentLiveView.tsx` -- treat video as interactive when it has checkpoints
- Import `VideoCheckpointStep` and its config type
- Update `isInteractiveBlock()` to conditionally include `video` (or handle it separately)
- Add a `video` block rendering branch in the interactive section that renders `VideoCheckpointStep` with `isLive={true}`
- When a video block has no checkpoints, keep the "Look Up" behavior

#### 4. Add checkpoint drag-and-drop reordering in the editor
- In the video checkpoint editor section of `ManageCurriculum.tsx`, add drag-and-drop handlers to each checkpoint card (same pattern as block reordering: `dragStart`, `dragOver`, `onDrop`)
- Reorder checkpoints within the config array and call `onChange` to persist

#### 5. Ensure all curriculum editor roles have access
- Already handled: both `ethics_admin` and `curriculum_admin` have matching RLS policies on `lesson_blocks` for INSERT, UPDATE, DELETE
- The editor UI is shared via the same `ManageCurriculum` component -- no separate pages per role

### Technical Details

**YouTube IFrame API integration pattern:**
```text
1. Check if window.YT exists, if not inject <script> tag
2. Create YT.Player targeting a <div> (not iframe directly)
3. Poll player.getCurrentTime() every 500ms via setInterval
4. On checkpoint hit: player.pauseVideo(), show overlay
5. On checkpoint complete: player.playVideo()
6. Track duration via player.getDuration()
```

**Files to modify:**
- `src/components/steps/VideoCheckpointStep.tsx` -- YouTube API integration
- `src/pages/TeacherLiveSession.tsx` -- use VideoCheckpointStep for video blocks
- `src/pages/StudentLiveView.tsx` -- handle video as interactive, render VideoCheckpointStep
- `src/pages/admin/ManageCurriculum.tsx` -- checkpoint drag-and-drop reordering

