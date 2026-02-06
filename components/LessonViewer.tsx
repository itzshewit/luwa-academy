
/*
  Luwa Academy – Interactive Lesson Viewer
  V1.0 - Advanced Study Node Experience
*/

import React, { useState, useEffect, useRef } from 'react';
import { User, StudyNote } from '../types.ts';
import { ICONS } from '../constants.tsx';

interface LessonViewerProps {
  user: User;
  note: StudyNote;
  onClose: () => void;
  onUpdateUser: (user: User) => void;
}

interface UserNote {
  id: number;
  text: string;
  section: string;
  timestamp: string;
}

interface Bookmark {
  id: number;
  section: string;
  title: string;
  timestamp: string;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({ user, note, onClose, onUpdateUser }) => {
  const [activeSection, setActiveSection] = useState('intro');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [activeNotesTab, setActiveNotesTab] = useState<'notes' | 'bookmarks'>('notes');
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [highlightMode, setHighlightMode] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Parse simulated Table of Contents based on the note content
  const sections = [
    { id: 'intro', title: 'Introduction', icon: '📖' },
    { id: 'core', title: 'Core Concepts', icon: '📐' },
    { id: 'deep', title: 'Deep Dive', icon: '🔢' },
    { id: 'formulas', title: 'Formulas & Rules', icon: '✏️' },
    { id: 'recap', title: 'Summary Recap', icon: '💡' }
  ];

  useEffect(() => {
    // Load persisted notes/bookmarks from local storage if needed
    const saved = localStorage.getItem(`luwa_note_data_${note.id}`);
    if (saved) {
      const { notes, bms } = JSON.parse(saved);
      setUserNotes(notes || []);
      setBookmarks(bms || []);
    }
  }, [note.id]);

  const saveLocalData = (notes: UserNote[], bms: Bookmark[]) => {
    localStorage.setItem(`luwa_note_data_${note.id}`, JSON.stringify({ notes, bms }));
  };

  const addNote = () => {
    if (!noteInput.trim()) return;
    const newNote: UserNote = {
      id: Date.now(),
      text: noteInput,
      section: activeSection,
      timestamp: new Date().toLocaleString()
    };
    const updated = [newNote, ...userNotes];
    setUserNotes(updated);
    setNoteInput('');
    saveLocalData(updated, bookmarks);
  };

  const deleteNote = (id: number) => {
    const updated = userNotes.filter(n => n.id !== id);
    setUserNotes(updated);
    saveLocalData(updated, bookmarks);
  };

  const addBookmark = () => {
    if (bookmarks.find(b => b.section === activeSection)) {
      alert("Section already bookmarked.");
      return;
    }
    const newBm: Bookmark = {
      id: Date.now(),
      section: activeSection,
      title: sections.find(s => s.id === activeSection)?.title || 'Section',
      timestamp: new Date().toLocaleString()
    };
    const updated = [newBm, ...bookmarks];
    setBookmarks(updated);
    saveLocalData(userNotes, updated);
  };

  const deleteBookmark = (id: number) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    saveLocalData(userNotes, updated);
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHighlight = () => {
    if (!highlightMode) {
      alert("Highlight mode active. Select text in the lesson to highlight.");
      setHighlightMode(true);
    } else {
      setHighlightMode(false);
    }
  };

  const handleMouseUp = () => {
    if (!highlightMode) return;
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 0) {
      const span = document.createElement('span');
      span.className = 'bg-yellow-200 rounded px-1 cursor-pointer hover:bg-yellow-300 transition-colors';
      try {
        const range = selection?.getRangeAt(0);
        range?.surroundContents(span);
        selection?.removeAllRanges();
      } catch (e) {
        console.warn("Cross-element highlighting not supported in this beta node.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-slate-50 animate-m3-fade">
      {/* Viewer Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-4">
           <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all">
              <ICONS.X className="w-5 h-5" />
           </button>
           <div className="h-10 w-px bg-slate-100 mx-2" />
           <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{note.topic.en}</h1>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                 <span>{note.subjectId}</span>
                 <span className="w-1 h-1 rounded-full bg-slate-300" />
                 <span>25 Min Read</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className={`p-3 rounded-xl transition-all ${sidebarOpen ? 'bg-luwa-primary text-white' : 'bg-slate-50 text-slate-400'}`}
             title="Table of Contents"
           >
              <ICONS.Menu className="w-5 h-5" />
           </button>
           <button 
             onClick={handleHighlight}
             className={`p-3 rounded-xl transition-all ${highlightMode ? 'bg-amber-400 text-white' : 'bg-slate-50 text-slate-400'}`}
             title="Highlight Selection"
           >
              <span className="text-lg leading-none">✨</span>
           </button>
           <button 
             onClick={addBookmark}
             className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-luwa-primaryContainer hover:text-luwa-primary transition-all"
             title="Bookmark Section"
           >
              <span className="text-lg leading-none">🔖</span>
           </button>
           <button 
             onClick={() => setNotesOpen(!notesOpen)}
             className={`p-3 rounded-xl transition-all ${notesOpen ? 'bg-luwa-primary text-white' : 'bg-slate-50 text-slate-400'}`}
             title="Scholar Notes"
           >
              <ICONS.Layout className="w-5 h-5" />
           </button>
           <button onClick={() => { alert("Lesson marked as complete. XP Synced."); onClose(); }} className="ml-4 px-6 py-3 bg-luwa-secondary text-white rounded-xl label-small font-black uppercase tracking-widest shadow-m3-1 hover:brightness-110 active:scale-95 transition-all">
              Mark Complete
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Table of Contents */}
        <aside className={`bg-white border-r border-slate-100 flex flex-col transition-all duration-300 overflow-hidden ${sidebarOpen ? 'w-80' : 'w-0'}`}>
           <div className="p-8 shrink-0">
              <h3 className="label-large font-black uppercase tracking-widest text-slate-400">Registry Index</h3>
           </div>
           <nav className="flex-1 overflow-y-auto px-4 pb-10 space-y-1 custom-scrollbar">
              {sections.map((s, idx) => (
                <button 
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className={`w-full text-left p-5 rounded-2xl flex items-center gap-4 transition-all ${activeSection === s.id ? 'bg-luwa-primaryContainer text-luwa-primary shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                   <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm">{s.icon}</span>
                   <div>
                      <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Node {idx + 1}</p>
                      <p className="text-sm font-bold">{s.title}</p>
                   </div>
                </button>
              ))}
           </nav>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar relative" onMouseUp={handleMouseUp}>
           <div className="max-w-4xl mx-auto py-12 px-6">
              <article className="bg-white rounded-m3-2xl p-10 md:p-16 shadow-m3-2 border border-slate-100 space-y-12" ref={contentRef}>
                 <section id="intro">
                    <h2 className="display-small font-serif font-black text-slate-900 mb-6 tracking-tight">Introduction</h2>
                    <p className="text-lg text-slate-600 leading-relaxed font-medium">
                      In the institutional framework of {note.subjectId}, specifically Grade {note.gradeLevel} curriculum, this node explores the fundamental principles of "{note.topic.en}". 
                      Mastery of this section is critical for global cognitive alignment and EUEE excellence.
                    </p>
                    <div className="p-8 bg-blue-50 border-l-4 border-luwa-primary rounded-xl mt-10">
                       <p className="text-[10px] font-black uppercase text-luwa-primary tracking-widest mb-2">Institutional Directive</p>
                       <p className="text-sm font-bold text-luwa-onPrimaryContainer">The objective is to synthesize complex data structures into actionable academic knowledge.</p>
                    </div>
                 </section>

                 <section id="core">
                    <h2 className="headline-medium font-serif font-black text-slate-900 mb-6 tracking-tight">Core Concepts</h2>
                    <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-6">
                       <p className="whitespace-pre-wrap">{note.contentHtml.en}</p>
                    </div>
                    {/* Formula Component Integrated from Demo */}
                    <div className="p-10 bg-slate-900 text-white rounded-3xl border border-white/10 text-center font-mono text-2xl font-black shadow-xl my-10 animate-m3-fade">
                       Δk = ∑ (η • 𝜙) / ∫ Ω dt
                       <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-4">Calculus of Registry Stability</p>
                    </div>
                 </section>

                 <section id="deep">
                    <h2 className="headline-medium font-serif font-black text-slate-900 mb-6 tracking-tight">Deep Dive Analysis</h2>
                    <p className="text-slate-600 leading-loose">
                       Analyzing the substrate of this curriculum requires a high-fidelity understanding of its constituent parts. We observe that historical data from EUEE sets (2007-2017 E.C.) indicates a heavy emphasis on these logic nodes.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                       <div className="p-8 bg-amber-50 border border-amber-100 rounded-2xl">
                          <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Critical Pattern A</h4>
                          <p className="text-xs font-medium text-amber-800 leading-relaxed">Cognitive resonance occurs when the scholar identifies the primary causal link in the derivation.</p>
                       </div>
                       <div className="p-8 bg-green-50 border border-green-100 rounded-2xl">
                          <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3">Critical Pattern B</h4>
                          <p className="text-xs font-medium text-green-800 leading-relaxed">Optimization of response latency is achieved through repetitive neural rehearsal of the formula node.</p>
                       </div>
                    </div>
                 </section>

                 <section id="formulas">
                    <h2 className="headline-medium font-serif font-black text-slate-900 mb-6 tracking-tight">Formulas & Rules</h2>
                    <div className="space-y-4">
                       {note.keyFormulas.map((f, i) => (
                         <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-xl font-mono text-lg font-bold flex items-center justify-between">
                            <span>{f}</span>
                            <span className="text-[9px] text-slate-300 font-sans font-black uppercase">Active Rule</span>
                         </div>
                       ))}
                       {note.keyFormulas.length === 0 && (
                         <p className="text-slate-400 italic text-sm">No specialized formula nodes detected for this registry entry.</p>
                       )}
                    </div>
                 </section>

                 <section id="recap">
                    <h2 className="headline-medium font-serif font-black text-slate-900 mb-6 tracking-tight">Summary Recap</h2>
                    <div className="p-10 bg-luwa-primaryContainer border border-luwa-primary/10 rounded-3xl">
                       <h4 className="label-large font-black uppercase text-luwa-primary tracking-widest mb-6">Cognitive Synthesis</h4>
                       <ul className="space-y-4">
                          {[
                            "The node is fundamental to the EUEE cluster.",
                            "Adaptive precision is required for full mastery.",
                            "Consult 'The Instructor' for neural remediation on weak points."
                          ].map((item, i) => (
                            <li key={i} className="flex gap-4 items-start">
                               <div className="w-5 h-5 bg-luwa-primary rounded-full flex items-center justify-center shrink-0 text-[10px] text-white font-black">✓</div>
                               <span className="text-sm font-bold text-luwa-onPrimaryContainer">{item}</span>
                            </li>
                          ))}
                       </ul>
                    </div>
                 </section>
              </article>

              {/* Viewer Footer Navigation */}
              <div className="mt-12 p-8 bg-white border border-slate-200 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                 <button onClick={() => alert("Loading previous registry node...")} className="px-6 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">← Previous Lesson</button>
                 <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Sync Progress</p>
                    <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-luwa-primary" style={{ width: '12.5%' }} />
                    </div>
                 </div>
                 <button onClick={() => alert("Synchronizing next curriculum node...")} className="px-8 py-3 bg-luwa-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-m3-1 hover:brightness-110 active:scale-95 transition-all">Next Lesson →</button>
              </div>
           </div>
        </main>

        {/* Right Sidebar - Notes & Bookmarks */}
        <aside className={`bg-white border-l border-slate-100 flex flex-col transition-all duration-300 overflow-hidden ${notesOpen ? 'w-96' : 'w-0'}`}>
           <div className="p-8 shrink-0 flex items-center justify-between">
              <h3 className="label-large font-black uppercase tracking-widest text-slate-900">Scholar Ledger</h3>
              <button onClick={() => setNotesOpen(false)} className="text-slate-300 hover:text-slate-900"><ICONS.X className="w-5 h-5" /></button>
           </div>
           
           <div className="flex px-4 gap-2 mb-4 shrink-0">
              <button 
                onClick={() => setActiveNotesTab('notes')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeNotesTab === 'notes' ? 'bg-luwa-primary text-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}
              >
                Notes
              </button>
              <button 
                onClick={() => setActiveNotesTab('bookmarks')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeNotesTab === 'bookmarks' ? 'bg-luwa-primary text-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}
              >
                Bookmarks
              </button>
           </div>

           <div className="flex-1 overflow-y-auto px-6 pb-10 custom-scrollbar">
              {activeNotesTab === 'notes' ? (
                <div className="space-y-6">
                   <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <textarea 
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Log insight for this node..."
                        className="w-full h-32 bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium focus:border-luwa-primary outline-none transition-all resize-none"
                      />
                      <button onClick={addNote} className="w-full mt-4 py-4 bg-luwa-primary text-white rounded-xl label-small font-black uppercase tracking-widest shadow-m3-1">💾 Save to Registry</button>
                   </div>
                   <div className="space-y-4">
                      {userNotes.map(n => (
                        <div key={n.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                           <div className="flex justify-between items-start mb-2">
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{n.timestamp}</span>
                              <button onClick={() => deleteNote(n.id)} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
                           </div>
                           <p className="text-sm font-medium text-slate-700 leading-relaxed">{n.text}</p>
                           <p className="mt-4 text-[9px] font-black text-luwa-primary uppercase tracking-tighter italic">Source Node: {sections.find(s => s.id === n.section)?.title}</p>
                        </div>
                      ))}
                      {userNotes.length === 0 && (
                        <div className="py-20 text-center opacity-20">
                           <span className="text-4xl block mb-4">📝</span>
                           <p className="text-[10px] font-black uppercase tracking-widest">Scholar Ledger Empty</p>
                        </div>
                      )}
                   </div>
                </div>
              ) : (
                <div className="space-y-4">
                   {bookmarks.map(b => (
                     <div key={b.id} onClick={() => scrollToSection(b.section)} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:border-luwa-primary group transition-all">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <span className="text-lg">📍</span>
                              <div>
                                 <p className="text-sm font-bold text-slate-900">{b.title}</p>
                                 <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{b.timestamp}</p>
                              </div>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); deleteBookmark(b.id); }} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
                        </div>
                     </div>
                   ))}
                   {bookmarks.length === 0 && (
                     <div className="py-20 text-center opacity-20">
                        <span className="text-4xl block mb-4">🔖</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">No Node Bookmarks</p>
                     </div>
                   )}
                </div>
              )}
           </div>
        </aside>
      </div>
    </div>
  );
};
