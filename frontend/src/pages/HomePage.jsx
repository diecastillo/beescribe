import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import apiClient from '../api';
import { logout } from '../auth/auth';
import {
  Icon,
  ICONS,
  LoadingScreen
} from '../components/HomePageComponents';
import AIChatPanel from '../components/AIChatPanel';
import { useNavigation } from '../context/NavigationContext';
import '../App.css';


function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { history, fetchHistory, userProfile } = useOutletContext();
  const { setIsUploadPanelOpen, setIsHistoryModalOpen, setIsNotificationsOpen } = useNavigation();
  
  const [error, setError] = useState(null);
  const [selectedForChat, setSelectedForChat] = useState([]);
  const [openChatWithSelection, setOpenChatWithSelection] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [navigate]);

  useEffect(() => {
    if (location.state?.openCreator) {
      setIsUploadPanelOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location, setIsUploadPanelOpen]);

  // Polling automático si hay algo procesándose
  useEffect(() => {
    const hasActiveProcessing = history.some(h => h.status === 'PROCESSING' || h.status === 'PENDING');
    if (hasActiveProcessing) {
      const interval = setInterval(() => {
        fetchHistory();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [history, fetchHistory]);

  const handleCancelMeeting = async (meetingId) => {
    try {
      await apiClient.delete(`/meetings/${meetingId}`);
      fetchHistory();
    } catch (err) {
      console.error("Error cancelando reunión:", err);
      setError("No se pudo cancelar la reunión.");
    }
  };

  const handleSelectFromHistory = (meetingId) => {
    navigate(`/results/${meetingId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-full">
      {/* --- MAIN DASHBOARD VIEW --- */}
      <main className="w-full px-8 py-8">
        {/* Header Layout Mockup */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-20 h-20 flex items-center justify-center overflow-hidden -ml-4">
              <img src="/LogoBeeScribe.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-gray-400 text-xxs font-semibold">Panel de Control</p>
              <h1 className="text-lg font-bold text-gray-800">
                Hola, {userProfile && userProfile.email ? userProfile.email.split('@')[0].charAt(0).toUpperCase() + userProfile.email.split('@')[0].slice(1) : 'Usuario'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-400">
            <button onClick={() => setIsNotificationsOpen(true)} className="hover:text-amber-500 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
            <button onClick={() => navigate('/perfil')} className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden shadow-sm flex items-center justify-center ring-4 ring-gray-50 hover:ring-amber-100 transition-all">
              <img 
                src={userProfile?.foto_perfil ? `${apiClient.defaults.baseURL.replace('/api', '')}${userProfile.foto_perfil}` : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"; }}
              />
            </button>
            <button onClick={handleLogout} className="hover:text-red-500 transition-colors pl-2">
              <Icon path={ICONS.logout} className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div onClick={() => navigate('/statistics')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:shadow-md transition-shadow">
            <span className="p-1.5 bg-amber-50 w-fit rounded-lg text-amber-500 mb-2">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>
            </span>
            <h4 className="text-gray-400 text-xxs font-semibold uppercase tracking-wider">Reuniones totales</h4>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-800">{history.length}</span>
              <span className="text-emerald-500 text-xs font-bold">+100%</span>
            </div>
          </div>
          <div onClick={() => navigate('/statistics')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:shadow-md transition-shadow">
            <span className="p-1.5 bg-amber-50 w-fit rounded-lg text-amber-500 mb-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <h4 className="text-gray-400 text-xxs font-semibold uppercase tracking-wider">Minutos ahorrados</h4>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-gray-800">{history.length * 35}</span>
              <span className="text-emerald-500 text-xxs font-semibold">+35 min/reunión</span>
            </div>
          </div>
        </div>

        {/* Prompter Yellow Banner */}
        <div className="bg-amber-400 p-5 rounded-2xl shadow-sm mb-6 flex justify-between items-center text-gray-900">
          <div>
            <h2 className="text-lg font-bold">¿Listo para la próxima?</h2>
            <p className="text-xs mt-0.5 opacity-90">Graba y transcribe en tiempo real con Bee-Scribe.</p>
          </div>
          <button onClick={() => setIsUploadPanelOpen(true)} className="bg-gray-800/10 p-3 rounded-full flex items-center justify-center shadow-inner hover:bg-gray-800/20">
            <Icon path={ICONS.mic} className="w-5 h-5 text-gray-900" />
          </button>
        </div>

        {/* Recent Meetings */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base text-gray-800">Reuniones Recientes</h3>
            <button onClick={() => setIsHistoryModalOpen(true)} className="text-amber-500 text-xs font-bold hover:underline">Ver todas</button>
          </div>
          <div className="space-y-3">
            {history.slice(0, 3).map((item, idx) => (
              <div key={item.id} onClick={() => item.status === 'COMPLETED' && handleSelectFromHistory(item.id)} className={`flex flex-col p-3.5 bg-white rounded-xl border border-gray-50 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${item.status !== 'COMPLETED' ? 'cursor-default opacity-80' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-gray-50 rounded-lg text-gray-400">
                      <Icon path={ICONS[item.metadatos?.tipo_audio] || ICONS.file} className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-800">{item.title}</h4>
                      <p className="text-gray-400 text-xxs mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {item.status === 'COMPLETED' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedForChat.includes(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedForChat(prev =>
                            prev.includes(item.id) ? prev.filter(x => x !== item.id) : prev.length < 3 ? [...prev, item.id] : prev
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ accentColor: '#f59e0b', width: 18, height: 18, cursor: 'pointer' }}
                        title="Seleccionar para analizar con IA"
                      />
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  ) : item.status === 'FAILED' ? (
                    <span className="text-xxs font-bold text-red-400">Error</span>
                  ) : item.status === 'CANCELLED' ? (
                    <span className="text-xxs font-bold text-gray-400">Cancelado</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xxs font-bold text-amber-500 animate-pulse">
                        {item.status === 'PENDING' ? 'En cola' : 'Procesando...'}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCancelMeeting(item.id); }}
                        className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-full transition-colors"
                        title="Cancelar"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )}
                </div>

                {(item.status === 'PROCESSING' || item.status === 'PENDING') && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-amber-400 h-1.5 rounded-full transition-all duration-700 ease-in-out" 
                        style={{ width: `${item.status === 'PENDING' ? 5 : Math.max(item.progress, 10)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[9px] text-gray-400 font-medium">
                        {item.status === 'PENDING' ? 'Esperando turno...' : 'Analizando audio y generando resumen...'}
                      </p>
                      <p className="text-[10px] text-amber-600 font-bold">
                        {item.status === 'PENDING' ? '0%' : `${item.progress}%`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {history.length === 0 && <p className="text-center text-gray-400 text-sm">No hay reuniones recientes</p>}
          </div>
        </div>
      </main>

      {/* Botón flotante para analizar selección */}
      {selectedForChat.length > 0 && (
        <button
          onClick={() => setOpenChatWithSelection(true)}
          style={{
            position: 'fixed', bottom: 100, right: 32, zIndex: 9999,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: 'white', border: 'none', borderRadius: 16,
            padding: '12px 20px', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
            cursor: 'pointer'
          }}
        >
          🐝 Analizar {selectedForChat.length} reunión{selectedForChat.length > 1 ? 'es' : ''} con IA
        </button>
      )}

      <AIChatPanel preSelectedIds={openChatWithSelection ? selectedForChat : undefined} autoOpen={openChatWithSelection} onOpened={() => setOpenChatWithSelection(false)} />
    </div>
  );
}

export default HomePage;