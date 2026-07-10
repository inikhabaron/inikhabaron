'use client';

import { useEffect, useState, useRef } from 'react';

import PersonalizedNewsCard from './PersonalizedNewsCard';
import PersonalizedFeedSkeleton from './PersonalizedFeedSkeleton';

import styles from './PersonalizedFeed.module.css';
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PersonalizedFeed() {

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
        Continue reading articles to build your
        personalized feed.
      </div>
    );
  }

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2>Personalized For You</h2>

        <p>
          Stories selected based on your reading
          interests.
        </p>
      </div>

      <section className={styles.wrapper}>
        <button
          className={styles.arrowLeft}
          onClick={() => scroll("left")}
        >
          <ChevronLeft size={22} />
        </button>

        <div ref={scrollRef} className={styles.carousel}>
          {articles.map(article => (
            <div key={article._id} className={styles.item}>
              <PersonalizedNewsCard
                article={article}
              />
            </div>
          ))}
        </div>

        <button
          className={styles.arrowRight}
          onClick={() => scroll("right")}
        >
          <ChevronRight size={22} />
        </button>
      </section>
    </section>
  );
}