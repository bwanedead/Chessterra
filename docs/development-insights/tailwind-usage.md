# Tailwind Usage Guidelines

To keep the Tailwind build predictable (and stop chasing missing utilities), follow these guidelines whenever you add or update UI code:

## 1. Prefer literal utility strings

Write utilities as plain strings that Tailwind can see at build time:

```tsx
<div className="py-8 pb-24" />
```

Avoid building class names with template literals, string concatenation, or values that only exist at runtime. If a value must be dynamic, map it to a finite list of literal classes:

```tsx
const paddingClass = size === 'lg' ? 'pb-24' : 'pb-12';
return <div className={paddingClass} />;
```

If you need an arbitrary value that cannot be enumerated, use an inline style instead of a synthetic class.

## 2. Inline styles only when a utility cannot express the layout

Inline styles are the highest priority in the cascade. Use them sparingly for data-driven values (e.g., values computed in pixels or percentages). Do not mix a Tailwind utility and an inline style for the same property unless you explicitly want the inline version to win.

## 3. Safelist rare dynamic utilities

When a dynamic utility is unavoidable (for example, `max-h-[280px]` used in multiple contexts), add it to the Tailwind safelist in `tailwind.config.ts`. The safelist doesn’t override anything; it simply tells Tailwind to keep the rule even if it can’t see a literal reference in source code.

```ts
safelist: ['pb-24', 'max-h-[280px]'];
```

## 4. Keep the `content` glob accurate

Tailwind only scans the paths listed in `tailwind.config.ts`. When you add a new top-level directory for components, update the `content` array so Tailwind can see utilities referenced in that folder.

## 5. Document intentional exceptions

If you intentionally use an inline style or a safelisted class for a layout edge case, leave a comment so the next contributor knows it is deliberate. This prevents future “cleanup” work from accidentally reintroducing the missing-utility problem.

By sticking to these patterns, utilities will be stable across features and the build artefacts will match what you expect locally.
