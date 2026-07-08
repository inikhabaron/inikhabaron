'use client';

import styles from './UserProfileChip.module.css';

export default function UserProfileChip({
  user,
}) {
  if (!user) return null;

  const provider =
    user.provider === 'google.com'
      ? 'Google Account'
      : user.provider;

  return (
    <div className={styles.chip}>
      <img
        className={styles.avatar}
        src={user.avatar || '/default-avatar.png'}
        alt={user.name}
      />

      <div className={styles.info}>
        <div className={styles.name}>
          {user.name}
        </div>

        <div className={styles.provider}>
          {provider}
        </div>
      </div>
    </div>
  );
}