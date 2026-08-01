'use client';

import { Suspense } from 'react';
import { Radio } from 'lucide-react';

import PublicPageLayout from '@/components/layout/PublicPageLayout';
import useSiteChrome from '@/hooks/useSiteChrome';
import { ACCENT } from '@/lib/news-utils';
import CricketSections from '@/components/cricket/CricketSections';

// Live Cricket hub (/cricket) — reachable from the homepage widget's "View
// All Scores" button and from any match card. Mirrors /market/page.js:
// PublicPageLayout + useSiteChrome for shared header/footer, the sections
// component does its own fetching/polling (CricketSections).
function CricketPageContent() {
  const chrome = useSiteChrome();
  const { selectedLanguage, dark, T1 } = chrome;
  const isHindi = selectedLanguage === 'hi';

  return (
    <PublicPageLayout chrome={chrome}>
      <div className="kn-content-wrap" style={{ padding: '28px 5px 70px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Radio size={22} color={ACCENT} aria-hidden="true" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T1, margin: 0 }}>
            {isHindi ? 'लाइव क्रिकेट स्कोर' : 'Live Cricket Scores'}
          </h1>
        </div>

        <CricketSections dark={dark} selectedLanguage={selectedLanguage} />
      </div>
    </PublicPageLayout>
  );
}

export default function CricketPage() {
  return (
    <Suspense fallback={null}>
      <CricketPageContent />
    </Suspense>
  );
}
