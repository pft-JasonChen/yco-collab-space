import { useCallback, useState } from 'react';
import { RuntimeProvider } from './adapters.jsx';
import Header from './Header.jsx';
import HomeLayout from './HomeLayout.jsx';
import MyGalleryPage from './MyGalleryPage.jsx';
import PricingModal from './pricing-index.jsx';
import { PricingProvider } from './pricing-adapters.jsx';
import styles from './HomeContainer.module.scss';
import globals from './globals.module.scss';
import { sections, homepageLayoutConfig, tabHot, tabNew } from './home-fixture.js';
import './home-icon-styles.css';

// Local routing/data integration only. Page markup and responsive rules are RD ports.
export default function Preview({ recipe = 'authenticated-home', onBoundary }) {
  const [path, setPath] = useState(recipe === 'gallery' ? '/account/gallery' : '/home');
  const [pricingOpen, setPricingOpen] = useState(recipe === 'pricing-overlay');
  const navigate = useCallback(next => {
    if (typeof next !== 'string') return;
    if (next === '/home' || next.startsWith('/account/gallery') || next === '/account/artwork') setPath(next);
    else {
      // Public integration callback: no substitute editor/checkout UI or API call.
      onBoundary?.({ route: next });
      window.dispatchEvent(new CustomEvent('yco:surface-boundary', { detail: { route: next } }));
    }
  }, [onBoundary]);
  return (
    <RuntimeProvider path={path} onNavigate={navigate} onBoundary={navigate}>
      <div className={globals.root}>
      {path.startsWith('/account/') ? <MyGalleryPage cmsGridModule={{ attributes: { sections } }} /> : <>
        <Header onPricing={() => setPricingOpen(true)} />
        <main className={styles.container}>
          <HomeLayout filteredSections={sections} homepageLayoutConfig={homepageLayoutConfig} tabHot={tabHot} tabNew={tabNew} sectionsLoaded onSelect={(_type, id) => document.getElementById(`yce-gridmodule-section-${id}`)?.scrollIntoView({ behavior: 'smooth' })} onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        </main>
      </>}
      <div id="portal-root" />
      {pricingOpen && <PricingProvider onClose={() => setPricingOpen(false)} onCheckout={() => navigate('pricing/checkout')}><PricingModal /></PricingProvider>}
      </div>
    </RuntimeProvider>
  );
}
