import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import { AppDialogContext } from "./appDialogContext";

import { AlertDialog } from "../components/AlertDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";

export interface AlertOptions {
  title: string;
  message?: string;
  buttonText?: string;
  variant?: "danger" | "standard" | "warning";
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "standard";
  checkboxLabel?: string;
  checkboxDefaultChecked?: boolean;
}

export interface ConfirmResult {
  confirmed: boolean;
  checkboxChecked?: boolean;
}

export interface AppDialogContextValue {
  showAlert: (options: AlertOptions) => Promise<void>;
  showConfirm: (options: ConfirmOptions) => Promise<ConfirmResult>;
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const alertResolveRef = useRef<(() => void) | null>(null);
  const confirmResolveRef = useRef<((result: ConfirmResult) => void) | null>(null);

  const closeAlert = useCallback(() => {
    setAlertOptions(null);
    const resolve = alertResolveRef.current;
    alertResolveRef.current = null;
    resolve?.();
  }, []);

  const closeConfirm = useCallback((result: ConfirmResult) => {
    setConfirmOptions(null);
    const resolve = confirmResolveRef.current;
    confirmResolveRef.current = null;
    resolve?.(result);
  }, []);

  const showAlert = useCallback((options: AlertOptions) => {
    if (alertResolveRef.current) {
      alertResolveRef.current();
      alertResolveRef.current = null;
    }

    setAlertOptions(options);

    return new Promise<void>((resolve) => {
      alertResolveRef.current = resolve;
    });
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current({ confirmed: false });
      confirmResolveRef.current = null;
    }

    setConfirmOptions(options);

    return new Promise<ConfirmResult>((resolve) => {
      confirmResolveRef.current = resolve;
    });
  }, []);

  const value = useMemo(
    () => ({
      showAlert,
      showConfirm,
    }),
    [showAlert, showConfirm]
  );

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      <AlertDialog
        isOpen={alertOptions !== null}
        title={alertOptions?.title ?? ""}
        message={alertOptions?.message}
        buttonText={alertOptions?.buttonText}
        variant={alertOptions?.variant}
        onClose={closeAlert}
      />
      <ConfirmDialog
        isOpen={confirmOptions !== null}
        title={confirmOptions?.title ?? ""}
        message={confirmOptions?.message}
        confirmText={confirmOptions?.confirmText}
        cancelText={confirmOptions?.cancelText}
        variant={confirmOptions?.variant}
        checkboxLabel={confirmOptions?.checkboxLabel}
        checkboxDefaultChecked={confirmOptions?.checkboxDefaultChecked}
        onConfirm={(checkboxChecked) => closeConfirm({ confirmed: true, checkboxChecked })}
        onCancel={() => closeConfirm({ confirmed: false })}
      />
    </AppDialogContext.Provider>
  );
}
