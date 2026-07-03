import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import OriginBadge from '@/components/shared/OriginBadge';
import MeatBadge from '@/components/shared/MeatBadge';

export default function ProductDetailDrawer({ product, open, onClose, onAddToCart, showPrice = true }) {
  const [activeImg, setActiveImg] = useState(0);

  if (!product) return null;

  const images = [product.image1, product.image2, product.image3].filter(Boolean);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left text-base">{product.name}</SheetTitle>
        </SheetHeader>

        {/* Images */}
        {images.length > 0 ? (
          <div className="mb-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-2">
              <img src={images[activeImg]} alt={product.name} className="w-full h-full object-contain" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary' : 'border-transparent'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
            暫無圖片
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className="bg-primary text-primary-foreground">{product.category}</Badge>
          {product.meat_type && <MeatBadge meatType={product.meat_type} />}
          {product.country_of_origin && <OriginBadge origin={product.country_of_origin} />}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-xl">
          <div>
            {showPrice ? (
              <p className="text-2xl font-bold text-primary">HK${product.wholesale_price}</p>
            ) : (
              <p className="text-base text-muted-foreground italic">登入查看價格</p>
            )}
            <p className="text-xs text-muted-foreground">最低 {product.min_order || 1} {product.unit || '件'}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {product.net_weight && <p>淨重：{product.net_weight}</p>}
            {product.sku && <p className="text-xs font-mono">SKU: {product.sku}</p>}
          </div>
        </div>

        {/* Stock */}
        {product.stock === 0 ? (
          <p className="text-sm text-destructive mb-3 font-medium">⚠️ 缺貨</p>
        ) : product.stock <= 5 ? (
          <p className="text-sm text-secondary mb-3 font-medium">僅剩 {product.stock} 件</p>
        ) : null}

        {/* Description */}
        {product.description && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-1">產品描述</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
          </div>
        )}

        {/* Nutrition */}
        {product.nutrition_info && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-1">營養資料</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{product.nutrition_info}</p>
          </div>
        )}

        {/* Add to cart */}
        {showPrice && (
          <Button
            className="w-full bg-primary hover:bg-primary/90 mt-2"
            size="lg"
            disabled={product.stock === 0}
            onClick={() => { onAddToCart(product); onClose(); }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            加入購物車
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}