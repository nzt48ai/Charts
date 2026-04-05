import { useEffect } from 'react';

function isEditableTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  if (target.closest('[contenteditable="true"]')) {
    return true;
  }

  const tagName = target.tagName?.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export function useDrawingKeyboardShortcuts({ onDelete, onUndo, onRedo, onCancelTool }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const isAccel = event.metaKey || event.ctrlKey;

      if (key === 'escape') {
        event.preventDefault();
        onCancelTool?.();
        return;
      }

      if (!isAccel) {
        if (key === 'delete' || key === 'backspace') {
          event.preventDefault();
          onDelete?.();
        }
        return;
      }

      if (key === 'z' && event.shiftKey) {
        event.preventDefault();
        onRedo?.();
        return;
      }

      if (key === 'z') {
        event.preventDefault();
        onUndo?.();
        return;
      }

      if (key === 'y') {
        event.preventDefault();
        onRedo?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancelTool, onDelete, onRedo, onUndo]);
}
