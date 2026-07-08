'use client';

import { useEffect, useState } from 'react';
import {
  Info,
  ChevronDown,
  ChevronUp,
  Heart,
  TrendingUp,
  MapPin,
  Star,
  UserPen,
  FolderOpen,
  Globe
} from 'lucide-react';

import styles from './WhySeeingThis.module.css';

const reasonIcons = {
  interest: Heart,
  category: FolderOpen,
  author: UserPen,
  city: MapPin,
  language: Globe,
  trending: TrendingUp,
  breaking: TrendingUp,
  editor: Star,
};

export default function WhySeeingThis({ 
    articleId,
    title = 'Why am I seeing this?',
    showMoreLabel = 'Show more',
    hideLabel = 'Hide',
}) {
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [reasons, setReasons] = useState([]);

  useEffect(() => {
    if (!articleId) return;

    let ignore = false;

    async function loadReasons() {
      try {
        setLoading(true);

        const response = await fetch(`/api/news/${articleId}/why`, {
          cache: 'no-store',
        });

        const data = await response.json();

        if (!ignore && data.success) {
          setReasons(data.data?.reasons || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadReasons();

    return () => {
      ignore = true;
    };
  }, [articleId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonText} />
      </div>
    );
  }

  if (reasons.length === 0) {
    return null;
  }

  const primaryReason = reasons[0];
  const extraReasons = reasons.slice(1);

  return (
    <section className={styles.container}>
        <div className={styles.header}>
            <Info size={18} />
            <h3>{title}</h3>
        </div>

        <p className={styles.subtitle}>
        We recommended this article because:
        </p>

        <div className={styles.primaryCard}>
            {(() => {
                const Icon = reasonIcons[primaryReason.type] || Star;

                return (
                <>
                    <div className={styles.primaryIcon}>
                        <Icon size={18} />
                    </div>

                    <div>
                        <div className={styles.primaryMessage}>
                            {primaryReason.message}
                        </div>
                    </div>
                </>
                );
            })()}
        </div>

        {expanded && extraReasons.length > 0 && (
            <div className={styles.reasonList}>
                {extraReasons.map((reason, index) => {
                const Icon = reasonIcons[reason.type] || Star;

                return (
                    <div
                    key={`${reason.type}-${index}`}
                    className={styles.reasonItem}
                    >
                        <Icon size={16} />

                        <span>{reason.message}</span>
                    </div>
                );
                })}
            </div>
        )}

        {extraReasons.length > 0 && (
            <button
                type="button"
                className={styles.toggle}
                onClick={() => setExpanded(prev => !prev)}
            >
                {expanded ? (
                    <>
                        {hideLabel}
                        <ChevronUp size={16} />
                    </>
                ) : (
                    <>
                        {showMoreLabel}
                        <ChevronDown size={16} />
                    </>
                )}
            </button>
        )}
    </section>
  );
}