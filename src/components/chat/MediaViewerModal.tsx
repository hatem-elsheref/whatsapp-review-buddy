import { useEffect } from 'react';
import { X } from 'lucide-react';

type MediaViewerModalProps = {
  open: boolean;
  title?: string;
  url: string | null;
  mimeType?: string | null;
  onClose: () => void;
};

const MediaViewerModal = ({ open, title, url, mimeType, onClose }: MediaViewerModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isImage = Boolean(mimeType?.startsWith('image/'));
  const isVideo = Boolean(mimeType?.startsWith('video/'));
  const isAudio = Boolean(mimeType?.startsWith('audio/'));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Media viewer'}
    >
      <div
        className="w-full max-w-4xl bg-card border border-border rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="text-sm font-medium truncate">{title || 'Attachment'}</div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-muted" aria-label="Close">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 bg-black/5">
          {!url ? (
            <div className="text-sm text-muted-foreground">No media loaded.</div>
          ) : isImage ? (
            <img src={url} alt={title || 'attachment'} className="max-h-[70vh] w-auto mx-auto rounded-lg" />
          ) : isVideo ? (
            <video src={url} controls className="max-h-[70vh] w-full rounded-lg bg-black" />
          ) : isAudio ? (
            <audio src={url} controls className="w-full" />
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">This file type cannot be previewed here.</div>
              <a
                href={url}
                download
                className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Download
              </a>
            </div>
          )}
        </div>

        {url ? (
          <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
            <a
              href={url}
              download
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted"
            >
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MediaViewerModal;

