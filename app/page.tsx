'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { HeroMain, HeroCollection } from '@/components/HeroBanner';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductDetailView } from '@/components/ProductDetailView';
import { CollectionView } from '@/components/CollectionView';
import { CartDrawer } from '@/components/CartDrawer';
import { InfoModal } from '@/components/InfoModal';
import { AccountModal } from '@/components/AccountModal';
import { Footer } from '@/components/Footer';
import { Category, Product, CartItem, User, ModalType } from '@/types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/lib/data';

type ViewMode = 'home' | 'product' | 'collection';

export default function HomePage() {
  // Routing State
  const [view, setView] = useState<ViewMode>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [collectionName, setCollectionName] = useState<string | null>(null);

  // Navigation & Category filter state
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Products state
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [allProducts, setAllProducts] = useState<Product[]>(INITIAL_PRODUCTS); // To find products by id easily
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cart state
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Modals & User Auth state
  const [infoModalType, setInfoModalType] = useState<ModalType>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // 1. Initial Load: Cart from localStorage, Logged User from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('chromewear_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      const savedUser = localStorage.getItem('chromewear_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Erro ao carregar dados locais:', e);
    }
  }, []);

  // Save Cart to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('chromewear_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Erro ao salvar sacola:', e);
    }
  }, [cartItems]);



  // Hash Routing Logic
  useEffect(() => {
    if (allProducts.length === 0) return;

    const handleHashRoute = () => {
      const hash = window.location.hash;
      const prodMatch = hash.match(/^#produto-(.+)$/);
      if (prodMatch) {
        const id = prodMatch[1];
        const found = allProducts.find((p) => p.id.toString() === id);
        if (found) {
          setSelectedProduct(found);
          setView('product');
          window.scrollTo(0, 0);
          return;
        }
      }

      const colMatch = hash.match(/^#colecao-(.+)$/);
      if (colMatch) {
        const slug = colMatch[1];
        const names = Array.from(new Set(allProducts.map((p) => p.collection).filter(Boolean))) as string[];
        const found = names.find(
          (n) =>
            n
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '') === slug
        );
        if (found) {
          setCollectionName(found);
          setView('collection');
          window.scrollTo(0, 0);
          return;
        }
      }

      setView('home');
    };

    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);
    return () => window.removeEventListener('hashchange', handleHashRoute);
  }, [allProducts]);

  // Apply filters for home grid
  useEffect(() => {
    let filtered = allProducts;
    if (activeCategory) {
      filtered = filtered.filter((p) => (p.categoryName || p.cat) === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sub && p.sub.toLowerCase().includes(q)) ||
          (p.categoryName || p.cat || '').toLowerCase().includes(q)
      );
    }
    setProducts(filtered);
  }, [activeCategory, searchQuery, allProducts]);

  // Cart Handler Functions
  const handleAddToCart = (product: Product, size: string, quantity: number = 1) => {
    const itemId = `${product.id}-${size}`;
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === itemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prevItems,
          {
            id: itemId,
            productId: product.id,
            numId: product.numId || 0,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            size,
            quantity,
            ref: product.ref || '01/25',
          },
        ];
      }
    });
    setCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const navigateHome = () => {
    window.location.hash = '';
  };

  const openProduct = (product: Product) => {
    window.location.hash = `#produto-${product.id}`;
  };

  const openCollection = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    window.location.hash = `#colecao-${slug}`;
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="w-full min-h-screen flex flex-col bg-surface-pure text-text-primary">
      <Header
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={(slug) => {
          setActiveCategory(slug);
          setSearchQuery('');
          navigateHome();
        }}
        onOpenModal={(type) => setInfoModalType(type)}
        onOpenAccountModal={() => setAccountModalOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        onToggleSearch={() => {
          setSearchOpen((prev) => !prev);
          navigateHome();
        }}
        cartCount={totalCartCount}
        user={user}
      />

      <SearchBar
        isOpen={searchOpen && view === 'home'}
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <main className="w-full pt-16 flex-1">
        {view === 'home' && (
          <>
            {!searchQuery && !activeCategory && (
              <HeroMain />
            )}
            <ProductGrid
              products={products}
              categories={categories}
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              onSelectCategory={setActiveCategory}
              onSelectProduct={openProduct}
              onAddToCart={handleAddToCart}
            />
            {!searchQuery && !activeCategory && (
              <HeroCollection
                onCollectionClick={(name) => openCollection(name)}
              />
            )}
          </>
        )}

        {view === 'product' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            onClose={navigateHome}
            onAddToCart={handleAddToCart}
          />
        )}

        {view === 'collection' && collectionName && (
          <CollectionView
            collectionName={collectionName}
            products={allProducts.filter((p) => p.collection === collectionName)}
            onClose={navigateHome}
            onSelectProduct={openProduct}
            onAddToCart={handleAddToCart}
          />
        )}
      </main>

      <Footer />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />

      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        user={user}
        onLoginSuccess={(u) => setUser(u)}
        onLogout={() => {
          setUser(null);
          try {
            localStorage.removeItem('chromewear_user');
          } catch (e) {}
        }}
      />
    </div>
  );
}
