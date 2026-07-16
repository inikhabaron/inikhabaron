const FOLLOW_LIST_KEYS = Object.freeze({
  category: 'categories',
  author: 'authors',
  city: 'cities',
});

// Applies a FollowButton onChange event ({ type, id, following, item }) to a
// page's cached { categories, authors, cities } following state, so any
// number of FollowButtons (of any type) on the same page can share one state
// object. Pass the full display object as `item` (whatever the page already
// has on hand — name, nameHi, color, avatar, ...) so it round-trips into the
// cache untouched instead of being reconstructed from just an id/label.
export function applyFollowChange(state, { type, id, following, item }) {
  const key = FOLLOW_LIST_KEYS[type];
  if (!key) return state;

  const list = state[key] || [];

  if (following) {
    if (list.some((entry) => entry.id === id)) return state;
    return { ...state, [key]: [...list, item || { id, exists: true }] };
  }

  return { ...state, [key]: list.filter((entry) => entry.id !== id) };
}
