import * as React from "react";

type ToastActionElement = React.ReactNode;

export type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type State = {
  toasts: Toast[];
};

const TOAST_REMOVE_DELAY = 3000;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(state: State) {
  memoryState = state;
  listeners.forEach((listener) => listener(memoryState));
}

function addToast(toast: Omit<Toast, "id">) {
  const id = genId();
  const nextToast: Toast = {
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismiss(id);
    },
    ...toast,
  };

  dispatch({
    toasts: [nextToast, ...memoryState.toasts].slice(0, 5),
  });

  setTimeout(() => {
    dismiss(id);
  }, TOAST_REMOVE_DELAY);

  return id;
}

function dismiss(toastId?: string) {
  if (!toastId) {
    dispatch({ toasts: [] });
    return;
  }

  dispatch({
    toasts: memoryState.toasts.filter((toast) => toast.id !== toastId),
  });
}

export function toast(props: Omit<Toast, "id">) {
  return {
    id: addToast(props),
    dismiss: () => dismiss(),
  };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss,
  };
}