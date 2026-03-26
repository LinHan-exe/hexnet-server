"use client";
import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("");
  const [cmd, setCmd] = useState({
    status: 'idle', mode: 'Generate Random Strategies', strategy: '', sims: 1000, sort: 'Composite Score (Best Overall)', auto: true, available_strats: []
  });

  useEffect(() => {
    // Fetch both the CSV results AND the Command State every 3 seconds
    const fetchAll = async () => {
      try {
        const resData = await fetch('/api/upload');
        const jsonData = await resData.json();
        if (jsonData && jsonData.length > 0) {
          setData(jsonData);
          setLastUpdate(new Date().toLocaleTimeString());
        }
        
        const resCmd = await fetch('/api/command');
        const jsonCmd = await resCmd.json();
        if (jsonCmd) setCmd(jsonCmd);
      } catch (err) { console.error(err); }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, []);

  // Send commands to Vercel (Python will pick them up)
  const sendCommand = async (updates) => {
    const newState = { ...cmd, ...updates };
    setCmd(newState);
    await fetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  };

  return (
    <div style={{ backgroundColor: '#0d1117', color: '#d1d4dc', minHeight: '100vh', padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2b2b36', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#ffffff' }}>Hexnet Remote Command</h1>
            <p style={{ margin: 0, color: cmd.status === 'running' ? '#26a69a' : '#ffb74d', fontWeight: 'bold' }}>
              ● Engine Status: {cmd.status.toUpperCase()} {lastUpdate && <span style={{ color: '#787b86', fontWeight: 'normal', marginLeft: '10px' }}>(Sync: {lastUpdate})</span>}
            </p>
          </div>
          <a href="/api/upload?download=true" download="hexnet_strategies.csv" style={{ backgroundColor: '#2962ff', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>↓ Download CSV</a>
        </div>

        {/* REMOTE CONTROL PANEL */}
        <div style={{ backgroundColor: '#1e222d', padding: '20px', borderRadius: '8px', border: '1px solid #2b2b36', marginBottom: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>MODE</label>
            <select value={cmd.mode} onChange={(e) => sendCommand({ mode: e.target.value })} style={{ padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }}>
              <option>Generate Random Strategies</option>
              <option>Optimize Existing Strategy</option>
            </select>
          </div>

          {cmd.mode === 'Optimize Existing Strategy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>BASE STRATEGY</label>
              <select value={cmd.strategy} onChange={(e) => sendCommand({ strategy: e.target.value })} style={{ padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }}>
                {cmd.available_strats.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '120px' }}>
            <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>SIMULATIONS</label>
            <input type="number" value={cmd.sims} onChange={(e) => sendCommand({ sims: parseInt(e.target.value) })} style={{ padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '12px', color: '#787b86', fontWeight: 'bold' }}>SORT BY</label>
            <select value={cmd.sort} onChange={(e) => sendCommand({ sort: e.target.value })} style={{ padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #333', borderRadius: '4px' }}>
              <option>Composite Score (Best Overall)</option><option>Strategy Sharpe</option>
              <option>Expected Value (EV)</option><option>Strategy Alpha</option><option>Net PnL</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#26a69a', fontWeight: 'bold', cursor: 'pointer', padding: '10px' }}>
            <input type="checkbox" checked={cmd.auto} onChange={(e) => sendCommand({ auto: e.target.checked })} style={{ width: '18px', height: '18px' }} /> Continuous Auto-Loop
          </label>

          <button onClick={() => sendCommand({ status: 'start_requested' })} disabled={cmd.status === 'running' || cmd.status === 'start_requested'} style={{ backgroundColor: '#26a69a', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.status === 'running' || cmd.status === 'start_requested') ? 0.5 : 1 }}>
            START
          </button>
          
          <button onClick={() => sendCommand({ status: 'stop_requested' })} disabled={cmd.status === 'idle' || cmd.status === 'stopped'} style={{ backgroundColor: '#ef5350', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: (cmd.status === 'idle' || cmd.status === 'stopped') ? 0.5 : 1 }}>
            STOP
          </button>
        </div>

        {/* ... (KEEP THE TABLE HTML EXACTLY THE SAME AS BEFORE) ... */}
        {data.length === 0 ? ( <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#131722', borderRadius: '8px', border: '1px solid #2b2b36' }}> <h3 style={{ color: '#787b86' }}>Waiting for Python Engine...</h3> </div> ) : ( <div style={{ overflowX: 'auto', backgroundColor: '#131722', borderRadius: '8px', border: '1px solid #2b2b36' }}> <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}> <thead> <tr style={{ backgroundColor: '#1e222d', borderBottom: '1px solid #2b2b36', fontSize: '14px', textTransform: 'uppercase' }}> <th style={{ padding: '15px 20px', color: '#787b86' }}>Rank</th> <th style={{ padding: '15px 20px', color: '#787b86' }}>SQN Sharpe</th> <th style={{ padding: '15px 20px', color: '#787b86' }}>Win Rate</th> <th style={{ padding: '15px 20px', color: '#787b86' }}>Trades</th> <th style={{ padding: '15px 20px', color: '#787b86' }}>Net PnL</th> <th style={{ padding: '15px 20px', color: '#787b86' }}>Exp. Value</th> <th style={{ padding: '15px 20px', color: '#787b86' }}>SMA Length</th> </tr> </thead> <tbody> {data.slice(0, 10).map((row, i) => ( <tr key={i} style={{ borderBottom: '1px solid #2b2b36', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#1e222d' } }}> <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#ffffff' }}>#{i + 1}</td> <td style={{ padding: '15px 20px', fontWeight: 'bold', color: row.Sharpe >= 1.0 ? '#26a69a' : '#ef5350' }}>{row.Sharpe?.toFixed(2)}</td> <td style={{ padding: '15px 20px' }}>{row.WinRate?.toFixed(1)}%</td> <td style={{ padding: '15px 20px' }}>{row.Trades}</td> <td style={{ padding: '15px 20px', color: row.PnL >= 0 ? '#26a69a' : '#ef5350' }}>{row.PnL?.toFixed(2)}</td> <td style={{ padding: '15px 20px' }}>{row.EV?.toFixed(2)}</td> <td style={{ padding: '15px 20px', color: '#2962ff', fontWeight: 'bold' }}>{row.SMA || row.s1_SMA || "N/A"}</td> </tr> ))} </tbody> </table> </div> )}

      </div>
    </div>
  );
}
