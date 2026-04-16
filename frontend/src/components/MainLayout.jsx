import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useNavigation } from '../context/NavigationContext';
import { 
  Icon, 
  ICONS, 
  HistoryModal, 
  NotificationsModal, 
  NewMeetingModal 
} from './HomePageComponents';
import apiClient from '../api';
import { slugify } from '../utils/stringUtils';


const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    isHistoryModalOpen, setIsHistoryModalOpen,
    isUploadPanelOpen, setIsUploadPanelOpen,
    isNotificationsOpen, setIsNotificationsOpen
  } = useNavigation();

  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchHistory();
    fetchUserProfile();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const response = await apiClient.get('/meetings');
      const formattedHistory = response.data.map(item => ({
        id: item.id,
        title: item.titulo,
        createdAt: item.fecha_creacion,
        status: item.status,
        progress: item.progress || 0,
        metadatos: item.metadatos,
        user_id: item.user_id
      }));
      setHistory(formattedHistory);
    } catch (err) {
      console.error('Error al cargar el historial:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get("/users/me");
      setUserProfile(response.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleSelectFromHistory = (meetingId) => {
    setIsHistoryModalOpen(false);
    const meeting = history.find(m => m.id === meetingId);
    if (meeting && meeting.title) {
      const slug = slugify(meeting.title);
      navigate(`/beescribe/${meetingId}/${slug}`);
    } else {
      navigate(`/results/${meetingId}`);
    }
  };

  const handleHistorySearch = async ({ consulta = '', filtros = {} }) => {
    try {
      setIsHistoryLoading(true);
      const activeFilters = Object.fromEntries(Object.entries(filtros).filter(([_, v]) => v != null && v !== ''));
      const response = await apiClient.post('/search', { consulta, filtros: activeFilters });
      const formattedHistory = response.data.resultados.map(item => ({
        id: item.id,
        title: item.titulo,
        createdAt: item.fecha_creacion,
        status: item.status,
        metadatos: item.metadatos,
        user_id: item.user_id
      }));
      setHistory(formattedHistory);
    } catch (err) {
      console.error('Error al realizar la búsqueda:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    try {
      await apiClient.delete(`/meetings/${meetingId}`);
      fetchHistory();
    } catch (err) {
      console.error("Error cancelando reunión:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      {/* Modales Globales */}
      <HistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        history={history} 
        onSelect={handleSelectFromHistory} 
        isLoading={isHistoryLoading} 
        onSearch={handleHistorySearch} 
        onResetFilters={fetchHistory} 
        onCancel={handleCancelMeeting} 
        currentUserId={userProfile?.id} 
      />
      
      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />

      <NewMeetingModal 
        isOpen={isUploadPanelOpen} 
        onClose={() => setIsUploadPanelOpen(false)}
        onSuccess={(id) => {
          setIsUploadPanelOpen(false);
          fetchHistory();
          navigate(`/results/${id}`);
        }}
      />

      {/* Contenido de la Página */}
      <Outlet context={{ fetchHistory, history, userProfile }} />

      {/* --- BARRA DE NAVEGACIÓN PERSISTENTE --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-10 py-3 flex justify-between items-center z-[100] w-full shadow-2xl rounded-t-3xl">
        <button 
          onClick={() => navigate('/')} 
          className={`flex flex-col items-center gap-0.5 ${location.pathname === '/' ? 'text-amber-500' : 'text-gray-400'}`}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-xxs font-semibold">Inicio</span>
        </button>

        <button 
          onClick={() => navigate('/calendar')} 
          className={`flex flex-col items-center gap-0.5 ${location.pathname === '/calendar' ? 'text-amber-500' : 'text-gray-400'}`}
        >
          <Icon path={ICONS.calendar} className="w-5 h-5" />
          <span className="text-xxs font-semibold">Calendario</span>
        </button>
        
        <button 
          onClick={() => setIsUploadPanelOpen(true)} 
          className="bg-amber-400 p-4 rounded-full shadow-lg text-gray-900 -translate-y-5 transform hover:scale-105 transition-transform flex items-center justify-center border-4 border-white"
        >
          <svg className="w-6 h-6 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <button 
          onClick={() => setIsHistoryModalOpen(true)} 
          className={`flex flex-col items-center gap-0.5 ${isHistoryModalOpen ? 'text-amber-500' : 'text-gray-400'}`}
        >
          <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" /><path strokeLinecap="round" strokeLinejoin="round" d="M18 9l-5 5-4-4-5 5" /></svg>
          <span className="text-xxs font-semibold">Análisis</span>
        </button>

        <button 
          onClick={() => navigate('/perfil')} 
          className={`flex flex-col items-center gap-0.5 ${location.pathname === '/perfil' ? 'text-amber-500' : 'text-gray-400'}`}
        >
          <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xxs font-semibold">Perfil</span>
        </button>
      </div>
    </div>
  );
};

export default MainLayout;
