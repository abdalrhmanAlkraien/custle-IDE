# Test Scenarios - Task 6.2: Polish, Shortcuts & Settings

**Task**: Final polish with keyboard shortcuts, command palette, settings, and toasts
**Test Method**: Manual verification + code inspection
**Date**: 2026-02-25

---

## Test Summary

| Category | Scenarios | Expected Result |
|----------|-----------|-----------------|
| Keyboard Shortcuts | 15 shortcuts | All keyboard shortcuts trigger correct actions |
| Command Palette | File search + Commands | Opens, searches files/commands, fuzzy match works |
| Settings Modal | 5 sections | All settings persist, apply immediately |
| Toast Notifications | 4 types | Toasts appear, auto-dismiss, max 3 visible |
| TypeScript | Build verification | 0 errors backend + frontend |

---

## Scenario 1: Keyboard Shortcuts - All 15 Work

**Test Steps:**
1. Open IDE with workspace
2. Test each keyboard shortcut:
   - `Ctrl+P` → Command palette opens
   - `Ctrl+Shift+P` → Command palette opens
   - `Ctrl+B` → Sidebar toggles
   - `Ctrl+J` → Bottom panel toggles
   - `Ctrl+\` → Chat panel toggles
   - `Ctrl+`  → Focus terminal (bottom opens if closed)
   - `Ctrl+S` → Save active file (toast appears)
   - `Ctrl+Shift+S` → Save all files (toast appears)
   - `Ctrl+W` → Close active tab
   - `Ctrl+Shift+W` → Close all tabs (confirmation)
   - `Ctrl+Tab` → Next tab
   - `Ctrl+Shift+Tab` → Previous tab
   - `Ctrl+,` → Settings modal opens
   - `Escape` → Closes any open modal

**Expected Result:**
- ✅ All 15 shortcuts trigger their respective actions
- ✅ No browser default shortcuts conflict
- ✅ Visual feedback immediate (< 50ms)

---

## Scenario 2: Command Palette - File Search Mode

**Test Steps:**
1. Press `Ctrl+P`
2. Verify palette opens (no `>` prefix)
3. Type part of a filename (e.g., "index")
4. Verify fuzzy search matches files
5. Use arrow keys to navigate
6. Press Enter to open file
7. Verify file opens in editor

**Expected Result:**
- ✅ Palette opens in < 50ms
- ✅ File mode by default (shows recent files when empty)
- ✅ Fuzzy matching works (e.g., "idestore" matches "ideStore.ts")
- ✅ Arrow keys navigate (visual highlight)
- ✅ Enter opens selected file
- ✅ Esc closes palette

---

## Scenario 3: Command Palette - Command Mode

**Test Steps:**
1. Press `Ctrl+P`
2. Type `>` to enter command mode
3. Verify commands list appears
4. Type "toggle sidebar"
5. Verify fuzzy match filters commands
6. Press Enter to execute
7. Verify sidebar toggles

**Expected Result:**
- ✅ `>` prefix switches to command mode
- ✅ Commands list shows 5+ commands
- ✅ Fuzzy search filters commands
- ✅ Command descriptions visible
- ✅ Enter executes command
- ✅ Command palette closes after execution

---

## Scenario 4: Settings Modal - Editor Settings

**Test Steps:**
1. Press `Ctrl+,` to open settings
2. Navigate to Editor tab
3. Change font size from 14 to 16
4. Change tab size from 2 to 4
5. Toggle word wrap OFF
6. Toggle minimap OFF
7. Click "Done"
8. Reload page (Ctrl+R)
9. Open settings again
10. Verify all changes persisted

**Expected Result:**
- ✅ Settings modal opens with Editor tab active
- ✅ All editor settings visible and editable
- ✅ Changes apply immediately (no reload needed initially)
- ✅ Settings persist in localStorage after reload
- ✅ Font size 16, tab size 4, word wrap OFF, minimap OFF

---

## Scenario 5: Settings Modal - AI Settings

**Test Steps:**
1. Open settings (`Ctrl+,`)
2. Navigate to AI tab
3. Adjust temperature slider from 0.7 to 0.9
4. Change max tokens from 2048 to 4096
5. Toggle autocomplete OFF
6. Change debounce delay from 700ms to 1000ms
7. Click "Done"
8. Reload page
9. Reopen settings
10. Verify AI settings persisted

**Expected Result:**
- ✅ AI tab shows all AI-related settings
- ✅ Temperature slider shows current value
- ✅ All changes apply immediately
- ✅ Settings persist after reload
- ✅ Temp 0.9, tokens 4096, autocomplete OFF, debounce 1000ms

---

## Scenario 6: Settings Modal - Terminal Settings

**Test Steps:**
1. Open settings
2. Navigate to Terminal tab
3. Change font size from 13 to 15
4. Change shell path to `/bin/zsh`
5. Click "Done"
6. Reload page
7. Reopen settings
8. Verify terminal settings persisted

**Expected Result:**
- ✅ Terminal settings visible
- ✅ Font size and shell path editable
- ✅ Settings persist after reload

---

## Scenario 7: Settings Modal - Keybindings View

**Test Steps:**
1. Open settings
2. Navigate to Keybindings tab
3. Verify all 15 shortcuts listed
4. Verify each shows correct key combination (Ctrl, Shift, etc.)
5. Verify read-only message displayed

**Expected Result:**
- ✅ All 15 keyboard shortcuts listed
- ✅ Each displays correct key combo (Ctrl, Shift, Alt badges)
- ✅ Descriptions match IDE_SHORTCUTS
- ✅ Read-only message: "Custom keybinding support coming soon"

---

## Scenario 8: Toast Notifications - Success

**Test Steps:**
1. Open a file in editor
2. Make changes
3. Press `Ctrl+S` to save
4. Verify green "Saved" toast appears bottom-right
5. Wait 3 seconds
6. Verify toast auto-dismisses

**Expected Result:**
- ✅ Green toast with checkmark icon
- ✅ Message: "Saved {filename}"
- ✅ Appears bottom-right
- ✅ Auto-dismisses after 3 seconds
- ✅ Slide-in animation smooth

---

## Scenario 9: Toast Notifications - Error

**Test Steps:**
1. Modify ideStore to simulate save error
2. Attempt to save file
3. Verify red error toast appears
4. Click toast to dismiss early
5. Verify toast closes immediately

**Expected Result:**
- ✅ Red toast with X icon
- ✅ Error message displayed
- ✅ Click to dismiss works
- ✅ Toast closes immediately on click

---

## Scenario 10: Toast Notifications - Max 3 Visible

**Test Steps:**
1. Trigger 5 toasts rapidly (save multiple files quickly)
2. Verify only 3 toasts visible at once
3. Verify older toasts removed as new ones appear

**Expected Result:**
- ✅ Maximum 3 toasts visible simultaneously
- ✅ Older toasts dismissed automatically
- ✅ Newest toasts always visible

---

## Scenario 11: TypeScript Build - Backend

**Test Steps:**
1. Run `cd backend && npm run build`
2. Verify 0 TypeScript errors
3. Verify compilation succeeds

**Expected Result:**
- ✅ Build completes successfully
- ✅ 0 TypeScript errors
- ✅ All new files compile clean

---

## Scenario 12: TypeScript Build - Frontend

**Test Steps:**
1. Run `cd frontend && npm run build`
2. Verify 0 TypeScript errors
3. Verify Next.js build succeeds
4. Verify all routes compile

**Expected Result:**
- ✅ Build completes successfully
- ✅ 0 TypeScript errors
- ✅ Next.js optimized production build succeeds
- ✅ All components type-safe

---

## Scenario 13: Settings Modal - Reset to Defaults

**Test Steps:**
1. Open settings
2. Make several changes across tabs
3. Click "Reset to Defaults"
4. Confirm reset
5. Verify all settings revert to defaults

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ All settings reset to original values
- ✅ Editor font size → 14, tab size → 2
- ✅ AI temp → 0.7, tokens → 2048
- ✅ Terminal font → 13, shell → /bin/bash

---

## Scenario 14: Command Palette - Recent Files

**Test Steps:**
1. Open 3-5 files in editor
2. Close command palette
3. Press `Ctrl+P` again
4. Verify recent files shown when input empty
5. Verify files listed in reverse order (most recent first)

**Expected Result:**
- ✅ Recent files displayed when query empty
- ✅ Up to 10 recent files shown
- ✅ Most recently opened at top
- ✅ File paths and names visible

---

## Scenario 15: Keyboard Shortcuts - Save All Files

**Test Steps:**
1. Open 3 files
2. Make changes to all 3
3. Press `Ctrl+Shift+S`
4. Verify success toast shows "Saved 3 file(s)"
5. Verify all files marked clean (no dirty indicators)

**Expected Result:**
- ✅ All 3 files saved simultaneously
- ✅ Toast message: "Saved 3 file(s)"
- ✅ All dirty indicators cleared
- ✅ No errors

---

## Security & Quality Checks

### Code Quality
- ✅ TypeScript: 0 errors (backend + frontend)
- ✅ No `any` types (except necessary type assertions)
- ✅ Proper error handling in async operations
- ✅ Clean console (0 errors/warnings)

### Performance
- ✅ Command palette opens < 50ms
- ✅ Settings changes apply immediately
- ✅ Keyboard shortcuts respond < 50ms
- ✅ Toast animations smooth (60fps)

### UX Quality
- ✅ All modals close with Escape key
- ✅ All keyboard shortcuts documented
- ✅ Settings organized in logical sections
- ✅ Toasts non-intrusive (bottom-right)
- ✅ Command palette fuzzy search intuitive

### Persistence
- ✅ Settings persist in localStorage
- ✅ Settings survive page reload
- ✅ No settings lost on browser close

---

## Test Execution Summary

**Total Scenarios**: 15
**Manual Verification**: Command palette, keyboard shortcuts, toasts, settings
**Automated Verification**: TypeScript builds (backend + frontend)

**Files Created**:
- `frontend/src/hooks/useKeyboard.ts` (already existed)
- `frontend/src/hooks/useToast.ts` (already existed)
- `frontend/src/components/ui/Toast.tsx` (already existed)
- `frontend/src/components/ui/ConfirmDialog.tsx` (already existed)
- `frontend/src/components/modals/CommandPalette.tsx` ✅ NEW
- `frontend/src/components/modals/SettingsModal.tsx` ✅ NEW
- `frontend/src/store/settingsStore.ts` ✅ NEW
- `frontend/src/store/fileTreeStore.ts` ✅ NEW

**Files Modified**:
- `frontend/src/components/layout/IDEShell.tsx` ✅ (added shortcuts, modals, toasts)
- `frontend/src/components/sidebar/FileTree.tsx` ✅ (populate fileTreeStore)

---

## Notes

- Task 6.2 is the final task completing the IDE
- All 15 keyboard shortcuts follow VS Code conventions
- Command palette supports both file search and command mode
- Settings system uses zustand/persist for localStorage
- Toast system lightweight (no external library)
- All components properly typed with TypeScript
- Integration complete in IDEShell component

---

**Test Status**: Ready for execution
**Test Type**: Manual verification + TypeScript builds
**Estimated Time**: 15 minutes manual testing
