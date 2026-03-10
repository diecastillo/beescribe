import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import apiClient from '../api';
import '../App.css'; 

// --- Componentes de UI ---
const Icon = ({ path, className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg> );
const ICONS = { summary: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", mindmap: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122", chevronDown: "M19 9l-7 7-7-7" };

mermaid.initialize({ startOnLoad: true, theme: 'forest', securityLevel: 'loose' });

const AccordionSection = ({ title, icon, children, isOpen, onToggle }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <button onClick={onToggle} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center">
          <Icon path={icon} className="w-6 h-6 text-amber-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
        </div>
        <Icon path={ICONS.chevronDown} className={`w-6 h-6 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="p-6 border-t animate-fade-in-up">{children}</div>}
    </div>
  );
};

const TransformButtons = ({ onTransform, isTransforming }) => {
  const options = [
    { key: 'breve', label: 'Resumen Breve', icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { key: 'detallado', label: 'Informe Detallado', icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { key: 'cuestionario', label: 'Cuestionario', icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { key: 'guion', label: 'Guion', icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onTransform(opt.key)}
          disabled={isTransforming}
          className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-amber-50 hover:border-amber-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="bg-amber-100 p-2 rounded-full mb-2">
            <Icon path={opt.icon} className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

function ResultDetailsPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('summary'); // 'summary', 'mindmap', 'transform'
  const [transformedContent, setTransformedContent] = useState(null);
  const [isTransforming, setIsTransforming] = useState(false);

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      if (!meetingId) return;
      try {
        setIsLoading(true);
        const response = await apiClient.get(`/api/meetings/${meetingId}`);
        const data = response.data;
        setMeeting({
          id: data.id,
          title: data.titulo,
          summary: data.resumen_md,
          mindmap: data.mapa_mermaid,
          createdAt: data.fecha_creacion,
        });
      } catch (err) {
        setError('No se pudo cargar el análisis.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeetingDetails();
  }, [meetingId]);

  useEffect(() => {
    if (meeting && meeting.mindmap && activeSection === 'mindmap') {
      const renderMermaid = async () => {
        try {
          const container = document.getElementById(`mermaid-details-${meeting.id}`);
          if (container) {
            container.innerHTML = ''; 
            const { svg } = await mermaid.render(`mermaid-svg-${meeting.id}`, meeting.mindmap);
            container.innerHTML = svg;
          }
        } catch (e) {
          console.error("Mermaid error:", e);
        }
      };
      setTimeout(renderMermaid, 100);
    }
  }, [meeting, activeSection]);

  const handleTransform = async (type) => {
    setIsTransforming(true);
    setTransformedContent(null);
    setActiveSection('transform'); // Switch view to show loader/result
    try {
      const response = await apiClient.post('/api/meetings/transform', {
        meeting_id: meeting.id,
        tipo_transformacion: type
      });
      setTransformedContent({
        type: type,
        content: response.data.contenido_md
      });
    } catch (err) {
      setError('Error al transformar el contenido.');
    } finally {
      setIsTransforming(false);
    }
  };

  if (isLoading) return <div className="text-center p-10">Cargando...</div>;
  if (error) return <div className="text-center p-10 text-red-600">{error}</div>;
  if (!meeting) return <div className="text-center p-10">No encontrado.</div>;

  return (
    <div className="min-h-screen bg-slate-100">
        <nav className="bg-gray-800 text-white shadow-md sticky top-0 z-10">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-amber-400">Bee-Scribe</h1>
                <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                    ← Volver a Inicio
                </button>
            </div>
        </nav>
        
        <main className="container mx-auto px-6 py-10 max-w-5xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">{meeting.title || `Reunión #${meeting.id}`}</h2>
                <p className="text-gray-500 text-sm mt-1">Analizado el {new Date(meeting.createdAt).toLocaleString()}</p>
                
                {/* Botones de Transformación */}
                <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Generar nuevo formato:</h3>
                <TransformButtons onTransform={handleTransform} isTransforming={isTransforming} />
            </div>

            <div className="space-y-4">
                {/* Sección de Transformación (Dinámica) */}
                {(isTransforming || transformedContent) && (
                  <div className="bg-white rounded-lg shadow-lg border-2 border-amber-400 overflow-hidden mb-6 animate-fade-in-up">
                    <div className="bg-amber-50 p-4 border-b border-amber-200 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-amber-800 flex items-center">
                        <Icon path="M13 10V3L4 14h7v7l9-11h-7z" className="w-5 h-5 mr-2" />
                        {isTransforming ? 'Generando...' : `Resultado: ${transformedContent?.type.toUpperCase()}`}
                      </h3>
                      <button onClick={() => {setTransformedContent(null); setActiveSection('summary');}} className="text-amber-700 hover:text-amber-900 text-sm font-semibold">Cerrar</button>
                    </div>
                    <div className="p-6 prose prose-amber max-w-none">
                      {isTransforming ? (
                        <div className="flex flex-col items-center justify-center py-10">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mb-4"></div>
                          <p className="text-gray-600">La IA está trabajando en tu nuevo formato...</p>
                        </div>
                      ) : (
                        <ReactMarkdown>{transformedContent?.content}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                )}

                <AccordionSection 
                  title="Resumen Original" 
                  icon={ICONS.summary} 
                  isOpen={activeSection === 'summary'} 
                  onToggle={() => setActiveSection(activeSection === 'summary' ? '' : 'summary')}
                >
                    <div className="prose prose-indigo max-w-none">
                        <ReactMarkdown>{meeting.summary}</ReactMarkdown>
                    </div>
                </AccordionSection>

                {meeting.mindmap && (
                    <AccordionSection 
                      title="Mapa Mental" 
                      icon={ICONS.mindmap} 
                      isOpen={activeSection === 'mindmap'} 
                      onToggle={() => setActiveSection(activeSection === 'mindmap' ? '' : 'mindmap')}
                    >
                        <div className="mermaid-container bg-gray-50 p-4 rounded-md overflow-auto">
                            <div id={`mermaid-details-${meeting.id}`} className="mermaid"></div>
                        </div>
                    </AccordionSection>
                )}
            </div>
        </main>
    </div>
  );
}

export default ResultDetailsPage;