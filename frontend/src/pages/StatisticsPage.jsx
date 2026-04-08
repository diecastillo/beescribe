import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { ArrowLeft, Download, TrendingUp, Calendar, Clock, BarChart3, Filter } from 'lucide-react';
import apiClient from '../api';
import html2pdf from 'html2pdf.js';
import AIChatPanel from '../components/AIChatPanel';

const COLORS = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'];

const StatisticsPage = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ preset: 'all', start: '', end: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/meetings');
      setMeetings(response.data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("No se pudieron cargar las estadísticas.");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!meetings.length) return null;

    // Filtrar reuniones por fecha
    const now = new Date();
    const filteredMeetings = meetings.filter(m => {
      const date = new Date(m.fecha_creacion);
      
      if (filter.preset === '7d') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return date >= sevenDaysAgo;
      }
      if (filter.preset === '30d') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return date >= thirtyDaysAgo;
      }
      if (filter.preset === '1y') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return date >= oneYearAgo;
      }
      if (filter.preset === 'custom' && filter.start && filter.end) {
        const start = new Date(filter.start);
        const end = new Date(filter.end);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      }
      return true; // preset === 'all'
    });

    if (!filteredMeetings.length) return { 
      totalMeetings: 0, totalMinutes: 0, avgPerDay: 0, dailyData: [], typeData: [] 
    };

    // Procesar datos para gráficas
    const dailyDataRaw = {};
    const typeDataRaw = {};
    let totalMinutes = 0;

    const sortedMeetings = [...filteredMeetings].sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion));

    sortedMeetings.forEach(m => {
      const date = new Date(m.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      dailyDataRaw[date] = (dailyDataRaw[date] || 0) + 1;

      const type = m.metadatos?.tipo_audio || 'reunion';
      typeDataRaw[type] = (typeDataRaw[type] || 0) + 1;
      
      totalMinutes += 35; 
    });

    const dailyData = Object.keys(dailyDataRaw).map(date => ({
      date,
      reuniones: dailyDataRaw[date],
      minutos: dailyDataRaw[date] * 35
    }));

    const typeLabels = {
      'reunion': 'Reunión de Trabajo',
      'podcast': 'Podcast o Entrevista',
      'conversacion': 'Conversación Informal',
      'audio_normal': 'Otro (Genérico)',
      'otro': 'Otro (Genérico)'
    };

    const typeData = Object.keys(typeDataRaw).map(key => ({
      name: typeLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
      value: typeDataRaw[key]
    }));

    return {
      totalMeetings: filteredMeetings.length,
      totalMinutes,
      avgPerDay: (filteredMeetings.length / Math.max(1, Object.keys(dailyDataRaw).length)).toFixed(1),
      dailyData,
      typeData
    };
  }, [meetings, filter]);

  const handleDownloadReport = async () => {
    const element = document.getElementById('statistics-report');
    
    // Convert to a single column layout specifically for the PDF to guarantee zero horizontal cutting
    const topGrid = element.querySelector('.md\\:grid-cols-3');
    const bottomGrid = element.querySelector('.lg\\:grid-cols-2');
    
    if (topGrid) {
      topGrid.classList.remove('md:grid-cols-3');
      topGrid.classList.add('grid-cols-1');
    }
    if (bottomGrid) {
      bottomGrid.classList.remove('lg:grid-cols-2');
      bottomGrid.classList.add('grid-cols-1');
    }

    const opt = {
      margin: 0.5,
      filename: `Reporte_BeeScribe_${filter.preset}_${new Date().toLocaleDateString()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    await html2pdf().from(element).set(opt).save();

    // Revert to original responsive layout immediately
    if (topGrid) {
      topGrid.classList.add('md:grid-cols-3');
      topGrid.classList.remove('grid-cols-1');
    }
    if (bottomGrid) {
      bottomGrid.classList.add('lg:grid-cols-2');
      bottomGrid.classList.remove('grid-cols-1');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-20 h-20 flex items-center justify-center overflow-hidden -ml-4">
              <img src="/LogoBeeScribe.png" alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Estadísticas y Reportes</h1>
          </div>
          <button 
            onClick={handleDownloadReport}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Generar Reporte
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <section className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
              <Filter className="w-4 h-4" />
            </div>
            <select 
              value={filter.preset}
              onChange={(e) => setFilter({ ...filter, preset: e.target.value })}
              className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer"
            >
              <option value="all">Resumen General</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="1y">Este año</option>
              <option value="custom">Rango Personalizado</option>
            </select>
          </div>

          {filter.preset === 'custom' && (
            <div className="flex items-center gap-2 animate-fade-in">
              <input 
                type="date" 
                value={filter.start}
                onChange={(e) => setFilter({ ...filter, start: e.target.value })}
                className="bg-gray-50 border-gray-200 rounded-lg text-xs font-medium px-3 py-1.5 focus:border-amber-400 focus:ring-0"
              />
              <span className="text-gray-300 text-xs">hasta</span>
              <input 
                type="date" 
                value={filter.end}
                onChange={(e) => setFilter({ ...filter, end: e.target.value })}
                className="bg-gray-50 border-gray-200 rounded-lg text-xs font-medium px-3 py-1.5 focus:border-amber-400 focus:ring-0"
              />
            </div>
          )}

          <div className="text-xs text-gray-400 font-medium">
            Mostrando <span className="text-gray-800 font-bold">{stats?.totalMeetings}</span> reuniones encontradas
          </div>
        </div>
      </section>

      <main id="statistics-report" className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Reuniones</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats?.totalMeetings || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Minutos Ahorrados</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats?.totalMinutes || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Promedio Diario</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats?.avgPerDay || 0}</h3>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activity Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Interacción Semanal
              </h4>
              <span className="text-xs text-gray-400 font-medium">Últimos 7 registros</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    cursor={{fill: '#fef3c7'}}
                  />
                  <Bar dataKey="reuniones" fill="#fbbf24" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Minutes Saved Area Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Ahorro Proyectado (min)
              </h4>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.dailyData}>
                  <defs>
                    <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="minutos" stroke="#10b981" fillOpacity={1} fill="url(#colorMin)" strokeWidth={3} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Type Distribution Pie Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Tipos de Audio
            </h4>
            <div className="h-64 w-full flex flex-col md:flex-row items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {stats?.typeData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Insights Panel */}
          <div className="bg-amber-400 p-8 rounded-3xl shadow-sm text-gray-900 flex flex-col justify-center">
            <h4 className="text-xl font-extrabold mb-4">💡 Sabías que...</h4>
            <p className="text-sm font-medium leading-relaxed opacity-90">
              Has recuperado aproximadamente <span className="font-bold">{((stats?.totalMinutes || 0) / 60).toFixed(1)} horas</span> de productividad gracias a los resúmenes automáticos de Bee-Scribe.
              <br/><br/>
              Las reuniones de tipo <span className="font-bold">"{stats?.typeData?.[0]?.name || 'Reunión'}"</span> son las que más tiempo te están ahorrando esta semana.
            </p>
          </div>
        </div>
      </main>
      <AIChatPanel initialMessage="¡Hola! 🐝 Estoy aquí para ayudarte a entender tus estadísticas. ¿Qué te gustaría saber sobre tu productividad?" />
    </div>
  );
};

export default StatisticsPage;
