'use client';

import { useContext, useEffect, useState, useRef } from 'react';

import PersonalizedNewsCard from './PersonalizedNewsCard';
import PersonalizedFeedSkeleton from './PersonalizedFeedSkeleton';
import { DarkCtx } from '@/lib/news-contexts';

import styles from './PersonalizedFeed.module.css';
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PersonalizedFeed({selectedLanguage = 'en',}) {

  const dark = useContext(DarkCtx);
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const start = container.scrollLeft;
    const distance = direction === "left" ? -800 : 800;
    const duration = 700; // milliseconds
    let startTime = null;
    function animate(currentTime) {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease in-out
      const ease =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      container.scrollLeft = start + distance * ease;
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  };

  const [articles, setArticles] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 20,
  });

  useEffect(() => {
    let ignore = false;

    async function loadFeed() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/news/personalized?page=${pagination.page}&limit=${pagination.limit}`,
          {
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load personalized feed.'
          );
        }

        if (ignore) {
          return;
        }

        setArticles(data.data.items);

        setPagination(prev => ({
          ...prev,
          page: data.data.page,
          total: data.data.total,
          totalPages: data.data.totalPages,
          limit: data.data.limit,
        }));
      } catch (error) {
        if (!ignore) {
          setError(error.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadFeed();

    return () => {
      ignore = true;
    };
  }, [pagination.page, pagination.limit]);

  if (loading) {
    return <PersonalizedFeedSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.message}>
        {error}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className={styles.message}>
        {selectedLanguage === 'hi'
          ? 'अपना व्यक्तिगत न्यूज़ फ़ीड बनाने के लिए और लेख पढ़ें।'
          : 'Continue reading articles to build your personalized feed.'}
      </div>
    );
  }

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2>{selectedLanguage === 'hi' ? 'आपके लिए विशेष' : 'Personalized For You'}</h2>

        <p>{selectedLanguage === 'hi' ? 'आपकी पढ़ने की रुचियों के आधार पर चुनी गई खबरें।' : 'Stories selected based on your reading interests.'}</p>
      </div>

      <section className={styles.wrapper}>
        <button
          className={styles.arrowLeft}
          onClick={() => scroll("left")}
          aria-label={selectedLanguage === 'hi' ? 'बाईं ओर स्क्रॉल करें' : 'Scroll left'}
          style={{
            background: dark ? '#161B27' : '#fff',
            border: dark ? '1px solid #252E40' : 'none',
            boxShadow: dark ? '0 4px 12px rgba(0,0,0,.45)' : '0 4px 12px rgba(0,0,0,.15)',
          }}
        >
          <ChevronLeft size={22} color={dark ? '#E8ECF0' : '#111827'} />
        </button>

        <div ref={scrollRef} className={styles.carousel}>
          {articles.map(article => (
            <div key={article.id} className={styles.item}>
              <PersonalizedNewsCard
                article={article}
                selectedLanguage={selectedLanguage}
              />
            </div>
          ))}
        </div>

        <button
          className={styles.arrowRight}
          onClick={() => scroll("right")}
          aria-label={selectedLanguage === 'hi' ? 'दाईं ओर स्क्रॉल करें' : 'Scroll right'}
          style={{
            background: dark ? '#161B27' : '#fff',
            border: dark ? '1px solid #252E40' : 'none',
            boxShadow: dark ? '0 4px 12px rgba(0,0,0,.45)' : '0 4px 12px rgba(0,0,0,.15)',
          }}
        >
          <ChevronRight size={22} color={dark ? '#E8ECF0' : '#111827'} />
        </button>
      </section>
    </section>
  );
}