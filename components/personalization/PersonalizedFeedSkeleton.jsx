import styles from './PersonalizedFeed.module.css';

export default function PersonalizedFeedSkeleton({
  count = 6,
}) {
  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div className={styles.skeletonHeading} />
        <div className={styles.skeletonSubheading} />
      </div>

      <div className={styles.grid}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={styles.skeletonCard}
          >
            <div className={styles.skeletonImage} />

            <div className={styles.skeletonBody}>
              <div className={styles.skeletonCategory} />

              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonTitleShort} />

              <div className={styles.skeletonReason} />

              <div className={styles.skeletonFooter} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}