interface ModalProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  hideDefaultButtons?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  children,
  hideDefaultButtons = false,
}) => {
  if (!open) return null;

  const showDefaultButtons = !hideDefaultButtons && (onConfirm || !children);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 rounded-lg max-w-lg w-full p-6 text-white">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {message && <p className="text-sm text-gray-300 mb-4">{message}</p>}
        {children && <div className={showDefaultButtons ? "mb-4" : ""}>{children}</div>}
        
        {showDefaultButtons && (
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
