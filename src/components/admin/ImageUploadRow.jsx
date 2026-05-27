import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ImageUploadRow({ field, label, value, uploading, onUpload }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 items-center mt-1">
        <label
          htmlFor={`img-upload-${field}`}
          className={`flex-1 flex items-center justify-center gap-2 h-9 px-3 rounded-md border text-sm transition-colors select-none ${
            uploading
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer ' + (value
                  ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
                  : 'border-input bg-transparent hover:bg-muted text-muted-foreground')
          }`}
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />上傳中...</>
          ) : value ? (
            <><CheckCircle2 className="h-4 w-4" />已上傳 ✓ (點擊更換)</>
          ) : (
            <>點擊選擇圖片</>
          )}
          <input
            id={`img-upload-${field}`}
            type="file"
            accept="image/*"
            disabled={uploading}
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(file, field);
              }
            }}
          />
        </label>
        {value && (
          <img src={value} alt="" className="w-10 h-10 rounded object-cover shrink-0 border" />
        )}
      </div>
    </div>
  );
}