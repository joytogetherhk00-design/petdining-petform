import React, { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ImageUploadRow({ field, label, value, uploading, onUpload }) {
  const inputRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file, field);
      // reset so same file can be re-selected
      e.target.value = '';
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 items-center mt-1">
        <button
          type="button"
          disabled={uploading}
          onMouseDown={e => e.preventDefault()}
          onClick={handleClick}
          className={`flex-1 flex items-center justify-center gap-2 h-9 px-3 rounded-md border text-sm transition-colors disabled:opacity-50 cursor-pointer ${
            value
              ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
              : 'border-input bg-transparent hover:bg-muted text-muted-foreground'
          }`}
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />上傳中...</>
          ) : value ? (
            <><CheckCircle2 className="h-4 w-4" />已上傳 ✓ (點擊更換)</>
          ) : (
            <>點擊選擇圖片</>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0 }}
          onChange={handleChange}
        />
        {value && (
          <img src={value} alt="" className="w-10 h-10 rounded object-cover shrink-0 border" />
        )}
      </div>
    </div>
  );
}