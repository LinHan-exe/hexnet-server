"use client";
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState("Connecting...");
  const isFirstLoad = useRef(true);
  const previousStatus = useRef('offline');
  
  // Tab State
  const [activeTab, setActiveTab] = useState('generator');

  // Main Engine State
  const [cmd, setCmd] = useState({
    status: 'idle', engine_status: 'offline', mode: 'Generate Random Strategies',
    strategy: '', sims: 1000, sort: 'Composite Score (Best Overall)',
    auto: true, auto_max: 10, available_strats: [], active_strats: [],
    adv_enabled: false, sma_min: 10, sma_max: 200, tp_min: 0.5, tp_max: 5.0,
    sl_min: 0.5, sl_max: 5.0, logic_max: 2, ideal_tpd: 3.0, ideal_ev: 10.0,
    min_wfe: 50.0, min_wr: 40.0, min_pnl: 0.0, min_sharpe: 1.0, use_genetic: false,
    progress: 0, total_sims: 1000, trade_progress: { current: 0, total: 0 },
    eta: '--:--:--', sims_sec: 0, data_ticker: 'NONE', data_start: 'N/A', data_end: 'N/A',
    fetch_ticker: 'SPY', fetch_interval: '1m', fetch_start: '', fetch_end: '',
    fetch_rth: true, fetch_pct: 0, is_start: '', is_end: '', oos_list: [{ start: '', end: '' }],
    hv_start: '', hv_end: '', hv_oos_list: [{ start: '', end: '' }],
    lv_start: '', lv_end: '', lv_oos_list: [{ start: '', end: '' }], stage_text: ''
  });

  // Polling loop for engine state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/command');
        const json = await res.json();
        setCmd(json);
        if (json.engine_status !== previousStatus.current) {
          setLastUpdate(new Date().toLocaleTimeString());
          previousStatus.current = json.engine_status;
        }
      } catch (err) {
        console.error("State Fetch Error:", err);
      }
    };
    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, []);

  // Send state update back to Python Engine
  const sendCommand = async (updates) => {
    const newState = { ...cmd, ...updates };
    setCmd(newState);
    await fetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newState)
    });
  };

  const handleToggleStrategy = (stratName) => {
    let newActive = [...(cmd.active_strats || [])];
    if (newActive.includes(stratName)) {
      newActive = newActive.filter(s => s !== stratName);
    } else {
      newActive.push(stratName);
    }
    sendCommand({ active_strats: newActive });
  };

  const startBacktest = () => {
    sendCommand({ status: 'backtest_requested', mode: 'Backtest Specific Strategies' });
  };

  const stopEngine = () => {
    sendCommand({ status: 'stop_requested' });
  };

  const tabStyle = (tabName) => ({
    padding: '12px 24px', cursor: 'pointer', fontWeight: 'bold',
    backgroundColor: activeTab === tabName ? '#1f6feb' : '#21262d',
    color: 'white', border: '1px solid #30363d', borderRadius: '6px 6px 0 0',
    marginRight: '5px', transition: '0.2s'
  });

  const inputStyle = { width: '100%', padding: '8px', backgroundColor: '#0d1117', color: 'white', border: '1px solid #30363d', borderRadius: '4px' };

  return (
    <div style={{ backgroundColor: '#0d1117', color: '#c9d1d9', minHeight: '100vh', padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER & GLOBAL PROGRESS */}
        <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#161b22', borderRadius: '8px', border: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 10px 0', color: cmd.engine_status === 'online' ? '#3fb950' : '#f85149' }}>
              Engine: {cmd.engine_status.toUpperCase()}
            </h2>
            <p style={{ margin: 0 }}>Stage: <strong>{cmd.stage_text || 'Idle'}</strong></p>
          </div>
          <button onClick={stopEngine} style={{ padding: '10px 20px', backgroundColor: '#da3633', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Emergency Stop
          </button>
        </div>

        {/* TRADE SIMULATION TRACKER */}
        {cmd.stage_text.includes("Simulating Trades") && cmd.trade_progress?.total > 0 && (
          <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#161b22', borderRadius: '8px', border: '1px solid #30363d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span><strong>Simulation Progress</strong></span>
              <span>{cmd.trade_progress.current.toLocaleString()} / {cmd.trade_progress.total.toLocaleString()} Bars</span>
            </div>
            <div style={{ width: '100%', backgroundColor: '#21262d', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${(cmd.trade_progress.current / cmd.trade_progress.total) * 100}%`, backgroundColor: '#238636', height: '100%', transition: 'width 0.2s linear' }} />
            </div>
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div style={{ display: 'flex', borderBottom: '1px solid #30363d', marginBottom: '20px' }}>
          <div style={tabStyle('generator')} onClick={() => setActiveTab('generator')}>Strategy Generator</div>
          <div style={tabStyle('backtester')} onClick={() => setActiveTab('backtester')}>Live Backtester</div>
        </div>

        {/* TAB CONTENT: GENERATOR */}
        {activeTab === 'generator' && (
          <div style={{ backgroundColor: '#161b22', padding: '20px', borderRadius: '0 8px 8px 8px', border: '1px solid #30363d' }}>
            <h3 style={{ borderBottom: '1px solid #30363d', paddingBottom: '10px' }}>Optimization Parameters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Simulations</label>
                <input type="number" value={cmd.sims} onChange={(e) => sendCommand({ sims: Number(e.target.value) })} style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Sort Target</label>
                <select value={cmd.sort} onChange={(e) => sendCommand({ sort: e.target.value })} style={inputStyle}>
                  <option>Composite Score (Best Overall)</option>
                  <option>Win Rate (%)</option>
                  <option>Net Profit ($)</option>
                  <option>Sharpe Ratio</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>SMA Min/Max</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" value={cmd.sma_min} onChange={(e) => sendCommand({ sma_min: Number(e.target.value) })} style={inputStyle} />
                  <input type="number" value={cmd.sma_max} onChange={(e) => sendCommand({ sma_max: Number(e.target.value) })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Take Profit (TP) Min/Max</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" step="0.1" value={cmd.tp_min} onChange={(e) => sendCommand({ tp_min: Number(e.target.value) })} style={inputStyle} />
                  <input type="number" step="0.1" value={cmd.tp_max} onChange={(e) => sendCommand({ tp_max: Number(e.target.value) })} style={inputStyle} />
                </div>
              </div>

            </div>

            <div style={{ marginTop: '20px' }}>
              <button onClick={() => sendCommand({ status: 'sync_requested' })} style={{ padding: '12px 24px', backgroundColor: '#1f6feb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Run Generator Engine
              </button>
            </div>
          </div>
        )}

        {/* TAB CONTENT: BACKTESTER */}
        {activeTab === 'backtester' && (
          <div style={{ backgroundColor: '#161b22', padding: '20px', borderRadius: '0 8px 8px 8px', border: '1px solid #30363d' }}>
            <h3 style={{ borderBottom: '1px solid #30363d', paddingBottom: '10px' }}>Available Strategies</h3>
            <p style={{ color: '#8b949e', marginBottom: '20px' }}>Select pre-generated strategies from Hexnet to deploy through the multi-threaded simulation engine.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px', maxHeight: '400px', overflowY: 'auto', padding: '10px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
              {cmd.available_strats && cmd.available_strats.length > 0 ? (
                cmd.available_strats.map(strat => (
                  <label key={strat} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', backgroundColor: (cmd.active_strats || []).includes(strat) ? '#1f6feb33' : 'transparent', borderRadius: '4px' }}>
                    <input 
                      type="checkbox" 
                      checked={(cmd.active_strats || []).includes(strat)}
                      onChange={() => handleToggleStrategy(strat)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    {strat}
                  </label>
                ))
              ) : (
                <div style={{ color: '#8b949e', padding: '20px', textAlign: 'center' }}>No strategies currently loaded in the Hexnet Python engine.</div>
              )}
            </div>
            
            <button 
              onClick={startBacktest}
              disabled={!cmd.active_strats || cmd.active_strats.length === 0}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: (!cmd.active_strats || cmd.active_strats.length === 0) ? '#21262d' : '#238636', 
                color: (!cmd.active_strats || cmd.active_strats.length === 0) ? '#8b949e' : 'white', 
                border: 'none', borderRadius: '6px', cursor: (!cmd.active_strats || cmd.active_strats.length === 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold', width: '100%' 
              }}
            >
              Run Backtest on Selected Strategies
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
