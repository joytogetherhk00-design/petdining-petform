import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DragDropUpload({
  value,
  onChange,
  accept = 'image/*',
  label = '拖放或點擊上傳',
  hint,
  className,
  preview = true,
  maxSizeMB = 10,
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
  const isPDF = (url) => url && /\.pdf(\?|$)/i.test(url);

  const uploadFile = useCallback(async (file) => {
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`檔案大小不能超過 ${maxSizeMB}MB`);
      return;
    }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
    toast.success('上傳成功');
  }, [onChange, maxSizeMB]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={cn('relative', className)}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all',
          dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30',
          uploading && 'pointer-events-none opacity-70'
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">上傳中...</p>
          </div>
        ) : value ? (
          <div className="relative">
            {preview && isImage(value) ? (
              <img src={value} alt="preview" className="max-h-32 mx-auto rounded-lg object-contain" />
            ) : isPDF(value) ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-3">
                <Upload className="h-5 w-5" />
                <span>PDF 已上傳</span>
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline" onClick={e => e.stopPropagation()}>預覽</a>
              </div>
            ) : (
              <p className="text-sm text-primary underline truncate">{value}</p>
            )}
            <button
              onClick={clear}
              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload className={cn('h-8 w-8 transition-colors', dragging ? 'text-primary' : 'text-muted-foreground')} />
            <p className="text-sm font-medium">{label}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}