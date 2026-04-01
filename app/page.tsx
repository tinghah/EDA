"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, FolderOpen, Filter, ArrowUpDown, Download, Bot, Sparkles,
  X, FileSpreadsheet, Trash2, Search, ChevronLeft, ChevronRight,
  Merge, BarChart3, Loader2, CheckCircle2, AlertCircle, Send,
  ArrowUp, ArrowDown, FileDown, Check, XCircle, Info, MessageSquare,
  Table2, TerminalSquare, Cpu, Cloud, Zap, Settings, Sun, Moon,
  Maximize2, Minimize2, ChevronDown, Sheet, PanelLeftClose, PanelLeftOpen, Key, Eye, EyeOff
} from 'lucide-react';
import { useNotification } from '@/hooks/useNotification';
import { renderMarkdown } from '@/lib/markdown';
import DOMPurify from 'dompurify';

// Use an empty API_BASE for Next.js rewrites to the backend.
const API_BASE = '';

// ==================== TYPES ====================
interface FileEntry {
  id: string;
  fileId: string;
  originalName: string;
  uploadedAt: string;
  size: number;
  sheetNames: string[];
  stats: { sheetCount: number; totalRows: number; totalCols: number };
}

interface SheetData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  totalCols: number;
  totalPages: number;
  page: number;
  pageSize: number;
  sheetName: string;
  sheetNames: string[];
  originalName: string;
  fileId: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface ColumnStats {
  column: string;
  totalValues: number;
  nonEmpty: number;
  empty: number;
  unique: number;
  isNumeric: boolean;
  min?: number;
  max?: number;
  sum?: number;
  mean?: number;
  median?: number;
  topValues: { value: string; count: number }[];
}

interface GeminiModelInfo {
  id: string;
  name: string;
  description: string;
}

interface GeminiStatus {
  connected: boolean;
  error?: string;
  message?: string;
  models: GeminiModelInfo[];
}

// ==================== MAIN COMPONENT ====================
export default function Workspace() {
  const { notification, showNotification } = useNotification();

  // AI Mode & Models
  const [aiMode, setAiMode] = useState<'offline' | 'gemini'>('offline');
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // File management
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, any>[] | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState('');
  
  // UI State
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logCollapsed, setLogCollapsed] = useState(false);
  
  // Panel Sizes
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [aiPanelWidth, setAiPanelWidth] = useState(360);
  const [logHeight, setLogHeight] = useState(140);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingAi, setIsResizingAi] = useState(false);
  const [isResizingLog, setIsResizingLog] = useState(false);

  // Modals & Menus
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSheetMenu, setShowSheetMenu] = useState(false);
  
  // AI Chat & Results
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSessionId, setChatSessionId] = useState<string>(Date.now().toString());
  const [columnStats, setColumnStats] = useState<ColumnStats | null>(null);

  // Logs
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] EDA System initialized. Ready to analyze data.`
  ]);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-200), `[${timestamp}] ${msg}`]);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ==================== API HELPERS ====================

  const fetchFiles = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/files`);
      const data = await resp.json();
      setFiles(data.files || []);
    } catch (err) {
      addLog('Failed to fetch files from backend');
    }
  };

  const fetchFileData = async (fileId: string, sheet?: string, page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (sheet) params.set('sheet', sheet);

      const resp = await fetch(`${API_BASE}/api/file/${fileId}?${params}`);
      const data = await resp.json();

      if (resp.ok) {
        setSheetData(data);
        setCurrentPage(data.page);
        setActiveSheet(data.sheetName);
        setSearchResults(null);
        setSortColumn(null);
        setFilterColumn('');
        setFilterValue('');
        setColumnStats(null);
        addLog(`Loaded File_ID:${data.fileId} "${data.originalName}" - Sheet: ${data.sheetName}`);
      } else {
        showNotification('error', data.error || 'Failed to load file');
      }
    } catch (err: any) {
      showNotification('error', 'Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFiles = async (fileList: FileList | File[]) => {
    setIsUploading(true);
    addLog('Uploading files...');
    try {
      const formData = new FormData();
      Array.from(fileList).forEach(file => formData.append('files', file));

      const resp = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
      const data = await resp.json();

      if (data.success) {
        await fetchFiles();
        if (data.files?.[0]) {
          const first = data.files[0];
          setActiveFileId(first.id);
          fetchFileData(first.id);
        }
        showNotification('success', `${data.files.length} file(s) uploaded successfully!`);
        addLog(`✓ Uploded ${data.files.length} files.`);
      } else {
        showNotification('error', data.error || 'Upload failed');
      }
    } catch (err: any) {
      showNotification('error', 'Upload error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ==================== Gemini Direct Support ====================
  const fetchGeminiModels = async (keyInput?: string) => {
    const key = keyInput || geminiApiKey;
    if (!key) return;
    setIsLoadingModels(true);
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, { signal: AbortSignal.timeout(10000) });
      if (resp.ok) {
        const data = await resp.json();
        const models = (data.models || []).filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => ({
            id: m.name.replace('models/', ''),
            name: m.displayName || m.name.replace('models/', '')
          }));
        setGeminiStatus({ connected: true, models });
        addLog(`✓ Gemini API connected browser-direct. Available models: ${models.length}`);
      } else {
        const errMsg = (await resp.json()).error?.message;
        setGeminiStatus({ connected: false, error: 'API_ERROR', message: errMsg, models: [] });
      }
    } catch (err) {
      setGeminiStatus({ connected: false, error: 'CONNECTION_FAILED', message: "VPN may be required to connect to Gemini API.", models: [] });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const saveApiKey = async (key: string) => {
    if (!key.trim()) return;
    setIsLoadingModels(true);
    try {
      localStorage.setItem('eda_gemini_key', key.trim());
      localStorage.setItem('eda_gemini_model', selectedModel);
      setGeminiApiKey(key.trim());
      await fetchGeminiModels(key.trim());
      showNotification('success', 'API configuration updated locally.');
      setShowApiConfig(false);
    } catch (err) {
      showNotification('error', 'Failed to save config.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  // ==================== AI CHAT HANDLERS ====================

  const processAiResults = async (text: string, userMessage: string) => {
    // 1. JSON Transform Match
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch && activeFileId) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.type === 'transform') {
          addLog(`Applying AI transformation: ${parsed.action}...`);
          const resp = await fetch(`${API_BASE}/api/transform-file`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: chatSessionId, mode: aiMode, fileId: activeFileId, sheet: activeSheet, transformJson: parsed, prompt: userMessage
            })
          });
          const data = await resp.json();
          if (data.success) {
            showNotification('success', `New result sheet created: ${data.sheetName}`);
            await fetchFiles();
            setActiveFileId(data.fileId);
            fetchFileData(data.fileId, data.sheetName);
          }
          return;
        }
      } catch (e) { /* Fallback to table detection */ }
    }

    // 2. Markdown Table Match
    if (text.includes('|---|') || text.includes('| --- |')) {
      try {
        const resp = await fetch(`${API_BASE}/api/save-results`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: chatSessionId, mode: aiMode, markdownTable: text, prompt: userMessage })
        });
        const data = await resp.json();
        if (data.success) {
          showNotification('success', `Analysis results saved to sheet.`);
          await fetchFiles();
          setActiveFileId(data.fileId);
          fetchFileData(data.fileId, data.sheetName);
        }
      } catch (e) { console.error('Error saving table result', e); }
    }
  };

  const sendChatMessage = async (msgOverride?: string) => {
    const text = msgOverride || chatInput;
    if (!text.trim()) return;

    if (!msgOverride) setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date().toISOString() }]);
    setIsChatLoading(true);

    try {
      if (aiMode === 'gemini') {
        if (!geminiApiKey) {
          setChatMessages(prev => [...prev, { role: 'ai', content: '⚠ Gemini API key is missing. Click the ⚙ icon to configure.', timestamp: new Date().toISOString() }]);
          return;
        }
        
        // Fetch context from backend
        const ctxResp = await fetch(`${API_BASE}/api/chat-context`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: activeFileId, sheet: activeSheet })
        });
        const ctx = await ctxResp.json();
        
        // Call Gemini directly
        const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiApiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            systemInstruction: { parts: [{ text: ctx.systemPrompt }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          })
        });
        const geminiData = await geminiResp.json();
        const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || geminiData.error?.message || 'No response.';
        setChatMessages(prev => [...prev, { role: 'ai', content: aiText, timestamp: new Date().toISOString() }]);
        processAiResults(aiText, text);
      } else {
        // Offline Backend Analysis
        const resp = await fetch(`${API_BASE}/api/search`, { // Reuse search for now or add back offline chat?
             method: 'POST', headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ query: text, fileId: activeFileId })
        });
        // Simplified offline: just show message and maybe stats
        setChatMessages(prev => [...prev, { role: 'ai', content: `Offline mode is current restricted to manual search and table interaction. Use Gemini mode for complex analysis.`, timestamp: new Date().toISOString() }]);
      }
    } catch (err: any) {
      showNotification('error', 'AI Chat error: ' + err.message);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ==================== EFFECTS & RESIZING ====================

  useEffect(() => {
    fetchFiles();
    // Load config from local storage
    const localKey = localStorage.getItem('eda_gemini_key');
    const localModel = localStorage.getItem('eda_gemini_model');
    if (localKey) {
      setGeminiApiKey(localKey);
      if (localModel) setSelectedModel(localModel);
      fetchGeminiModels(localKey);
    }
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages, isChatLoading]);

  // Window Resizing Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) setSidebarWidth(Math.max(160, Math.min(400, e.clientX)));
      if (isResizingAi) setAiPanelWidth(Math.max(280, Math.min(600, window.innerWidth - e.clientX)));
      if (isResizingLog) {
          const mainRect = document.getElementById('main-workspace')?.getBoundingClientRect();
          if (mainRect) setLogHeight(Math.max(80, Math.min(400, mainRect.bottom - e.clientY)));
      }
    };
    const handleMouseUp = () => {
      setIsResizingSidebar(false); setIsResizingAi(false); setIsResizingLog(false);
      document.body.style.cursor = '';
    };

    if (isResizingSidebar || isResizingAi || isResizingLog) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizingLog ? 'row-resize' : 'col-resize';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, isResizingAi, isResizingLog]);

  // Sorting Logic
  const getSortedRows = useCallback(() => {
    let rows = searchResults || sheetData?.rows || [];
    if (sortColumn) {
      rows = [...rows].sort((a, b) => {
        const aVal = a[sortColumn] ?? '';
        const bVal = b[sortColumn] ?? '';
        const isNum = !isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal));
        if (isNum) return sortDirection === 'asc' ? parseFloat(aVal) - parseFloat(bVal) : parseFloat(bVal) - parseFloat(aVal);
        return sortDirection === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }
    if (filterColumn && filterValue) {
        rows = rows.filter(r => String(r[filterColumn] || '').toLowerCase().includes(filterValue.toLowerCase()));
    }
    return rows;
  }, [sheetData, searchResults, sortColumn, sortDirection, filterColumn, filterValue]);

  const rowsToShow = getSortedRows();

  // ==================== RENDER PARTS ====================

  const renderHeader = () => (
    <header className="h-14 bg-surface-container shadow-md flex justify-between items-center px-6 z-50 shrink-0 border-b border-outline-variant/10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 shadow-lg">
            <FileSpreadsheet className="text-surface font-bold" size={20} />
          </div>
          <span className="font-headline font-black text-lg tracking-widest text-primary uppercase">EDA</span>
        </div>
        <div className="flex bg-surface-container-low border border-outline-variant/30 rounded overflow-hidden h-9">
          <button onClick={() => setAiMode('offline')} className={`px-4 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition-all
            ${aiMode === 'offline' ? 'bg-amber-500/20 text-amber-500' : 'text-on-surface-variant hover:bg-surface-container'}`}>
            <Cpu size={14} /> Local
          </button>
          <button onClick={() => setAiMode('gemini')} className={`px-4 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition-all
            ${aiMode === 'gemini' ? 'bg-blue-500/20 text-blue-500' : 'text-on-surface-variant hover:bg-surface-container'}`}>
            <Cloud size={14} /> Gemini
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {activeFileId && sheetData && (
           <div className="bg-surface-container-high px-3 py-1 text-[10px] font-mono text-on-surface-variant hidden md:block border border-outline-variant/10">
             {sheetData.totalRows.toLocaleString()} ROWS
           </div>
        )}
        <button onClick={() => setShowApiConfig(true)} className="p-2 text-on-surface-variant hover:text-primary"><Settings size={18} /></button>
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="p-2 text-on-surface-variant hover:text-primary">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {aiMode === 'gemini' && !!geminiApiKey && (
           <div className="relative">
              <button onClick={() => setShowModelMenu(!showModelMenu)} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 h-9 text-[11px] font-mono flex items-center gap-2 uppercase tracking-tighter">
                <Zap size={14} /> {selectedModel} <ChevronDown size={12} />
              </button>
              {showModelMenu && geminiStatus?.connected && (
                <div className="absolute right-0 top-11 bg-surface-container h-auto max-h-[300px] w-[240px] shadow-2xl border border-outline-variant/20 z-[100] overflow-y-auto">
                    {geminiStatus.models.map(m => (
                       <button key={m.id} onClick={() => { setSelectedModel(m.id); setShowModelMenu(false); }} className={`w-full text-left p-3 text-[11px] hover:bg-surface-container-high border-b border-outline-variant/10 ${selectedModel === m.id ? 'text-primary bg-primary/5 font-bold' : 'text-on-surface-variant'}`}>
                         {m.id}
                       </button>
                    ))}
                </div>
              )}
           </div>
        )}
      </div>
    </header>
  );

  const renderSidebar = () => (
    <aside className={`bg-surface-container-low border-r border-outline-variant/20 flex flex-col relative transition-all duration-300 shrink-0 ${sidebarCollapsed ? 'w-0 overflow-hidden' : ''}`} style={{ width: sidebarCollapsed ? 0 : sidebarWidth }}>
       <div className="p-4 border-b border-outline-variant/10 flex flex-col gap-2">
         <input type="file" ref={fileInputRef} multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
         <button onClick={() => fileInputRef.current?.click()} className="bg-primary hover:brightness-110 text-surface p-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all">
           {isUploading ? <><Loader2 size={16} className="animate-spin" /> Working...</> : <><Upload size={16} /> Upload Sheet</>}
         </button>
       </div>
       <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          <p className="text-[9px] uppercase font-black tracking-widest text-on-surface-variant/40 px-3 mb-2">Workspace Files</p>
          {files.map(f => (
            <div key={f.id} onClick={() => { setActiveFileId(f.id); fetchFileData(f.id); }} className={`p-3 cursor-pointer group flex items-start gap-3 transition-colors rounded-sm mb-1 ${activeFileId === f.id ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'hover:bg-surface-container text-on-surface-variant'}`}>
               <FolderOpen size={16} className="mt-0.5 shrink-0" />
               <div className="flex-1 min-w-0 pr-1">
                  <p className="text-[11px] font-bold truncate leading-tight uppercase font-headline" title={f.originalName}>{f.originalName}</p>
                  <p className="text-[9px] font-mono opacity-50 mt-1 flex items-center gap-2">
                     <span className="bg-surface-container-highest px-1 text-primary">ID:{f.fileId}</span>
                     <span>{f.stats.totalRows.toLocaleString()}R • {f.stats.sheetCount}S</span>
                  </p>
               </div>
               <button onClick={(e) => { e.stopPropagation(); fetch(`${API_BASE}/api/file/${f.id}`, { method: 'DELETE' }).then(() => fetchFiles()); }} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded-full transition-all">
                 <X size={14} />
               </button>
            </div>
          ))}
          {files.length === 0 && (
             <div className="p-8 text-center opacity-20">
               <FileSpreadsheet size={32} className="mx-auto mb-2" />
               <p className="text-[10px] font-mono">No files uploaded.</p>
             </div>
          )}
       </div>
       <div onMouseDown={() => setIsResizingSidebar(true)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 z-10" />
    </aside>
  );

  const renderWorkspace = () => (
    <section id="main-workspace" className="flex-1 flex flex-col min-w-0 bg-surface relative overflow-hidden" 
      onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }} 
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}>
      
      {dragOver && (
         <div className="absolute inset-0 bg-primary/10 backdrop-blur-md flex items-center justify-center z-[60] border-4 border-primary border-dashed m-4">
           <div className="flex flex-col items-center gap-4 text-primary">
             <Upload size={64} className="animate-bounce" />
             <p className="text-xl font-headline font-black uppercase tracking-widest">Release to Upload</p>
           </div>
         </div>
      )}

      {/* Toolbar */}
      <div className="h-10 bg-surface-container-low border-b border-outline-variant/20 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 hover:bg-surface-container rounded transition-colors">
               {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
            {sheetData && (
              <>
                <div className="flex items-center gap-2 group relative">
                   <button onClick={() => setShowSheetMenu(!showSheetMenu)} className="bg-surface border border-outline-variant/30 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 hover:border-primary transition-all">
                      <Sheet size={12} className="text-primary" /> {activeSheet} <ChevronDown size={10} />
                   </button>
                   {showSheetMenu && (
                     <div className="absolute left-0 top-7 w-[160px] bg-surface-container shadow-2xl border border-outline-variant/30 z-[70]">
                        {sheetData.sheetNames.map(sn => (
                          <button key={sn} onClick={() => { setActiveSheet(sn); fetchFileData(activeFileId!, sn); setShowSheetMenu(false); }} className={`w-full text-left px-3 py-2 text-[11px] hover:bg-surface-container-highest ${activeSheet === sn ? 'text-primary bg-primary/5 font-bold' : 'text-on-surface-variant'}`}>{sn}</button>
                        ))}
                     </div>
                   )}
                </div>
                <div className="hidden md:flex border-l border-outline-variant/30 h-4 mx-1"></div>
                <div className="flex items-center gap-3">
                   <div className="relative flex items-center">
                      <Search size={12} className="absolute left-2 text-on-surface-variant/40" />
                      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage(`Search for "${searchQuery}" in current sheet`)} placeholder="Search rows..." className="bg-surface border border-outline-variant/30 h-7 pl-7 pr-2 text-[10px] focus:outline-none focus:border-primary w-[140px] transition-all focus:w-[220px]" />
                   </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
             {sheetData && (
               <>
                 <button onClick={() => setShowExportMenu(!showExportMenu)} className={`flex items-center gap-2 h-7 px-3 bg-surface border border-outline-variant/30 text-[10px] font-bold uppercase transition-all hover:border-primary group relative`}>
                    <Download size={13} /> Export Data
                    {showExportMenu && (
                      <div className="absolute top-9 right-0 w-[140px] bg-surface-container shadow-2xl border border-outline-variant/30 z-[70]">
                        <button onClick={() => { setShowExportMenu(false); fetch(`${API_BASE}/api/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId: activeFileId, sheet: activeSheet, format: 'xlsx' }) }).then(r => r.blob()).then(b => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${sheetData.originalName}.xlsx`; a.click(); }); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-surface-container-highest flex items-center gap-2"><FileDown size={14} /> Excel (.xlsx)</button>
                        <button onClick={() => { setShowExportMenu(false); fetch(`${API_BASE}/api/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId: activeFileId, sheet: activeSheet, format: 'csv' }) }).then(r => r.blob()).then(b => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${sheetData.originalName}.csv`; a.click(); }); }} className="w-full text-left px-3 py-2 text-[11px] hover:bg-surface-container-highest flex items-center gap-2"><FileDown size={14} /> CSV (.csv)</button>
                      </div>
                    )}
                 </button>
               </>
             )}
          </div>
      </div>

      {/* Main Data View */}
      <div className="flex-1 bg-surface-container-lowest overflow-hidden flex flex-col relative">
        {!sheetData && !isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30 select-none">
             <div className="p-8 border-2 border-dashed border-outline-variant/20 group hover:border-primary/40 cursor-pointer transition-all mb-4" onClick={() => fileInputRef.current?.click()}>
                <Upload size={48} className="text-on-surface-variant group-hover:text-primary transition-all mb-4 mx-auto" />
                <p className="text-lg font-headline font-black uppercase tracking-[0.2em] mb-2">Upload Data</p>
                <p className="text-sm font-mono max-w-xs">Drag and drop your spreadsheet here to begin analysis.</p>
             </div>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
             <Loader2 size={40} className="text-primary animate-spin" />
             <p className="text-xs font-mono animate-pulse tracking-[0.3em] uppercase">Processing Data...</p>
          </div>
        ) : sheetData && (
          <div className="flex-1 overflow-auto bg-surface relative scrollbar-custom">
             <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 bg-surface-container-high z-30 shadow-sm">
                   <tr className="uppercase text-[9px] font-black tracking-widest text-on-surface-variant/70 font-mono">
                      <th className="p-2 border-r border-outline-variant/10 w-12 text-center bg-surface-container-highest">IDX</th>
                      {sheetData.headers.map(h => (
                        <th key={h} className="p-2 border-r border-outline-variant/10 min-w-[120px] max-w-[240px] hover:bg-surface-container-highest transition-colors cursor-pointer group" onClick={() => { if (sortColumn === h) setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); else { setSortColumn(h); setSortDirection('asc'); } }}>
                          <div className="flex items-center justify-between">
                            <span className={`truncate flex-1 ${sortColumn === h ? 'text-primary' : ''}`}>
                              {h}
                              {sortColumn === h && (sortDirection === 'asc' ? <ArrowUp size={10} className="inline ml-1" /> : <ArrowDown size={10} className="inline ml-1" />)}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); fetch(`${API_BASE}/api/column-stats`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ fileId: activeFileId, sheet: activeSheet, column: h })}).then(r => r.json()).then(data => setColumnStats(data)); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary transition-all">
                              <BarChart3 size={12} />
                            </button>
                          </div>
                        </th>
                      ))}
                   </tr>
                </thead>
                <tbody className="text-[11px] font-mono">
                   {rowsToShow.map((row, i) => (
                     <tr key={i} className={`border-b border-outline-variant/5 transition-colors ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-container-low/30'} hover:bg-primary/5 group`}>
                        <td className="p-2 border-r border-outline-variant/10 text-center opacity-20 group-hover:opacity-100 transition-opacity bg-surface-container-lowest/50">{row._rowIndex || i + 1}</td>
                        {sheetData.headers.map(h => (
                          <td key={h} className={`p-2 border-r border-outline-variant/10 truncate max-w-[240px] ${!row[h] ? 'text-on-surface-variant/20 italic' : ''}`} title={String(row[h] || '')}>
                            {row[h] === '' || row[h] === null ? '—' : String(row[h])}
                          </td>
                        ))}
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Column Stats Popover */}
      {columnStats && (
        <div className="absolute right-6 top-16 w-[320px] bg-surface-container-highest shadow-2xl border border-outline-variant/30 z-[100] p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
              <span className="text-xs font-black uppercase text-primary tracking-widest truncate max-w-[200px]">{columnStats.column}</span>
              <button onClick={() => setColumnStats(null)} className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant"><X size={16} /></button>
           </div>
           <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-container p-2 border border-outline-variant/10">
                 <p className="text-[8px] uppercase font-bold text-on-surface-variant/60">Total Vales</p>
                 <p className="text-sm font-black font-headline">{columnStats.totalValues.toLocaleString()}</p>
              </div>
              <div className="bg-surface-container p-2 border border-outline-variant/10">
                 <p className="text-[8px] uppercase font-bold text-on-surface-variant/60">Unique</p>
                 <p className="text-sm font-black font-headline">{columnStats.unique.toLocaleString()}</p>
              </div>
              {columnStats.isNumeric && (
                 <>
                    <div className="bg-surface-container p-2 border border-outline-variant/10 col-span-2">
                       <p className="text-[8px] uppercase font-bold text-primary/60">Statistics (Numeric)</p>
                       <div className="grid grid-cols-2 mt-1 gap-2 border-t border-outline-variant/5 pt-1">
                          <div><span className="text-[7px] text-on-surface-variant/50">AVG</span> <p className="text-[11px] font-bold font-mono">{columnStats.mean?.toFixed(2)}</p></div>
                          <div><span className="text-[7px] text-on-surface-variant/50">SUM</span> <p className="text-[11px] font-bold font-mono text-emerald-500">{columnStats.sum?.toLocaleString()}</p></div>
                          <div><span className="text-[7px] text-on-surface-variant/50">MIN</span> <p className="text-[11px] font-bold font-mono text-red-500">{columnStats.min}</p></div>
                          <div><span className="text-[7px] text-on-surface-variant/50">MAX</span> <p className="text-[11px] font-bold font-mono text-blue-500">{columnStats.max}</p></div>
                       </div>
                    </div>
                 </>
              )}
           </div>
           {columnStats.topValues.length > 0 && (
             <div className="flex flex-col gap-1.5">
                <p className="text-[8px] uppercase font-bold text-on-surface-variant/60">Top Distribution</p>
                <div className="bg-surface flex flex-col gap-1 p-2 border border-outline-variant/10 max-h-[160px] overflow-y-auto">
                   {columnStats.topValues.map((v, idx) => (
                     <div key={idx} className="flex justify-between items-center text-[10px] font-mono border-b border-outline-variant/5 pb-1 last:border-0">
                        <span className="truncate flex-1 pr-2">{v.value || '(empty)'}</span>
                        <span className="text-primary font-bold opacity-70">{v.count}</span>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      )}

      {/* Log Console */}
      <div className={`mt-auto bg-surface-container-lowest border-t border-outline-variant/20 relative transition-all duration-300 ${logCollapsed ? 'h-8' : ''}`} style={{ height: logCollapsed ? 32 : logHeight }}>
         <div onMouseDown={() => setIsResizingLog(true)} className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-primary/40 z-20" />
         <div className="h-full flex flex-col">
            <div className={`h-8 px-4 flex items-center justify-between border-b border-outline-variant/10 bg-surface-container ${logCollapsed ? '' : 'shadow-sm'}`}>
               <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setLogCollapsed(!logCollapsed)}>
                  <TerminalSquare size={14} className="text-secondary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Diagnostics</span>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={() => setLogs([])} className="text-[8px] font-black uppercase border border-outline-variant/20 px-2 py-0.5 hover:bg-surface-container-highest transition-colors">Clear</button>
                  <button onClick={() => setLogCollapsed(!logCollapsed)} className="p-1 hover:bg-surface-container-highest">
                    {logCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                  </button>
               </div>
            </div>
            {!logCollapsed && (
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] leading-relaxed custom-scrollbar">
                {logs.map((log, idx) => (
                  <p key={idx} className={`mb-1 ${log.includes('Failed') || log.includes('error') ? 'text-red-400' : log.includes('✓') ? 'text-emerald-400' : 'text-[#00ffcc]/60'}`}>
                    {log}
                  </p>
                ))}
              </div>
            )}
         </div>
      </div>
    </section>
  );

  const renderAiChat = () => (
    <aside className="bg-surface-container-high border-l border-outline-variant/20 flex flex-col relative shrink-0" style={{ width: aiPanelWidth }}>
       <div className="p-4 bg-surface-container flex flex-col gap-4 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 flex items-center justify-center p-2 shadow-2xl ${aiMode === 'gemini' ? 'bg-blue-600' : 'bg-amber-600'}`}>
                {aiMode === 'gemini' ? <Bot size={24} className="text-white" /> : <Cpu size={24} className="text-white" />}
             </div>
             <div className="flex-1 min-w-0">
                <h3 className="text-xs font-black uppercase tracking-[0.1em]">{aiMode === 'gemini' ? 'Gemini Intelligence' : 'Offline Analyst'}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${aiMode === 'gemini' ? (geminiStatus?.connected ? 'bg-emerald-400' : 'bg-red-400') : 'bg-amber-400'}`}></div>
                   <span className="text-[9px] font-bold font-mono opacity-40 uppercase">{aiMode === 'gemini' ? (geminiStatus?.connected ? 'Online' : 'Disconnected') : 'Local Mode'}</span>
                </div>
             </div>
          </div>
          
          {activeFileId && (
            <div className="grid grid-cols-2 gap-1.5">
               {[
                 { label: 'Summarize', icon: Sparkles, prompt: 'Provide a detailed data summary of this sheet and suggest insights.' },
                 { label: 'Clean', icon: Zap, prompt: 'Suggest data cleaning steps for these rows.' },
                 { label: 'Mismatches', icon: Merge, prompt: 'Find inconsistencies or mismatches in this data.' },
                 { label: 'Visualize', icon: BarChart3, prompt: 'How should I visualize this data? Provide a summary.' }
               ].map(btn => (
                 <button key={btn.label} onClick={() => sendChatMessage(btn.prompt)} disabled={isChatLoading} className="flex items-center gap-2 bg-surface hover:bg-surface-container-lowest border border-outline-variant/20 p-2 text-[9px] font-bold uppercase tracking-tighter transition-all hover:border-primary disabled:opacity-40">
                   <btn.icon size={12} className="text-primary" /> {btn.label}
                 </button>
               ))}
            </div>
          )}
       </div>

       <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {chatMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center p-8 opacity-20 text-center grayscale">
               <Bot size={48} className="mb-4" />
               <p className="text-xs font-mono mb-2 uppercase tracking-widest font-black">AI Readiness</p>
               <p className="text-[10px] leading-relaxed">System initialized. Upload data and toggle Gemini mode for advanced neural analysis.</p>
            </div>
          )}
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
               <span className="text-[8px] font-black font-mono opacity-30 uppercase tracking-[0.2em]">{msg.role === 'ai' ? (aiMode === 'gemini' ? 'Gemini AI' : 'Local') : 'Human'}</span>
               <div className={`p-3 max-w-[92%] shadow-sm ${msg.role === 'user' ? 'bg-primary/5 border-r-4 border-primary text-right' : 'bg-surface-container-highest border-l-4 border-secondary text-left'}`}>
                  <div className="prose prose-invert prose-xs max-w-none text-[11px] leading-relaxed" 
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(msg.content)) }} />
               </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex items-center gap-3 p-3 bg-surface-container-low/50 animate-pulse">
               <Loader2 size={14} className="animate-spin text-primary" />
               <span className="text-[10px] uppercase font-black font-mono tracking-widest opacity-40">Reasoning...</span>
            </div>
          )}
       </div>

       <div className="p-3 bg-surface-container border-t border-outline-variant/20">
          <div className="relative">
             <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }} placeholder={activeFileId ? "Ask about data or command transforms..." : "Upload file to enable chat..."} disabled={isChatLoading || !activeFileId} className="w-full bg-surface-container-lowest border border-outline-variant/30 px-3 py-3 pr-10 text-[11px] font-mono focus:outline-none focus:border-primary transition-all resize-none h-20 leading-relaxed custom-scrollbar" />
             <button onClick={() => sendChatMessage()} disabled={isChatLoading || !chatInput.trim() || !activeFileId} className={`absolute right-3 bottom-3 p-1.5 transition-all active:scale-95 disabled:opacity-20 ${aiMode === 'gemini' ? 'text-primary' : 'text-amber-500'}`}>
                <Send size={18} />
             </button>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
             <span className="text-[8px] font-black font-mono opacity-20 uppercase tracking-widest truncate max-w-[150px]">
               {activeFileId ? `CTX: ${files.find(f => f.id === activeFileId)?.originalName}` : 'NO_CONTEXT'}
             </span>
             <div className="flex items-center gap-3 opacity-30">
               <span className="text-[8px] font-mono uppercase">SHIFT+ENTER NEWLINE</span>
               <span className="text-[8px] font-mono uppercase">ENTER SEND</span>
             </div>
          </div>
       </div>
       <div onMouseDown={() => setIsResizingAi(true)} className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 z-10" />
    </aside>
  );

  // ==================== MAIN RENDER ====================

  return (
    <div className={`flex flex-col h-screen w-full overflow-hidden font-body select-none ${theme === 'dark' ? 'dark bg-surface text-on-surface' : 'light bg-slate-50 text-slate-900 shadow-inner'}`}>
       {notification && (
         <div className={`fixed top-6 right-6 z-[200] px-5 py-3 border-l-4 shadow-2xl animate-in slide-in-from-right duration-300 flex items-center gap-3 text-xs font-bold uppercase tracking-widest
           ${notification.type === 'success' ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500' : 
             notification.type === 'error' ? 'bg-red-950/90 text-red-100 border-red-500' : 
             'bg-blue-950/90 text-blue-200 border-blue-500'}`}>
           {notification.type === 'success' ? <CheckCircle2 size={16} /> : notification.type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />}
           {notification.message}
         </div>
       )}

       {renderHeader()}

       <main className="flex-1 flex overflow-hidden">
          {renderSidebar()}
          {renderWorkspace()}
          {renderAiChat()}
       </main>

       {/* API Config Modal */}
       {showApiConfig && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowApiConfig(false); }}>
           <div className="bg-surface-container shadow-2xl border border-outline-variant/30 w-full max-w-md animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"><Key size={16} className="text-primary" /> Secure API Config</h3>
                 <button onClick={() => setShowApiConfig(false)} className="hover:bg-surface-container-high p-1 rounded transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-6">
                 <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Gemini API Key</label>
                    <input type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} placeholder="AIza..." className="w-full bg-surface-container-highest border border-outline-variant/30 p-3 text-xs font-mono focus:outline-none focus:border-primary" />
                    <p className="text-[8px] mt-2 opacity-40">Your key is stored locally for this session and persisted securely to the workspace configuration.</p>
                 </div>
                 <button onClick={() => saveApiKey(geminiApiKey)} disabled={isLoadingModels} className="w-full bg-primary hover:brightness-110 text-surface p-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]">
                    {isLoadingModels ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Configure Interface</>}
                 </button>
              </div>
           </div>
         </div>
       )}

       <style jsx global>{`
          .scrollbar-thin::-webkit-scrollbar { width: 4px; }
          .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
          .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(var(--primary), 0.1); }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(var(--primary), 0.3); }
          
          .scrollbar-custom::-webkit-scrollbar { width: 8px; height: 8px; }
          .scrollbar-custom::-webkit-scrollbar-track { background: rgba(var(--surface-container), 0.3); }
          .scrollbar-custom::-webkit-scrollbar-thumb { background: rgba(var(--outline-variant), 0.2); border: 2px solid transparent; background-clip: content-box; }
          .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: rgba(var(--outline-variant), 0.4); border: 2px solid transparent; background-clip: content-box; }
       `}</style>
    </div>
  );
}
