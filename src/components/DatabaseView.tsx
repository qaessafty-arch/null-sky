import React, { useState, useEffect } from 'react';
import { PanelContainer } from './PanelContainer';
import { 
  Database, 
  Server, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Download, 
  Search, 
  Shield, 
  Zap, 
  Code, 
  FileText, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers
} from 'lucide-react';
import { 
  KNOWN_COLLECTIONS, 
  DatabaseHealthInfo, 
  checkDatabaseHealth, 
  getCollectionDocuments, 
  writeDatabaseDocument, 
  deleteDatabaseDocument, 
  seedSampleDatabaseData 
} from '../services/databaseService';
import { soundManager } from '../utils/audio';

interface DatabaseViewProps {
  onClose?: () => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ onClose }) => {
  const [selectedCollection, setSelectedCollection] = useState<string>('users');
  const [healthInfo, setHealthInfo] = useState<DatabaseHealthInfo | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [documents, setDocuments] = useState<{ id: string; data: Record<string, any> }[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit / Create Document Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState('');
  const [editingJsonContent, setEditingJsonContent] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Status & Notification
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    runHealthCheck();
  }, []);

  useEffect(() => {
    loadCollectionData(selectedCollection);
  }, [selectedCollection]);

  const runHealthCheck = async () => {
    setIsPinging(true);
    try {
      const info = await checkDatabaseHealth();
      setHealthInfo(info);
    } catch (e) {
      console.warn('Health check error:', e);
    } finally {
      setIsPinging(false);
    }
  };

  const loadCollectionData = async (colName: string) => {
    setLoadingDocs(true);
    try {
      const docs = await getCollectionDocuments(colName, 100);
      setDocuments(docs);
    } catch (e) {
      console.error('Error loading documents:', e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleOpenCreateModal = () => {
    const randomId = `doc_${Date.now()}`;
    setEditingDocId(randomId);
    
    // Generate default boilerplate JSON based on collection
    let defaultPayload: Record<string, any> = {
      id: randomId,
      createdAt: new Date().toISOString()
    };

    if (selectedCollection === 'users') {
      defaultPayload = {
        uid: randomId,
        displayName: 'New Peshmerga Warrior',
        username: 'warrior_' + Date.now().toString().slice(-4),
        country: 'Kurdistan',
        flag: '☀️',
        elo: 1400,
        respectPoints: 150,
        role: 'member',
        badgeNumber: 25,
        honorRank: 'Knight of the Sun',
        rankBadge: '☀️',
        createdAt: new Date().toISOString()
      };
    } else if (selectedCollection === 'authored_puzzles') {
      defaultPayload = {
        id: randomId,
        title: 'Tactical Checkmate Scenario',
        description: 'Find the winning combination in 2 moves.',
        difficulty: 'Medium',
        rating: 1500,
        fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
        playerColor: 'w',
        solutionMoves: ['c4f7', 'e8e7'],
        authorName: 'Tactics Creator',
        isPublished: true,
        createdAt: new Date().toISOString()
      };
    } else if (selectedCollection === 'announcements') {
      defaultPayload = {
        id: randomId,
        title: 'Championship Event Notice',
        content: 'Registration for the weekly arena championship is now open!',
        author: 'Admin 👑',
        type: 'championship',
        active: true,
        createdAt: new Date().toISOString()
      };
    }

    setEditingJsonContent(JSON.stringify(defaultPayload, null, 2));
    setJsonError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (docItem: { id: string; data: Record<string, any> }) => {
    setEditingDocId(docItem.id);
    setEditingJsonContent(JSON.stringify(docItem.data, null, 2));
    setJsonError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveDocument = async () => {
    setJsonError(null);
    if (!editingDocId.trim()) {
      setJsonError('Document ID cannot be empty.');
      return;
    }

    let parsedData: Record<string, any>;
    try {
      parsedData = JSON.parse(editingJsonContent);
    } catch (e: any) {
      setJsonError(`Invalid JSON format: ${e.message}`);
      return;
    }

    setIsSaving(true);
    try {
      await writeDatabaseDocument(selectedCollection, editingDocId.trim(), parsedData);
      soundManager.playCapture();
      showNotice(`Successfully saved document [${editingDocId}] in ${selectedCollection}!`);
      setIsEditModalOpen(false);
      loadCollectionData(selectedCollection);
    } catch (e: any) {
      setJsonError(`Database write failed: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (confirm(`Are you sure you want to permanently delete document "${docId}" from collection "${selectedCollection}"?`)) {
      try {
        await deleteDatabaseDocument(selectedCollection, docId);
        soundManager.playCapture();
        showNotice(`Deleted document [${docId}]`);
        loadCollectionData(selectedCollection);
      } catch (e: any) {
        showNotice(`Delete error: ${e.message}`);
      }
    }
  };

  const handleCopyJson = (docItem: { id: string; data: Record<string, any> }) => {
    navigator.clipboard.writeText(JSON.stringify(docItem.data, null, 2));
    setCopiedDocId(docItem.id);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const res = await seedSampleDatabaseData();
      soundManager.playVictory();
      showNotice(`Seeded ${res.seeded} sample records into Firestore Database!`);
      loadCollectionData(selectedCollection);
      runHealthCheck();
    } catch (e: any) {
      showNotice(`Seed failed: ${e.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportCollectionJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(documents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `firestore_${selectedCollection}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter documents by search
  const filteredDocs = documents.filter(d => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.id.toLowerCase().includes(query) ||
      JSON.stringify(d.data).toLowerCase().includes(query)
    );
  });

  return (
    <PanelContainer>
      {/* Top Banner / Cloud Database Health Status */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-[#F5C453]/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#52673A] via-[#8C2425] to-[#F5C453] p-0.5 shadow-lg shadow-[#F5C453]/25 flex-shrink-0">
            <div className="w-full h-full bg-[#161c12] rounded-[14px] flex items-center justify-center text-[#F5C453]">
              <Database className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
                Cloud Firestore Database Explorer
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Database
              </span>
            </div>
            <p className="text-xs text-[#DFD0B0]/75 font-mono">
              Database ID: <strong className="text-white">{healthInfo?.databaseId || 'ai-studio-chesskyspro-81bf19f6-839d-4d8e-8c71-e9af0de56150'}</strong>
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={runHealthCheck}
            disabled={isPinging}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#F5C453] ${isPinging ? 'animate-spin' : ''}`} />
            <span>{healthInfo?.latencyMs ? `${healthInfo.latencyMs}ms` : 'Ping DB'}</span>
          </button>

          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="px-3.5 py-2 rounded-xl bg-[#52673A] hover:bg-[#52673A]/90 text-white text-xs font-bold flex items-center gap-1.5 border border-[#F5C453]/40 shadow-md transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>{isSeeding ? 'Seeding...' : 'Seed Sample Records'}</span>
          </button>

          <button
            onClick={handleExportCollectionJson}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#DFD0B0] text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-[#52673A]/80 border border-[#F5C453]/60 text-white text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#F5C453]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Collection Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {KNOWN_COLLECTIONS.map(col => {
          const isSelected = selectedCollection === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setSelectedCollection(col.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-[#52673A] to-[#1e2716] border-[#F5C453] text-white shadow-lg shadow-[#F5C453]/15 scale-[1.02]'
                  : 'bg-black/40 border-white/10 hover:border-white/25 hover:bg-black/60 text-[#DFD0B0]/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base">{col.icon}</span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-[#F5C453]" />}
              </div>
              <div>
                <div className="text-xs font-black text-white truncate">{col.name}</div>
                <div className="text-[10px] font-mono text-[#DFD0B0]/50 truncate">{col.id}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Collection Management Panel */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
        {/* Controls Ribbon */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-[#DFD0B0]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search in ${selectedCollection} documents...`}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-medium focus:border-[#F5C453] focus:outline-none"
              />
            </div>
            <button
              onClick={() => loadCollectionData(selectedCollection)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 cursor-pointer"
              title="Refresh Collection"
            >
              <RefreshCw className={`w-4 h-4 text-[#F5C453] ${loadingDocs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#8C2425] via-[#52673A] to-[#F5C453] hover:brightness-110 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md border border-[#F5C453]/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Insert New Document</span>
          </button>
        </div>

        {/* Documents Content Grid / Cards */}
        {loadingDocs ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#F5C453] border-t-transparent animate-spin mx-auto" />
            <div className="text-xs text-[#DFD0B0]/60 font-mono">Querying Firestore collection: {selectedCollection}...</div>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center space-y-3 border border-dashed border-white/15 rounded-2xl bg-black/20">
            <Database className="w-10 h-10 text-[#F5C453]/40 mx-auto" />
            <div className="text-sm font-bold text-white">No Documents in "{selectedCollection}"</div>
            <p className="text-xs text-[#DFD0B0]/60 max-w-sm mx-auto">
              No matching records found. Insert a new document or click "Seed Sample Records" to populate initial data.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-[#52673A] hover:bg-[#52673A]/90 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5 text-[#F5C453]" />
              <span>Create Document in {selectedCollection}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDocs.map(docItem => {
              const isCopied = copiedDocId === docItem.id;
              return (
                <div
                  key={docItem.id}
                  className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-[#F5C453]/40 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono font-black text-[#F5C453] truncate">
                          📄 {docItem.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleCopyJson(docItem)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
                          title="Copy JSON"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(docItem)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
                          title="Edit Document"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(docItem.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Formatted Preview Fields */}
                    <div className="pt-2 text-xs font-mono space-y-1 max-h-48 overflow-y-auto pr-1">
                      {Object.entries(docItem.data).slice(0, 6).map(([k, v]) => (
                        <div key={k} className="flex items-start justify-between gap-2 text-[11px]">
                          <span className="text-[#DFD0B0]/60 font-semibold">{k}:</span>
                          <span className="text-white text-right truncate max-w-[200px]">
                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      ))}
                      {Object.keys(docItem.data).length > 6 && (
                        <div className="text-[10px] text-[#F5C453] italic">
                          + {Object.keys(docItem.data).length - 6} more fields...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#DFD0B0]/40">
                    <span>Fields: {Object.keys(docItem.data).length}</span>
                    <button
                      onClick={() => handleOpenEditModal(docItem)}
                      className="text-[#F5C453] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <span>Inspect Raw Data</span>
                      <Code className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT / CREATE DOCUMENT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-[#F5C453]/40 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#F5C453]" />
                  <h3 className="text-base font-black text-white">
                    Edit Document in <span className="text-[#F5C453]">{selectedCollection}</span>
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {jsonError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{jsonError}</span>
                </div>
              )}

              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#DFD0B0] block mb-1">Document ID</label>
                  <input
                    type="text"
                    value={editingDocId}
                    onChange={e => setEditingDocId(e.target.value)}
                    placeholder="Document unique key/id"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/70 border border-white/20 text-white font-mono text-xs font-bold focus:border-[#F5C453] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#DFD0B0] block mb-1">Document Payload (JSON)</label>
                  <textarea
                    rows={12}
                    value={editingJsonContent}
                    onChange={e => setEditingJsonContent(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-black/80 border border-white/20 text-emerald-300 font-mono text-xs focus:border-[#F5C453] focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDocument}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#52673A] to-[#8C2425] hover:brightness-110 text-white font-black text-xs flex items-center gap-1.5 shadow-md border border-[#F5C453]/40 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving to Firestore...' : 'Save to Cloud Database'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelContainer>
  );
};
