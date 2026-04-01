"use client";

import React, { useState } from 'react';
import { 
  Settings, 
  Network, 
  User, 
  ShieldCheck,
  Upload,
  FolderOpen,
  Database,
  Server,
  Workflow,
  TerminalSquare,
  Filter,
  ArrowDownAZ,
  Download,
  Bot,
  Wand2,
  CalendarClock,
  Sparkles,
  History,
  Zap,
  Paperclip,
  Mic,
  X
} from 'lucide-react';

// --- Mock Data ---
const initialData = [
  { id: '001', timestamp: '2023-10-12T14:22:01Z', sensorId: 'SN-40293-A', status: 'OK_200', value: '144.20', operator: 'USR_881', machine: 'LHR-PLANT-01' },
  { id: '002', timestamp: '2023-10-12T14:22:04Z', sensorId: 'SN-40293-A', status: 'NULL', value: '143.98', operator: 'USR_881', machine: 'LHR-PLANT-01' },
  { id: '003', timestamp: 'INVALID_FMT', sensorId: 'SN-40293-B', status: 'ERR_500', value: '--', operator: 'USR_442', machine: 'LHR-PLANT-02' },
  { id: '004', timestamp: '2023-10-12T14:22:10Z', sensorId: 'SN-40294-C', status: 'OK_200', value: '12.01', operator: 'USR_101', machine: 'BER-PLANT-09' },
  { id: '005', timestamp: '2023-10-12T14:22:15Z', sensorId: 'SN-40294-C', status: 'OK_200', value: '12.05', operator: 'USR_101', machine: 'BER-PLANT-09' },
];

export default function Workspace() {
  const [data, setData] = useState(initialData);
  const [logs, setLogs] = useState([
    "[2023-10-12 14:25:01] INITIALIZING STITCH_ENGINE_V2.0...",
    "> Establishing VPN tunnel to cloud nodes...",
    "> Loading dataset: Factory_Output_Q3.csv",
    "> Scanning columns for structural integrity...",
    "> [ALERT] Found 14 nulls in column 'Value'",
    "> [ERROR] 1 cell in column 'Timestamp' failed ISO-8601 validation",
    "> Suggestion: Use AI Command Center to run \"Fix Dates\" macro."
  ]);

  const handleCleanNulls = () => {
    setLogs(prev => [...prev, "> Executing MACRO: Clean Nulls..."]);
    setTimeout(() => {
      setData(prevData => prevData.map(row => {
        if (row.status === 'NULL' || row.value === '--') {
          return { ...row, status: 'FIXED', value: '0.00' };
        }
        return row;
      }));
      setLogs(prev => [...prev, "> Fixed null values. Replaced with 0.00"]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-surface text-on-surface font-body overflow-hidden">
      {/* TopAppBar */}
      <header className="bg-surface-container shadow-[0_1px_0_0_rgba(255,255,255,0.05)] flex justify-between items-center w-full px-6 h-14 z-50 shrink-0">
        <div className="flex items-center gap-8">
          <h1 className="text-primary font-black tracking-widest text-xl font-headline uppercase">EXCEL_DATA_ANALYZER</h1>
          <nav className="hidden md:flex items-center gap-2">
            <a className="text-primary border-b-2 border-primary px-4 py-2 font-headline font-bold tracking-tighter uppercase text-sm transition-all active:scale-95" href="#">Python Offline</a>
            <a className="text-slate-500 hover:text-primary px-4 py-2 font-headline font-bold tracking-tighter uppercase text-sm hover:bg-surface-container-highest transition-all active:scale-95" href="#">Gemini Cloud</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1 text-[10px] font-mono text-primary border border-primary/20">
            <ShieldCheck size={14} />
            VPN_CONNECTED
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <button className="hover:text-primary transition-colors"><Settings size={18} /></button>
            <button className="hover:text-primary transition-colors"><Network size={18} /></button>
            <div className="w-8 h-8 bg-surface-container-highest border border-outline-variant flex items-center justify-center">
              <User size={16} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left SideNavBar */}
        <aside className="bg-surface-container-lowest flex flex-col w-64 pt-4 border-r border-outline-variant/20 shrink-0">
          <div className="px-4 mb-6">
            <button className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-surface-container-lowest font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all">
              <Upload size={18} />
              UPLOAD_FILES
            </button>
            <p className="text-[10px] text-on-surface-variant/60 mt-2 font-mono text-center uppercase">Supported: .xlsx, .xlsb, .csv</p>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            <div className="mb-4">
              <p className="px-2 mb-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">STITCH_WS_01</p>
              <div className="space-y-1">
                <div className="bg-surface-container-highest text-primary border-l-4 border-primary flex items-center px-4 py-3 cursor-pointer group">
                  <FolderOpen size={18} className="mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Factory_Output_Q3.csv</p>
                    <p className="text-[9px] opacity-60 font-mono uppercase">Active Session</p>
                  </div>
                </div>
                <div className="text-slate-500 hover:text-slate-300 hover:bg-surface-container flex items-center px-4 py-3 cursor-pointer transition-colors group">
                  <Database size={18} className="mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Inventory_Logs.xlsx</p>
                    <p className="text-[9px] opacity-60 font-mono uppercase">Cached 2h ago</p>
                  </div>
                </div>
                <div className="text-slate-500 hover:text-slate-300 hover:bg-surface-container flex items-center px-4 py-3 cursor-pointer transition-colors group">
                  <Server size={18} className="mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Sensors_Raw_DUMP.csv</p>
                    <p className="text-[9px] opacity-60 font-mono uppercase">Ready</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <p className="px-2 mb-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">System</p>
              <div className="space-y-1">
                <div className="text-slate-500 hover:text-slate-300 flex items-center px-4 py-2 text-xs uppercase tracking-wider cursor-pointer">
                  <Workflow size={18} className="mr-3" /> Pipeline
                </div>
                <div className="text-slate-500 hover:text-slate-300 flex items-center px-4 py-2 text-xs uppercase tracking-wider cursor-pointer">
                  <TerminalSquare size={18} className="mr-3" /> Logs
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Workspace */}
        <section className="flex-1 flex flex-col min-w-0 bg-surface">
          {/* Data Grid */}
          <div className="flex-[7] overflow-hidden flex flex-col">
            <div className="h-10 border-b border-outline-variant/20 flex items-center px-4 bg-surface-container-low justify-between shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-primary uppercase tracking-tighter font-mono">Current_Table: Factory_Output_Q3</span>
                <span className="text-[10px] text-on-surface-variant font-mono">Rows: 12,402 | Cols: 14</span>
              </div>
              <div className="flex gap-2 text-on-surface-variant">
                <button className="hover:text-primary transition-colors"><Filter size={14} /></button>
                <button className="hover:text-primary transition-colors"><ArrowDownAZ size={14} /></button>
                <button className="hover:text-primary transition-colors"><Download size={14} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-surface-container-lowest">
              <table className="w-full border-collapse text-xs text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-surface-container text-on-surface-variant uppercase font-bold text-[10px] tracking-wider z-10">
                  <tr>
                    <th className="p-3 border-r border-outline-variant/20 w-12 text-center bg-surface-container-high">#</th>
                    <th className="p-3 border-r border-outline-variant/20 min-w-[180px]">Timestamp</th>
                    <th className="p-3 border-r border-outline-variant/20 min-w-[120px]">Sensor_ID</th>
                    <th className="p-3 border-r border-outline-variant/20 min-w-[120px]">Status_Code</th>
                    <th className="p-3 border-r border-outline-variant/20 min-w-[100px]">Value</th>
                    <th className="p-3 border-r border-outline-variant/20 min-w-[150px]">Operator_ID</th>
                    <th className="p-3 min-w-[200px]">Machine_Reference</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {data.map((row, idx) => {
                    const isError = row.status.includes('ERR') || row.timestamp.includes('INVALID');
                    const isWarning = row.status === 'NULL';
                    const isEven = idx % 2 === 0;
                    
                    let rowClass = isEven ? 'bg-surface hover:bg-surface-container-low' : 'bg-surface-container-low hover:bg-surface-container';
                    if (isError) rowClass = 'bg-error-container/10 hover:bg-error-container/20';

                    return (
                      <tr key={row.id} className={`${rowClass} transition-colors group`}>
                        <td className="p-2 border-r border-outline-variant/20 text-center text-on-surface-variant/40 bg-surface-container-lowest">{row.id}</td>
                        <td className={`p-2 border-r border-outline-variant/20 ${isError ? 'text-error' : 'text-primary'}`}>{row.timestamp}</td>
                        <td className="p-2 border-r border-outline-variant/20">{row.sensorId}</td>
                        <td className="p-2 border-r border-outline-variant/20">
                          <span className={`px-1 border text-[10px] ${
                            isError ? 'bg-error-container text-error border-error/50' : 
                            isWarning ? 'bg-secondary/10 text-secondary border-secondary/30' : 
                            'bg-primary/10 text-primary border-primary/30'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className={`p-2 border-r border-outline-variant/20 text-right font-bold ${isError ? 'text-error' : ''}`}>{row.value}</td>
                        <td className="p-2 border-r border-outline-variant/20">{row.operator}</td>
                        <td className="p-2">{row.machine}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Execution Log */}
          <div className="flex-[3] bg-surface-container-lowest border-t border-outline-variant/20 flex flex-col shrink-0">
            <div className="h-8 flex items-center px-4 bg-surface-container-high justify-between shrink-0">
              <div className="flex items-center gap-2">
                <TerminalSquare size={12} className="text-on-surface-variant" />
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-on-surface-variant">Execution_Log</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-primary font-mono">SYS_READY</span>
                <button className="text-on-surface-variant hover:text-white"><X size={12} /></button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-[#00ff9d] leading-relaxed">
              {logs.map((log, i) => {
                const isAlert = log.includes('[ALERT]');
                const isError = log.includes('[ERROR]');
                return (
                  <p key={i} className={`mb-1 ${i === 0 ? 'opacity-50' : ''}`}>
                    {isAlert ? <span className="text-secondary">{log}</span> : 
                     isError ? <span className="text-error">{log}</span> : log}
                  </p>
                );
              })}
              <div className="flex items-center gap-1 mt-2">
                <span className="animate-pulse w-2 h-4 bg-primary inline-block"></span>
                <span className="text-primary-container">_</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right AI Panel */}
        <aside className="bg-surface-container/80 backdrop-blur-xl w-80 flex flex-col border-l border-outline-variant/20 shrink-0">
          <div className="p-4 bg-surface-container-highest">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center">
                <Bot className="text-surface-container-lowest" size={24} />
              </div>
              <div>
                <h2 className="text-xs font-bold font-headline tracking-widest uppercase">GEMINI_ENGINE</h2>
                <p className="text-[10px] text-primary/70 font-mono">READY_FOR_CLEANING</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleCleanNulls}
                className="bg-surface p-2 text-[10px] font-bold uppercase tracking-tighter border border-outline-variant/20 hover:border-primary/50 transition-all active:scale-95 flex flex-col items-center gap-1 group"
              >
                <Wand2 size={16} className="group-hover:text-primary" />
                Clean Nulls
              </button>
              <button className="bg-surface p-2 text-[10px] font-bold uppercase tracking-tighter border border-outline-variant/20 hover:border-primary/50 transition-all active:scale-95 flex flex-col items-center gap-1 group">
                <CalendarClock size={16} className="group-hover:text-primary" />
                Fix Dates
              </button>
              <button className="col-span-2 bg-primary-container/20 text-primary border border-primary/40 p-2 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                <Sparkles size={16} />
                Auto-Format Schema
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-bold uppercase font-mono">
                <History size={12} />
                History
              </div>
              <div className="h-[1px] bg-outline-variant/20 w-full"></div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-primary font-mono">GEMINI_ENGINE <span className="text-on-surface-variant opacity-40">14:26</span></p>
              <div className="bg-primary-container/30 p-3 text-xs leading-relaxed border-l-2 border-primary">
                I've detected potential date formatting issues in <span className="text-primary font-bold">column B</span>. Some values do not match the target ISO-8601 schema. 
                <br/><br/>
                Should I attempt to auto-standardize them?
              </div>
            </div>

            <div className="space-y-1 flex flex-col items-end">
              <p className="text-[10px] font-bold text-on-surface-variant font-mono uppercase">Operator_881 <span className="opacity-40">14:27</span></p>
              <div className="bg-surface-container-highest p-3 text-xs leading-relaxed text-right border-r-2 border-outline-variant">
                Check for nulls first.
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-primary font-mono">GEMINI_ENGINE <span className="text-on-surface-variant opacity-40">14:28</span></p>
              <div className="bg-primary-container/30 p-3 text-xs leading-relaxed border-l-2 border-primary">
                Scan complete. Found 14 nulls in <span className="text-primary font-bold">'Value'</span>. 
                <br/><br/>
                Common strategies:
                <ul className="list-disc ml-4 mt-2 space-y-1 text-primary/80">
                  <li>Fill with <span className="font-mono">MEAN(column)</span></li>
                  <li>Fill with <span className="font-mono">PREV_VALUE</span></li>
                  <li>Drop affected rows</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20 shrink-0">
            <div className="relative group">
              <input 
                className="w-full bg-surface-container text-xs border border-outline-variant/30 px-3 py-4 pr-12 focus:outline-none focus:border-primary transition-colors font-mono" 
                placeholder="Ask Gemini..." 
                type="text"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors">
                <Zap size={16} />
              </button>
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[9px] text-on-surface-variant/40 font-mono uppercase">Context: 12.4k rows active</span>
              <div className="flex gap-2 text-on-surface-variant/40">
                <Paperclip size={12} className="cursor-pointer hover:text-primary" />
                <Mic size={12} className="cursor-pointer hover:text-primary" />
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
