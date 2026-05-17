// src/pages/HomePage.jsx - ULTRA PREMIUM ELECTRONICS STORE
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';
import {
  FiTruck, FiRefreshCw, FiShield, FiHeadphones,
  FiStar, FiHeart, FiShoppingCart, FiUser,
  FiAward, FiPackage, FiMapPin, FiMail, FiSend,
  FiChevronRight, FiZap, FiWifi, FiBattery
} from 'react-icons/fi';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

/* ─── Global styles ─────────────────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --black:#080808;--dark:#0e0e0e;--card:#131313;
      --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);
      --cyan:#00e5ff;--amber:#ffb300;--red:#ff3b3b;--white:#ffffff;
      --muted:rgba(255,255,255,0.45);--muted2:rgba(255,255,255,0.22);
    }
    body{background:var(--black);color:var(--white);font-family:'DM Sans',sans-serif}
    .syne{font-family:'Syne',sans-serif}
    .label{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--cyan)}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:var(--black)}
    ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
    .swiper-pagination-bullet{background:rgba(255,255,255,.3)!important;opacity:1!important}
    .swiper-pagination-bullet-active{background:var(--cyan)!important;width:24px!important;border-radius:2px!important}
    .swiper-button-next,.swiper-button-prev{color:var(--white)!important}
    .swiper-button-next::after,.swiper-button-prev::after{font-size:18px!important}
    .noise::before{content:'';position:absolute;inset:0;z-index:1;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E");pointer-events:none}
    .glow-line{height:1px;background:linear-gradient(90deg,transparent,var(--cyan),transparent)}
    .glow-line-amber{height:1px;background:linear-gradient(90deg,transparent,var(--amber),transparent)}
    .product-card{position:relative;overflow:hidden;transition:transform .4s ease,box-shadow .4s ease}
    .product-card::before{content:'';position:absolute;inset:0;z-index:0;background:radial-gradient(600px circle at var(--mx,50%) var(--my,50%),rgba(0,229,255,.06),transparent 60%);pointer-events:none;transition:opacity .3s;opacity:0}
    .product-card:hover::before{opacity:1}
    .product-card:hover{transform:translateY(-6px);box-shadow:0 30px 60px rgba(0,0,0,.5),0 0 0 1px rgba(0,229,255,.15)}
    @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    .marquee-track{animation:marquee 28s linear infinite}
    @keyframes scanline{0%{top:-4px}100%{top:100%}}
    .scanline{position:absolute;left:0;right:0;height:2px;background:linear-gradient(to right,transparent,rgba(0,229,255,.2),transparent);pointer-events:none;animation:scanline 6s linear infinite;z-index:2}
    .spec-badge{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border2);border-radius:4px;padding:4px 10px;font-size:12px;color:var(--muted);background:rgba(255,255,255,.03)}
    .grad-cyan{background:linear-gradient(135deg,#00e5ff 0%,#00b8d4 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .grad-amber{background:linear-gradient(135deg,#ffb300 0%,#ff6f00 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .section-divider{width:40px;height:3px;background:var(--cyan);border-radius:2px}
    .line-clamp-1{overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical}
    .line-clamp-2{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
    @keyframes ring-pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,255,.4)}50%{box-shadow:0 0 0 12px rgba(0,229,255,0)}}
    .ring-pulse{animation:ring-pulse 2.5s ease-in-out infinite}
    .hero-grid{background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:60px 60px}
    .cat-card{position:relative;overflow:hidden;border-radius:12px}
    .cat-card::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.8) 0%,transparent 60%);pointer-events:none}
    .cat-card img{transition:transform .6s ease;display:block;width:100%;height:100%;object-fit:cover}
    .cat-card:hover img{transform:scale(1.08)}
    .dark-input{background:rgba(255,255,255,.05);border:1px solid var(--border2);border-radius:8px;color:var(--white);padding:14px 20px;font-family:'DM Sans',sans-serif;font-size:15px;outline:none;transition:border-color .2s;width:100%}
    .dark-input::placeholder{color:var(--muted2)}
    .dark-input:focus{border-color:var(--cyan)}
    .btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--cyan);color:#000;font-family:'Syne',sans-serif;font-weight:700;font-size:14px;letter-spacing:.04em;padding:14px 28px;border-radius:6px;cursor:pointer;border:none;transition:all .25s;text-decoration:none}
    .btn-primary:hover{background:#33ecff;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,229,255,.3)}
    .btn-ghost{display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--white);font-family:'Syne',sans-serif;font-weight:600;font-size:14px;letter-spacing:.04em;padding:13px 28px;border-radius:6px;border:1px solid var(--border2);cursor:pointer;transition:all .25s;text-decoration:none}
    .btn-ghost:hover{border-color:var(--white);background:rgba(255,255,255,.05)}
    @keyframes skeleton-pulse{0%,100%{opacity:.4}50%{opacity:.7}}
    .skeleton{animation:skeleton-pulse 1.5s ease-in-out infinite;background:var(--card);border:1px solid var(--border);border-radius:16px}
  `}</style>
);

/* ─── Stat Card ─────────────────────────────────────────────────────────────── */
const StatCard = ({ number, suffix, label, icon: Icon }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.5 });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const inc = number / (2000 / 16);
    const timer = setInterval(() => {
      start += inc;
      if (start >= number) { setCount(number); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, number]);
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
        <Icon style={{ color: 'var(--cyan)', width: 18, height: 18 }} />
      </div>
      <div className="syne" style={{ fontSize: 'clamp(36px,4vw,52px)', fontWeight: 800, color: 'var(--white)', lineHeight: 1 }}>
        {count.toLocaleString()}<span style={{ color: 'var(--cyan)' }}>{suffix}</span>
      </div>
      <p style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
    </motion.div>
  );
};

/* ─── Product Card ──────────────────────────────────────────────────────────── */
const ProductCard = ({ product, index }) => {
  const cardRef = useRef(null);
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };
  return (
    <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07, duration: 0.5 }} viewport={{ once: true }}>
      <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
        <div ref={cardRef} className="product-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }} onMouseMove={handleMouseMove}>
          <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: '#1a1a1a' }}>
            <img src={product.mainImage?.url || `https://placehold.co/600x600/131313/00e5ff?text=${encodeURIComponent(product.productName || 'Product')}`}
              alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .5s ease' }} />
            {product.isFeatured && (
              <div style={{ position: 'absolute', top: 14, left: 14, background: 'var(--amber)', color: '#000', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Syne, sans-serif' }}>Featured</div>
            )}
            {product.inventory?.currentStock === 0 && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ background: 'var(--red)', color: '#fff', padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>Sold Out</span>
              </div>
            )}
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,.6)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
              <FiHeart style={{ color: 'var(--muted)', width: 15, height: 15 }} />
            </button>
          </div>
          <div style={{ padding: '20px 20px 22px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} style={{ width: 13, height: 13, color: i < (product.rating || 4) ? 'var(--amber)' : 'var(--border2)', fill: i < (product.rating || 4) ? 'var(--amber)' : 'transparent' }} />
              ))}
              <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>({product.totalReviews || 0})</span>
            </div>
            <h3 className="syne line-clamp-1" style={{ fontSize: 16, fontWeight: 700, color: 'var(--white)', marginBottom: 6 }}>{product.productName}</h3>
            <p className="line-clamp-2" style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>{product.shortDescription}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="syne" style={{ fontSize: 22, fontWeight: 800, color: 'var(--cyan)' }}>${product.price}</span>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,229,255,.1)', border: '1px solid rgba(0,229,255,.2)', color: 'var(--cyan)', padding: '8px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'all .2s' }}>
                <FiShoppingCart style={{ width: 13, height: 13 }} /> Add
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ─── Marquee ───────────────────────────────────────────────────────────────── */
const brands = ['Apple','Samsung','Sony','Bose','JBL','Philips','Garmin','Beats','Anker','LG','Xiaomi','OnePlus'];
const MarqueeBrands = () => (
  <div style={{ overflow: 'hidden', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '18px 0', background: 'var(--dark)' }}>
    <div className="marquee-track" style={{ display: 'flex', gap: 80, whiteSpace: 'nowrap', width: 'max-content' }}>
      {[...brands, ...brands].map((b, i) => (
        <span key={i} className="syne" style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{b}</span>
      ))}
    </div>
  </div>
);

/* ─── Section heading ────────────────────────────────────────────────────────── */
const SectionHead = ({ label, title, sub, align = 'center' }) => (
  <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
    style={{ textAlign: align, marginBottom: 52 }}>
    <span className="label" style={{ display: 'block', marginBottom: 14 }}>{label}</span>
    <h2 className="syne" style={{ fontSize: 'clamp(30px,4vw,48px)', fontWeight: 800, color: 'var(--white)', lineHeight: 1.1, marginBottom: 16 }}>{title}</h2>
    {sub && <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: align === 'center' ? '0 auto' : undefined }}>{sub}</p>}
    {align === 'left' && <div className="section-divider" style={{ marginTop: 20 }} />}
  </motion.div>
);

/* ─── Demo data ─────────────────────────────────────────────────────────────── */
const demoProducts = [
  { _id:'1', productName:'ProWatch Ultra', price:'349', rating:5, totalReviews:248, shortDescription:'AMOLED display, GPS, 7-day battery life, health monitoring suite.', mainImage:{url:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=70'} },
  { _id:'2', productName:'AirPod X3 ANC', price:'199', rating:4, totalReviews:182, shortDescription:'40hr playtime, hybrid ANC, Hi-Res audio certification.', mainImage:{url:'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=70'} },
  { _id:'3', productName:'Hue Strip Pro', price:'89', rating:5, totalReviews:96, shortDescription:'16M colors, Alexa & Google compatible, app-controlled.', mainImage:{url:'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&q=70'} },
  { _id:'4', productName:'PowerBank 30K', price:'69', rating:4, totalReviews:74, shortDescription:'30,000mAh, 65W PD fast charge, dual USB-C output.', mainImage:{url:'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=70'} },
  { _id:'5', productName:'Sport Band S2', price:'129', rating:5, totalReviews:311, shortDescription:'Blood oxygen, sleep tracking, 14-day battery, IP68 rated.', mainImage:{url:'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=70'} },
  { _id:'6', productName:'Studio Buds Pro', price:'249', rating:5, totalReviews:155, shortDescription:'Spatial audio, adaptive transparency, custom EQ via app.', mainImage:{url:'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=70'} },
  { _id:'7', productName:'Smart Bulb Pack', price:'49', rating:4, totalReviews:88, shortDescription:'E27, 1200 lumen, RGBWW, group scenes, circadian mode.', mainImage:{url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=70'} },
  { _id:'8', productName:'Charging Dock Pro', price:'79', rating:4, totalReviews:43, shortDescription:'5-in-1 wireless charging, 15W Qi2, MagSafe compatible.', mainImage:{url:'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=70'} },
];
const demoCategories = [
  { _id:'c1', name:'Smart Watches', slug:'smartwatches', image:{url:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=60'} },
  { _id:'c2', name:'Earbuds', slug:'earbuds', image:{url:'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=60'} },
  { _id:'c3', name:'Smart Lights', slug:'lights', image:{url:'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&q=60'} },
  { _id:'c4', name:'Power Banks', slug:'power-banks', image:{url:'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=60'} },
  { _id:'c5', name:'Fitness Bands', slug:'fitness-bands', image:{url:'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&q=60'} },
  { _id:'c6', name:'Headphones', slug:'headphones', image:{url:'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=60'} },
  { _id:'c7', name:'Smart Bulbs', slug:'smart-bulbs', image:{url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=60'} },
  { _id:'c8', name:'Accessories', slug:'accessories', image:{url:'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=60'} },
];

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterName, setNewsletterName] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [activeTab, setActiveTab] = useState('featured');

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => { fetchAllData(); window.scrollTo(0, 0); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [featuredRes, newRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/products`, { params: { isFeatured: true, limit: 8 } }),
        axios.get(`${API_URL}/products`, { params: { sort: '-createdAt', limit: 8 } }),
        axios.get(`${API_URL}/categories`, { params: { status: 'active', limit: 8 } })
      ]);
      setFeaturedProducts(featuredRes.data?.data?.length ? featuredRes.data.data : demoProducts);
      setNewArrivals(newRes.data?.data?.length ? newRes.data.data : [...demoProducts].reverse());
      setCategories(categoriesRes.data?.data?.length ? categoriesRes.data.data : demoCategories);
    } catch {
      setFeaturedProducts(demoProducts);
      setNewArrivals([...demoProducts].reverse());
      setCategories(demoCategories);
    } finally { setLoading(false); }
  };

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) { toast.error('Please enter your email'); return; }
    setSubscribing(true);
    try {
      await axios.post(`${API_URL}/newsletter/subscribe`, { email: newsletterEmail, name: newsletterName });
      toast.success('Welcome aboard! Check your inbox.');
      setNewsletterEmail(''); setNewsletterName('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to subscribe'); }
    finally { setSubscribing(false); }
  };

  const displayProducts = activeTab === 'featured' ? featuredProducts : newArrivals;

  const heroSlides = [
    { title: ['Next-Gen', 'Wearables'], sub: 'Ultra-precision smartwatches engineered for the extraordinary', accent: '#00e5ff', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&q=80', specs: ['Always-on AMOLED', 'GPS + HR', '7-day battery'], cta: 'Explore Watches', link: '/shop?category=watches' },
    { title: ['Immersive', 'Sound'], sub: 'Studio-grade audio that disappears into pure feeling', accent: '#ffb300', img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1200&auto=format&q=80', specs: ['ANC Pro', '40h Playtime', 'Hi-Res Audio'], cta: 'Shop Earbuds', link: '/shop?category=earbuds' },
    { title: ['Smart', 'Lighting'], sub: 'Transform every space with intelligent adaptive illumination', accent: '#a78bfa', img: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=1200&auto=format&q=80', specs: ['16M Colors', 'Voice Control', 'App Control'], cta: 'Discover Lights', link: '/shop?category=lights' },
  ];

  const features = [
    { icon: FiTruck, title: 'Express Delivery', desc: 'Same-day shipping on orders before 2PM' },
    { icon: FiShield, title: '2-Year Warranty', desc: 'All products fully covered & protected' },
    { icon: FiRefreshCw, title: '30-Day Returns', desc: 'Hassle-free return, no questions asked' },
    { icon: FiHeadphones, title: '24/7 Support', desc: 'Expert tech support around the clock' },
  ];

  return (
    <>
      <GlobalStyles />
      <Helmet>
        <title>ElectroVault — Premium Tech Gear</title>
        <meta name="description" content="Shop smartwatches, earbuds, smart lights and cutting-edge electronics." />
      </Helmet>

      <div style={{ background: 'var(--black)', minHeight: '100vh' }}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section style={{ position: 'relative', height: '100svh', minHeight: 640, overflow: 'hidden' }} className="noise">
          <Swiper modules={[Autoplay, Pagination, Navigation, EffectFade]} effect="fade" slidesPerView={1}
            autoplay={{ delay: 6000, disableOnInteraction: false }} pagination={{ clickable: true }} navigation style={{ height: '100%' }}>
            {heroSlides.map((slide, idx) => (
              <SwiperSlide key={idx} style={{ height: '100%' }}>
                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <img src={slide.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18 }} />
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 80% at 70% 50%, ${slide.accent}18 0%, transparent 70%)` }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(8,8,8,.96) 40%,rgba(8,8,8,.4) 100%)' }} />
                  </div>
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0 }} className="hero-grid" />
                  <div className="scanline" />
                  <motion.div style={{ y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 2, width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
                    <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.1 }}>
                      <span className="label" style={{ display: 'inline-block', marginBottom: 20 }}>ElectroVault Collection</span>
                      <h1 className="syne" style={{ fontSize: 'clamp(52px,7vw,96px)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 24 }}>
                        {slide.title[0]}<br /><span style={{ color: slide.accent }}>{slide.title[1]}</span>
                      </h1>
                      <p style={{ fontSize: 'clamp(15px,1.5vw,18px)', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 460, marginBottom: 36 }}>{slide.sub}</p>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 40, flexWrap: 'wrap' }}>
                        {slide.specs.map((s, i) => (
                          <span key={i} className="spec-badge">
                            {i === 0 && <FiZap style={{ width: 12, height: 12, color: slide.accent }} />}
                            {i === 1 && <FiWifi style={{ width: 12, height: 12, color: slide.accent }} />}
                            {i === 2 && <FiBattery style={{ width: 12, height: 12, color: slide.accent }} />}
                            {s}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 14 }}>
                        <Link to={slide.link} className="btn-primary" style={{ background: slide.accent }}>{slide.cta} <FiChevronRight /></Link>
                        <Link to="/shop" className="btn-ghost">View All</Link>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top,var(--black),transparent)', zIndex: 3 }} />
        </section>

        {/* ── MARQUEE ──────────────────────────────────────────────────────── */}
        <MarqueeBrands />

        {/* ── FEATURES BAR ─────────────────────────────────────────────────── */}
        <section style={{ background: 'var(--dark)', padding: '64px 0' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 32 }}>
              {features.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, border: '1px solid var(--border2)', background: 'rgba(0,229,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <f.icon style={{ color: 'var(--cyan)', width: 20, height: 20 }} />
                  </div>
                  <div>
                    <h4 className="syne" style={{ fontWeight: 700, fontSize: 15, color: 'var(--white)', marginBottom: 4 }}>{f.title}</h4>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <div className="glow-line" />

        {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
        <section style={{ padding: '100px 0', background: 'var(--black)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
            <SectionHead label="Shop by Category" title={<>Browse Our <span className="grad-cyan">Collections</span></>} sub="From precision wearables to intelligent lighting — discover every corner of our tech universe." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
              {(categories.length ? categories : demoCategories).slice(0, 8).map((cat, i) => (
                <motion.div key={cat._id || i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} viewport={{ once: true }}>
                  <Link to={`/shop?category=${cat.slug || cat.name?.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                    <div className="cat-card" style={{ aspectRatio: '3/4' }}>
                      <img src={cat.image?.url || `https://placehold.co/400x560/131313/00e5ff?text=${encodeURIComponent(cat.name)}`} alt={cat.name} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 18px', zIndex: 2 }}>
                        <h3 className="syne" style={{ fontWeight: 700, fontSize: 16, color: 'var(--white)' }}>{cat.name}</h3>
                        <span style={{ fontSize: 12, color: 'var(--cyan)' }}>Explore →</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ────────────────────────────────────────────────────────── */}
        <section style={{ background: 'var(--dark)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 0' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 32, alignItems: 'center' }}>
              <StatCard number={50000} suffix="+" label="Happy Customers" icon={FiUser} />
              <div style={{ height: 60, width: 1, background: 'var(--border)', margin: '0 auto' }} />
              <StatCard number={1200} suffix="+" label="Products" icon={FiPackage} />
              <div style={{ height: 60, width: 1, background: 'var(--border)', margin: '0 auto' }} />
              <StatCard number={60} suffix="+" label="Brands" icon={FiAward} />
              <div style={{ height: 60, width: 1, background: 'var(--border)', margin: '0 auto' }} />
              <StatCard number={35} suffix="+" label="Countries" icon={FiMapPin} />
            </div>
          </div>
        </section>

        {/* ── PRODUCTS (tabbed) ─────────────────────────────────────────────── */}
        <section style={{ padding: '100px 0', background: 'var(--black)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 52 }}>
              <div>
                <span className="label" style={{ display: 'block', marginBottom: 12 }}>Our Products</span>
                <h2 className="syne" style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 800, color: 'var(--white)' }}>
                  Handpicked <span className="grad-cyan">Essentials</span>
                </h2>
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
                {['featured', 'new'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: '9px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.04em', textTransform: 'capitalize', transition: 'all .2s', background: activeTab === tab ? 'var(--cyan)' : 'transparent', color: activeTab === tab ? '#000' : 'var(--muted)' }}>
                    {tab === 'featured' ? 'Featured' : 'New Arrivals'}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
                {displayProducts.slice(0, 8).map((product, i) => <ProductCard key={product._id || i} product={product} index={i} />)}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 56 }}>
              <Link to="/shop" className="btn-ghost">View All Products <FiChevronRight /></Link>
            </div>
          </div>
        </section>

        {/* ── HIGHLIGHT BANNER ─────────────────────────────────────────────── */}
        <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--dark)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 100% at 50% 50%,rgba(0,229,255,.06) 0%,transparent 70%)' }} />
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 32px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 64, alignItems: 'center' }}>
              <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }}>
                <span className="label" style={{ display: 'block', marginBottom: 18 }}>Limited Offer</span>
                <h2 className="syne" style={{ fontSize: 'clamp(32px,4vw,56px)', fontWeight: 800, color: 'var(--white)', lineHeight: 1.05, marginBottom: 20 }}>
                  Get <span className="grad-amber">50% OFF</span><br />Your First Order
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
                  Use promo code at checkout and unlock exclusive savings on our entire premium electronics range.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: 'rgba(255,179,0,.07)', border: '1px solid rgba(255,179,0,.25)', borderRadius: 10, padding: '16px 24px', marginBottom: 36 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.12em' }}>VOLT50</span>
                  <button style={{ fontSize: 12, color: 'var(--amber)', background: 'transparent', border: '1px solid rgba(255,179,0,.3)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>Copy</button>
                </div>
                <br />
                <Link to="/shop" className="btn-primary" style={{ background: 'var(--amber)' }}>Shop Now <FiChevronRight /></Link>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { name: 'Smart Watch Pro', price: '299', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=60', tag: 'Watches' },
                  { name: 'ANC Earbuds X', price: '149', img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=60', tag: 'Audio' },
                  { name: 'LED Strip Kit', price: '79', img: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&q=60', tag: 'Lighting' },
                  { name: 'Power Bank 20K', price: '59', img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=60', tag: 'Accessories' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    <img src={item.img} alt={item.name} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', opacity: 0.85 }} />
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{item.tag}</div>
                      <p className="syne" style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>{item.name}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--amber)', fontFamily: 'Syne, sans-serif' }}>${item.price}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
        <section style={{ padding: '100px 0', background: 'var(--black)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
            <SectionHead label="Social Proof" title={<>Trusted by <span className="grad-cyan">Thousands</span></>} sub="Real reviews from real customers who live and breathe tech." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
              {[
                { name: 'Sarah K.', role: 'Tech Reviewer', rating: 5, text: 'The smartwatch quality is insane. Feels premium in every detail, and the app integration is flawless.', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
                { name: 'Marcus T.', role: 'Music Producer', rating: 5, text: "Best earbuds I've owned in years. The ANC is surgical and the sound profile is reference-grade.", avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
                { name: 'Priya M.', role: 'Interior Designer', rating: 5, text: 'The smart lighting transformed my studio. Setup took 10 minutes, the colors are incredibly accurate.', avatar: 'https://randomuser.me/api/portraits/women/3.jpg' },
              ].map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,var(--cyan),transparent)' }} />
                  <div style={{ fontSize: 36, color: 'var(--cyan)', lineHeight: 1, fontFamily: 'Georgia, serif', marginBottom: 16, opacity: 0.4 }}>"</div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
                    {[...Array(t.rating)].map((_, j) => <FiStar key={j} style={{ width: 14, height: 14, color: 'var(--amber)', fill: 'var(--amber)' }} />)}
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.75, marginBottom: 24 }}>{t.text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={t.avatar} alt={t.name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border2)' }} />
                    <div>
                      <p className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>{t.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)' }}>{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
        <section style={{ padding: '100px 0', background: 'var(--dark)', position: 'relative', overflow: 'hidden', borderTop: '1px solid var(--border)' }}>
          <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,229,255,.04) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 32px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div className="ring-pulse" style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,229,255,.08)', border: '1px solid rgba(0,229,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
              <FiMail style={{ color: 'var(--cyan)', width: 24, height: 24 }} />
            </div>
            <span className="label" style={{ display: 'block', marginBottom: 16 }}>Stay in the loop</span>
            <h2 className="syne" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--white)', lineHeight: 1.1, marginBottom: 16 }}>
              Get Early Access &<br /><span className="grad-cyan">Exclusive Deals</span>
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
              Join 50,000+ tech enthusiasts. Be first to know about new drops, flash sales, and member-only perks.
            </p>
            <form onSubmit={handleNewsletter}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <input className="dark-input" type="text" placeholder="Your name (optional)" value={newsletterName} onChange={e => setNewsletterName(e.target.value)} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <input className="dark-input" type="email" placeholder="Enter your email address" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} required style={{ flex: 1 }} />
                  <button type="submit" disabled={subscribing} className="btn-primary" style={{ whiteSpace: 'nowrap', opacity: subscribing ? 0.6 : 1 }}>
                    {subscribing ? 'Joining...' : <><FiSend style={{ marginRight: 6 }} /> Subscribe</>}
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted2)' }}>No spam. Unsubscribe at any time. We respect your privacy.</p>
            </form>
          </div>
        </section>

      </div>
    </>
  );
};

export default HomePage;