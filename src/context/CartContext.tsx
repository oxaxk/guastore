import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { calculateCart } from '@/lib/commerce';
import { MAX_CART_QUANTITY, MAX_CART_LINES, normalizeCartEntry, parseStoredCart } from '@/lib/cart-policy';

export interface CartItem {
  id: string;
  variantId: string;
  title: string;
  variantTitle: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  image: string;
  handle: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  stoneCount: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('gua-shop-cart');
      return parseStoredCart(stored);
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('gua-shop-cart', JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const { subtotal, shipping, total, stoneCount } = calculateCart(items);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const normalized = normalizeCartEntry({ ...item, quantity });
    if (!normalized) return;
    setItems(prev => {
      const existing = prev.find(i => i.variantId === item.variantId);
      if (existing) {
        return prev.map(i =>
          i.variantId === item.variantId
            ? { ...i, ...normalized, quantity: Math.min(MAX_CART_QUANTITY, i.quantity + quantity) }
            : i
        );
      }
      return prev.length < MAX_CART_LINES ? [...prev, normalized] : prev;
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems(prev => prev.filter(item => item.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity > MAX_CART_QUANTITY) return;
    if (quantity < 1) {
      removeItem(variantId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.variantId === variantId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        itemCount,
        subtotal,
        shipping,
        total,
        stoneCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
