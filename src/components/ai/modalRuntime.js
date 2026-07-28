import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

let activeModalCount = 0;
let bodyLockSnapshot = null;

function getFocusableElements(container) {
  if (!container || typeof container.querySelectorAll !== 'function') return [];
  return [...container.querySelectorAll([
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(','))].filter(element => {
    if (typeof window === 'undefined') return true;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

function lockBodyScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
  activeModalCount += 1;
  if (activeModalCount === 1) {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    bodyLockSnapshot = {
      scrollY,
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width
    };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  }
  return () => {
    activeModalCount = Math.max(0, activeModalCount - 1);
    if (activeModalCount > 0 || !bodyLockSnapshot) return;
    document.body.style.overflow = bodyLockSnapshot.overflow;
    document.body.style.position = bodyLockSnapshot.position;
    document.body.style.top = bodyLockSnapshot.top;
    document.body.style.width = bodyLockSnapshot.width;
    window.scrollTo(0, bodyLockSnapshot.scrollY);
    bodyLockSnapshot = null;
  };
}

export function useModalRuntime({ open, modalRef, initialFocusRef, onClose }) {
  const restoreFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    restoreFocusRef.current = document.activeElement;
    const releaseScroll = lockBodyScroll();
    const timer = window.setTimeout(() => {
      const focusTarget = initialFocusRef?.current || modalRef?.current;
      focusTarget?.focus?.();
    }, 0);

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = getFocusableElements(modalRef?.current);
      if (!focusables.length) {
        event.preventDefault();
        modalRef?.current?.focus?.();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      releaseScroll();
      restoreFocusRef.current?.focus?.();
    };
  }, [open, modalRef, initialFocusRef]);
}

export function renderModalPortal(node) {
  if (typeof document === 'undefined' || !document.body) return node;
  return createPortal(node, document.body);
}

export const __TEST_ONLY__ = {
  getFocusableElements,
  lockBodyScroll,
  getActiveModalCount: () => activeModalCount,
  getBodyLockSnapshot: () => bodyLockSnapshot
};
