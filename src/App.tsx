/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  LayoutDashboard, 
  ChevronRight,
  Search,
  Bell,
  User,
  CheckCircle2,
  Clock,
  ExternalLink,
  LogOut,
  LogIn,
  Info,
  X
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { FirebaseProvider, useFirebase } from "./components/FirebaseProvider";
import { db } from "./lib/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./lib/firestoreUtils";

const Navbar = () => {
  const { user, signIn, logout, isAdmin, userRole } = useFirebase();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Новая политика в категории 'Академика' добавлена.", time: "10 мин назад", unread: true },
    { id: 2, text: "Ваш отчет #491294 был успешно принят.", time: "1 час назад", unread: false },
    { id: 3, text: "Обновлены правила безопасности в лабораториях.", time: "3 часа назад", unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'faculty': return 'Преподаватель';
      case 'student': return 'Студент';
      default: return 'Гость';
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/policies?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Sync search input with URL search param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("search");
    if (q) setSearchQuery(q);
    else if (location.pathname !== "/policies") setSearchQuery("");
  }, [location]);

  return (
    <nav className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-8 text-slate-900">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">U</div>
          <span className="font-bold tracking-tight text-lg text-slate-900">UniTrust</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск политик..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </form>
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-800 uppercase">Уведомления</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-indigo-600 font-bold hover:underline">Прочитать все</button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className={cn("p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer", n.unread && "bg-indigo-50/30")}>
                          <p className="text-xs text-slate-700 leading-relaxed mb-1">{n.text}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{n.time}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">Нет новых уведомлений</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        {user ? (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none text-slate-900">{user.displayName || 'Пользователь'}</p>
              <p className="text-xs text-slate-500 mt-1">{getRoleLabel(userRole)}</p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 bg-slate-200 border-2 border-white rounded-full flex items-center justify-center overflow-hidden cursor-pointer focus:ring-2 focus:ring-indigo-500 ring-offset-2 transition-all"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-slate-500" />
                )}
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    {/* Backdrop to close on click outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-50 p-1 divide-y divide-slate-50"
                    >
                      <div className="px-3 py-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Роль: {getRoleLabel(userRole)}</p>
                        <p className="text-[10px] text-slate-300 uppercase truncate font-medium">{user.email}</p>
                      </div>
                      
                      {(isAdmin || userRole === 'admin') && (
                        <div className="p-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 px-1">Управление ролями</p>
                          <div className="flex flex-col gap-1">
                            {['student', 'faculty', 'admin'].map(r => (
                              <button 
                                key={r}
                                onClick={() => {
                                  updateDoc(doc(db, 'users', user.uid), { role: r });
                                  setShowProfileMenu(false);
                                }}
                                className={cn(
                                  "text-left px-2 py-1 text-[10px] rounded hover:bg-slate-50 transition-colors capitalize flex items-center justify-between",
                                  userRole === r ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-500"
                                )}
                              >
                                {r === 'faculty' ? 'Преподаватель' : r === 'student' ? 'Студент' : 'Админ'}
                                {userRole === r && <CheckCircle2 className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-1">
                        <button 
                          onClick={() => {
                            logout();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Выйти
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <button 
            onClick={signIn}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <LogIn className="w-4 h-4" /> Войти
          </button>
        )}
      </div>
    </nav>
  );
};

const Sidebar = () => {
  const { user } = useFirebase();
  const location = useLocation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: "Дашборд", path: "/", protected: true },
    { icon: FileText, label: "Политики", path: "/policies", protected: false },
    { icon: AlertTriangle, label: "Сообщить об инциденте", path: "/report", protected: false },
  ];

  const visibleItems = menuItems.filter(item => !item.protected || user);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-64px)] sticky top-16 hidden lg:flex flex-col p-4">
      <nav className="flex-1 space-y-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                isActive 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="mt-auto p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Статус системы</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">92% Оптимально</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 w-[92%]" />
          </div>
        </div>
      )}
    </aside>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState([
    { 
      label: "Общий рейтинг", 
      value: "92%", 
      icon: ShieldCheck, 
      color: "text-emerald-500", 
      trend: "+0.8%",
      info: "Интегральный показатель соблюдения всех вузовских политик и стандартов безопасности." 
    },
    { 
      label: "Открытые инциденты", 
      value: "0", 
      icon: AlertTriangle, 
      color: "text-slate-900", 
      sub: "Все проверено",
      info: "Количество сообщений об инцидентах, которые в данный момент находятся в обработке." 
    },
    { 
      label: "Политик в базе", 
      value: "...", 
      icon: FileText, 
      color: "text-indigo-500", 
      sub: "Всего актуально",
      info: "Общее количество действующих регламентов и этических кодексов университета." 
    },
    { 
      label: "Статус системы", 
      value: "92%", 
      icon: CheckCircle2, 
      color: "text-indigo-600", 
      sub: "Оптимально",
      info: "Технический и операционный статус платформы UniTrust и отсутствие критических сбоев." 
    },
  ]);
  const [recentPolicies, setRecentPolicies] = useState<any[]>([]);

  useEffect(() => {
    const policiesQuery = query(collection(db, "policies"), orderBy("lastUpdated", "desc"), limit(4));
    const unsubscribePolicies = onSnapshot(policiesQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentPolicies(docs);
      
      setStats(prev => [
        { ...prev[0], value: "92%", trend: "+0.8%" },
        { ...prev[1], value: "0", sub: "Все проверено" },
        { ...prev[2], value: docs.length.toString(), sub: "Активно" },
        { ...prev[3], value: "92%", sub: "Оптимально" }
      ]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "policies"));

    return () => unsubscribePolicies();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Дашборд комплаенса</h1>
        <p className="text-slate-500 mt-1">Мониторинг и управление всеми показателями соблюдения регламентов.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md group relative">
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
              <div className="relative group/info">
                <Info className="w-3 h-3 text-slate-300 hover:text-indigo-500 cursor-help transition-colors" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-10 font-medium leading-relaxed">
                  {stat.info}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div className="mt-2 text-xs font-medium text-slate-500">
              {stat.trend && stat.value !== "..." ? <span className="text-emerald-500">{stat.trend}</span> : stat.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Последние обновления</h3>
              <Link to="/policies" className="text-indigo-600 text-sm font-medium hover:underline">Все политики</Link>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-bold uppercase bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3">Название</th>
                    <th className="px-6 py-3">Категория</th>
                    <th className="px-6 py-3">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPolicies.length > 0 ? recentPolicies.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 line-clamp-1">{p.title}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 uppercase italic">{p.category}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {p.status === 'active' ? 'Активно' : 'Черновик'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center text-slate-400 text-sm italic">
                        Политики еще не добавлены.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-2">Поддержка комплаенса</h3>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">Нужна помощь в интерпретации правил или анонимный отчет?</p>
            <Link to="/report" className="w-full py-2.5 bg-white text-indigo-600 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-sm">
              Подать отчет
            </Link>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-slate-800 font-bold mb-4">Срочные дедлайны</h3>
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                <p className="text-xs font-bold text-rose-600 uppercase mb-1">Срок через 2 дня</p>
                <p className="text-sm font-semibold text-slate-900">Ежегодная этическая аттестация</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs font-bold text-amber-600 uppercase mb-1">Срок через 5 дней</p>
                <p className="text-sm font-semibold text-slate-900">Протокол лабораторной безопасности</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const Policies = () => {
  const { isTeacher } = useFirebase();
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const searchParam = queryParams.get("search") || "";
  
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ title: "", category: "Академика", content: "", status: "active" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "policies"), (snap) => {
      setPolicies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "policies"));
    return () => unsub();
  }, []);

  const handleCreatePolicy = async () => {
    if (!newPolicy.title || !newPolicy.content) return;
    try {
      await addDoc(collection(db, "policies"), {
        ...newPolicy,
        version: "1.0",
        lastUpdated: serverTimestamp()
      });
      setIsCreating(false);
      setNewPolicy({ title: "", category: "Академика", content: "", status: "active" });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "policies");
    }
  };

  const filtered = policies.filter(p => 
    p.title.toLowerCase().includes(searchParam.toLowerCase()) ||
    p.category.toLowerCase().includes(searchParam.toLowerCase())
  );

  const clearSearch = () => {
    navigate("/policies");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Библиотека политик</h1>
          <p className="text-slate-500 mt-1">Институциональные стандарты и нормативная документация.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={searchParam}
              onChange={(e) => {
                const val = e.target.value;
                if (val) navigate(`/policies?search=${encodeURIComponent(val)}`);
                else navigate(`/policies`);
              }}
              placeholder="Поиск..."
              className="px-4 py-2 pl-10 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 w-48 md:w-64"
            />
          </div>
          {isTeacher && (
            <button 
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Создать
            </button>
          )}
        </div>
      </header>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-indigo-100 rounded-xl p-6 mb-8 shadow-sm"
        >
          <h3 className="font-bold text-slate-900 mb-4">Новая политика</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input 
              placeholder="Заголовок"
              value={newPolicy.title}
              onChange={e => setNewPolicy({...newPolicy, title: e.target.value})}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            />
            <select 
              value={newPolicy.category}
              onChange={e => setNewPolicy({...newPolicy, category: e.target.value})}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            >
              <option>Академика</option>
              <option>IT</option>
              <option>Безопасность</option>
              <option>Администрация</option>
            </select>
          </div>
          <textarea 
            placeholder="Содержание политики..."
            value={newPolicy.content}
            onChange={e => setNewPolicy({...newPolicy, content: e.target.value})}
            className="w-full h-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm mb-4 resize-none"
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-500 text-sm font-bold">Отмена</button>
            <button onClick={handleCreatePolicy} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Сохранить</button>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Документ</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Тип</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Статус</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Версия</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">Загрузка...</td></tr>
            ) : filtered.length > 0 ? filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{p.title}</td>
                <td className="px-6 py-4 text-xs text-slate-500 italic">{p.category}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {p.status === 'active' ? 'Активно' : 'Черновик'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{p.version || '1.0'}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setSelectedPolicy(p)} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold">Детали</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <Search className="w-10 h-10 text-slate-200 mb-3" />
                    <p className="text-slate-500 font-medium">Ничего не найдено по вашему запросу</p>
                    <button 
                      onClick={clearSearch}
                      className="mt-4 text-indigo-600 text-sm font-bold hover:underline"
                    >
                      Сбросить поиск
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedPolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm shadow-xl">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedPolicy.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedPolicy.category} • v{selectedPolicy.version || '1.0'}</p>
                </div>
                <button onClick={() => setSelectedPolicy(null)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-5 h-5 rotate-90" /></button>
              </div>
              <div className="p-6 overflow-y-auto text-slate-600 text-sm whitespace-pre-wrap">
                {selectedPolicy.content}
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button onClick={() => setSelectedPolicy(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold">Закрыть</button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-indigo-100 shadow-lg">Подписать</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReportIncident = () => {
  const { user, signIn, isTeacher, isAdmin } = useFirebase();
  const [report, setReport] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [reportId, setReportId] = useState<string | null>(null);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [view, setView] = useState<'create' | 'list'>('create');

  useEffect(() => {
    // If not a teacher, force view to create
    if (!isTeacher && view === 'list') {
      setView('create');
    }
    
    if (isTeacher && view === 'list') {
      setLoading(true);
      const q = isAdmin 
        ? query(collection(db, "reports"), orderBy("createdAt", "desc"))
        : query(collection(db, "reports"), where("status", "==", "pending"), orderBy("createdAt", "desc"));
        
      const unsub = onSnapshot(q, (snap) => {
        setAllReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, (err) => {
        console.error("List Error:", err);
        handleFirestoreError(err, OperationType.LIST, "reports");
        setLoading(false);
      });
      return () => unsub();
    }
  }, [isTeacher, view, isAdmin]);

  // Reset steps if user changes
  useEffect(() => {
    setStep(1);
    setReport("");
    setAnalysis(null);
  }, [user?.uid]);

  const handleAnalyze = async () => {
    if (!report.trim()) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze-incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: report }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Ошибка анализа. Пожалуйста, попробуйте позже.");
      }
      
      const data = await res.json();
      if (!data || data.error) throw new Error(data?.error || "Некорректный формат ответа AI");
      
      if (!data.primaryCategory || !data.severityLevel) {
        console.warn("AI returned partial data:", data);
      }
      
      setAnalysis(data);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Ошибка при связи с сервером AI");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async () => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "reports"), {
        userId: user?.uid || null,
        description: report,
        analysis: analysis || null,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setReportId(docRef.id);
      setStep(3);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "reports");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "reports", id), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "reports");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Центр инцидентов</h1>
            <p className="text-slate-500 text-sm">Безопасная система отчетности и мониторинга.</p>
          </div>
        </div>
        
        {isTeacher && (
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setView('create')}
              className={cn("px-4 py-1.5 rounded-md text-sm font-bold transition-all", view === 'create' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700")}
            >
              Сообщить
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn("px-4 py-1.5 rounded-md text-sm font-bold transition-all", view === 'list' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700")}
            >
              Список {allReports.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px]">{allReports.length}</span>}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'create' ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm max-w-2xl mx-auto"
          >
            {step === 1 ? (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Ваше сообщение будет обработано конфиденциально. AI поможет классифицировать инцидент для ускорения рассмотрения.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Описание события</label>
                  <textarea 
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    placeholder="Что произошло? Укажите ключевые детали..."
                    className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm resize-none transition-all focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 italic">Минимум 10 символов. Конфиденциальность гарантирована.</p>
                </div>
                <button 
                  onClick={handleAnalyze}
                  disabled={loading || report.length < 10}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Анализируем через AI...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" /> Проанализировать и продолжить
                    </>
                  )}
                </button>
              </div>
            ) : step === 2 ? (
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Результаты предварительного анализа
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Категория</p>
                      <p className="text-sm font-semibold text-slate-700">{analysis?.primaryCategory || "Не определено"}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Срочность</p>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase inline-block",
                        analysis?.severityLevel === 'Критический' || analysis?.severityLevel === 'Высокий' 
                          ? "bg-rose-100 text-rose-700" 
                          : "bg-indigo-100 text-indigo-700"
                      )}>
                        {analysis?.severityLevel || "Стандарт"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Рекомендации AI</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{analysis?.recommendedNextSteps || "Предоставьте больше деталей для точных рекомендаций."}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setStep(1)} 
                    disabled={loading}
                    className="py-3 border border-slate-200 rounded-lg font-bold text-sm bg-white hover:bg-slate-50 transition-colors"
                  >
                    Редактировать
                  </button>
                  <button 
                    onClick={handleSendReport} 
                    disabled={loading}
                    className="py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? "Отправка..." : "Зафиксировать отчет"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8" /></div>
                <h2 className="text-xl font-bold mb-2">Отчет отправлен</h2>
                <p className="text-slate-500 text-sm mb-8">Индификатор: #{reportId?.slice(-6).toUpperCase()}</p>
                <button onClick={() => { setStep(1); setReport(""); setAnalysis(null); }} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm">Готово</button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 gap-6"
          >
            {allReports.length > 0 ? allReports.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">#{r.id.slice(-6)}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                        r.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {r.status === 'pending' ? 'Ожидает' : 'Решено'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : 'Только что'}</p>
                  </div>
                  {r.status === 'pending' && (
                    <button 
                      onClick={() => handleResolve(r.id, 'resolved')}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Решить
                    </button>
                  )}
                </div>
                
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{r.description}</p>
                </div>

                {r.analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-[10px]">
                      <p className="font-bold text-slate-400 uppercase italic">Анализ AI:</p>
                      <p className="text-slate-600">Категория: {r.analysis.primaryCategory}</p>
                      <p className="text-slate-600">Важность: {r.analysis.severityLevel}</p>
                    </div>
                    <div className="text-[10px]">
                      <p className="font-bold text-slate-400 uppercase italic">Действие:</p>
                      <p className="text-slate-600">{r.analysis.recommendedNextSteps}</p>
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                <Clock className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium italic">Новых инцидентов не обнаружено.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



const AuthWelcome = () => {
  const { signIn } = useFirebase();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
        <ShieldCheck className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4">Добро пожаловать в UniTrust</h2>
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
        Управляйте университетскими политиками и сообщайте об инцидентах безопасно и конфиденциально. Пожалуйста, войдите в систему, чтобы продолжить.
      </p>
      <button 
        onClick={signIn}
        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-3"
      >
        <LogIn className="w-5 h-5" /> Войти через университетскую почту
      </button>
      <p className="mt-6 text-xs text-slate-400">Только для студентов и сотрудников университета.</p>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useFirebase();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <Navbar />
        <div className="flex-1 flex max-w-[1600px] mx-auto w-full">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8 min-w-0 overflow-auto">
            <Routes>
              <Route path="/report" element={<ReportIncident />} />
              <Route path="/policies" element={<Policies />} />
              <Route 
                path="/" 
                element={!user ? (
                  <div className="min-h-[70vh] flex items-center justify-center">
                    <AuthWelcome />
                  </div>
                ) : <Dashboard />} 
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
