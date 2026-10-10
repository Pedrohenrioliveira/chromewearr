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

type ViewMode = 'home' | 'product' | 'collection';

export default function HomePage() {
  // Routing State
  const [view, setView] = useState<ViewMode>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [collectionName, setCollectionName] = useState<string | null>(null);

  // Navigation & Category filter state
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Banner state
  const [banner, setBanner] = useState<any>(null);

  // Cart state
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Modals & User Auth state
  const [infoModalType, setInfoModalType] = useState<ModalType>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Site Lock State
  const [siteLocked, setSiteLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [lockError, setLockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // 1. Initial Load: Site Lock, Cart, User, and Data
  useEffect(() => {
    const checkLockAndInit = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.isLocked) {
            const savedCode = localStorage.getItem('chromewear_access_code');
            if (savedCode) {
              const verifyRes = await fetch('/api/settings/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: savedCode })
              });
              if (!verifyRes.ok) {
                setSiteLocked(true);
              }
            } else {
              setSiteLocked(true);
            }
          }
        }
      } catch (e) {
        console.error('Erro ao verificar bloqueio:', e);
      } finally {
        setCheckingLock(false);
      }
    };
    checkLockAndInit();
    try {
      const savedUser = localStorage.getItem('chromewear_user');
      if (savedUser) {
        const currentUser = JSON.parse(savedUser);
        setUser(currentUser);
        
        const cartKey = `chromewear_cart_${currentUser.email}`;
        const savedCart = localStorage.getItem(cartKey);
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      }
    } catch (e) {
      console.error('Erro ao carregar dados locais:', e);
    }

    // Fetch initial data
    const fetchInitialData = async () => {
      try {
        const [prodRes, catRes, banRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/admin/categories'),
          fetch('/api/admin/banner')
        ]);
        
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setAllProducts(prodData);
          setProducts(prodData);
        }
        if (catRes.ok) {
          setCategories(await catRes.json());
        }
        if (banRes.ok) {
          setBanner(await banRes.json());
        }
      } catch (err) {
        console.error('Erro ao carregar dados do banco:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Save Cart to localStorage and DB on changes
  useEffect(() => {
    try {
      if (user) {
        const cartKey = `chromewear_cart_${user.email}`;
        localStorage.setItem(cartKey, JSON.stringify(cartItems));

        fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, cartData: cartItems })
        }).catch(err => console.error('Erro ao salvar no banco:', err));
      }
    } catch (e) {
      console.error('Erro ao salvar sacola:', e);
    }
  }, [cartItems, user]);

  // Load specific cart when user changes (login/logout)
  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (user) {
          const res = await fetch(`/api/cart?email=${user.email}`);
          let dbCart: CartItem[] = [];
          if (res.ok) {
            const data = await res.json();
            dbCart = data.cart || [];
          }
          
          // Merge current guest cart into the DB cart
          setCartItems(prev => {
            if (prev.length === 0) return dbCart;
            const merged = [...dbCart];
            prev.forEach(gItem => {
              const existingIndex = merged.findIndex(i => i.id === gItem.id);
              if (existingIndex > -1) {
                merged[existingIndex].quantity += gItem.quantity;
              } else {
                merged.push(gItem);
              }
            });
            return merged;
          });
        } else {
          // Logged out -> clear cart (starts fresh)
          setCartItems([]);
        }
      } catch (e) {
        console.error('Erro ao carregar sacola:', e);
      }
    };
    
    // We only want to run fetchCart if the user state actually changed to logged in/out.
    // However, on initial load, `user` becomes non-null, triggering this to fetch from DB.
    fetchCart();
  }, [user]);



  // Hash Routing Logic
  useEffect(() => {
    if (allProducts.length === 0) return;

    const handleHashRoute = () => {
      // Fechar menus, carrinhos e modais ao mudar de "página" (rota hash)
      setSearchOpen(false);
      setCartOpen(false);
      setInfoModalType(null);
      setAccountModalOpen(false);

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
    if (activeCategory && activeCategory !== 'all') {
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

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    setLockError('');
    try {
      const res = await fetch('/api/settings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCodeInput })
      });
      if (res.ok) {
        localStorage.setItem('chromewear_access_code', accessCodeInput);
        setSiteLocked(false);
      } else {
        setLockError('Código de acesso inválido.');
      }
    } catch (e) {
      setLockError('Erro ao verificar código.');
    } finally {
      setUnlocking(false);
    }
  };

  if (checkingLock) {
    return <div className="w-full min-h-screen flex items-center justify-center bg-surface-pure text-text-primary text-xs uppercase tracking-widest font-bold animate-pulse">Carregando...</div>;
  }

  if (siteLocked) {
    return (
      <div className="w-full min-h-screen bg-surface-pure flex flex-col items-center justify-center p-4 text-text-primary">
        <div className="max-w-md w-full bg-surface-off border border-border-hairline p-8 shadow-sm">
          <h1 className="font-display uppercase text-2xl font-bold mb-2 text-center text-text-primary">Acesso Antecipado</h1>
          <p className="text-sm text-text-secondary mb-8 text-center">O site está bloqueado no momento. Insira sua senha de acesso para continuar.</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            {lockError && (
              <div className="p-3 bg-[#ba1a1a]/10 text-[#ba1a1a] text-xs font-bold uppercase text-center border border-[#ba1a1a]/20">{lockError}</div>
            )}
            <div>
              <input
                type="password"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                placeholder="CÓDIGO DE ACESSO"
                className="w-full border border-border-hairline bg-surface-pure p-4 text-center text-sm text-text-primary focus:outline-none focus:border-primary transition-colors tracking-widest"
                required
              />
            </div>
            <button
              type="submit"
              disabled={unlocking}
              className="w-full bg-primary text-white py-4 text-xs uppercase tracking-wider font-bold hover:bg-black transition-colors disabled:opacity-50"
            >
              {unlocking ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
        }}
        cartCount={totalCartCount}
        user={user}
        showSearchIcon={view === 'collection'}
      />

      <SearchBar
        isOpen={searchOpen && view === 'collection'}
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <main className="w-full pt-16 flex-1">
        {view === 'home' && (
          <>
            {!searchQuery && !activeCategory ? (
              <>
                <HeroMain onCollectionClick={openCollection} banner={banner} />
                {loadingProducts ? (
                  <div className="w-full py-24 flex items-center justify-center">
                    <p className="font-display uppercase tracking-widest text-sm animate-pulse">Carregando Acervo...</p>
                  </div>
                ) : (
                  <ProductGrid
                    products={products}
                    categories={categories}
                    activeCategory={activeCategory}
                    searchQuery={searchQuery}
                    onSelectCategory={setActiveCategory}
                    onSelectProduct={openProduct}
                    onAddToCart={handleAddToCart}
                  />
                )}
                <HeroCollection
                  onCollectionClick={(name) => openCollection(name)}
                />
              </>
            ) : (
              <CollectionView
                collectionName={activeCategory === 'all' ? 'Shop All' : activeCategory || 'Busca'}
                products={products}
                searchQuery={searchQuery}
                onClose={() => {
                  setActiveCategory(null);
                  setSearchQuery('');
                }}
                onSelectProduct={openProduct}
                onAddToCart={handleAddToCart}
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
            searchQuery={searchQuery}
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
          setAccountModalOpen(false);
          try {
            localStorage.removeItem('chromewear_user');
          } catch (e) {}
        }}
      />
    </div>
  );
}
