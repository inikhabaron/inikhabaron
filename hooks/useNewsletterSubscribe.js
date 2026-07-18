'use client';

import { useState } from 'react';
import { toast } from 'sonner';

// Single source of truth for the newsletter subscribe form's state/submit
// logic — previously copy-pasted independently in HomeClient, NewsClient,
// live/page and useSiteChrome. Takes the page's current selectedLanguage
// purely for toast copy (en/hi); it does not otherwise depend on site chrome.
export default function useNewsletterSubscribe(selectedLanguage) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleNewsletterSubscribe = async (extra = {}) => {
    if (!newsletterEmail.trim()) {
      toast.error(selectedLanguage === 'hi' ? 'ईमेल दर्ज करें' : 'Please enter email');
      return;
    }
    try {
      setNewsletterLoading(true);
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail, language: extra.language, categories: extra.categories }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(selectedLanguage === 'hi' ? 'सफलतापूर्वक सब्सक्राइब किया गया' : 'Subscribed!');
        setNewsletterEmail('');
      } else {
        toast.error(data.message || 'Something went wrong');
      }
    } catch {
      toast.error('Server error');
    } finally {
      setNewsletterLoading(false);
    }
  };

  return { newsletterEmail, setNewsletterEmail, newsletterLoading, handleNewsletterSubscribe };
}
