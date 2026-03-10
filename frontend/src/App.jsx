import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

function App() {
  const [news, setNews] = useState([]);
  const [topic, setTopic] = useState("technology");
  const [page, setPage] = useState(1); // Track the current page
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = window.location.hostname === "localhost" 
    ? "http://127.0.0.1:8000" 
    : "https://ai-news-sentiment-tracker.onrender.com";

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch(`${API_BASE}/news?topic=${topic}&page=${page}`)
      .then(res => res.json())
      .then(data => {
        if (data.length === 0 && page === 1) {
          setError("No news found for this topic. Try another search!");
        }
        
        // LOGIC: If it's page 1, set the data. If page 2+, append it to previous news.
        setNews(prev => (page === 1 ? data : [...prev, ...data]));
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch news. Please check your connection.");
        setLoading(false);
      });
  }, [topic, page, API_BASE]); // Runs when topic OR page changes

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTopic(searchInput);
      setPage(1); // Reset to page 1 for a new search
      setSearchInput("");
    }
  };

  const positiveCount = news.filter(n => n.mood === 'Positive').length;
  const neutralCount = news.filter(n => n.mood === 'Neutral').length;
  const negativeCount = news.filter(n => n.mood === 'Negative').length;

  const chartData = [
    { name: 'Positive', value: positiveCount, color: '#22c55e' },
    { name: 'Neutral', value: neutralCount, color: '#9ca3af' },
    { name: 'Negative', value: negativeCount, color: '#ef4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-2 text-gray-900 tracking-tight text-balance">
          AI News Mood Tracker
        </h1>
        <p className="text-center text-gray-500 mb-8 text-lg">
          Currently tracking: <span className="font-bold text-blue-600 capitalize">{topic}</span>
        </p>
        
        <form onSubmit={handleSearch} className="flex gap-3 mb-10 justify-center">
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search a topic..." 
            className="px-5 py-3 rounded-xl w-full max-w-md shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition transform hover:-translate-y-0.5">
            Analyze
          </button>
        </form>

        {/* Wikipedia Card */}
        {!loading && news.length > 0 && news[0].wiki_summary && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-blue-500 mb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 text-2xl">📖</span>
              <h2 className="text-xl font-bold capitalize">What is {topic}?</h2>
            </div>
            <p className="text-gray-600 leading-relaxed italic">"{news[0].wiki_summary}"</p>
            <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest font-semibold">Source: Wikipedia</p>
          </div>
        )}

        {error && <p className="text-center text-xl text-red-500 font-semibold mt-10 bg-red-50 p-4 rounded-xl border border-red-200">{error}</p>}

        {news.length > 0 && (
          <>
            {/* Dashboard Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-green-600">{positiveCount}</span>
                  <span className="text-gray-500 font-medium mt-1">Positive</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-red-600">{negativeCount}</span>
                  <span className="text-gray-500 font-medium mt-1">Negative</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center col-span-2">
                  <span className="text-3xl font-bold text-gray-600">{neutralCount}</span>
                  <span className="text-gray-500 font-medium mt-1">Neutral</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64 md:h-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* News Feed */}
            <div className="grid gap-5">
              {news.map((art, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="pr-4">
                    <h2 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition">{art.title}</h2>
                    <a href={art.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 font-semibold text-sm mt-3 inline-flex items-center gap-1">
                      Read Source Article <span>↗</span>
                    </a>
                  </div>
                  <span className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${
                    art.mood === 'Positive' ? 'bg-green-100 text-green-700' : 
                    art.mood === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {art.mood}
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-12 flex flex-col items-center gap-4">
                {loading && (
                    <p className="text-blue-500 font-semibold animate-pulse">
                        Analyzing more articles...
                    </p>
                )}
                
                {!loading && (
                    <button 
                        onClick={() => setPage(prev => prev + 1)}
                        className="bg-white border-2 border-blue-600 text-blue-600 px-10 py-3 rounded-xl font-bold hover:bg-blue-50 transition shadow-sm active:scale-95"
                    >
                        Load More Articles
                    </button>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App