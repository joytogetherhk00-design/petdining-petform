import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import ProductCard from '@/components/customer/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { addToCart } from '@/lib/cartStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ORIGINS } from '@/components/shared/OriginBadge';
import { MEAT_TYPES } from '@/components/shared/MeatBadge';
import ProductDetailDrawer from '@/components/customer/ProductDetailDrawer';

export default function ProductCatalog() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeOrigin, setActiveOrigin] = useState('all');
  const [activeMeat, setActiveMeat] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const all = await base44.entities.Products.list();
      // 只顯示 active 且 is_visible 為 true 的產品
      return all.filter(p => p.status === 'active' && p.is_visible !== false);
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Categories.list(),
  });

  const filtered = products.filter(p => {
    if (p.is_visible === false) return false;
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchOrigin = activeOrigin === 'all' || p.country_of_origin === activeOrigin;
    const matchMeat = activeMeat === 'all' || p.meat_type === activeMeat;
    return matchSearch && matchCat && matchOrigin && matchMeat;
  });

  const handleAdd = (product) => {
    addToCart(product);
    toast.success(`已加入 ${product.name}`);
  };

  return (
    <div>
      <PageHeader title="產品目錄" description="瀏覽我們的批發寵物產品" />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋產品名稱或編號..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <Button variant={activeCategory === 'all' ? 'default' : 'outline'} size="sm"
          className={cn(activeCategory === 'all' && 'bg-primary')} onClick={() => setActiveCategory('all')}>
          全部
        </Button>
        {categories.map(cat => (
          <Button key={cat.id} variant={activeCategory === cat.name ? 'default' : 'outline'} size="sm"
            className={cn('whitespace-nowrap', activeCategory === cat.name && 'bg-primary')}
            onClick={() => setActiveCategory(cat.name)}>
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Origin filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <Button variant={activeOrigin === 'all' ? 'default' : 'outline'} size="sm"
          className={cn('text-xs', activeOrigin === 'all' ? 'bg-primary' : '')} onClick={() => setActiveOrigin('all')}>
          全部產地
        </Button>
        {ORIGINS.map(o => (
          <Button key={o} variant={activeOrigin === o ? 'default' : 'outline'} size="sm"
            className={cn('whitespace-nowrap text-xs', activeOrigin === o && 'bg-primary')}
            onClick={() => setActiveOrigin(o)}>
            {o}
          </Button>
        ))}
      </div>

      {/* Meat filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        <Button variant={activeMeat === 'all' ? 'default' : 'outline'} size="sm"
          className={cn('text-xs', activeMeat === 'all' ? 'bg-primary' : '')} onClick={() => setActiveMeat('all')}>
          全部肉類
        </Button>
        {MEAT_TYPES.map(m => (
          <Button key={m.value} variant={activeMeat === m.value ? 'default' : 'outline'} size="sm"
            className={cn('whitespace-nowrap text-xs', activeMeat === m.value && 'bg-primary')}
            onClick={() => setActiveMeat(m.value)}>
            {m.label}
          </Button>
        ))}
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Filter className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>沒有找到產品</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAdd} onViewDetail={() => setSelectedProduct(product)} />
          ))}
        </div>
      )}
      <ProductDetailDrawer
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAdd}
      />
    </div>
  );
}