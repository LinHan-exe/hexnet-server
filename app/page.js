"use client";
import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Ping our API every 5 seconds to see if Python sent new data
    const fetchResults = async () => {
      const res = await fetch('/api/upload');
      const json = await res.json();
      if (json && json.length > 0) setData(json);
    };
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: '#131722', color: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Hexnet Remote Monitoring</h1>
      <p style={{ color: '#26a69a' }}>Live Strategy Results</p>
      
      {data.length === 0 ? <p>Waiting for Python Engine to upload...</p> : (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#2b2b2b', borderBottom: '1px solid #444' }}>
              <th style={{ padding: '10px' }}>Sharpe</th>
              <th style={{ padding: '10px' }}>Win %</th>
              <th style={{ padding: '10px' }}>Trades</th>
              <th style={{ padding: '10px' }}>Net PnL</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '10px', color: '#26a69a', fontWeight: 'bold' }}>{row.Sharpe?.toFixed(2)}</td>
                <td style={{ padding: '10px' }}>{row.WinRate?.toFixed(1)}%</td>
                <td style={{ padding: '10px' }}>{row.Trades}</td>
                <td style={{ padding: '10px' }}>{row.PnL?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}