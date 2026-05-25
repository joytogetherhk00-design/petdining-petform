import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Minus, AlertCircle, ShoppingCart } from 'lucide-react';
import { getCart, saveCart, removeFromCart, clearCart, getCartTotal, getCartItemCount } from '@/lib/cartStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const [items, setItems] = useState(getCart());
  const [notes, setNotes] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = () => setItems(getCart());
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, []);

  const { data: customer } = useQuery({
    queryKey: ['myCustomer'],
    queryFn: async () => {
      const me = await base44.auth.me();
      const customers = await base44.entities.Customers.filter({ user_email: me.email });
      return customers[0] || null;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const s = await base44.entities.AppSettings.list();
      return s[0] || {};
    },
  });

  const total = getCartTotal(items);
  const itemCount = getCartItemCount(items);
  const minAmount = settings?.min_order_amount || 500;
  const creditsBalance = customer?.credits_balance || 0;
  const canOrder = total >= minAmount && itemCount >= 5 && creditsBalance >= total;

  const updateQty = (sku, delta) => {
    const newItems = items.map(i => {
      if (i.sku === sku) {
        const newQty = Math.max(i.min_order || 1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    });
    saveCart(newItems);
    setItems(newItems);
  };

  const handleRemove = (sku) => {
    const newItems = removeFromCart(sku);
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!customer) {
      toast.error('請先完成帳戶設定');
      return;
    }
    setSubmitting(true);

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const orders = await base44.entities.Orders.filter({ customer_id: customer.customer_id });
    const orderNum = `${customer.customer_id}${String(orders.length + 1).padStart(2, '0')}${month}${year}`;

    const order = await base44.entities.Orders.create({
      customer_id: customer.customer_id,
      order_date: now.toISOString(),
      status: 'pending',
      subtotal: total,
      credits_used: total,
      total: total,
      notes: notes,
      order_number: orderNum,
      delivery_address: selectedAddress || customer.delivery_address,
      user_email: customer.user_email,
    });

    for (const item of items) {
      await base44.entities.OrderItems.create({
        order_id: order.id,
        sku: item.sku,
        product_name: item.product_name,
        qty: item.qty,
        price: item.price,
        subtotal: item.price * item.qty,
      });
    }

    await base44.entities.Customers.update(customer.id, {
      credits_balance: creditsBalance - total,
    });

    await base44.entities.CreditsLog.create({
      customer_id: customer.customer_id,
      month: `${now.getFullYear()}-${month}`,
      used: total,
      type: 'usage',
      status: 'active',
    });

    clearCart();
    setItems([]);
    queryClient.invalidateQueries({ queryKey: ['myCustomer'] });
    toast.success('訂單已提交！');
    setSubmitting(false);
    navigate('/orders');
  };

  const addresses = [
    customer?.delivery_address,
    ...(customer?.multiple_addresses || [])
  ].filter(Boolean);

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="購物車" />
        <div className="text-center py-20">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">購物車是空的</p>
          <Button className="mt-4 bg-primary" onClick={() => navigate('/')}>瀏覽產品</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="購物車" description={`共 ${items.length} 項產品`} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <Card key={item.sku} className="p-4 flex gap-4">
              {item.image && (
                <img src={item.image} alt={item.product_name} className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{item.product_name}</h3>
                <p className="text-sm text-primary font-semibold">HK${item.price}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.sku, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">{item.qty}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.sku, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => handleRemove(item.sku)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <p className="font-semibold text-sm">HK${(item.price * item.qty).toLocaleString()}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">訂單摘要</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>小計</span><span>HK${total.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>產品數量</span><span>{itemCount} 件</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>總計</span><span className="text-primary">HK${total.toLocaleString()}</span>
              </div>
            </div>

            {customer && (
              <div className="text-sm p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">積分餘額：</span>
                <span className="font-semibold">{creditsBalance.toLocaleString()}</span>
              </div>
            )}

            {total < minAmount && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>最低訂單金額為 HK${minAmount}</span>
              </div>
            )}
            {itemCount < 5 && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>最低訂購 5 件產品</span>
              </div>
            )}
            {creditsBalance < total && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>積分不足</span>
                </div>
                <Button variant="outline" className="w-full border-secondary text-secondary" onClick={() => navigate('/account')}>
                  直接增值
                </Button>
              </div>
            )}

            {addresses.length > 0 && (
              <Select value={selectedAddress} onValueChange={setSelectedAddress}>
                <SelectTrigger><SelectValue placeholder="選擇送貨地址" /></SelectTrigger>
                <SelectContent>
                  {addresses.map((addr, i) => (
                    <SelectItem key={i} value={addr}>{addr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Textarea placeholder="訂單備註（可選）" value={notes} onChange={e => setNotes(e.target.value)} />

            <Button
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!canOrder || submitting}
              onClick={handleSubmit}
            >
              {submitting ? '提交中...' : '確認訂單'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}