# Components

Framework: React 19 with Vite 8. Styling is a mix of Tailwind utility classes on marketing components and inline style objects on ERP dashboard components. Shared UI primitives live in `frontend/src/components/ui.jsx`.

## `frontend/src/components/ui.jsx`

Shared ERP dashboard primitives: `PageHeader`, `Card`, `CardHeader`, `StatCard`, `Badge`, `BtnPrimary`, `BtnOutline`, `BtnSm`, `Tabs`, `DataTable`, `EmptyState`, `Modal`, `FormGroup`, `FormGrid`, `Input`, `Select`, `Textarea`, `SectionTitle`.

Key props:
- Most dashboard primitives receive `t`, the active theme object from `Dashboard.jsx`.
- Buttons accept `onClick`, `disabled`, and optional `style`.
- Tables receive `columns`, `rows`, `emptyMsg`, and `t`.
- Modal receives `open`, `onClose`, `title`, `children`, `footer`, `t`, and `wide`.

Source notes:
- Brand colors are duplicated in this file as `BRAND`.
- Buttons and cards use inline CSS, not a component library.
- `DataTable` renders empty states unless rows are passed; current frontend modules rarely pass rows.

```jsx
// Full source lives at frontend/src/components/ui.jsx.
// Include this file as context for dashboard design work.
```

## Marketing Components

Marketing/landing components exist but are not currently routed in `App.jsx`:
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/Hero.jsx`
- `frontend/src/components/Solutions.jsx`
- `frontend/src/components/WhyCeritage.jsx`
- `frontend/src/components/CTA.jsx`
- `frontend/src/components/Footer.jsx`

```jsx
// Full source lives in frontend/src/components/*.jsx.
// Include the specific component files when redesigning public marketing pages.
```
