interface ModalProps {
  open: boolean;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  hideDefaultButtons?: boolean;
  centerTitle?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  children,
  hideDefaultButtons = false,
  centerTitle = false,
}) => {
  if (!open) return null;

  const showDefaultButtons = !hideDefaultButtons && (onConfirm || !children);

  return (
    <div
      // allow vertical scrolling on small screens and align to top on small devices
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : "Dialog"}
    >
      {/* constrain modal height and make inner content scrollable */}
      <div className="bg-gray-800 rounded-lg max-w-lg w-full p-6 text-white shadow-lg max-h-[85vh] overflow-hidden">
        <div className="relative mb-4">
          {centerTitle ? (
            <>
              {title && (
                <h3 className="text-lg font-semibold text-center">{title}</h3>
              )}
              <button
                onClick={onCancel}
                aria-label="Close"
                className="absolute right-0 top-0 text-gray-400 hover:text-white"
              >
                ✕
              </button>
              {message && (
                <p className="text-sm text-gray-300 mt-2 text-center">{message}</p>
              )}
            </>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
                {message && <p className="text-sm text-gray-300 mb-4">{message}</p>}
              </div>
              <button
                onClick={onCancel}
                aria-label="Close"
                className="ml-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* modal content: scrollable area */}
        {children && (
          <div className={`modal-body ${showDefaultButtons ? "mb-4" : ""}`}>
            {children}
          </div>
        )}

        {showDefaultButtons && (
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                onClick={onConfirm}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
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
