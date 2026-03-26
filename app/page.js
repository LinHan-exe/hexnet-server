"use client";
import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch('/api/upload');
        const json = await res.json();
        if (json && json.length > 0) {
          setData(json);
          setLastUpdate(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: '#0d1117', color: '#d1d4dc', minHeight: '100vh', padding: '40px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2b2b36', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#ffffff' }}>Hexnet Remote Terminal</h1>
            <p style={{ margin: 0, color: '#26a69a', fontWeight: 'bold' }}>
              ● Live Engine Active {lastUpdate && <span style={{ color: '#787b86', fontWeight: 'normal', marginLeft: '10px' }}>(Last sync: {lastUpdate})</span>}
            </p>
          </div>
          
          <a 
            href="/api/upload?download=true" 
            download="hexnet_strategies.csv"
            style={{ backgroundColor: '#2962ff', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', transition: '0.2s' }}
          >
            ↓ Download Full CSV
          </a>
        </div>

        {/* Data Table */}
        {data.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#131722', borderRadius: '8px', border: '1px solid #2b2b36' }}>
            <h3 style={{ color: '#787b86' }}>Waiting for Python Engine to push data...</h3>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', backgroundColor: '#131722', borderRadius: '8px', border: '1px solid #2b2b36' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e222d', borderBottom: '1px solid #2b2b36', fontSize: '14px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>Rank</th>
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>SQN Sharpe</th>
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>Win Rate</th>
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>Trades</th>
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>Net PnL</th>
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>Exp. Value</th>
                  <th style={{ padding: '15px 20px', color: '#787b86' }}>SMA Length</th>
                </tr>
              </thead>
              <tbody>
                {/* Display only Top 10 */}
                {data.slice(0, 10).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #2b2b36', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#1e222d' } }}>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#ffffff' }}>#{i + 1}</td>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: row.Sharpe >= 1.0 ? '#26a69a' : '#ef5350' }}>{row.Sharpe?.toFixed(2)}</td>
                    <td style={{ padding: '15px 20px' }}>{row.WinRate?.toFixed(1)}%</td>
                    <td style={{ padding: '15px 20px' }}>{row.Trades}</td>
                    <td style={{ padding: '15px 20px', color: row.PnL >= 0 ? '#26a69a' : '#ef5350' }}>{row.PnL?.toFixed(2)}</td>
                    <td style={{ padding: '15px 20px' }}>{row.EV?.toFixed(2)}</td>
                    <td style={{ padding: '15px 20px', color: '#2962ff', fontWeight: 'bold' }}>{row.SMA || row.s1_SMA || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
