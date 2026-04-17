// src/pages/ResultDetailsPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import apiClient from '../api';
import html2pdf from 'html2pdf.js';
import AIChatPanel from '../components/AIChatPanel';
import InteractiveQuiz from '../components/InteractiveQuiz';
import { useNavigation } from '../context/NavigationContext';
import { slugify } from '../utils/stringUtils';
import '../App.css'; // Asegúrate de que tus estilos base están aquí

// --- Componentes de UI (pueden moverse a un archivo de componentes compartidos) ---
const Icon = ({ path, className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>);
const ICONS = { summary: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", mindmap: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122", chevronDown: "M19 9l-7 7-7-7", bolt: "M13 10V3L4 14h7v7l9-11h-7z", question: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", film: "M7 4h10M7 8h10M5 22h14a2 2 0 002-2V4a2 2 0 00-2-2H5a2 2 0 00-2 2v16a2 2 0 002 2z", meeting: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", podcast: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.636 5.636a9 9 0 0112.728 0M18.364 18.364A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636", conversation: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", file: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" };


mermaid.initialize({
  startOnLoad: true,
  theme: 'forest',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
    nodeSpacing: 50,
    rankSpacing: 80,
    padding: 20,
    wrappingWidth: 250,
    curve: 'basis'
  },
  themeVariables: {
    fontSize: '16px',
    fontFamily: 'Outfit, sans-serif',
    primaryColor: '#fbbf24',
    nodeBorder: '#b45309',
    mainBkg: '#fffbeb',
    lineColor: '#d97706'
  }
});

const customComponents = {
  li: ({ children }) => (
    <li className="flex items-center gap-3 py-1.5 text-gray-700 text-sm">
      <input type="checkbox" className="h-4 w-4 rounded-full border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer" />
      <span>{children}</span>
    </li>
  ),
  ul: ({ children }) => <ul className="space-y-2 list-none pl-0">{children}</ul>
};

const AccordionSection = ({ title, icon, children, onPdfClick }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
      <div className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-50 transition-colors">
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center flex-1 text-left cursor-pointer">
          <Icon path={icon} className="w-6 h-6 text-amber-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
        </button>
        <div className="flex items-center gap-4">
          {onPdfClick && (
            <button onClick={(e) => { e.stopPropagation(); onPdfClick(); }} className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium text-sm cursor-pointer">
              <Icon path={ICONS.summary} className="w-4 h-4" /> PDF
            </button>
          )}
          <button onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
            <Icon path={ICONS.chevronDown} className={`w-6 h-6 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 border-t">{children}</div>
      </div>
    </div>
  );
};


function ResultDetailsPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useOutletContext();
  const { setIsNotificationsOpen } = useNavigation();
  const [meeting, setMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [generatedContent, setGeneratedContent] = useState([]); // Array para persistencia de tarjetas
  const [transformError, setTransformError] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [previewData, setPreviewData] = useState({ title: '', content: '', type: 'markdown' });
  const [showShareModal, setShowShareModal] = useState(false);
  const [libraryTransformations, setLibraryTransformations] = useState([]); // Biblioteca de contenidos guardados
  const [isRefreshingLibrary, setIsRefreshingLibrary] = useState(false);
  
  // Registrar el acceso por link cuando se abre el modal
  useEffect(() => {
    if (showShareModal) {
      apiClient.post(`/meetings/${meetingId}/share`, { email: "link-shared" })
        .catch(err => console.error("Error activando link compartido:", err));
    }
  }, [showShareModal, meetingId]);

  const getFriendlyUrl = () => {
    const slug = slugify(meeting?.title || "estudio");
    return `${window.location.origin}/beescribe/${meetingId}/${slug}`;
  };

  const cleanMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/---PAGINA---/gi, '')
      .replace(/---PÁGINA---/gi, '')
      .replace(/\[OBJETO JSON VÁLIDO\]/gi, '')
      .replace(/\[INFORME EXTENSO.*?\]/gi, '')
      .replace(/\[GUION.*?\]/gi, '')
      .replace(/\[RESUMEN.*?\]/gi, '')
      .replace(/\[CUESTIONARIO COMPLETO.*?\]/gi, '')
      .replace(/^.*Tarea \d:.*$/gim, '')
      .replace(/^.*FORMATO REQUERIDO:.*$/gim, '')
      .replace(/^.*TRANSCRIPCIÓN:.*$/gim, '')
      .replace(/^.*TRANSCRIPCIÓN DEL AUDIO:.*$/gim, '')
      .replace(/^(nivel_detalle|temas_clave|entidades_relevantes|personajes|genero_sugerido|sentimiento|tema_principal):.*$/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };


  const handleDownloadPdf = () => {
    const element = document.getElementById('pdf-preview-content');
    if (!element) return;
    
    const meetingTitleRequested = meeting?.title || meetingId || 'analisis';
    const reportType = previewData.title || 'reporte';
    const safeTitle = String(meetingTitleRequested).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeReport = String(reportType).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle}_${safeReport}.pdf`;

    const opt = {
      margin: [0.5, 0.5],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const originalStyle = element.style.padding;
    element.style.padding = '20px';
    html2pdf().from(element).set(opt).save().then(() => {
      element.style.padding = originalStyle;
    });
  };

  const handleOpenPreview = (title, content, type = 'markdown') => {
    setPreviewData({ title, content, type });
    setShowPdfPreview(true);
  };

  const handleTransform = async (tipo) => {
    if (isTransforming) return;
    setIsTransforming(true);
    setTransformError(null);
    try {
      const response = await apiClient.post('/meetings/transform', {
        meeting_id: meetingId,
        tipo_transformacion: tipo
      });
      // Ahora solo lo añadimos a la BIBLIOTECA, no lo abrimos automáticamente
      setLibraryTransformations(prev => [response.data, ...prev]);
      alert(`¡${tipo.replace('_', ' ')} generado con éxito! Puedes abrirlo en tu biblioteca. 🐝`);
    } catch (err) {
      setTransformError(`Error al generar ${tipo}. 🧪`);
    } finally {
      setIsTransforming(false);
    }
  };

  const fetchTransformations = async () => {
    try {
      setIsRefreshingLibrary(true);
      const response = await apiClient.get(`/meetings/${meetingId}/transformations`);
      setLibraryTransformations(response.data);
    } catch (err) {
      console.error("Error cargando biblioteca:", err);
    } finally {
      setIsRefreshingLibrary(false);
    }
  };

  const handleToggleTransformation = (trans) => {
    const isAlreadyOpen = generatedContent.some(item => item.id === trans.id);
    
    if (isAlreadyOpen) {
      // Si ya está abierto, lo cerramos (lo quitamos de la vista principal)
      setGeneratedContent(prev => prev.filter(item => item.id !== trans.id));
    } else {
      // Si no está abierto, lo añadimos
      setGeneratedContent(prev => [{
        id: trans.id,
        tipo: trans.tipo,
        contenido_md: trans.contenido_md,
        metadatos: trans.metadatos
      }, ...prev]);
    }
  };

  const handleDeleteTransformation = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este contenido generado?")) return;
    try {
      await apiClient.delete(`/transformations/${id}`);
      setLibraryTransformations(prev => prev.filter(t => t.id !== id));
      // También lo quitamos de la vista principal si estaba abierto
      setGeneratedContent(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert("No se pudo eliminar el contenido.");
    }
  };

  const removeGeneratedItem = (id) => {
    setGeneratedContent(prev => prev.filter(item => item.id !== id));
  };

  // Re-dirigir a la URL amigable si entramos por la ID simple
  useEffect(() => {
    if (meeting && meeting.title && !window.location.pathname.includes('/beescribe/')) {
      const slug = slugify(meeting.title);
      window.history.replaceState(null, '', `/beescribe/${meetingId}/${slug}`);
    }
  }, [meeting, meetingId]);

  useEffect(() => {
    if (showPdfPreview && previewData.type === 'mermaid' && previewData.content) {
      const renderModalMermaid = async () => {
        try {
          const container = document.getElementById('mermaid-preview-container');
          if (container) {
            container.innerHTML = ''; 
            const { svg } = await mermaid.render(`mermaid-svg-modal`, previewData.content);
            container.innerHTML = svg;
          }
        } catch (e) {
          console.error("Error renderizando mermaid:", e);
        }
      };
      setTimeout(renderModalMermaid, 200);
    }
  }, [showPdfPreview, previewData]);

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      if (!meetingId) return;
      try {
        setIsLoading(true);
        const response = await apiClient.get(`/meetings/${meetingId}`);
        const data = response.data;
        setMeeting({
          id: data.id,
          title: data.titulo,
          summary: data.resumen_md,
          mindmap: data.mapa_mermaid,
          createdAt: data.fecha_creacion,
          metadatos: data.metadatos,
        });
      } catch (err) {
        setError('No se pudo cargar el análisis. Es posible que no exista o haya ocurrido un error.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeetingDetails();
    fetchTransformations();
  }, [meetingId]);

  useEffect(() => {
    if (meeting && meeting.mindmap) {
      const renderMermaid = async () => {
        try {
          const container = document.getElementById(`mermaid-details-${meeting.id}`);
          if (container) {
            container.innerHTML = ''; 
            const { svg } = await mermaid.render(`mermaid-svg-${meeting.id}`, meeting.mindmap);
            container.innerHTML = svg;
          }
        } catch (e) {
          console.error("Error renderizando el diagrama:", e);
        }
      };
      setTimeout(renderMermaid, 100);
    }
  }, [meeting]);

  if (isLoading) return <div className="text-center p-10 font-bold bg-white h-screen flex flex-col items-center justify-center"><span className="animate-pulse text-amber-500">Abriendo colmena... 🐝</span></div>;
  if (error || !meeting) return <div className="text-center p-10 h-screen flex flex-col items-center justify-center bg-white"><h2 className="text-2xl font-bold text-red-500">{error || "No se encontró el estudio"}</h2><button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-amber-400 text-gray-900 rounded-xl font-bold">Volver</button></div>;

  return (
    <div className="h-[calc(100vh-96px)] flex flex-col bg-white overflow-hidden font-sans selection:bg-amber-100">
      
      {/* HEADER TIPO NOTEBOOKLM */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-white z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-20 h-20 flex items-center justify-center overflow-hidden -ml-4">
              <img src="/LogoBeeScribe.png" alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <h1 className="text-lg font-bold text-gray-800">{meeting.title || "Estudio"}</h1>
          </div>
          <div className="flex gap-1">
             <button onClick={() => navigate('/statistics')} className="bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 transition-colors border border-gray-100">Estadísticas</button>
             <button onClick={() => setShowShareModal(true)} className="bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 transition-colors border border-gray-100 flex items-center gap-1">
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
               Compartir
             </button>
          </div>
        </div>
         <div className="flex items-center gap-4">
            <button onClick={() => setIsNotificationsOpen(true)} className="text-gray-400 hover:text-amber-500 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-amber-500 transition-colors">
              <svg className="w-6 h-6 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </button>
            <button onClick={() => navigate('/perfil')} className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden shadow-sm flex items-center justify-center ring-4 ring-gray-50 hover:ring-amber-100 transition-all">
              <img 
                src={userProfile?.foto_perfil ? `${apiClient.defaults.baseURL.replace('/api', '')}${userProfile.foto_perfil}` : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"; }}
              />
            </button>
         </div>
      </header>

      {/* BODY DE DOS COLUMNAS */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PANEL IZQUIERDO (DOCUMENTO) */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-10 flex flex-col items-center">
          <div className="w-full max-w-4xl space-y-8 pb-32">
            
            {/* DOCUMENT CARD */}
            <section className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.05)] border border-gray-100 animate-fade-in relative group">
              <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">{meeting.title || "Documento sin título"}</h2>
                <p className="text-xs text-gray-400 font-medium tracking-wide">1 fuente • {new Date(meeting.createdAt).toLocaleDateString()}</p>
              </div>

              {/* RESUMEN EN PÁRRAFO */}
              <div className="prose prose-slate max-w-none text-gray-600 leading-[1.8] text-lg">
                <ReactMarkdown components={{
                  p: ({children}) => <p className="mb-6 text-justify">{children}</p>,
                  ul: ({children}) => <span>{children}</span>,
                  li: ({children}) => <span className="inline italic mr-2 text-amber-600">• {children}. </span>,
                }}>
                  {cleanMarkdown(meeting.summary)}
                </ReactMarkdown>
              </div>
            </section>

            {/* PERSISTENCIA: TARJETAS GENERADAS */}
            {generatedContent.map((item) => (
              <section key={item.id} className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100 animate-slide-up relative group">
                <button 
                  onClick={() => removeGeneratedItem(item.id)}
                  className="absolute top-6 right-6 p-2 text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50"
                  title="Eliminar de la vista"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" /></svg>
                </button>
                <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                   <div className="bg-amber-100 p-2 rounded-xl">
                      <Icon path={ICONS[item.tipo] || ICONS.file} className="w-5 h-5 text-amber-600" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-800 capitalize">{item.tipo.replace('_', ' ')}</h3>
                   {item.tipo !== 'cuestionario' && (
                     <button onClick={() => handleOpenPreview(item.tipo, item.contenido_md)} className="ml-auto text-[10px] font-bold text-amber-500 hover:text-amber-600 uppercase tracking-widest">Descargar PDF</button>
                   )}
                </div>
                {item.tipo === 'cuestionario' && item.metadatos?.preguntas ? (
                  <InteractiveQuiz data={item.metadatos} />
                ) : (
                  <div className="prose prose-slate max-w-none text-gray-600 text-sm leading-relaxed">
                    <ReactMarkdown components={customComponents}>{cleanMarkdown(item.contenido_md)}</ReactMarkdown>
                  </div>
                )}
              </section>
            ))}

            {/* MAPA MENTAL CARD */}
            {meeting.mindmap && (
              <section className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100 animate-fade-in">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Icon path={ICONS.mindmap} className="w-6 h-6 text-amber-500" />
                    Mapa Mental
                  </h3>
                  <button onClick={() => handleOpenPreview('Mapa Mental', meeting.mindmap, 'mermaid')} className="text-amber-500 hover:text-amber-600 font-bold text-xs flex items-center gap-1">
                    <Icon path={ICONS.mindmap} className="w-4 h-4" /> Exportar
                  </button>
                </div>
                <div className="bg-[#fcfcfc] rounded-2xl p-6 overflow-auto border border-gray-50 shadow-inner flex justify-center min-h-[500px]">
                  <div id={`mermaid-details-${meeting.id}`} className="mermaid w-full"></div>
                </div>
              </section>
            )}

          </div>
        </main>

        {/* PANEL DERECHO (STUDIO) */}
        <aside className="w-[360px] bg-white border-l border-gray-100 flex flex-col z-20 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="p-8 pb-4">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 tracking-tight">Generar Contenido</h2>
            <div className="h-1 w-12 bg-amber-400 rounded-full mt-2"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
             {/* GRID DE HERRAMIENTAS - 2 COLUMNAS (Solo las opciones originales) */}
             <div className="grid grid-cols-2 gap-3 mb-10">
                {[
                  { id: 'breve', label: 'Resumen Breve', icon: ICONS.bolt, color: 'bg-amber-50 text-amber-500' },
                  { id: 'detallado', label: 'Informe Detallado', icon: ICONS.summary, color: 'bg-blue-50 text-blue-500' },
                  { id: 'cuestionario', label: 'Cuestionario', icon: ICONS.question, color: 'bg-purple-50 text-purple-500' },
                  { id: 'guion', label: 'Guion', icon: ICONS.film, color: 'bg-pink-50 text-pink-500' },
                ].map((tool) => (
                  <button 
                    key={tool.id}
                    onClick={() => handleTransform(tool.id)}
                    disabled={isTransforming}
                    className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition-all group disabled:opacity-50 h-[100px]"
                  >
                    <div className={`w-8 h-8 ${tool.color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                       <Icon path={tool.icon} className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 text-center uppercase tracking-tighter leading-none">{tool.label}</span>
                  </button>
                ))}
             </div>

             {/* BIBLIOTECA DE CONTENIDOS */}
             <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Tu Biblioteca</h3>
                   <button onClick={fetchTransformations} disabled={isRefreshingLibrary} className="text-amber-500 hover:rotate-180 transition-transform">
                      <svg className={`w-3 h-3 ${isRefreshingLibrary ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                   </button>
                </div>
                
                {libraryTransformations.length === 0 ? (
                  <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                     <p className="text-[10px] text-gray-400 font-bold px-4">Aún no has guardado nada. Genera un contenido para que aparezca aquí.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {libraryTransformations.map((trans) => (
                      <div key={trans.id} className="group relative bg-white border border-gray-100 p-3 rounded-2xl hover:border-amber-200 transition-all hover:shadow-md">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-amber-50 transition-colors">
                               <Icon path={ICONS[trans.tipo] || ICONS.file} className="w-4 h-4 text-gray-400 group-hover:text-amber-500" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                               <p className="text-[10px] font-black text-gray-700 uppercase tracking-tight truncate">{trans.tipo.replace('_', ' ')}</p>
                               <p className="text-[9px] text-gray-400 font-medium tracking-tighter">{new Date(trans.fecha_creacion).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => handleToggleTransformation(trans)}
                                 className={`p-1.5 rounded-lg shadow-sm transition-all ${generatedContent.some(item => item.id === trans.id) ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600'}`}
                                 title={generatedContent.some(item => item.id === trans.id) ? "Ocultar del panel" : "Mostrar en panel"}
                               >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                               </button>
                               <button 
                                 onClick={() => handleDeleteTransformation(trans.id)}
                                 className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100"
                                 title="Eliminar"
                               >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             {isTransforming && (
               <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex flex-col items-center animate-pulse">
                  <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-amber-700 mt-4 uppercase tracking-widest">Generando...</p>
               </div>
             )}

             {transformError && (
               <div className="mt-4 p-4 bg-red-50 text-red-500 text-xs rounded-2xl border border-red-100 font-bold">
                 {transformError}
               </div>
             )}
          </div>

          <div className="p-8 border-t border-gray-50 flex flex-col items-center text-center">
             <div className="text-amber-500 mb-3 animate-bounce">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <p className="text-[11px] font-bold text-gray-400 leading-relaxed">Los datos de salida de Studio se guardarán aquí. Genera contenidos sin perder tus avances.</p>
          </div>
        </aside>

      </div>

      {/* MODAL PDF PREVIEW */}
      {showPdfPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col border border-gray-100 animate-scale-in">
             <div className="p-5 flex justify-between items-center border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                   <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                   Previsualización PDF
                </h3>
                <div className="flex gap-2">
                  <button onClick={handleDownloadPdf} className="bg-amber-400 hover:bg-amber-500 px-6 py-2 rounded-xl text-xs font-bold text-gray-900 shadow-sm transition-all">Descargar</button>
                  <button onClick={() => setShowPdfPreview(false)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" /></svg></button>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 flex flex-col items-center">
                <div id="pdf-preview-content" className="bg-white w-full max-w-[800px] shadow-sm p-16 min-h-[1056px] text-gray-800 border border-gray-100 rounded-2xl">
                   <div className="mb-10 text-center">
                      <h1 className="text-3xl font-black text-gray-900 mb-2 border-b-4 border-amber-400 inline-block pb-2">{previewData.title.toUpperCase()}</h1>
                      <p className="text-lg text-gray-500 mt-4">{meeting?.title}</p>
                   </div>
                   <div className="prose prose-slate max-w-none text-gray-600">
                      {previewData.type === 'mermaid' ? (
                        <div id="mermaid-preview-container" className="mermaid flex justify-center py-10"></div>
                      ) : (
                        <ReactMarkdown components={customComponents}>{cleanMarkdown(previewData.content)}</ReactMarkdown>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-sm p-10 animate-fade-in shadow-2xl border border-gray-50 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </div>
            
            <h3 className="text-2xl font-black text-gray-800 mb-2">Compartir Link</h3>
            <p className="text-gray-400 text-xs mb-8 px-4 font-bold">Cualquier persona con este enlace podrá revisar los resultados del análisis.</p>
            
            <div className="mb-8">
              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 mb-4 flex flex-col items-center">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Enlace de acceso rápido</span>
                <p className="text-xs font-bold text-gray-600 break-all select-all px-2 leading-relaxed">
                  {getFriendlyUrl()}
                </p>
              </div>
              
              <button 
                onClick={() => {
                  const link = getFriendlyUrl();
                  
                  const copyToClipboard = async (text) => {
                    // Intento 1: API Moderna (Navigator)
                    if (navigator.clipboard && window.isSecureContext) {
                      try {
                        await navigator.clipboard.writeText(text);
                        return true;
                      } catch (err) {}
                    }

                    // Intento 2: Fallback Clásico (textarea invisible)
                    const textArea = document.createElement("textarea");
                    textArea.value = text;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-9999px";
                    textArea.style.top = "0";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                      const successful = document.execCommand('copy');
                      document.body.removeChild(textArea);
                      return successful;
                    } catch (err) {
                      document.body.removeChild(textArea);
                      return false;
                    }
                  };

                  copyToClipboard(link).then(success => {
                    if (success) {
                      alert("¡Enlace copiado! 🐝");
                    } else {
                      alert("Error al copiar. Por favor selecciona el link manualmente.");
                    }
                  });
                }}
                className="w-full bg-amber-400 text-gray-900 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-amber-500 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Copiar Enlace
              </button>
            </div>

            <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600 font-extrabold text-[10px] uppercase tracking-widest transition-colors py-2">Cerrar</button>
          </div>
        </div>
      )}

      <AIChatPanel meetingId={meetingId} initialMessage={`¡Hola! Soy Bee, tu asistente de estudio. He analizado "${meeting?.title || 'este documento'}". ¿Qué quieres que hagamos ahora? 🐝`} />
    </div>
  );
}

export default ResultDetailsPage;