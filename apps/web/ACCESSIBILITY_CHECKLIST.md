# Accessibility Testing Checklist

Use this checklist for every new feature or component added to the application.

---

## 🧪 Pre-Commit Checklist

### Semantic HTML
- [ ] Used correct HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- [ ] Headings are in logical order (h1 → h2 → h3)
- [ ] No skipped heading levels
- [ ] Form fields use `<label>` elements
- [ ] Lists use `<ul>`, `<ol>`, or `<dl>` appropriately

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible (Tab/Shift+Tab)
- [ ] Focus order matches visual order
- [ ] No keyboard traps
- [ ] Escape key closes modals/dropdowns
- [ ] Enter/Space activate buttons/links
- [ ] Arrow keys work in custom widgets (if applicable)

### Focus Management
- [ ] Focus indicators are visible and meet 3:1 contrast
- [ ] Focus moves logically through page
- [ ] Focus returns to trigger after closing overlay
- [ ] No `outline: none` without alternative indicator
- [ ] Uses `focus-visible` for appropriate elements

### ARIA Usage
- [ ] Used semantic HTML before ARIA
- [ ] ARIA roles are appropriate
- [ ] `aria-label` or `aria-labelledby` on interactive elements without text
- [ ] `aria-describedby` links help text to inputs
- [ ] `aria-expanded` on collapsible elements
- [ ] `aria-haspopup` on menu triggers
- [ ] `aria-current="page"` on current navigation item
- [ ] `aria-invalid` on fields with errors
- [ ] `aria-required` on required fields
- [ ] `aria-live` regions for dynamic content

### Text & Labels
- [ ] All form inputs have labels
- [ ] Link text is descriptive (no "click here")
- [ ] Button text describes action
- [ ] Required fields are marked (visually and programmatically)
- [ ] Error messages are clear and specific
- [ ] Icons have text alternatives or aria-labels

### Images & Media
- [ ] All meaningful images have alt text
- [ ] Decorative images have `alt=""` or `aria-hidden="true"`
- [ ] Complex images have detailed descriptions
- [ ] SVG icons have appropriate labels or are hidden
- [ ] No text in images (use real text instead)

### Color & Contrast
- [ ] Text contrast is at least 4.5:1 (or 3:1 for large text)
- [ ] UI components meet 3:1 contrast
- [ ] Color is not the only indicator (use icons/text too)
- [ ] Error states use more than just color
- [ ] Links are distinguishable from surrounding text

### Forms
- [ ] All inputs have associated labels
- [ ] Form validation provides helpful messages
- [ ] Error messages are linked to fields
- [ ] Success/error states announced to screen readers
- [ ] Forms can be submitted with Enter key
- [ ] Multi-step forms show progress

### Responsive & Zoom
- [ ] Content reflows at 320px width (no horizontal scroll)
- [ ] Text is readable at 200% zoom
- [ ] Touch targets are at least 44x44px
- [ ] Works in portrait and landscape
- [ ] No fixed positioning that blocks content

---

## 🔍 Manual Testing Procedures

### Keyboard-Only Test (5 minutes)
1. Disconnect your mouse
2. Use only Tab, Shift+Tab, Enter, Space, Escape, and Arrow keys
3. Navigate through entire page/feature
4. Can you:
   - [ ] Reach all interactive elements?
   - [ ] See where focus is at all times?
   - [ ] Activate all buttons and links?
   - [ ] Open and close menus/modals?
   - [ ] Submit forms?
   - [ ] Navigate without getting trapped?

### Screen Reader Test (10 minutes)

#### Using NVDA (Windows)
1. Install [NVDA](https://www.nvaccess.org/download/)
2. Press `Ctrl+Alt+N` to start NVDA
3. Navigate with:
   - `Down Arrow` - Next item
   - `Up Arrow` - Previous item
   - `H` - Next heading
   - `F` - Next form field
   - `K` - Next link
   - `Insert+F7` - List of elements

#### Using VoiceOver (macOS)
1. Press `Cmd+F5` to enable VoiceOver
2. Navigate with:
   - `Ctrl+Option+Right Arrow` - Next item
   - `Ctrl+Option+Left Arrow` - Previous item
   - `Ctrl+Option+Cmd+H` - Next heading
   - `Ctrl+Option+U` - Open rotor

#### What to Check:
- [ ] Page title is announced
- [ ] Landmarks are identified (navigation, main, etc.)
- [ ] Headings make sense in isolation
- [ ] Form labels are read before inputs
- [ ] Error messages are announced
- [ ] Button purposes are clear
- [ ] Link destinations are clear
- [ ] Images have appropriate descriptions
- [ ] Dynamic content updates are announced

### Color Contrast Test (2 minutes)
1. Use browser DevTools or [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
2. Check:
   - [ ] Body text on background: ≥ 4.5:1
   - [ ] Large text (18pt+) on background: ≥ 3:1
   - [ ] UI controls on background: ≥ 3:1
   - [ ] Focus indicators on background: ≥ 3:1

### Zoom Test (2 minutes)
1. Set browser zoom to 200% (Ctrl/Cmd + Plus)
2. Check:
   - [ ] No horizontal scrolling
   - [ ] All content is readable
   - [ ] No overlapping text
   - [ ] Interactive elements still usable
   - [ ] No content is cut off

### Mobile/Touch Test (5 minutes)
1. Test on actual mobile device or use DevTools device mode
2. Check:
   - [ ] All touch targets ≥ 44x44px
   - [ ] Sufficient spacing between interactive elements
   - [ ] No hover-only interactions
   - [ ] Gestures have alternatives
   - [ ] Works in portrait and landscape

---

## 🤖 Automated Testing

### Run Before Each Commit

```bash
# TypeScript compilation
pnpm typecheck

# Linting (includes accessibility rules)
pnpm lint

# Build test
pnpm build
```

### Browser DevTools

#### Lighthouse Audit
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Accessibility" category
4. Run audit
5. **Target Score: 95+**
6. Fix all flagged issues

#### axe DevTools
1. Install [axe DevTools Extension](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
2. Open DevTools > axe DevTools tab
3. Click "Scan ALL of my page"
4. **Target: 0 violations**
5. Fix all issues found

---

## 📋 Component-Specific Checklists

### New Form Component
- [ ] Every input has a label
- [ ] Labels use `htmlFor` matching input `id`
- [ ] Required fields marked with `required` attribute
- [ ] Error messages use `aria-describedby`
- [ ] Errors change `aria-invalid` to `"true"`
- [ ] Form can be submitted with Enter key
- [ ] Validation runs before submission
- [ ] Success/error states announced

### New Button Component
- [ ] Uses `<button>` element (not `<div>` or `<a>`)
- [ ] Has descriptive text or `aria-label`
- [ ] `type` attribute set (`button`, `submit`, or `reset`)
- [ ] Disabled state uses `disabled` attribute
- [ ] Focus indicator visible
- [ ] Sufficient contrast in all states

### New Link Component
- [ ] Uses `<a>` element with `href`
- [ ] Link text describes destination
- [ ] External links noted (visually or aria-label)
- [ ] Opens in same window unless user expects new window
- [ ] Sufficient contrast from surrounding text

### New Modal/Dialog Component
- [ ] Uses `role="dialog"` or `role="alertdialog"`
- [ ] Has `aria-labelledby` or `aria-label`
- [ ] Focus moves to modal when opened
- [ ] Focus trapped within modal
- [ ] Escape key closes modal
- [ ] Focus returns to trigger when closed
- [ ] Background content inert (aria-hidden or inert attribute)

### New Navigation Component
- [ ] Uses `<nav>` element
- [ ] Has descriptive `aria-label` if multiple navs
- [ ] Current page marked with `aria-current="page"`
- [ ] Keyboard accessible
- [ ] Consistent across pages

### New Data Table Component
- [ ] Uses `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`
- [ ] Column headers use `<th scope="col">`
- [ ] Row headers use `<th scope="row">` (if applicable)
- [ ] Has caption or `aria-label`
- [ ] Sortable columns have aria-sort
- [ ] Keyboard navigation for interactive cells

---

## 🐛 Common Accessibility Issues & Fixes

### Issue: Missing Form Labels
**❌ Bad:**
```tsx
<input type="email" placeholder="Enter email" />
```

**✅ Good:**
```tsx
<label htmlFor="email">Email Address</label>
<input id="email" type="email" placeholder="you@example.com" />
```

---

### Issue: Icon-Only Button
**❌ Bad:**
```tsx
<button><XIcon /></button>
```

**✅ Good:**
```tsx
<button aria-label="Close">
  <XIcon aria-hidden="true" />
</button>
```

---

### Issue: Non-Descriptive Link Text
**❌ Bad:**
```tsx
<a href="/docs">Click here</a>
```

**✅ Good:**
```tsx
<a href="/docs">Read documentation</a>
```

---

### Issue: Div/Span Button
**❌ Bad:**
```tsx
<div onClick={handleClick}>Submit</div>
```

**✅ Good:**
```tsx
<button onClick={handleClick}>Submit</button>
```

---

### Issue: No Keyboard Access
**❌ Bad:**
```tsx
<div onClick={handleClick}>Menu</div>
```

**✅ Good:**
```tsx
<button onClick={handleClick}>Menu</button>
// Native button is keyboard accessible
```

---

### Issue: Missing Alt Text
**❌ Bad:**
```tsx
<img src="logo.png" />
```

**✅ Good:**
```tsx
// Meaningful image
<img src="logo.png" alt="Invoice Flow logo" />

// Decorative image
<img src="decoration.png" alt="" aria-hidden="true" />
```

---

### Issue: Poor Color Contrast
**❌ Bad:**
```css
color: #999; /* Light gray on white = 2.8:1 */
```

**✅ Good:**
```css
color: #666; /* Dark gray on white = 5.7:1 */
```

---

### Issue: Keyboard Trap
**❌ Bad:**
```tsx
// Modal with no way to close via keyboard
<div className="modal">
  <button onClick={() => close()}>×</button>
</div>
```

**✅ Good:**
```tsx
// Modal closes with Escape key
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, []);
```

---

## 📊 Acceptance Criteria Template

For each user story, include:

```markdown
### Accessibility Acceptance Criteria

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Screen reader tested and announces correctly
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] Works at 200% zoom without horizontal scroll
- [ ] Touch targets are ≥ 44x44px on mobile
- [ ] All form inputs have labels
- [ ] Error states are announced to assistive tech
- [ ] No ARIA violations in axe DevTools
- [ ] Lighthouse accessibility score ≥ 95
```

---

## 🎯 Definition of Done

**A feature is not complete until:**

1. ✅ All automated tests pass (TypeScript, ESLint, build)
2. ✅ Lighthouse accessibility score ≥ 95
3. ✅ axe DevTools shows 0 violations
4. ✅ Keyboard navigation tested manually
5. ✅ Screen reader tested (NVDA or VoiceOver)
6. ✅ Color contrast checked and meets AA standards
7. ✅ Zoom to 200% tested
8. ✅ Mobile/touch tested
9. ✅ Accessibility checklist completed
10. ✅ Code review includes accessibility verification

---

## 📚 Quick Reference Links

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

## 💡 Pro Tips

1. **Test early and often** - Don't wait until the end
2. **Use semantic HTML first** - ARIA is a last resort
3. **Test with actual users** - Automated tools catch ~30-40% of issues
4. **Learn keyboard shortcuts** - Practice using your app without a mouse
5. **Use a screen reader regularly** - Even 5 minutes helps build intuition
6. **Think beyond visual** - How would this work if you couldn't see it?
7. **Document patterns** - Build a library of accessible components
8. **Make it a team effort** - Everyone is responsible for accessibility

---

*Remember: Accessibility is not a feature, it's a requirement. Build it in from the start.*
