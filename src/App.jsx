import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowLeft, Bus, Car, FileText, Users, Search, PlusCircle, LogOut, Lock, Loader2, Trash2 } from 'lucide-react';
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// 引入真实数据库（完全基于您的生产环境配置）
import { db, kehadiranDb, kehadiranAuth } from './firebase';

// --- MOCK DATA (Updated to include IDs for deletion) ---
const initialMockDrivers = [
  { id: 'mock-1', nickname: "Uncle Ah Meng", plate: "WAA1234", gate: "A3", hp: "012-3456789", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Meng" },
  { id: 'mock-2', nickname: "Auntie Siti", plate: "BCC999", gate: "B", hp: "017-9876543", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti" },
  { id: 'mock-3', nickname: "Bas Sekolah Cikgu Wong", plate: "VBB555", gate: "A3", hp: "019-1112222", photo: null }
];

// --- COMPONENTS ---

const DisclaimerPopup = ({ onAccept }) => {
  const [dontShow, setDontShow] = useState(false);

  const handleAccept = () => {
    if (dontShow) localStorage.setItem('hideTransportDisclaimer', 'true');
    onAccept();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-4 text-red-600">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-xl font-bold mb-4 text-center text-gray-900">Makluman / 通知</h2>
        <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl">
          <p className="text-sm text-gray-700 text-justify">
            <span className="font-bold text-blue-800">BM:</span> Pihak sekolah perlu mengumpul data ini demi keselamatan semua pelajar dan untuk tujuan rekod rasmi pengangkutan. Data anda akan disimpan dengan selamat.
          </p>
          <p className="text-sm text-gray-700 text-justify border-t border-gray-200 pt-3">
            <span className="font-bold text-blue-800">中文:</span> 为了所有学生的安全以及官方交通记录的需要，校方需收集此数据。您的数据将被安全妥善保管。
          </p>
        </div>
        <div className="flex items-center mb-6 bg-yellow-50 p-3 rounded-lg border border-yellow-200 cursor-pointer" onClick={() => setDontShow(!dontShow)}>
          <input type="checkbox" checked={dontShow} readOnly className="mr-3 w-5 h-5 accent-yellow-600 cursor-pointer" />
          <span className="text-sm font-semibold text-yellow-800 select-none">Do not show again / 不要再显示 / Jangan tunjuk lagi</span>
        </div>
        <button onClick={handleAccept} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg active:scale-95">
          Baik, saya faham / 好的，我明白
        </button>
      </div>
    </div>
  );
};

const ChildForm = ({ index, data, onChange, availableClasses, studentsDict, isLoadingStudents, driversList }) => {
  const handleChange = (field, value) => {
    onChange(index, field, value);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
      <h3 className="font-bold mb-4 text-blue-800 text-lg flex items-center justify-between">
        <div className="flex items-center">
          <span className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center mr-2">{index + 1}</span>
          Anak / 孩子
        </div>
        {isLoadingStudents && <Loader2 size={18} className="animate-spin text-blue-500" />}
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">Tahun / 年级</label>
          <select className="w-full p-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50" 
            value={data.year} onChange={(e) => { handleChange('year', e.target.value); handleChange('kelas', ''); handleChange('name', ''); }} disabled={isLoadingStudents}>
            <option value="">Pilih / 选择</option>
            {Object.keys(availableClasses).sort().map(y => <option key={y} value={y}>Tahun {y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">Kelas / 班级</label>
          <select className="w-full p-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50" 
            value={data.kelas} onChange={(e) => { handleChange('kelas', e.target.value); handleChange('name', ''); }} disabled={!data.year || isLoadingStudents}>
            <option value="">Pilih / 选择</option>
            {data.year && availableClasses[data.year]?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-bold mb-1 text-gray-600">Nama Pelajar / 学生姓名</label>
        <select className="w-full p-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50" 
          value={data.name} onChange={(e) => handleChange('name', e.target.value)} disabled={!data.kelas || isLoadingStudents}>
          <option value="">Pilih / 选择</option>
          {data.kelas && studentsDict[`${data.year}-${data.kelas}`]?.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-bold mb-1 text-gray-600">Sesi / 班次</label>
        <select className="w-full p-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={data.session} onChange={(e) => handleChange('session', e.target.value)}>
          <option value="">Pilih / 选择</option>
          <option value="morning">Pagi / 上午班</option>
          <option value="afternoon">Petang / 下午班</option>
        </select>
      </div>

      {/* --- ARRIVAL --- */}
      <div className="mb-5 bg-green-50/50 border border-green-200 p-4 rounded-xl">
        <h4 className="font-bold text-green-800 mb-3 flex items-center border-b border-green-200 pb-2"><Bus size={18} className="mr-2" /> Perjalanan Datang / 来学校</h4>
        <div className="mb-3">
          <label className="block text-xs font-bold mb-1 text-green-700">Gate / 校门</label>
          <select className="w-full p-2.5 border border-green-200 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none" value={data.arriveGate} onChange={(e) => handleChange('arriveGate', e.target.value)}>
            <option value="">Pilih / 选择</option>
            <option value="A/A1">Gate A / A1 (Sendiri/自己载送)</option>
            <option value="A3">Gate A3</option>
            <option value="B">Gate B</option>
          </select>
        </div>
        {(data.arriveGate === 'A3' || data.arriveGate === 'B') && (
          <div className="animate-in fade-in slide-in-from-top-2 pt-2">
            <label className="block text-xs font-bold mb-1 text-green-800">Pemandu / 载送司机</label>
            <select className="w-full p-2.5 border border-green-300 rounded-xl mb-2 focus:ring-2 focus:ring-green-500 outline-none bg-white shadow-sm" value={data.arriveDriver} onChange={(e) => handleChange('arriveDriver', e.target.value)}>
              <option value="">Pilih Pemandu / 请选择司机</option>
              {driversList.map((driver, i) => <option key={driver.id || i} value={driver.nickname}>{driver.nickname} ({driver.plate})</option>)}
              <option value="others">Lain-lain / 其他 (Sila Nyatakan)</option>
            </select>
            {data.arriveDriver === 'others' && (
               <input type="text" placeholder="Nyatakan Nama & Plat Kereta / 请注明" className="w-full p-2.5 border border-green-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm" value={data.arriveDriverOther} onChange={e => handleChange('arriveDriverOther', e.target.value)} />
            )}
          </div>
        )}
      </div>

      {/* --- DEPARTURE --- */}
      <div className="mb-2 bg-orange-50/50 border border-orange-200 p-4 rounded-xl">
        <h4 className="font-bold text-orange-800 mb-3 flex items-center border-b border-orange-200 pb-2"><Car size={18} className="mr-2" /> Perjalanan Balik / 离开学校</h4>
        <div className="mb-3">
          <label className="block text-xs font-bold mb-1 text-orange-700">Gate / 校门</label>
          <select className="w-full p-2.5 border border-orange-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 outline-none" value={data.leaveGate} onChange={(e) => handleChange('leaveGate', e.target.value)}>
             <option value="">Pilih / 选择</option>
            <option value="A/A1">Gate A/A1 (Sendiri/自己载送)</option>
            <option value="A3">Gate A3</option>
            <option value="B">Gate B</option>
          </select>
        </div>

        {data.session === 'morning' && (data.leaveGate === 'A3' || data.leaveGate === 'B') && (
          <div className="mb-4 flex items-center bg-yellow-50 p-4 rounded-xl border-2 border-yellow-400 shadow-sm animate-in fade-in slide-in-from-top-2">
            <input type="checkbox" id={`round2-${index}`} checked={data.isRound2} onChange={(e) => handleChange('isRound2', e.target.checked)} className="mr-3 w-5 h-5 accent-yellow-600 cursor-pointer" />
            <label htmlFor={`round2-${index}`} className="text-sm font-bold text-yellow-900 cursor-pointer select-none flex-1">Balik Pusingan Ke-2 / 放学第二轮载送</label>
          </div>
        )}

        {(data.leaveGate === 'A3' || data.leaveGate === 'B') && (
          <div className="animate-in fade-in slide-in-from-top-2 pt-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-orange-800">Pemandu / 载送司机</label>
              {(data.arriveGate === 'A3' || data.arriveGate === 'B') && (
                <label className="flex items-center text-xs font-bold text-orange-800 bg-white px-2 py-1.5 rounded-lg border border-orange-300 cursor-pointer shadow-sm hover:bg-orange-100 transition">
                  <input type="checkbox" className="mr-2 accent-orange-600 w-4 h-4 cursor-pointer" checked={data.sameDriver} onChange={(e) => handleChange('sameDriver', e.target.checked)} />
                  Sama / 来回一样
                </label>
              )}
            </div>
            
            {!data.sameDriver ? (
              <>
                <select className="w-full p-2.5 border border-orange-300 rounded-xl mb-2 focus:ring-2 focus:ring-orange-500 outline-none bg-white shadow-sm" value={data.leaveDriver} onChange={(e) => handleChange('leaveDriver', e.target.value)}>
                  <option value="">Pilih Pemandu / 请选择司机</option>
                  {driversList.map((driver, i) => <option key={driver.id || i} value={driver.nickname}>{driver.nickname} ({driver.plate})</option>)}
                  <option value="others">Lain-lain / 其他 (Sila Nyatakan)</option>
                </select>
                {data.leaveDriver === 'others' && (
                   <input type="text" placeholder="Nyatakan Nama & Plat Kereta / 请注明" className="w-full p-2.5 border border-orange-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm" value={data.leaveDriverOther} onChange={e => handleChange('leaveDriverOther', e.target.value)} />
                )}
              </>
            ) : (
              <div className="p-3 bg-white border border-orange-300 rounded-xl text-sm text-gray-500 italic flex items-center shadow-sm">
                <span className="bg-gray-100 text-gray-500 w-6 h-6 rounded-full flex items-center justify-center mr-2"><Bus size={12}/></span>
                Menggunakan pemandu yang sama (Datang).
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [view, setView] = useState('home'); 
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // Drivers State (Manageable in Admin)
  const [driversList, setDriversList] = useState(initialMockDrivers);

  // Admin State
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDriverFormOpen, setIsDriverFormOpen] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [isFetchingAdmin, setIsFetchingAdmin] = useState(false);
  
  // Delete Modals State
  const [deleteSubmissionId, setDeleteSubmissionId] = useState(null);
  const [deleteDriverId, setDeleteDriverId] = useState(null);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [numKids, setNumKids] = useState(1);
  const [parentInfo, setParentInfo] = useState({ name: '', ic: '', phone: '', relation: '', address: '' });
  
  const initialChildState = { year: '', kelas: '', name: '', session: '', arriveGate: '', arriveDriver: '', arriveDriverOther: '', leaveGate: '', leaveDriver: '', leaveDriverOther: '', sameDriver: false, isRound2: false };
  const [childrenInfo, setChildrenInfo] = useState([initialChildState]);

  // Firebase Fetching States
  const [availableClasses, setAvailableClasses] = useState({});
  const [studentsDict, setStudentsDict] = useState({});
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // Configure Chrome Tab Header
  useEffect(() => {
    document.title = "SJKC Sin Ming Transport System";
  }, []);

  // 1. Fetch Students from Kehadiran DB & Auth Setup
  useEffect(() => {
    if (!localStorage.getItem('hideTransportDisclaimer')) {
      setShowDisclaimer(true);
    }

    const initDatabasesAndFetch = async () => {
      setIsLoadingStudents(true);

      // Authenticate the Transport DB so we can save forms
      try {
        const defaultAuth = getAuth();
        await signInAnonymously(defaultAuth);
      } catch (authErr) {
        console.error("Transport DB Auth Error:", authErr);
      }

      if (!kehadiranDb || !kehadiranAuth) {
        setAvailableClasses({"1": ["Mawar", "Melati"], "6": ["DE"]});
        setStudentsDict({ "1-Mawar": ["Ali bin Abu", "Muthusamy"], "1-Melati": ["Siti Nurhaliza"], "6-DE": ["WONG YU MIN"] });
        setIsLoadingStudents(false);
        return;
      }

      try {
        // Authenticate the Kehadiran DB to fetch students
        await signInAnonymously(kehadiranAuth);
        const docRef = doc(kehadiranDb, "artifacts/sistem-kehadiran-sm/public/data/metadata/students_index");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const studentArray = docSnap.data().list || [];
          const tempClasses = {};
          const tempStudents = {};

          studentArray.forEach(student => {
            const fullClass = student.class || ""; 
            const name = student.name || "Unknown";
            const match = fullClass.match(/^(\d+)\s*(.*)/);
            let year = "Lain-lain";
            let className = fullClass;

            if (match) { year = match[1]; className = match[2] || fullClass; }
            if (!tempClasses[year]) tempClasses[year] = new Set();
            tempClasses[year].add(className);

            const dictKey = `${year}-${className}`;
            if (!tempStudents[dictKey]) tempStudents[dictKey] = [];
            tempStudents[dictKey].push(name);
          });

          Object.keys(tempClasses).forEach(y => tempClasses[y] = Array.from(tempClasses[y]).sort());
          Object.keys(tempStudents).forEach(k => tempStudents[k].sort());

          setAvailableClasses(tempClasses);
          setStudentsDict(tempStudents);
        }
      } catch (error) {
        console.error("Error fetching from Kehadiran DB:", error);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    initDatabasesAndFetch();
  }, []);

  // 2. Admin Fetch Submissions Logic
  const fetchSubmissions = async () => {
    setIsFetchingAdmin(true);
    try {
      const querySnapshot = await getDocs(collection(db, "transport_submissions"));
      const subs = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() });
      });
      // Sort by newest first
      subs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setSubmissions(subs);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setIsFetchingAdmin(false);
    }
  };

  useEffect(() => {
    if (view === 'admin' && isAdmin) {
      fetchSubmissions();
    }
  }, [view, isAdmin]);

  // Form Handlers
  const handleNumKidsChange = (n) => {
    setNumKids(n);
    setChildrenInfo(prev => {
      const newArr = [...prev];
      while(newArr.length < n) newArr.push({ ...initialChildState });
      return newArr.slice(0, n);
    });
  };

  const handleChildChange = (index, field, value) => {
    setChildrenInfo(prev => {
      const newArr = [...prev];
      newArr[index] = { ...newArr[index], [field]: value };
      return newArr;
    });
  };

  const handleParentSubmit = async () => {
    // Basic validation
    if (!parentInfo.name || !parentInfo.phone) {
      setAlertMessage("Sila isikan sekurang-kurangnya Nama dan No. Telefon penjaga. / 请至少填写监护人姓名与电话号码。");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "transport_submissions"), {
        parent: parentInfo,
        children: childrenInfo,
        createdAt: serverTimestamp()
      });
      setAlertMessage("Borang Berjaya Dihantar / 提交成功!");
      // Reset form
      setParentInfo({ name: '', ic: '', phone: '', relation: '', address: '' });
      setNumKids(1);
      setChildrenInfo([{ ...initialChildState }]);
      handleBack();
    } catch (error) {
      console.error("Error saving document: ", error);
      setAlertMessage("Ralat semasa menghantar. Sila cuba lagi. / 提交时发生错误，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Handlers
  const handleAdminLogin = (e) => {
    e.preventDefault();
    
    // 使用 import.meta.env 获取真实的密码环境变量
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    
    if (adminPwd === correctPassword) {
      setIsAdmin(true);
      setView('admin');
      setAdminModalOpen(false);
      setAdminPwd('');
    } else {
      setAlertMessage("Katalaluan Salah / 密码错误 (Incorrect Password)!");
    }
  };

  const handleDeleteSubmission = async (id) => {
    try {
      await deleteDoc(doc(db, "transport_submissions", id));
      setSubmissions(prev => prev.filter(s => s.id !== id));
      setDeleteSubmissionId(null);
    } catch (error) {
      console.error("Error deleting document: ", error);
      setAlertMessage("Gagal memadam rekod. / 无法删除记录，请检查数据库权限。");
      setDeleteSubmissionId(null);
    }
  };

  const handleDeleteDriver = () => {
    if (deleteDriverId) {
      setDriversList(prev => prev.filter(d => d.id !== deleteDriverId));
      setDeleteDriverId(null);
    }
  };

  const navigateTo = (newView) => {
    window.scrollTo(0, 0);
    setView(newView);
  }

  const handleBack = () => {
    window.scrollTo(0, 0);
    if (isAdmin) setView('admin');
    else setView('home');
  };

  // Filter Submissions for Admin View
  const filteredSubmissions = submissions.filter(sub => {
    const q = searchQuery.toLowerCase();
    
    // Search matching logic (Parent name/IC or Child Name)
    const matchesQuery = !q || 
      (sub.parent?.name || '').toLowerCase().includes(q) || 
      (sub.parent?.ic || '').toLowerCase().includes(q) ||
      (sub.children || []).some(c => (c.name || '').toLowerCase().includes(q));

    // Driver matching logic
    const matchesDriver = !filterDriver || (sub.children || []).some(c => {
      const actualArrive = c.arriveDriver === 'others' ? c.arriveDriverOther : c.arriveDriver;
      const actualLeave = c.sameDriver ? actualArrive : (c.leaveDriver === 'others' ? c.leaveDriverOther : c.leaveDriver);
      return actualArrive === filterDriver || actualLeave === filterDriver;
    });

    return matchesQuery && matchesDriver;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 selection:bg-blue-200 pb-12">
      {showDisclaimer && <DisclaimerPopup onAccept={() => setShowDisclaimer(false)} />}
      
      {/* Alert Modal (Dual Language) */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in text-center">
            <div className="text-lg font-bold mb-6 text-gray-800 whitespace-pre-line">{alertMessage}</div>
            <button onClick={() => setAlertMessage('')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold w-full transition">OK, Faham / 好的</button>
          </div>
        </div>
      )}

      {/* Delete Submission Confirmation Modal (Dual Language) */}
      {deleteSubmissionId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in">
            <h3 className="font-bold text-xl mb-2 text-gray-900">Padam Rekod? / 删除记录？</h3>
            <p className="text-gray-600 mb-6 text-sm">Adakah anda pasti mahu memadam rekod ini? Tindakan ini tidak boleh dibatalkan. / 您确定要删除此记录吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteSubmissionId(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold transition">Batal / 取消</button>
              <button onClick={() => handleDeleteSubmission(deleteSubmissionId)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition shadow-lg">Padam / 删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Driver Confirmation Modal (Dual Language) */}
      {deleteDriverId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in">
            <h3 className="font-bold text-xl mb-2 text-gray-900">Padam Pemandu? / 删除司机？</h3>
            <p className="text-gray-600 mb-6 text-sm">Adakah anda pasti mahu memadam pemandu ini daripada senarai? / 您确定要在列表中删除这位司机吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteDriverId(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold transition">Batal / 取消</button>
              <button onClick={handleDeleteDriver} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition shadow-lg">Padam / 删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center justify-center"><Lock size={20} className="mr-2 text-red-600"/> Admin Access</h2>
            <form onSubmit={handleAdminLogin}>
              <input type="password" placeholder="Kata Laluan / Password" className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-red-500 outline-none text-center tracking-widest" value={adminPwd} onChange={e => setAdminPwd(e.target.value)} autoFocus />
              <div className="flex gap-3">
                <button type="button" onClick={() => setAdminModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">Batal / 取消</button>
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition">Login / 登录</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {view !== 'home' && view !== 'admin' && (
        <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-10 border-b border-gray-200">
          <button onClick={handleBack} className="text-blue-600 font-bold flex items-center bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">
            <ArrowLeft size={18} className="mr-1" /> Kembali
          </button>
          <div className="font-bold text-gray-800 flex items-center">
            <span className="text-xl mr-2">🏫</span> SJKC Sin Ming
          </div>
        </div>
      )}

      {/* --- 1. HOME VIEW --- */}
      {view === 'home' && (
        <div className="min-h-screen bg-gradient-to-br from-yellow-300 to-yellow-500 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <Bus size={120} className="absolute top-10 left-[-20px] text-yellow-600 opacity-20 rotate-[-15deg]" />
          <Car size={100} className="absolute bottom-20 right-[-10px] text-yellow-600 opacity-20" />
          
          <div className="mb-6 w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-white z-10 overflow-hidden">
            <img src="https://i.postimg.cc/SjbRb8KH/hq720-removebg-preview.png" alt="SJKC Sin Ming Logo" className="w-full h-full object-cover p-2" />
          </div>

          <div className="text-center z-10 mb-10 px-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">Sistem Pengangkutan SJKC Sin Ming</h1>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mt-2 opacity-90">新明华小交通管理系统</h2>
          </div>

          <div className="w-full max-w-md space-y-4 z-10">
            <button onClick={() => navigateTo('parentForm')} className="w-full bg-white text-gray-900 font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center border-2 border-transparent hover:border-blue-500 text-left group">
              <div className="bg-blue-100 p-3 rounded-xl mr-4 group-hover:bg-blue-500 group-hover:text-white transition">
                <Users size={24} />
              </div>
              <div>
                <div className="text-lg">Borang Maklumat Ibu Bapa</div>
                <div className="text-sm font-normal text-gray-500">家长/监护人填写表格</div>
              </div>
            </button>
            
            <button 
              onClick={() => { if(isDriverFormOpen || isAdmin) navigateTo('driverForm'); }} 
              className={`w-full bg-white text-gray-900 font-bold py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center border-2 text-left group ${(!isDriverFormOpen && !isAdmin) ? 'opacity-75 cursor-not-allowed border-transparent' : 'hover:shadow-xl hover:-translate-y-1 border-transparent hover:border-green-500'}`}
            >
              <div className={`p-3 rounded-xl mr-4 transition ${isDriverFormOpen || isAdmin ? 'bg-green-100 group-hover:bg-green-500 group-hover:text-white' : 'bg-gray-200 text-gray-500'}`}>
                <FileText size={24} />
              </div>
              <div className="flex-1">
                <div className="text-lg flex items-center justify-between">
                  Pendaftaran Pemandu
                  {!isDriverFormOpen && <span className="bg-red-100 text-red-600 text-xs py-1 px-2 rounded-lg border border-red-200 font-extrabold tracking-wider">CLOSED</span>}
                </div>
                <div className="text-sm font-normal text-gray-500">司机注册 / 更新表格</div>
              </div>
            </button>

            <button onClick={() => navigateTo('driverList')} className="w-full bg-white text-gray-900 font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center border-2 border-transparent hover:border-purple-500 text-left group">
              <div className="bg-purple-100 p-3 rounded-xl mr-4 group-hover:bg-purple-500 group-hover:text-white transition">
                <Bus size={24} />
              </div>
              <div>
                <div className="text-lg">Senarai Pemandu</div>
                <div className="text-sm font-normal text-gray-500">公共载送方列表</div>
              </div>
            </button>
          </div>
          
          <div className="mt-12 flex flex-col items-center z-10">
            <div className="text-sm font-semibold text-yellow-900 opacity-70">
              © {new Date().getFullYear()} SJKC Sin Ming, Puchong
            </div>
            <button onClick={() => setAdminModalOpen(true)} className="mt-2 text-xs font-bold tracking-widest uppercase text-yellow-800 opacity-40 hover:opacity-100 transition-opacity">
              Admin
            </button>
          </div>
        </div>
      )}

      {/* --- 2. PARENT DATA COLLECTION FORM --- */}
      {view === 'parentForm' && (
        <div className="max-w-xl mx-auto p-4 animate-in fade-in">
          <div className="text-center mb-6 mt-2">
            <h2 className="text-2xl font-extrabold text-gray-900">Borang Ibu Bapa</h2>
            <p className="text-gray-600 font-medium">家长/监护人交通资料收集</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <h3 className="font-bold mb-5 text-lg flex items-center text-gray-800"><Users size={20} className="mr-2 text-blue-600" /> Maklumat Penjaga / 监护人资料</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">Nama Penuh / 全名</label>
                <input type="text" placeholder="Contoh: Tan Ah Kao" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={parentInfo.name} onChange={e => setParentInfo({...parentInfo, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">No. Kad Pengenalan / 身份证号码</label>
                <input type="text" placeholder="Contoh: 880101-10-5555" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={parentInfo.ic} onChange={e => setParentInfo({...parentInfo, ic: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold mb-1 text-gray-600">No. Telefon / 手机号码</label>
                  <input type="tel" placeholder="Contoh: 012-3456789" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={parentInfo.phone} onChange={e => setParentInfo({...parentInfo, phone: e.target.value})} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold mb-1 text-gray-600">Hubungan / 关系</label>
                  <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" value={parentInfo.relation} onChange={e => setParentInfo({...parentInfo, relation: e.target.value})}>
                    <option value="">Pilih / 选择</option>
                    <option value="IbuBapa">IbuBapa / 父母</option>
                    <option value="Penjaga">Penjaga / 监护人</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">Alamat Rumah / 家庭住址</label>
                <textarea placeholder="Alamat penuh..." className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" rows="2" value={parentInfo.address} onChange={e => setParentInfo({...parentInfo, address: e.target.value})}></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
            <label className="block font-bold mb-2 text-gray-800 text-lg">Jumlah Anak di Sekolah Ini / 本校就读孩子数量</label>
            <p className="text-xs text-gray-500 mb-4">Sila pilih bilangan anak anda / 请选择</p>
            <select className="w-full p-3.5 border border-blue-200 rounded-xl bg-blue-50 text-blue-900 font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" value={numKids} onChange={(e) => handleNumKidsChange(parseInt(e.target.value))}>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Orang / 人</option>)}
            </select>
          </div>

          <div className="space-y-6">
            {childrenInfo.map((childData, i) => (
              <ChildForm 
                key={i} index={i} data={childData} onChange={handleChildChange}
                availableClasses={availableClasses} studentsDict={studentsDict} isLoadingStudents={isLoadingStudents} 
                driversList={driversList}
              />
            ))}
          </div>

          <button onClick={handleParentSubmit} disabled={isSubmitting} className="mt-8 w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all text-lg flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? <><Loader2 size={20} className="mr-2 animate-spin" /> Menghantar / 正在提交...</> : <>Hantar / 提交 <ArrowLeft size={20} className="ml-2 rotate-180" /></>}
          </button>
        </div>
      )}

      {/* --- 3. DRIVER REGISTRATION FORM --- */}
      {view === 'driverForm' && (
        <div className="max-w-xl mx-auto p-4 pb-24 animate-in fade-in">
          <div className="text-center mb-6 mt-2">
            <h2 className="text-2xl font-extrabold text-gray-900">Pendaftaran Pemandu</h2>
            <p className="text-gray-600 font-medium">司机注册与资料更新表格</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
            
            <div className="bg-green-50 p-4 rounded-xl mb-6 text-sm text-green-800 border border-green-200">
              Sila isi maklumat terkini anda untuk rujukan pihak sekolah and kemudahan ibu bapa. / 请填写您的最新资料，以便校方记录及方便家长查阅。
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">Nama Penuh Pemandu / 司机全名 (IC)</label>
                <input type="text" placeholder="Contoh: Lim Ah Beng" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">Nama Panggilan / 称呼 (Yang dikenali murid)</label>
                <input type="text" placeholder="Contoh: Uncle Ah Meng / Auntie Shirley" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none" />
                <p className="text-xs text-gray-500 mt-1">Nama ini akan dipaparkan dalam senarai awam.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold mb-1 text-gray-600">No. Telefon / 手机号码</label>
                  <input type="tel" placeholder="Contoh: 012-3456789" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold mb-1 text-gray-600">No. Plat Kereta / 车牌号码</label>
                  <input type="text" placeholder="Contoh: WAA 1234" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none font-bold uppercase" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">Muat Naik Gambar / 司机照片 (Pilihan/Optional)</label>
                <input type="file" accept="image/*" className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition" />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">Gate Menunggu / 等候校门 (Sila Pilih)</label>
                <div className="grid grid-cols-2 gap-3">
                  {['A3', 'B'].map(gate => (
                    <label key={gate} className="border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 focus-within:ring-2 ring-green-500 transition has-[:checked]:bg-green-100 has-[:checked]:border-green-500">
                      <input type="radio" name="driverGate" value={gate} className="sr-only" />
                      <span className="font-bold text-gray-800">Gate</span>
                      <span className="text-xl font-extrabold text-green-700">{gate}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => { setAlertMessage("Pendaftaran Pemandu Berjaya Disimpan / 司机资料注册成功!"); handleBack(); }} className="mt-8 w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-all text-lg flex justify-center items-center">
              Daftar / 提交注册 <PlusCircle size={20} className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* --- 4. PUBLIC DRIVER LIST VIEW --- */}
      {view === 'driverList' && (
        <div className="max-w-4xl mx-auto p-4 animate-in fade-in">
          <div className="text-center mb-6 mt-2">
            <h2 className="text-2xl font-extrabold text-gray-900">Senarai Pemandu</h2>
            <p className="text-gray-600 font-medium">载送方公共列表</p>
          </div>
          
          <div className="relative mb-6 max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input type="text" placeholder="Cari nama pemandu atau plat kereta..." className="w-full pl-10 p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none shadow-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="bg-green-100 text-green-800 font-bold text-center py-2.5 rounded-xl mb-4 shadow-sm border border-green-200">
                Gate A3
              </div>
              <div className="space-y-4">
                {driversList.filter(d => d.gate === 'A3').map((driver) => (
                  <div key={driver.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl mr-4 flex-shrink-0 overflow-hidden border border-green-100">
                      {driver.photo ? <img src={driver.photo} alt={driver.nickname} className="w-full h-full object-cover" /> : <Bus size={30} />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900">{driver.nickname}</div>
                      <div className="text-sm font-semibold text-gray-600 mb-1">{driver.hp}</div>
                      <div className="flex items-center">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono text-xs font-bold">{driver.plate}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {driversList.filter(d => d.gate === 'A3').length === 0 && <div className="text-sm text-gray-500 text-center py-4">Tiada pemandu.</div>}
              </div>
            </div>

            <div>
              <div className="bg-blue-100 text-blue-800 font-bold text-center py-2.5 rounded-xl mb-4 shadow-sm border border-blue-200">
                Gate B
              </div>
              <div className="space-y-4">
                {driversList.filter(d => d.gate === 'B').map((driver) => (
                  <div key={driver.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mr-4 flex-shrink-0 overflow-hidden border border-blue-100">
                      {driver.photo ? <img src={driver.photo} alt={driver.nickname} className="w-full h-full object-cover" /> : <Bus size={30} />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900">{driver.nickname}</div>
                      <div className="text-sm font-semibold text-gray-600 mb-1">{driver.hp}</div>
                      <div className="flex items-center">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono text-xs font-bold">{driver.plate}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {driversList.filter(d => d.gate === 'B').length === 0 && <div className="text-sm text-gray-500 text-center py-4">Tiada pemandu.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 5. ADMIN VIEW (Protected) --- */}
      {view === 'admin' && (
        <div className="max-w-4xl mx-auto p-4 animate-in fade-in zoom-in-95">
          <div className="bg-gray-900 text-white p-5 rounded-2xl shadow-lg mb-6 flex justify-between items-center bg-pattern">
            <div className="flex items-center">
              <ShieldAlert className="text-red-500 mr-3" size={28} />
              <div>
                <h2 className="text-xl font-bold">Admin Panel</h2>
                <div className="text-xs text-gray-400">SJKC Sin Ming Transport System</div>
              </div>
            </div>
            <button onClick={() => { setIsAdmin(false); navigateTo('home'); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center transition">
              <LogOut size={16} className="mr-2" /> Logout / 登出
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧区域：搜索控制 & 系统设置 */}
            <div className="space-y-6 h-fit">
              {/* Search Controls */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center"><Search size={18} className="mr-2 text-blue-500"/> Carian / 搜索与过滤</h3>
                <input type="text" placeholder="Cari nama ibu bapa, IC, atau murid... / 搜索家长姓名、IC 或学生..." className="w-full p-3 border border-gray-200 rounded-xl mb-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <div className="relative mb-4">
                  <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={filterDriver} onChange={e => setFilterDriver(e.target.value)}>
                    <option value="">Semua Pemandu (All Drivers) / 所有司机</option>
                    {driversList.map((d) => <option key={d.id} value={d.nickname}>{d.nickname}</option>)}
                  </select>
                </div>
                <div className="text-sm font-semibold text-gray-500 text-center bg-gray-100 py-2 rounded-lg">
                  Jumpa / 找到: <span className="text-blue-600 font-bold">{filteredSubmissions.length}</span> rekod / 条记录
                </div>
              </div>

              {/* Manage Drivers */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center"><Bus size={18} className="mr-2 text-purple-500"/> Senarai Pemandu / 司机列表</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {driversList.map(driver => (
                    <div key={driver.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="overflow-hidden pr-2">
                        <div className="font-bold text-gray-900 text-sm truncate">{driver.nickname}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Gate: {driver.gate} | Plat: {driver.plate}</div>
                      </div>
                      <button onClick={() => setDeleteDriverId(driver.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition flex-shrink-0" title="Padam Pemandu">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {driversList.length === 0 && <div className="text-sm text-gray-500 text-center py-4">Tiada pemandu. / 暂无司机。</div>}
                </div>
              </div>

              {/* System Settings */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center">Tetapan Sistem / 系统设置</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50 gap-4">
                  <div>
                    <div className="font-bold text-gray-800">Status Pendaftaran Pemandu</div>
                    <div className="text-xs text-gray-500 mt-1">Buka/tutup borang pendaftaran awam.</div>
                  </div>
                  <button 
                    onClick={() => setIsDriverFormOpen(!isDriverFormOpen)} 
                    className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-sm transition ${isDriverFormOpen ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {isDriverFormOpen ? 'Tutup Borang (Close)' : 'Buka Borang (Open)'}
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧区域：Results List */}
            <div className="space-y-4">
              {isFetchingAdmin ? (
                <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl border border-gray-200">
                  <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
                  <p className="text-gray-500 font-bold">Memuat turun data / 正在加载数据...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center border border-gray-200 shadow-sm text-gray-500">
                  Tiada rekod dijumpai / 未找到任何记录。
                </div>
              ) : (
                filteredSubmissions.map(sub => (
                  <div key={sub.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    
                    {/* Header: Parent Info & Delete */}
                    <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">{sub.parent?.name || "Tiada Nama"} <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-1">{sub.parent?.relation}</span></h4>
                        <div className="text-sm font-semibold text-gray-600 mt-0.5">{sub.parent?.phone} | IC: {sub.parent?.ic}</div>
                      </div>
                      <button onClick={() => setDeleteSubmissionId(sub.id)} className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition active:scale-95" title="Padam Rekod">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Children List */}
                    <div className="space-y-2">
                      {(sub.children || []).map((c, i) => {
                        const actualLeaveDriver = c.sameDriver ? c.arriveDriver : c.leaveDriver;
                        const actualLeaveOther = c.sameDriver ? c.arriveDriverOther : c.leaveDriverOther;
                        
                        return (
                          <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="font-bold text-blue-800 text-sm mb-1.5 flex items-center">
                              <span className="w-5 h-5 bg-blue-200 text-blue-800 flex items-center justify-center rounded-full text-xs mr-2">{i+1}</span>
                              {c.name || "Nama tidak diisi"} <span className="text-gray-500 font-normal ml-1">({c.year} {c.kelas}) - {c.session}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                              <div className="bg-green-50 text-green-800 p-2 rounded-lg border border-green-100">
                                <span className="block text-green-600/70 mb-0.5 font-bold">Datang ({c.arriveGate}):</span>
                                {c.arriveDriver === 'others' ? c.arriveDriverOther : c.arriveDriver || "-"}
                              </div>
                              <div className="bg-orange-50 text-orange-800 p-2 rounded-lg border border-orange-100">
                                <span className="block text-orange-600/70 mb-0.5 font-bold">Balik ({c.leaveGate}):</span>
                                {actualLeaveDriver === 'others' ? actualLeaveOther : actualLeaveDriver || "-"}
                                {c.isRound2 && <span className="ml-1 text-orange-600">(Pusingan 2)</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-3 text-right">ID: {sub.id}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}