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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all duration-500">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300 ease-out">
        <div className="flex justify-center mb-6 text-red-600 drop-shadow-md animate-pulse">
          <ShieldAlert size={56} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-extrabold mb-5 text-center text-gray-900 tracking-tight">Makluman / 通知</h2>
        <div className="space-y-4 mb-8 bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
          <p className="text-sm text-gray-700 text-justify leading-relaxed">
            <span className="font-bold text-blue-800">BM:</span> Pihak sekolah perlu mengumpul data ini demi keselamatan semua pelajar dan untuk tujuan rekod rasmi pengangkutan. Data anda akan disimpan dengan selamat.
          </p>
          <p className="text-sm text-gray-700 text-justify leading-relaxed border-t border-gray-200 pt-4">
            <span className="font-bold text-blue-800">中文:</span> 为了所有学生的安全以及官方交通记录的需要，校方需收集此数据。您的数据将被安全妥善保管。
          </p>
        </div>
        <div className="flex items-center mb-6 bg-yellow-50/80 p-4 rounded-xl border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors duration-300" onClick={() => setDontShow(!dontShow)}>
          <input type="checkbox" checked={dontShow} readOnly className="mr-3 w-5 h-5 accent-yellow-600 cursor-pointer transition-transform duration-200 hover:scale-110" />
          <span className="text-sm font-semibold text-yellow-800 select-none">Do not show again / 不要再显示 / Jangan tunjuk lagi</span>
        </div>
        <button onClick={handleAccept} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-bold hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
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
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 mb-6 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
      <h3 className="font-bold mb-5 text-blue-900 text-lg flex items-center justify-between">
        <div className="flex items-center">
          <span className="bg-blue-100 text-blue-800 w-9 h-9 rounded-full flex items-center justify-center mr-3 shadow-inner font-black">{index + 1}</span>
          <span className="tracking-wide">Anak / 孩子</span>
        </div>
        {isLoadingStudents && <Loader2 size={20} className="animate-spin text-blue-500" />}
      </h3>
      
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div>
          <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">Tahun / 年级</label>
          <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 hover:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:opacity-50 transition-all duration-300 cursor-pointer" 
            value={data.year} onChange={(e) => { handleChange('year', e.target.value); handleChange('kelas', ''); handleChange('name', ''); }} disabled={isLoadingStudents}>
            <option value="">Pilih / 选择</option>
            {Object.keys(availableClasses).sort().map(y => <option key={y} value={y}>Tahun {y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">Kelas / 班级</label>
          <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 hover:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:opacity-50 transition-all duration-300 cursor-pointer" 
            value={data.kelas} onChange={(e) => { handleChange('kelas', e.target.value); handleChange('name', ''); }} disabled={!data.year || isLoadingStudents}>
            <option value="">Pilih / 选择</option>
            {data.year && availableClasses[data.year]?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">Nama Pelajar / 学生姓名</label>
        <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 hover:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:opacity-50 transition-all duration-300 cursor-pointer" 
          value={data.name} onChange={(e) => handleChange('name', e.target.value)} disabled={!data.kelas || isLoadingStudents}>
          <option value="">Pilih / 选择</option>
          {data.kelas && studentsDict[`${data.year}-${data.kelas}`]?.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">Sesi / 班次</label>
        <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 hover:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 cursor-pointer" value={data.session} onChange={(e) => handleChange('session', e.target.value)}>
          <option value="">Pilih / 选择</option>
          <option value="morning">Pagi / 上午班</option>
          <option value="afternoon">Petang / 下午班</option>
        </select>
      </div>

      {/* --- ARRIVAL --- */}
      <div className="mb-5 bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-100 p-5 rounded-2xl transition-all duration-300 hover:shadow-md">
        <h4 className="font-extrabold text-green-800 mb-4 flex items-center border-b border-green-200/60 pb-3">
          <div className="bg-green-100 p-1.5 rounded-lg mr-2"><Bus size={18} className="text-green-700" /></div> 
          Perjalanan Datang / 来学校
        </h4>
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1.5 text-green-700 uppercase tracking-wider">Gate / 校门</label>
          <select className="w-full p-3 border border-green-200 rounded-xl bg-white hover:border-green-400 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300 cursor-pointer text-green-900" value={data.arriveGate} onChange={(e) => handleChange('arriveGate', e.target.value)}>
            <option value="">Pilih / 选择</option>
            <option value="A/A1">Gate A / A1 (Sendiri/自己载送)</option>
            <option value="A3 (Parents)">Gate A3 (Parents/父母)</option>
            <option value="A3">Gate A3</option>
            <option value="B">Gate B</option>
          </select>
        </div>
        {(data.arriveGate === 'A3' || data.arriveGate === 'B') && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 pt-2">
            <label className="block text-xs font-bold mb-1.5 text-green-800 uppercase tracking-wider">Pemandu / 载送司机</label>
            <select className="w-full p-3 border border-green-300 rounded-xl mb-3 hover:border-green-400 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white shadow-sm transition-all duration-300 cursor-pointer" value={data.arriveDriver} onChange={(e) => handleChange('arriveDriver', e.target.value)}>
              <option value="">Pilih Pemandu / 请选择司机</option>
              {driversList.map((driver, i) => <option key={driver.id || i} value={driver.nickname}>{driver.nickname} ({driver.plate})</option>)}
              <option value="others">Lain-lain / 其他 (Sila Nyatakan)</option>
            </select>
            {data.arriveDriver === 'others' && (
               <input type="text" placeholder="Nyatakan Nama & Plat Kereta / 请注明" className="w-full p-3 border border-green-300 rounded-xl outline-none hover:border-green-400 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white shadow-sm transition-all duration-300 animate-in fade-in" value={data.arriveDriverOther} onChange={e => handleChange('arriveDriverOther', e.target.value)} />
            )}
          </div>
        )}
      </div>

      {/* --- DEPARTURE --- */}
      <div className="mb-2 bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-100 p-5 rounded-2xl transition-all duration-300 hover:shadow-md">
        <h4 className="font-extrabold text-orange-800 mb-4 flex items-center border-b border-orange-200/60 pb-3">
          <div className="bg-orange-100 p-1.5 rounded-lg mr-2"><Car size={18} className="text-orange-700" /></div> 
          Perjalanan Balik / 离开学校
        </h4>
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1.5 text-orange-700 uppercase tracking-wider">Gate / 校门</label>
          <select className="w-full p-3 border border-orange-200 rounded-xl bg-white hover:border-orange-400 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all duration-300 cursor-pointer text-orange-900" value={data.leaveGate} onChange={(e) => handleChange('leaveGate', e.target.value)}>
             <option value="">Pilih / 选择</option>
            <option value="A/A1">Gate A/A1 (Sendiri/自己载送)</option>
            <option value="A3 (Parents)">Gate A3 (Parents/父母)</option>
            <option value="A3">Gate A3</option>
            <option value="B">Gate B</option>
          </select>
        </div>

        {data.session === 'morning' && (data.leaveGate === 'A3' || data.leaveGate === 'B') && (
          <div className="mb-5 flex items-center bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-300 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 hover:shadow-md transition-all">
            <input type="checkbox" id={`round2-${index}`} checked={data.isRound2} onChange={(e) => handleChange('isRound2', e.target.checked)} className="mr-3 w-5 h-5 accent-yellow-600 cursor-pointer transition-transform hover:scale-110" />
            <label htmlFor={`round2-${index}`} className="text-sm font-bold text-yellow-900 cursor-pointer select-none flex-1">Balik Pusingan Ke-2 / 放学第二轮载送</label>
          </div>
        )}

        {(data.leaveGate === 'A3' || data.leaveGate === 'B') && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 pt-2">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-orange-800 uppercase tracking-wider">Pemandu / 载送司机</label>
              {(data.arriveGate === 'A3' || data.arriveGate === 'B') && (
                <label className="flex items-center text-xs font-bold text-orange-800 bg-white px-3 py-1.5 rounded-lg border border-orange-200 cursor-pointer shadow-sm hover:bg-orange-100 hover:border-orange-300 transition-all duration-300">
                  <input type="checkbox" className="mr-2 accent-orange-600 w-4 h-4 cursor-pointer transition-transform hover:scale-110" checked={data.sameDriver} onChange={(e) => handleChange('sameDriver', e.target.checked)} />
                  Sama / 来回一样
                </label>
              )}
            </div>
            
            {!data.sameDriver ? (
              <>
                <select className="w-full p-3 border border-orange-300 rounded-xl mb-3 hover:border-orange-400 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white shadow-sm transition-all duration-300 cursor-pointer" value={data.leaveDriver} onChange={(e) => handleChange('leaveDriver', e.target.value)}>
                  <option value="">Pilih Pemandu / 请选择司机</option>
                  {driversList.map((driver, i) => <option key={driver.id || i} value={driver.nickname}>{driver.nickname} ({driver.plate})</option>)}
                  <option value="others">Lain-lain / 其他 (Sila Nyatakan)</option>
                </select>
                {data.leaveDriver === 'others' && (
                   <input type="text" placeholder="Nyatakan Nama & Plat Kereta / 请注明" className="w-full p-3 border border-orange-300 rounded-xl outline-none hover:border-orange-400 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white shadow-sm transition-all duration-300 animate-in fade-in" value={data.leaveDriverOther} onChange={e => handleChange('leaveDriverOther', e.target.value)} />
                )}
              </>
            ) : (
              <div className="p-4 bg-white border border-orange-200 rounded-xl text-sm text-gray-500 italic flex items-center shadow-inner animate-in fade-in zoom-in-95 duration-300">
                <span className="bg-gray-100 text-gray-500 w-7 h-7 rounded-full flex items-center justify-center mr-3 shadow-sm"><Bus size={14}/></span>
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

  // Driver Registration Form State
  const [driverInfo, setDriverInfo] = useState({ fullName: '', nickname: '', phone: '', plate: '', gate: '', photo: null });
  const [isCompressing, setIsCompressing] = useState(false);

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
      setAlertMessage("Sila isikan sekurang-kurangnya Nama dan No. Telefon penjaga. \n 请至少填写监护人姓名与电话号码。");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "transport_submissions"), {
        parent: parentInfo,
        children: childrenInfo,
        createdAt: serverTimestamp()
      });
      setAlertMessage("Borang Berjaya Dihantar! \n 提交成功！");
      // Reset form
      setParentInfo({ name: '', ic: '', phone: '', relation: '', address: '' });
      setNumKids(1);
      setChildrenInfo([{ ...initialChildState }]);
      handleBack();
    } catch (error) {
      console.error("Error saving document: ", error);
      setAlertMessage("Ralat semasa menghantar. Sila cuba lagi. \n 提交时发生错误，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Driver Image Compression Handler
  const handleImageCompress = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // 限制最大宽度 400px 以节省空间
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 压缩为 JPEG，质量设为 0.6，极大地缩小 Base64 字符串体积
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setDriverInfo({...driverInfo, photo: compressedDataUrl});
        setIsCompressing(false);
      };
    };
  };

  // Driver Submit Handler
  const handleDriverSubmit = async () => {
    if (!driverInfo.fullName || !driverInfo.plate) {
       setAlertMessage("Sila lengkapkan borang. \n 请完善表格。");
       return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "drivers_registrations"), {
        ...driverInfo,
        createdAt: serverTimestamp()
      });
      setAlertMessage("Pendaftaran Pemandu Berjaya Disimpan! \n 司机资料注册成功！");
      setDriverInfo({ fullName: '', nickname: '', phone: '', plate: '', gate: '', photo: null });
      handleBack();
    } catch (error) {
      console.error("Error saving driver: ", error);
      setAlertMessage("Ralat semasa menghantar. \n 提交时发生错误，请重试。");
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
      setAlertMessage("Katalaluan Salah \n 密码错误 (Incorrect Password)!");
    }
  };

  const handleDeleteSubmission = async (id) => {
    try {
      await deleteDoc(doc(db, "transport_submissions", id));
      setSubmissions(prev => prev.filter(s => s.id !== id));
      setDeleteSubmissionId(null);
    } catch (error) {
      console.error("Error deleting document: ", error);
      setAlertMessage("Gagal memadam rekod. \n 无法删除记录，请检查数据库权限。");
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView(newView);
  }

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 selection:bg-blue-200 pb-12 overflow-x-hidden">
      {showDisclaimer && <DisclaimerPopup onAccept={() => setShowDisclaimer(false)} />}
      
      {/* Alert Modal (Dual Language) */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all duration-500">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out text-center">
            <div className="text-lg font-bold mb-8 text-gray-800 whitespace-pre-line leading-relaxed">{alertMessage}</div>
            <button onClick={() => setAlertMessage('')} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-2xl font-bold w-full transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">OK, Faham / 好的</button>
          </div>
        </div>
      )}

      {/* Delete Submission Confirmation Modal (Dual Language) */}
      {deleteSubmissionId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all duration-500">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 text-red-600">
              <Trash2 size={24} />
            </div>
            <h3 className="font-extrabold text-xl mb-3 text-gray-900">Padam Rekod? / 删除记录？</h3>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">Adakah anda pasti mahu memadam rekod ini? Tindakan ini tidak boleh dibatalkan. <br/><br/> 您确定要删除此记录吗？此操作无法撤销。</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteSubmissionId(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold transition-all duration-300 active:scale-95">Batal / 取消</button>
              <button onClick={() => handleDeleteSubmission(deleteSubmissionId)} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">Padam / 删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Driver Confirmation Modal (Dual Language) */}
      {deleteDriverId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all duration-500">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out">
             <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 text-red-600">
              <Trash2 size={24} />
            </div>
            <h3 className="font-extrabold text-xl mb-3 text-gray-900">Padam Pemandu? / 删除司机？</h3>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">Adakah anda pasti mahu memadam pemandu ini daripada senarai? <br/><br/> 您确定要在列表中删除这位司机吗？</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteDriverId(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold transition-all duration-300 active:scale-95">Batal / 取消</button>
              <button onClick={handleDeleteDriver} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">Padam / 删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all duration-500">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out">
            <div className="flex justify-center mb-6">
               <div className="bg-red-50 p-4 rounded-full text-red-600">
                 <Lock size={32} strokeWidth={2} />
               </div>
            </div>
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900 text-center">Admin Access</h2>
            <form onSubmit={handleAdminLogin}>
              <input type="password" placeholder="Kata Laluan / Password" className="w-full p-4 border border-gray-200 rounded-2xl mb-6 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none text-center tracking-widest transition-all duration-300" value={adminPwd} onChange={e => setAdminPwd(e.target.value)} autoFocus />
              <div className="flex gap-4">
                <button type="button" onClick={() => setAdminModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-all duration-300 active:scale-95">Batal / 取消</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">Login / 登录</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {view !== 'home' && view !== 'admin' && (
        <div className="bg-white/80 backdrop-blur-lg shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-20 border-b border-gray-200 transition-all duration-300">
          <button onClick={handleBack} className="text-blue-600 font-bold flex items-center bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors duration-300 group">
            <ArrowLeft size={18} className="mr-1.5 group-hover:-translate-x-1 transition-transform duration-300" /> Kembali
          </button>
          <div className="font-extrabold text-gray-800 flex items-center tracking-tight">
            <span className="text-xl mr-2 animate-bounce duration-[2000ms]">🏫</span> SJKC Sin Ming
          </div>
        </div>
      )}

      {/* --- 1. HOME VIEW --- */}
      {view === 'home' && (
        <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 flex flex-col items-center justify-center p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 ease-out">
          
          {/* Lava Lamp Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-amber-300/50 mix-blend-multiply filter blur-[80px] animate-pulse" style={{ animationDuration: '6s' }}></div>
            <div className="absolute top-1/4 -right-1/4 w-[70vw] h-[70vw] rounded-full bg-yellow-200/50 mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
            <div className="absolute -bottom-1/4 left-1/4 w-[80vw] h-[80vw] rounded-full bg-orange-300/40 mix-blend-multiply filter blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }}></div>
          </div>

          {/* Background decorative icons */}
          <Bus size={160} className="absolute top-10 left-[-30px] text-yellow-600/20 rotate-[-15deg] animate-pulse duration-[4000ms] z-0" />
          <Car size={120} className="absolute bottom-20 right-[-20px] text-yellow-600/20 animate-pulse duration-[3000ms] z-0" />
          
          <div className="mb-8 w-36 h-36 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white/50 z-10 overflow-hidden transform hover:scale-105 transition-transform duration-500 hover:rotate-3">
            <img src="https://i.postimg.cc/SjbRb8KH/hq720-removebg-preview.png" alt="SJKC Sin Ming Logo" className="w-full h-full object-cover scale-110 transition-transform duration-700 hover:scale-125" />
          </div>

          <div className="text-center z-10 mb-12 px-4 animate-in slide-in-from-bottom-6 fade-in duration-700 delay-100">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight drop-shadow-sm mb-2">Sistem Pengangkutan SJKC Sin Ming</h1>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 opacity-90 drop-shadow-sm">新明华小交通管理系统</h2>
          </div>

          <div className="w-full max-w-md space-y-5 z-10">
            <button onClick={() => navigateTo('parentForm')} className="w-full bg-white/95 backdrop-blur text-gray-900 font-bold py-4 px-6 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 active:translate-y-0 transition-all duration-300 flex items-center border border-white/40 hover:border-blue-400 text-left group animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200">
              <div className="bg-blue-50 p-3.5 rounded-2xl mr-5 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shadow-sm group-hover:shadow-blue-500/40 group-hover:scale-110">
                <Users size={26} strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-lg font-extrabold text-gray-900">Borang Maklumat Ibu Bapa</div>
                <div className="text-sm font-medium text-gray-500 mt-0.5">家长/监护人填写表格</div>
              </div>
            </button>
            
            <button 
              onClick={() => { if(isDriverFormOpen || isAdmin) navigateTo('driverForm'); }} 
              className={`w-full bg-white/95 backdrop-blur text-gray-900 font-bold py-4 px-6 rounded-3xl shadow-xl transition-all duration-300 flex items-center border text-left group animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300 ${(!isDriverFormOpen && !isAdmin) ? 'opacity-70 cursor-not-allowed border-transparent grayscale-[30%]' : 'hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 active:translate-y-0 border-white/40 hover:border-green-400'}`}
            >
              <div className={`p-3.5 rounded-2xl mr-5 transition-all duration-300 shadow-sm ${isDriverFormOpen || isAdmin ? 'bg-green-50 group-hover:bg-green-500 group-hover:text-white group-hover:shadow-green-500/40 group-hover:scale-110' : 'bg-gray-100 text-gray-400'}`}>
                <FileText size={26} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="text-lg font-extrabold text-gray-900 flex items-center justify-between">
                  Pendaftaran Pemandu
                  {!isDriverFormOpen && <span className="bg-red-100 text-red-600 text-[10px] py-1 px-2.5 rounded-lg border border-red-200 font-black tracking-widest uppercase shadow-sm">Closed</span>}
                </div>
                <div className="text-sm font-medium text-gray-500 mt-0.5">司机注册 / 更新表格</div>
              </div>
            </button>

            <button onClick={() => navigateTo('driverList')} className="w-full bg-white/95 backdrop-blur text-gray-900 font-bold py-4 px-6 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 active:translate-y-0 transition-all duration-300 flex items-center border border-white/40 hover:border-purple-400 text-left group animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500">
              <div className="bg-purple-50 p-3.5 rounded-2xl mr-5 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 shadow-sm group-hover:shadow-purple-500/40 group-hover:scale-110">
                <Bus size={26} strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-lg font-extrabold text-gray-900">Senarai Pemandu</div>
                <div className="text-sm font-medium text-gray-500 mt-0.5">公共载送方列表</div>
              </div>
            </button>
          </div>
          
          <div className="mt-14 flex flex-col items-center z-10 animate-in fade-in duration-1000 delay-700">
            <div className="text-sm font-bold text-yellow-900/60 tracking-wide">
              © {new Date().getFullYear()} SJKC Sin Ming, Puchong
            </div>
            <button onClick={() => setAdminModalOpen(true)} className="mt-3 text-xs font-black tracking-widest uppercase text-yellow-800/30 hover:text-yellow-900 transition-colors duration-300 py-2 px-4 rounded-full hover:bg-yellow-600/10">
              Admin Access
            </button>
          </div>
        </div>
      )}

      {/* --- 2. PARENT DATA COLLECTION FORM --- */}
      {view === 'parentForm' && (
        <div className="max-w-xl mx-auto p-4 animate-in slide-in-from-bottom-4 fade-in duration-500 ease-out">
          <div className="text-center mb-8 mt-4">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Borang Ibu Bapa</h2>
            <p className="text-gray-500 font-bold mt-1 tracking-wide">家长/监护人交通资料收集</p>
          </div>
          
          <div className="bg-white p-7 rounded-3xl shadow-sm hover:shadow-md border border-gray-100 mb-6 relative overflow-hidden transition-shadow duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-blue-400"></div>
            <h3 className="font-extrabold mb-6 text-xl flex items-center text-gray-800 tracking-tight"><Users size={22} className="mr-2.5 text-blue-500 drop-shadow-sm" /> Maklumat Penjaga / 监护人资料</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">Nama Penuh / 全名</label>
                <input type="text" placeholder="Contoh: Tan Ah Kao" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-blue-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300" value={parentInfo.name} onChange={e => setParentInfo({...parentInfo, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">No. Kad Pengenalan / 身份证号码</label>
                <input type="text" placeholder="Contoh: 880101-10-5555" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-blue-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300" value={parentInfo.ic} onChange={e => setParentInfo({...parentInfo, ic: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">No. Telefon / 手机号码</label>
                  <input type="tel" placeholder="Contoh: 012-3456789" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-blue-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300" value={parentInfo.phone} onChange={e => setParentInfo({...parentInfo, phone: e.target.value})} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">Hubungan / 关系</label>
                  <select className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-blue-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 cursor-pointer" value={parentInfo.relation} onChange={e => setParentInfo({...parentInfo, relation: e.target.value})}>
                    <option value="">Pilih / 选择</option>
                    <option value="IbuBapa">IbuBapa / 父母</option>
                    <option value="Penjaga">Penjaga / 监护人</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">Alamat Rumah / 家庭住址</label>
                <textarea placeholder="Alamat penuh..." className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-blue-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300" rows="2" value={parentInfo.address} onChange={e => setParentInfo({...parentInfo, address: e.target.value})}></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white p-7 rounded-3xl shadow-sm hover:shadow-md border border-gray-100 mb-6 transition-shadow duration-300">
            <label className="block font-extrabold mb-2 text-gray-900 text-lg tracking-tight">Jumlah Anak di Sekolah Ini / 本校就读孩子数量</label>
            <p className="text-xs text-gray-500 mb-5 font-medium tracking-wide">Sila pilih bilangan anak anda / 请选择</p>
            <select className="w-full p-4 border-2 border-blue-100 rounded-2xl bg-blue-50/50 hover:bg-blue-50 text-blue-900 font-bold text-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer transition-all duration-300" value={numKids} onChange={(e) => handleNumKidsChange(parseInt(e.target.value))}>
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

          <button onClick={handleParentSubmit} disabled={isSubmitting} className="mt-10 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-extrabold py-4.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 active:translate-y-0 transition-all duration-300 text-lg flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed group">
            {isSubmitting ? <><Loader2 size={22} className="mr-3 animate-spin" /> Menghantar / 正在提交...</> : <>Hantar / 提交 <ArrowLeft size={22} className="ml-2.5 rotate-180 group-hover:translate-x-1 transition-transform duration-300" /></>}
          </button>
        </div>
      )}

      {/* --- 3. DRIVER REGISTRATION FORM --- */}
      {view === 'driverForm' && (
        <div className="max-w-xl mx-auto p-4 pb-24 animate-in slide-in-from-bottom-4 fade-in duration-500 ease-out">
          <div className="text-center mb-8 mt-4">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Pendaftaran Pemandu</h2>
            <p className="text-gray-500 font-bold mt-1 tracking-wide">司机注册与资料更新表格</p>
          </div>

          <div className="bg-white p-7 rounded-3xl shadow-sm hover:shadow-md border border-gray-100 relative overflow-hidden transition-shadow duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 to-emerald-400"></div>
            
            <div className="bg-green-50/80 p-5 rounded-2xl mb-7 text-sm text-green-800 border border-green-100 font-medium leading-relaxed shadow-inner">
              Sila isi maklumat terkini anda untuk rujukan pihak sekolah and kemudahan ibu bapa. / 请填写您的最新资料，以便校方记录及方便家长查阅。
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">Nama Penuh Pemandu / 司机全名 (IC)</label>
                <input type="text" placeholder="Contoh: Lim Ah Beng" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-green-300 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300" value={driverInfo.fullName} onChange={e => setDriverInfo({...driverInfo, fullName: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">Nama Panggilan / 称呼 (Yang dikenali murid)</label>
                <input type="text" placeholder="Contoh: Uncle Ah Meng / Auntie Shirley" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-green-300 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300" value={driverInfo.nickname} onChange={e => setDriverInfo({...driverInfo, nickname: e.target.value})} />
                <p className="text-xs text-gray-400 mt-2 font-medium">Nama ini akan dipaparkan dalam senarai awam.</p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">No. Telefon / 手机号码</label>
                  <input type="tel" placeholder="Contoh: 012-3456789" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-green-300 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300" value={driverInfo.phone} onChange={e => setDriverInfo({...driverInfo, phone: e.target.value})} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">No. Plat Kereta / 车牌号码</label>
                  <input type="text" placeholder="Contoh: WAA 1234" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-green-300 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold uppercase transition-all duration-300" value={driverInfo.plate} onChange={e => setDriverInfo({...driverInfo, plate: e.target.value})} />
                </div>
              </div>

              <div className="p-1">
                <label className="block text-xs font-bold mb-2 text-gray-600 uppercase tracking-wider">Muat Naik Gambar / 司机照片 (Pilihan/Optional)</label>
                <input type="file" accept="image/*" onChange={handleImageCompress} className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-green-100 file:text-green-800 hover:file:bg-green-200 hover:border-green-300 transition-all duration-300 cursor-pointer" />
                {isCompressing && <span className="block mt-3 text-xs text-blue-500 animate-pulse font-bold flex items-center"><Loader2 size={12} className="mr-1 animate-spin"/> Sedang memampatkan gambar... / 正在压缩图片...</span>}
                {driverInfo.photo && !isCompressing && <span className="block mt-3 text-xs text-green-600 font-bold flex items-center animate-in fade-in duration-300"><PlusCircle size={12} className="mr-1"/> Gambar sedia dimuat naik / 图片已准备就绪</span>}
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 text-gray-600 uppercase tracking-wider">Gate Menunggu / 等候校门 (Sila Pilih)</label>
                <div className="grid grid-cols-2 gap-4">
                  {['A3', 'B'].map(gate => (
                    <label key={gate} className="border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 hover:border-green-200 focus-within:ring-4 ring-green-500/20 transition-all duration-300 has-[:checked]:bg-green-50/80 has-[:checked]:border-green-500 has-[:checked]:shadow-sm hover:-translate-y-0.5 active:scale-95">
                      <input type="radio" name="driverGate" value={gate} checked={driverInfo.gate === gate} onChange={e => setDriverInfo({...driverInfo, gate: e.target.value})} className="sr-only" />
                      <span className="font-bold text-gray-500 tracking-wide mb-1">Gate</span>
                      <span className="text-2xl font-black text-gray-900">{gate}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleDriverSubmit} disabled={isSubmitting || isCompressing} className="mt-10 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-extrabold py-4.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 active:translate-y-0 transition-all duration-300 text-lg flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed group">
              {isSubmitting ? <><Loader2 size={22} className="mr-3 animate-spin" /> Sedang Menyimpan / 正在保存...</> : <>Daftar / 提交注册 <PlusCircle size={22} className="ml-2.5 group-hover:rotate-90 transition-transform duration-500" /></>}
            </button>
          </div>
        </div>
      )}

      {/* --- 4. PUBLIC DRIVER LIST VIEW --- */}
      {view === 'driverList' && (
        <div className="max-w-4xl mx-auto p-4 animate-in slide-in-from-bottom-4 fade-in duration-500 ease-out">
          <div className="text-center mb-8 mt-4">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Senarai Pemandu</h2>
            <p className="text-gray-500 font-bold mt-1 tracking-wide">载送方公共列表</p>
          </div>
          
          <div className="relative mb-8 max-w-xl mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300" />
            </div>
            <input type="text" placeholder="Cari nama pemandu atau plat kereta..." className="w-full pl-12 p-4 border border-gray-200 rounded-2xl bg-white hover:border-purple-300 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none shadow-sm transition-all duration-300 font-medium" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
              <div className="bg-gradient-to-r from-green-100 to-green-50 text-green-800 font-black text-center py-3.5 rounded-2xl mb-5 shadow-sm border border-green-200/60 uppercase tracking-widest">
                Gate A3
              </div>
              <div className="space-y-4">
                {driversList.filter(d => d.gate === 'A3').map((driver, i) => (
                  <div key={driver.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl mr-5 flex-shrink-0 overflow-hidden border border-green-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                      {driver.photo ? <img src={driver.photo} alt={driver.nickname} className="w-full h-full object-cover" /> : <Bus size={28} strokeWidth={1.5} />}
                    </div>
                    <div className="flex-1">
                      <div className="font-extrabold text-lg text-gray-900 group-hover:text-green-700 transition-colors duration-300">{driver.nickname}</div>
                      <div className="text-sm font-semibold text-gray-500 mb-1.5">{driver.hp}</div>
                      <div className="flex items-center">
                        <span className="bg-gray-100 px-3 py-1 rounded-lg text-gray-700 font-mono text-xs font-black tracking-wider border border-gray-200 shadow-sm">{driver.plate}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {driversList.filter(d => d.gate === 'A3').length === 0 && <div className="text-sm text-gray-400 font-medium text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">Tiada pemandu.</div>}
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
              <div className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 font-black text-center py-3.5 rounded-2xl mb-5 shadow-sm border border-blue-200/60 uppercase tracking-widest">
                Gate B
              </div>
              <div className="space-y-4">
                {driversList.filter(d => d.gate === 'B').map((driver, i) => (
                  <div key={driver.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mr-5 flex-shrink-0 overflow-hidden border border-blue-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                      {driver.photo ? <img src={driver.photo} alt={driver.nickname} className="w-full h-full object-cover" /> : <Bus size={28} strokeWidth={1.5} />}
                    </div>
                    <div className="flex-1">
                      <div className="font-extrabold text-lg text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{driver.nickname}</div>
                      <div className="text-sm font-semibold text-gray-500 mb-1.5">{driver.hp}</div>
                      <div className="flex items-center">
                        <span className="bg-gray-100 px-3 py-1 rounded-lg text-gray-700 font-mono text-xs font-black tracking-wider border border-gray-200 shadow-sm">{driver.plate}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {driversList.filter(d => d.gate === 'B').length === 0 && <div className="text-sm text-gray-400 font-medium text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">Tiada pemandu.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 5. ADMIN VIEW (Protected) --- */}
      {view === 'admin' && (
        <div className="max-w-5xl mx-auto p-4 animate-in fade-in zoom-in-95 duration-500 ease-out">
          <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl mb-8 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <div className="flex items-center z-10">
              <ShieldAlert className="text-red-500 mr-4 drop-shadow-lg" size={32} />
              <div>
                <h2 className="text-2xl font-black tracking-tight">Admin Panel</h2>
                <div className="text-xs text-gray-400 font-medium tracking-wide mt-0.5">SJKC Sin Ming Transport System</div>
              </div>
            </div>
            <button onClick={() => { setIsAdmin(false); navigateTo('home'); }} className="bg-white/10 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center transition-all duration-300 hover:shadow-lg active:scale-95 z-10 border border-white/10 hover:border-red-500">
              <LogOut size={16} className="mr-2" /> Logout
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* 左侧区域：搜索控制 & 系统设置 */}
            <div className="lg:col-span-4 space-y-6 h-fit">
              {/* Search Controls */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <h3 className="font-extrabold text-lg mb-5 flex items-center text-gray-900"><Search size={20} className="mr-2.5 text-blue-500"/> Carian / 过滤</h3>
                <input type="text" placeholder="Cari nama ibu bapa, IC, murid..." className="w-full p-3.5 border border-gray-200 rounded-xl mb-4 bg-gray-50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all duration-300" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <div className="relative mb-5">
                  <select className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all duration-300 cursor-pointer" value={filterDriver} onChange={e => setFilterDriver(e.target.value)}>
                    <option value="">Semua Pemandu / 所有司机</option>
                    {driversList.map((d) => <option key={d.id} value={d.nickname}>{d.nickname}</option>)}
                  </select>
                </div>
                <div className="text-sm font-semibold text-gray-600 text-center bg-blue-50/50 border border-blue-100 py-3 rounded-xl">
                  Jumpa / 找到: <span className="text-blue-600 font-black text-base">{filteredSubmissions.length}</span> rekod
                </div>
              </div>

              {/* Manage Drivers */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <h3 className="font-extrabold text-lg mb-5 flex items-center text-gray-900"><Bus size={20} className="mr-2.5 text-purple-500"/> Senarai Pemandu</h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {driversList.map(driver => (
                    <div key={driver.id} className="flex justify-between items-center p-3.5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-white transition-all duration-200 group">
                      <div className="overflow-hidden pr-2">
                        <div className="font-bold text-gray-900 text-sm truncate">{driver.nickname}</div>
                        <div className="text-xs font-semibold text-gray-500 mt-1">Gate: <span className="text-gray-700">{driver.gate}</span> | Plat: <span className="text-gray-700">{driver.plate}</span></div>
                      </div>
                      <button onClick={() => setDeleteDriverId(driver.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 opacity-50 group-hover:opacity-100" title="Padam Pemandu">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {driversList.length === 0 && <div className="text-sm font-medium text-gray-400 text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">Tiada pemandu.</div>}
                </div>
              </div>

              {/* System Settings */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <h3 className="font-extrabold text-lg mb-5 flex items-center text-gray-900">Tetapan / 设置</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Pendaftaran Pemandu</div>
                    <div className="text-xs text-gray-500 mt-0.5 mb-3">Buka/tutup borang awam.</div>
                  </div>
                  <button 
                    onClick={() => setIsDriverFormOpen(!isDriverFormOpen)} 
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${isDriverFormOpen ? 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200' : 'bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border border-green-200'}`}
                  >
                    {isDriverFormOpen ? 'Tutup Borang (Close)' : 'Buka Borang (Open)'}
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧区域：Results List */}
            <div className="lg:col-span-8 space-y-5">
              {isFetchingAdmin ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
                  <p className="text-gray-500 font-bold tracking-wide">Memuat turun data...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-gray-300 shadow-sm text-gray-400 font-medium">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  Tiada rekod dijumpai / 未找到任何记录。
                </div>
              ) : (
                filteredSubmissions.map(sub => (
                  <div key={sub.id} className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md border border-gray-100 relative overflow-hidden transition-all duration-300 group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-indigo-500 opacity-80"></div>
                    
                    {/* Header: Parent Info & Delete */}
                    <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                      <div>
                        <h4 className="font-extrabold text-xl text-gray-900 tracking-tight flex items-center">
                          {sub.parent?.name || "Tiada Nama"} 
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg ml-3 tracking-wide">{sub.parent?.relation}</span>
                        </h4>
                        <div className="text-sm font-semibold text-gray-500 mt-1.5 flex items-center">
                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200 mr-2">{sub.parent?.phone}</span> 
                          IC: {sub.parent?.ic}
                        </div>
                      </div>
                      <button onClick={() => setDeleteSubmissionId(sub.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 active:scale-95" title="Padam Rekod">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Children List */}
                    <div className="space-y-3">
                      {(sub.children || []).map((c, i) => {
                        const actualLeaveDriver = c.sameDriver ? c.arriveDriver : c.leaveDriver;
                        const actualLeaveOther = c.sameDriver ? c.arriveDriverOther : c.leaveDriverOther;
                        
                        return (
                          <div key={i} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 hover:bg-white hover:border-gray-200 transition-colors duration-300">
                            <div className="font-extrabold text-blue-900 text-sm mb-2.5 flex items-center">
                              <span className="w-6 h-6 bg-blue-100 text-blue-800 flex items-center justify-center rounded-full text-xs mr-2.5 shadow-inner">{i+1}</span>
                              {c.name || "Nama tidak diisi"} <span className="text-gray-500 font-medium ml-2">({c.year} {c.kelas}) - {c.session}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                              <div className="bg-green-50/50 text-green-900 p-3 rounded-xl border border-green-100">
                                <span className="block text-green-600/80 mb-1 font-bold uppercase tracking-wider text-[10px]">Datang ({c.arriveGate})</span>
                                {c.arriveDriver === 'others' ? c.arriveDriverOther : c.arriveDriver || "-"}
                              </div>
                              <div className="bg-orange-50/50 text-orange-900 p-3 rounded-xl border border-orange-100">
                                <span className="block text-orange-600/80 mb-1 font-bold uppercase tracking-wider text-[10px]">Balik ({c.leaveGate})</span>
                                {actualLeaveDriver === 'others' ? actualLeaveOther : actualLeaveDriver || "-"}
                                {c.isRound2 && <span className="ml-1.5 text-orange-600 font-bold bg-orange-100 px-1.5 py-0.5 rounded">(Pusingan 2)</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[10px] font-mono text-gray-300 mt-4 text-right">ID: {sub.id}</div>
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