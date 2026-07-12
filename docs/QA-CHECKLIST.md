# Jannati AI Tutor v2.0 Beta — QA Checklist

## Scope

- Production hardening
- Lazy loading
- Error boundary
- Accessibility checks
- Asset review

## Test Checklist

- [ ] Home dashboard loads correctly
- [ ] Quiz screen loads correctly
- [ ] Finish screen loads correctly
- [ ] Parent dashboard opens correctly
- [ ] Revision dashboard opens correctly
- [ ] AI explain modal opens correctly
- [ ] AI teacher modal opens correctly
- [ ] Voice button hides on unsupported browsers
- [ ] Error boundary shows friendly Malay fallback
- [ ] Keyboard navigation works for buttons and inputs
- [ ] Focus ring remains visible
- [ ] No broken image paths
- [ ] Build passes

## Known Limitations

- Some bundled chunks may still be large on first load.
- Browser voice support depends on the user agent.

## Deployment Checklist

- [ ] Run production build
- [ ] Verify critical screens in browser
- [ ] Verify error boundary fallback copy
- [ ] Verify accessibility labels
- [ ] Verify optimized mascot asset loads
