# Custom Mockup Studio Plan

## 1) Route Screens
- User:
  - `#/` Home
  - `#/products` Product List
  - `#/products/:id` Product Detail
  - `#/editor/:productId` Canvas Editor
  - `#/my-submissions` My Submissions
- Admin:
  - `#/admin/login`
  - `#/admin/products`
  - `#/admin/products/new`
  - `#/admin/products/:id/edit`
  - `#/admin/templates`
  - `#/admin/options`
  - `#/admin/inbox`
  - `#/admin/inbox/:submissionId`

## 2) Component Breakdown
- `ProductCard`
  - props: `product`, `onViewDetail`, `onCustomize`
- `MockupGallery`
  - props: `views[]`, `activeView`, `onChangeView`
- `OptionSelector`
  - props: `groupName`, `values[]`, `selectedValue`, `onSelect`
- `CanvasEditor`
  - props: `product`, `templatesByView`
  - children:
    - `LayerPanel`
    - `TransformToolbar`
    - `GuideOverlay` (safe/bleed/center)
    - `EditorSummarySticky`
- `LayerPanel`
  - reorder, lock/hide, opacity, blend mode
- `ExportModal`
  - preview, production file list, contact inputs, submit
- `AdminProductForm`
  - base info, mockups, publish
- `TemplateEditor`
  - view mapping, printArea, outputSize, dpi, safe/bleed, mask
- `InboxTable`
  - date/product/customer/status/actions
- `SubmissionDetail`
  - preview, assets download, notes, status workflow

## 3) State Management Plan
- UI Route State:
  - `currentRoute`, `routeParams`
- Catalog State:
  - `products[]`, `activeProduct`
  - `optionGroupsByProduct`
  - `templatesByProductView`
- Editor State:
  - `activeView`
  - `layers[]` (type, transform, opacity, lock/hide)
  - `selectedLayerId`
  - `showGuides` (safe/bleed/center)
  - `draft` (autosave snapshot)
  - `validationWarnings[]` (DPI, out-of-bounds)
- Pricing State:
  - `selectedOptions`
  - `basePrice`, `priceDelta`, `totalPrice`
- Submission State:
  - `customerInfo`, `notes`
  - `previewAssets[]`, `productionAssets[]`, `originalAssets[]`
  - `submitStatus`
- Admin State:
  - `adminSession`
  - `productFormDraft`
  - `templateFormDraft`
  - `optionFormDraft`
  - `inboxFilters`, `inboxItems`, `submissionDetail`

## 4) API Endpoints (High-level)
- Auth:
  - `POST /api/admin/login`
  - `POST /api/admin/logout`
  - `GET /api/admin/session`
- Product / Mockup:
  - `GET /api/products`
  - `GET /api/products/:id`
  - `POST /api/admin/products`
  - `PATCH /api/admin/products/:id`
  - `DELETE /api/admin/products/:id`
  - `POST /api/admin/products/:id/mockups`
- Template:
  - `GET /api/products/:id/templates`
  - `POST /api/admin/templates`
  - `PATCH /api/admin/templates/:id`
  - `DELETE /api/admin/templates/:id`
- Options / Pricing:
  - `GET /api/products/:id/options`
  - `POST /api/admin/options/groups`
  - `POST /api/admin/options/values`
  - `PATCH /api/admin/options/values/:id`
  - `DELETE /api/admin/options/values/:id`
- Asset Upload / Export:
  - `POST /api/uploads/original`
  - `POST /api/editor/export/preview`
  - `POST /api/editor/export/production`
  - `POST /api/editor/export/pdf` (optional)
- Submission / Inbox:
  - `POST /api/submissions`
  - `GET /api/my/submissions`
  - `GET /api/admin/inbox`
  - `GET /api/admin/inbox/:submissionId`
  - `PATCH /api/admin/inbox/:submissionId/status`
  - `PATCH /api/admin/inbox/:submissionId/notes`

## 5) Submission Payload (example)
```json
{
  "productId": "mtm_interlock",
  "selectedOptions": {
    "size": "M",
    "color": "Melange",
    "material": "Premium"
  },
  "price": {
    "base": 15900,
    "delta": 4000,
    "total": 19900
  },
  "customerInfo": {
    "name": "홍길동",
    "email": "hong@example.com",
    "phone": "010-0000-0000"
  },
  "notes": "앞면은 중앙, 뒷면은 상단 배치",
  "assets": [
    { "type": "preview", "viewName": "Front", "url": "..." },
    { "type": "production", "viewName": "Front", "url": "..." },
    { "type": "original", "viewName": "Front", "url": "..." }
  ]
}
```

