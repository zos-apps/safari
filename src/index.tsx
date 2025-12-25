import React, { useState, useRef, useEffect } from 'react';
import type { AppProps } from './types';

export interface SafariConfig {
  homePage?: string;
  bookmarks?: Array<{ name: string; url: string; icon?: string }>;
}

const ZSafari: React.FC<AppProps & { config?: SafariConfig; initialUrl?: string }> = ({
  className,
  config,
  initialUrl
}) => {
  const [url, setUrl] = useState(initialUrl || config?.homePage || 'https://www.google.com');
  const [inputUrl, setInputUrl] = useState(url);
  const [history, setHistory] = useState<string[]>([url]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{title: string; snippet: string; url: string}>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check if URL is Google (requires custom implementation due to iframe blocking)
  const isGoogleUrl = (testUrl: string): boolean => {
    try {
      const urlObj = new URL(testUrl);
      return urlObj.hostname.includes('google.com');
    } catch {
      return false;
    }
  };

  // Check if URL is a search engine that blocks iframes
  const needsCustomSearch = isGoogleUrl(url);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let navigateUrl = inputUrl.trim();
    if (navigateUrl && !navigateUrl.match(/^https?:\/\//i)) {
      navigateUrl = 'https://' + navigateUrl;
    }
    if (navigateUrl) {
      setUrl(navigateUrl);
      setInputUrl(navigateUrl);
      setHistory(prev => [...prev.slice(0, historyIndex + 1), navigateUrl]);
      setHistoryIndex(prev => prev + 1);
      setIsSearchMode(false);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setUrl(history[historyIndex - 1]);
      setInputUrl(history[historyIndex - 1]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setUrl(history[historyIndex + 1]);
      setInputUrl(history[historyIndex + 1]);
    }
  };

  const handleRefresh = () => {
    setIframeKey(Date.now());
  };

  const handleHome = () => {
    const homeUrl = config?.homePage || 'https://www.google.com';
    setUrl(homeUrl);
    setInputUrl(homeUrl);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), homeUrl]);
    setHistoryIndex(prev => prev + 1);
  };

  // Search using Wikipedia API (allows CORS)
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearchMode(true);
    setSearchLoading(true);

    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=10`
      );
      const data = await response.json();
      if (data.query?.search) {
        setSearchResults(data.query.search.map((item: { title: string; snippet: string }) => ({
          title: item.title,
          snippet: item.snippet.replace(/<[^>]*>/g, ''),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
        })));
      }
    } catch (e) {
      console.error('Search failed:', e);
    }
    setSearchLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInputRef.current?.value;
    if (query) {
      handleSearch(query);
    }
  };

  // Auto-focus search input
  useEffect(() => {
    if (needsCustomSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [needsCustomSearch]);

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Navigation Bar */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-[#F6F6F6] dark:bg-[#2D2D2D] border-b border-gray-300/50 dark:border-gray-600/50">
        <button
          className={`p-1.5 rounded-full ${historyIndex > 0 ? 'hover:bg-gray-200 dark:hover:bg-gray-600' : 'opacity-50 cursor-not-allowed'}`}
          onClick={handleBack}
          disabled={historyIndex <= 0}
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className={`p-1.5 rounded-full ${historyIndex < history.length - 1 ? 'hover:bg-gray-200 dark:hover:bg-gray-600' : 'opacity-50 cursor-not-allowed'}`}
          onClick={handleForward}
          disabled={historyIndex >= history.length - 1}
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" onClick={handleRefresh}>
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" onClick={handleHome}>
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        <form onSubmit={handleNavigate} className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 text-sm rounded-full bg-white dark:bg-[#3A3A3A] border border-gray-300/50 dark:border-gray-600/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search or enter website name"
            />
          </div>
        </form>

        <button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white overflow-hidden">
        {needsCustomSearch ? (
          // Custom Google-like search page
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white">
            {!isSearchMode ? (
              <>
                {/* Google Logo */}
                <svg viewBox="0 0 272 92" width="272" height="92" className="mb-8">
                  <path fill="#4285F4" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                  <path fill="#EA4335" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                  <path fill="#FBBC05" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
                  <path fill="#4285F4" d="M225 3v65h-9.5V3h9.5z"/>
                  <path fill="#34A853" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
                  <path fill="#EA4335" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/>
                </svg>

                {/* Search Form */}
                <form onSubmit={handleSearchSubmit} className="w-full max-w-xl">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search the web"
                      className="w-full px-12 py-3 text-lg border border-gray-200 rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:outline-none transition-shadow"
                    />
                  </div>
                  <div className="flex justify-center gap-3 mt-6">
                    <button type="submit" className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open('https://www.google.com/doodles', '_blank')}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      I'm Feeling Lucky
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // Search Results
              <div className="w-full h-full overflow-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                  <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        ref={searchInputRef}
                        type="text"
                        defaultValue={searchQuery}
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
                      Search
                    </button>
                  </form>
                </div>

                <div className="max-w-2xl mx-auto p-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Showing Wikipedia results for "{searchQuery}"
                    <button
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank')}
                      className="ml-2 text-blue-500 hover:underline inline-flex items-center gap-1"
                    >
                      Open Google ↗
                    </button>
                  </p>

                  {searchLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-6">
                      {searchResults.map((result, i) => (
                        <div key={i}>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-lg font-medium"
                          >
                            {result.title}
                          </a>
                          <p className="text-sm text-green-700 truncate">{result.url}</p>
                          <p className="text-sm text-gray-600 mt-1">{result.snippet}...</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-12">No results found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Regular iframe
          <iframe
            src={url}
            title="Safari Content"
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            key={`iframe-${iframeKey}`}
          />
        )}
      </div>
    </div>
  );
};

export default ZSafari;
