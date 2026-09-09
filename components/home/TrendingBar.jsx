'use client';
import React from 'react';
import Link from 'next/link';
import FollowButton from '@/components/follow/FollowButton';

// Option B (2026-09-09, see docs/mvp3-phase1-architecture.md): article-level
// tag matching sits at ~4.7% coverage because the tags catalog and real
// article tags are two different vocabularies, not variant spellings of one.
// Rather than a normalization/migration project, every tag *here* is by
// definition a real tags-collection record — so this is the entry point
// that gives Topic Follow 100% coverage: every displayed chip is followable
// and links to its own /topics/[slug] feed. The hardcoded fallback (shown
// when no real tags are loaded) has neither, and keeps its old click-to-search
// behavior since there's no real tag/topic page behind it.
export default function TrendingBar({ tags, selectedLanguage, onTagClick, dark, user, following = [], onFollowChange, onRequireLogin }) {
  const fallback = selectedLanguage === 'hi'
    ? ['चुनाव', 'महंगाई', 'शेयर बाजार', 'मौसम अपडेट', 'पेट्रोल डीजल दाम']
    : ['Elections', 'Inflation', 'Stock Market', 'Weather', 'Fuel Prices'];

  const displayTags = tags.length > 0 ? tags.slice(0, 5) : fallback;
  const followingIds = new Set(following.map((t) => t.id));
  const followLabels = selectedLanguage === 'hi'
    ? { follow: 'फॉलो करें', following: 'फॉलो कर रहे हैं' }
    : { follow: 'Follow', following: 'Following' };
  const tagStyle = { borderColor: dark ? '#252E40' : '#E8EAED', color: dark ? '#9BA5B4' : '#4B5563', textDecoration: 'none', display: 'inline-block' };

  return (
    <div className="kn-trending" style={{ backgroundColor: dark ? '#161B27' : '#ffffff', borderBottomColor: dark ? '#252E40' : '#E8EAED' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="kn-trending-badge">
          {selectedLanguage === 'hi' ? 'ट्रेंडिंग' : 'Trending'}
        </span>
        <div className="kn-trending-tags">
          {displayTags.map((tag, i) => {
            const isRealTag = typeof tag !== 'string';
            const name = isRealTag ? tag.name : tag;
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {isRealTag ? (
                  <Link href={`/topics/${tag.slug}`} className="kn-trending-tag" style={tagStyle}>
                    # {name}
                  </Link>
                ) : (
                  <button
                    className="kn-trending-tag"
                    style={{ borderColor: dark ? '#252E40' : '#E8EAED', color: dark ? '#9BA5B4' : '#4B5563' }}
                    onClick={() => onTagClick(name)}
                  >
                    # {name}
                  </button>
                )}
                {isRealTag && (
                  <FollowButton
                    type="tag"
                    id={tag.id}
                    user={user}
                    size="sm"
                    following={followingIds.has(tag.id)}
                    onRequireLogin={onRequireLogin}
                    onChange={(change) => onFollowChange?.({
                      ...change,
                      item: { id: tag.id, name: tag.name, slug: tag.slug, color: tag.color, exists: true },
                    })}
                    labels={followLabels}
                  />
                )}
              </span>
            );
          })}
        </div>
        {/* <button className="kn-trending-all">
          {selectedLanguage === 'hi' ? 'सभी देखें' : 'View All'} &rsaquo;
        </button> */}
      </div>
    </div>
  );
}
