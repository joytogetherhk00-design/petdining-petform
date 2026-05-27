import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import OriginBadge from '@/components/shared/OriginBadge';
import MeatBadge from '@/components/shared/MeatBadge';

export default function ProductCard({ product, onAddToCart, onViewDetail }) {
  const images = [product.image1, product.image2, product.image3].filter(Boolean);
  const [activeImg, setActiveImg] = useState(0);
  const [imgError, setImgError] = useState(false);

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <div className="relative bg-muted overflow-hidden cursor-pointer flex items-center justify-center" style={{height: '200px'}} onClick={onViewDetail}>
        {images.length > 0 && !imgError ? (
          <img
            src={images[activeImg]}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ImageOff className="h-8 w-8 opacity-40" />
            <span className="text-xs">暫無圖片</span>
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-white scale-125' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
          {product.category}
        </Badge>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 cursor-pointer hover:text-primary transition-colors" onClick={onViewDetail}>{product.name}</h3>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {product.meat_type && <MeatBadge meatType={product.meat_type} />}
          {product.country_of_origin
            ? <OriginBadge origin={product.country_of_origin} />
            : <span className="text-xs text-muted-foreground">未標示</span>}
        </div>

        <div className="flex items-end justify-between mt-3">
          <div>
            <p className="text-lg font-bold text-primary">HK${product.wholesale_price}</p>
            <p className="text-xs text-muted-foreground">最低 {product.min_order || 1} {product.unit || '件'}</p>
          </div>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            加入
          </Button>
        </div>

        {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
          <p className="text-xs text-secondary mt-2">僅剩 {product.stock} 件</p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-destructive mt-2">缺貨</p>
        )}
      </div>
    </Card>
  );
}