# Regression Checklist

## Scope
- LineFactory Editor core flow
- Supabase connect/fallback
- Export outputs (SPEC/Preview/Print)

## 1. Base UI / Mode
- App loads without console errors.
- User mode is default; admin sections are hidden.
- Switching `사용자 모드` <-> `관리자 모드` updates visible panels correctly.

## 2. Supabase Connection UX
- With valid `Project URL / Anon Key / Bucket`, `연결/갱신` shows success alert and status `SUPABASE`.
- With invalid URL format, failure alert includes concrete reason and status remains `LOCAL`.
- With wrong key or blocked table policy, failure alert includes detailed error and fallback to `LOCAL`.
- Failed connection performs retry automatically (up to 2 attempts).
- After fallback to `LOCAL`, template/asset list still renders from local storage.

## 3. Template Admin
- Add template with valid values appears in both user selector and admin list.
- `사용` applies selected template geometry immediately.
- Deleting template works, but deleting the last template is blocked.

## 4. Asset Admin / Selection
- Admin image upload (valid image <= 12MB) is saved and listed.
- Uploaded asset can be selected in user asset list and appears on canvas.
- `이미지 선택 해제` clears selected source and hides image layer.
- Deleting selected admin image clears selection state safely.

## 5. Canvas Interaction
- Image drag, text drag, handle resize all update transform box correctly.
- `Shift` during image resize unlocks aspect lock behavior as designed.
- `Alt` during resize uses center-based scaling behavior.
- Ctrl/Cmd + wheel scales currently selected layer only.
- Align buttons stay disabled when no layer is selected.

## 6. Validation
- Missing required inputs (order type / make type / qty / image) block export.
- Safe 영역 침범 warning appears when image/text goes outside safe box.
- Small image warning appears when file size is very low (< 250KB).

## 7. Export Quality / Robustness
- `SPEC` download always generates valid JSON.
- `PREVIEW.jpg` exports with visible image smoothing and readable text box.
- `PRINT.png` exports at template DPI pixel size.
- If blob generation fails, user sees explicit error alert (no silent failure).
- `생산파일 생성` handles warning confirm and reports failures clearly.

## 8. Reset / Session
- `리셋` restores form values, image/text transforms, and validation state.
- New job ID is generated on load.
- Existing local template/asset data persists across reload.
