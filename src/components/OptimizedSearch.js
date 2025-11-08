import React, { useState, useCallback, memo } from 'react';
import { debounce } from '../utils/performanceConfig';
import { Search } from 'lucide-react';

const OptimizedSearch = memo(({ 
  onSearch, 
  placeholder = 'Buscar...', 
  debounceTime = 300,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value) => {
      onSearch(value);
    }, debounceTime),
    [onSearch, debounceTime]
  );

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className={`optimized-search ${className}`} style={{
      position: 'relative',
      width: '100%',
      maxWidth: '400px'
    }}>
      <div style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-tertiary)',
        pointerEvents: 'none'
      }}>
        <Search size={18} />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 40px 10px 40px',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          fontSize: '14px',
          backgroundColor: 'var(--card-bg)',
          color: 'var(--text-primary)',
          transition: 'all 0.2s ease'
        }}
      />
      {searchTerm && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.placeholder === nextProps.placeholder &&
         prevProps.debounceTime === nextProps.debounceTime;
});

OptimizedSearch.displayName = 'OptimizedSearch';

export default OptimizedSearch;
