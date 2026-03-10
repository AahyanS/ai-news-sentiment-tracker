import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

function App() {
  const [news, setNews] = useState([]);
  const [topic, setTopic] = useState("technology");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`http://127.0.0.1:8000/news?topic=${topic}`)
//    fetch(`https://ai-news-sentiment-tracker.onrender.com/news?topic=${topic}`)
      .then(res => res.json())
      .then(data => {
        console.log("Articles received:", data);
        if (data.length === 0) {
          setError("No news found for this topic. Try another search!");
        }
        setNews(data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch news. Is your Python server running?");
        setLoading(false);
      });
  }, [topic]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTopic(searchInput);
      setSearchInput("");
    }
  };

  // Calculate Statistics
  const positiveCount = news.filter(n => n.mood === 'Positive').length;
  const neutralCount = news.filter(n => n.mood === 'Neutral').length;
  const negativeCount = news.filter(n => n.mood === 'Negative').length;

  // Setup Data for the Pie Chart
  const chartData = [
    { name: 'Positive', value: positiveCount, color: '#22c55e' }, // Green
    { name: 'Neutral', value: neutralCount, color: '#9ca3af' },   // Gray
    { name: 'Negative', value: negativeCount, color: '#ef4444' }  // Red
  ].filter(d => d.value > 0); // This hides slices that have 0 articles

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-2 text-gray-900 tracking-tight">AI News Mood Tracker</h1>
        <p className="text-center text-gray-500 mb-8 text-lg">Currently tracking: <span className="font-bold text-blue-600 capitalize">{topic}</span></p>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-10 justify-center">
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search a topic (e.g., AI, Economy, Sports)..." 
            className="px-5 py-3 rounded-xl w-full max-w-md shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition transform hover:-translate-y-0.5">
            Analyze
          </button>
        </form>

        {/* --- NEW: Wikipedia Summary Card --- */}
        {!loading && !error && news.length > 0 && news[0].wiki_summary && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-blue-500 mb-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 text-2xl">📖</span>
              <h2 className="text-xl font-bold capitalize">What is {topic}?</h2>
            </div>
            <p className="text-gray-600 leading-relaxed italic">
              "{news[0].wiki_summary}"
            </p>
            <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest font-semibold">Source: Wikipedia</p>
          </div>
        )}

        {loading && <p className="text-center text-xl text-blue-500 font-semibold mt-10 animate-pulse">Running AI Analysis...</p>}
        {error && <p className="text-center text-xl text-red-500 font-semibold mt-10 bg-red-50 p-4 rounded-xl border border-red-200">{error}</p>}

        {!loading && !error && news.length > 0 && (
          <>
            {/* Dashboard Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex flex-col items-center justify-center col-span-2 sm:col-span-1">
                  <span className="text-3xl font-bold text-green-600">{positiveCount}</span>
                  <span className="text-gray-500 font-medium mt-1">Positive</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex flex-col items-center justify-center col-span-2 sm:col-span-1">
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
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* The News Feed */}
            <div className="grid gap-5">
              {news.map((art, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center transition hover:shadow-md hover:border-blue-100 group">
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
          </>
        )}
      </div>
    </div>
  )
}

export default App