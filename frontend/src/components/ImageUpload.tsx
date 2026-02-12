import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
  previewSize?: 'sm' | 'md' | 'lg';
}

export function ImageUpload({ value, onChange, label, hint, previewSize = 'md' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const sizeClass = previewSize === 'sm' ? 'w-8 h-8' : previewSize === 'lg' ? 'w-64 h-auto' : 'w-16 h-16';

  const handleUpload = async (file: File) => {
    setError('');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload<{ url: string }>('/uploads', formData);
      onChange(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleUpload(file);
  };

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div
        className="mt-1 border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif,image/x-icon"
          onChange={handleFileChange}
          className="hidden"
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Mengupload...</span>
          </div>
        ) : value ? (
          <div className="flex items-center gap-3 justify-center">
            <img
              src={value}
              alt="Preview"
              className={`${sizeClass} object-contain rounded`}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="text-left">
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{value.split('/').pop()}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(''); }}
                className="text-xs text-destructive hover:underline mt-1 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Hapus
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Klik atau drag & drop gambar</span>
            <span className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP (maks 5MB)</span>
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
