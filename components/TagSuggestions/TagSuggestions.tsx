'use client';

import styles from './TagSuggestions.module.css';

type TagSuggestionsProps = {
  suggestions: string[];
  loading: boolean;
  onTagSelect: (tag: string) => void;
};

export default function TagSuggestions({ suggestions, loading, onTagSelect }: TagSuggestionsProps) {
  if (loading && suggestions.length === 0) {
    return <div className={styles.loading}>Finding similar tags...</div>;
  }

  if (suggestions.length === 0) {
    return <div className={styles.empty}>No similar tags found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>Suggested Tags</div>
      <div className={styles.list}>
        {suggestions.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagSelect(tag)}
            className={styles.tagItem}
          >
            <span className={styles.hash}>#</span>
            {tag.replace(/^#/, '')}
          </button>
        ))}
      </div>
    </div>
  );
}
