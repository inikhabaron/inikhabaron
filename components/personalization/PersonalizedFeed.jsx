'use client';

import { useEffect, useState } from 'react';

import PersonalizedNewsCard from './PersonalizedNewsCard';
import PersonalizedFeedSkeleton from './PersonalizedFeedSkeleton';

import styles from './PersonalizedFeed.module.css';

export default function PersonalizedFeed() {
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

      <div className={styles.grid}>
        {articles.map(article => (
          <PersonalizedNewsCard
            key={article.id}
            article={article}
          />
        ))}
      </div>
    </section>
  );
}