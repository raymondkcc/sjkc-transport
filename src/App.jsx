import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowLeft, Bus, Car, FileText, Users, Search, PlusCircle, LogOut, Lock, Loader2 } from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// =========================================================================
// ⚠️ VS CODE 部署提示 (IMPORTANT FOR VS CODE)
// 当您将此代码复制到 VS Code 时，请取消注释下面这行引入真实数据库的代码：
// import { kehadiranDb, kehadiranAuth } from './firebase';
// 并且您可以安全地删除或注释掉下方 try...catch 区块中为了预览而设置的临时代码。
// =========================================================================

let kehadiranDb = null;
let kehadiranAuth = null;
try {
  // 这段代码仅用于确保在当前的网页预览环境中不会崩溃。
  const kehadiranConfig = {
    apiKey: "preview-dummy-key",
    authDomain: "sistem-kehadiran-sm.firebaseapp.com",
    projectId: "sistem-kehadiran-sm",
    storageBucket: "sistem-kehadiran-sm.firebasestorage.app",
    messagingSenderId: "342447956861",
    appId: "1:342447956861:web:2636cce55011d336e8a214"
  };
  
  const apps = getApps();
  const existingApp = apps.find(app => app.name === "Kehadiran");
  if (!existingApp) {
    const kehadiranApp = initializeApp(kehadiranConfig, "Kehadiran");
    kehadiranDb = getFirestore(kehadiranApp);
    kehadiranAuth = getAuth(kehadiranApp);
  } else {
    kehadiranDb = getFirestore(existingApp);
    kehadiranAuth = getAuth(existingApp);
  }
} catch (error) {
  console.warn("Firebase initialization skipped for preview environment.");
}

// --- MOCK DATA ---
const mockDrivers = [
  { nickname: "Uncle Ah Meng", plate: "WAA1234", gate: "A3", hp: "012-3456789", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Meng" },
  { nickname: "Auntie Siti", plate: "BCC999", gate: "B", hp: "017-9876543", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti" },
  { nickname: "Bas Sekolah Cikgu Wong", plate: "VBB555", gate: "A3", hp: "019-1112222", photo: null }
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

const ChildForm = ({ index, availableClasses, studentsDict, isLoadingStudents }) => {
  const [year, setYear] = useState('');
  const [kelas, setKelas] = useState('');
  const [session, setSession] = useState('');
  
  const [arriveGate, setArriveGate] = useState('');
  const [arriveDriver, setArriveDriver] = useState('');
  const [arriveDriverOther, setArriveDriverOther] = useState('');
  
  const [leaveGate, setLeaveGate] = useState('');
  const [leaveDriver, setLeaveDriver] = useState('');
  const [leaveDriverOther, setLeaveDriverOther] = useState('');
  
  const [sameDriver, setSameDriver] = useState(false);
  const [isRound2, setIsRound2] = useState(false);

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
          <select 
            className="w-full p-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50" 
            value={year} 
            onChange={(e) => { setYear(e.target.value); setKelas(''); }}
            disabled={isLoadingStudents}
          >
            <option value="">Pilih / 选择</option>
            {Object.keys(availableClasses).sort().map(y => <option key={y} value={y}>Tahun {y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-gray-600">Kelas / 班级</label>
          <select 
            className="w-full p-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50" 
            value={kelas} 
            onChange={(e) => setKelas(e.target.value)} 
            disabled={!year || isLoadingStudents}
          >
            <option value="">Pilih / 选择</option>
            {year && availableClasses[year]?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-bold mb-1 text-gray-600">Nama Pelajar / 学生姓名</label>
        <select 
          className="w-full p-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50" 
          disabled={!kelas || isLoadingStudents}
        >
          <option value="">Pilih / 选择</option>
          {kelas && studentsDict[`${year}-${kelas}`]?.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-bold mb-1 text-gray-600">Sesi / 班次</label>
        <select className="w-full p-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition" value={session} onChange={(e) => setSession(e.target.value)}>
          <option value="">Pilih / 选择</option>
          <option value="morning">Pagi / 上午班</option>
          <option value="afternoon">Petang / 下午班</option>
        </select>
      </div>

      {/* --- ARRIVAL (DATANG) SECTION --- */}
      <div className="mb-5 bg-green-50/50 border border-green-200 p-4 rounded-xl">
        <h4 className="font-bold text-green-800 mb-3 flex items-center border-b border-green-200 pb-2">
          <Bus size={18} className="mr-2" /> Perjalanan Datang / 来学校
        </h4>
        
        <div className="mb-3">
          <label className="block text-xs font-bold mb-1 text-green-700">Gate / 校门</label>
          <select className="w-full p-2.5 border border-green-200 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none transition text-green-900" value={arriveGate} onChange={(e) => setArriveGate(e.target.value)}>
            <option value="">Pilih / 选择</option>
            <option value="A/A1">Gate A / A1 (Sendiri/自己载送)</option>
            <option value="A3">Gate A3</option>
            <option value="B">Gate B</option>
          </select>
        </div>

        {(arriveGate === 'A3' || arriveGate === 'B') && (
          <div className="animate-in fade-in slide-in-from-top-2 pt-2">
            <label className="block text-xs font-bold mb-1 text-green-800">Pemandu / 载送司机</label>
            <select className="w-full p-2.5 border border-green-300 rounded-xl mb-2 focus:ring-2 focus:ring-green-500 outline-none bg-white shadow-sm" value={arriveDriver} onChange={(e) => setArriveDriver(e.target.value)}>
              <option value="">Pilih Pemandu / 请选择司机</option>
              {mockDrivers.map((driver, i) => (
                <option key={i} value={driver.nickname}>{driver.nickname} ({driver.plate})</option>
              ))}
              <option value="others">Lain-lain / 其他 (Sila Nyatakan)</option>
            </select>
            {arriveDriver === 'others' && (
               <input type="text" placeholder="Nyatakan Nama & Plat Kereta / 请注明" className="w-full p-2.5 border border-green-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 animate-in fade-in bg-white shadow-sm" value={arriveDriverOther} onChange={e => setArriveDriverOther(e.target.value)} />
            )}
          </div>
        )}
      </div>

      {/* --- DEPARTURE (BALIK) SECTION --- */}
      <div className="mb-2 bg-orange-50/50 border border-orange-200 p-4 rounded-xl">
        <h4 className="font-bold text-orange-800 mb-3 flex items-center border-b border-orange-200 pb-2">
          <Car size={18} className="mr-2" /> Perjalanan Balik / 离开学校
        </h4>

        <div className="mb-3">
          <label className="block text-xs font-bold mb-1 text-orange-700">Gate / 校门</label>
          <select className="w-full p-2.5 border border-orange-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 outline-none transition text-orange-900" value={leaveGate} onChange={(e) => setLeaveGate(e.target.value)}>
             <option value="">Pilih / 选择</option>
            <option value="A/A1">Gate A/A1 (Sendiri/自己载送)</option>
            <option value="A3">Gate A3</option>
            <option value="B">Gate B</option>
          </select>
        </div>

        {session === 'morning' && (leaveGate === 'A3' || leaveGate === 'B') && (
          <div className="mb-4 flex items-center bg-yellow-50 p-4 rounded-xl border-2 border-yellow-400 shadow-sm animate-in fade-in slide-in-from-top-2">
            <input type="checkbox" id={`round2-${index}`} checked={isRound2} onChange={(e) => setIsRound2(e.target.checked)} className="mr-3 w-5 h-5 accent-yellow-600 cursor-pointer" />
            <label htmlFor={`round2-${index}`} className="text-sm font-bold text-yellow-900 cursor-pointer select-none flex-1">Balik Pusingan Ke-2 / 放学第二轮载送</label>
          </div>
        )}

        {(leaveGate === 'A3' || leaveGate === 'B') && (
          <div className="animate-in fade-in slide-in-from-top-2 pt-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-orange-800">Pemandu / 载送司机</label>
              {(arriveGate === 'A3' || arriveGate === 'B') && (
                <label className="flex items-center text-xs font-bold text-orange-800 bg-white px-2 py-1.5 rounded-lg border border-orange-300 cursor-pointer shadow-sm hover:bg-orange-100 transition">
                  <input type="checkbox" className="mr-2 accent-orange-600 w-4 h-4 cursor-pointer" checked={sameDriver} onChange={(e) => setSameDriver(e.target.checked)} />
                  Sama / 来回一样
                </label>
              )}
            </div>
            
            {!sameDriver ? (
              <>
                <select className="w-full p-2.5 border border-orange-300 rounded-xl mb-2 focus:ring-2 focus:ring-orange-500 outline-none bg-white shadow-sm" value={leaveDriver} onChange={(e) => setLeaveDriver(e.target.value)}>
                  <option value="">Pilih Pemandu / 请选择司机</option>
                  {mockDrivers.map((driver, i) => (
                    <option key={i} value={driver.nickname}>{driver.nickname} ({driver.plate})</option>
                  ))}
                  <option value="others">Lain-lain / 其他 (Sila Nyatakan)</option>
                </select>
                {leaveDriver === 'others' && (
                   <input type="text" placeholder="Nyatakan Nama & Plat Kereta / 请注明" className="w-full p-2.5 border border-orange-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 animate-in fade-in bg-white shadow-sm" value={leaveDriverOther} onChange={e => setLeaveDriverOther(e.target.value)} />
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
  const [view, setView] = useState('home'); // 'home', 'parentForm', 'driverForm', 'driverList', 'admin'
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [numKids, setNumKids] = useState(1);
  
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDriverFormOpen, setIsDriverFormOpen] = useState(true);

  // --- FIREBASE FETCHING STATES ---
  const [availableClasses, setAvailableClasses] = useState({});
  const [studentsDict, setStudentsDict] = useState({});
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  useEffect(() => {
    // 1. Disclaimer logic
    if (!localStorage.getItem('hideTransportDisclaimer')) {
      setShowDisclaimer(true);
    }

    // 2. Fetch students from Kehadiran DB
    const fetchStudentsFromKehadiran = async () => {
      setIsLoadingStudents(true);
      
      // 如果是在预览面板（使用 dummy key），直接加载备用测试数据
      if (!kehadiranDb || !kehadiranAuth || kehadiranDb.app.options.apiKey === "preview-dummy-key") {
        setAvailableClasses({"1": ["Mawar", "Melati"], "6": ["DE"]});
        setStudentsDict({
          "1-Mawar": ["Ali bin Abu", "Muthusamy"], 
          "1-Melati": ["Siti Nurhaliza"],
          "6-DE": ["WONG YU MIN"]
        });
        setIsLoadingStudents(false);
        return;
      }

      try {
        // 在查询 Firestore 之前先进行匿名登录以获取访问权限
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
            
            // Extract Year and Class (e.g., "6 DE" -> Year 6, Class DE)
            const match = fullClass.match(/^(\d+)\s*(.*)/);
            let year = "Lain-lain";
            let className = fullClass;

            if (match) {
              year = match[1];
              className = match[2] || fullClass;
            }

            // Group Classes by Year
            if (!tempClasses[year]) tempClasses[year] = new Set();
            tempClasses[year].add(className);

            // Group Students by Year-Class key
            const dictKey = `${year}-${className}`;
            if (!tempStudents[dictKey]) tempStudents[dictKey] = [];
            tempStudents[dictKey].push(name);
          });

          // Convert Sets to Arrays and Sort Alphabetically
          Object.keys(tempClasses).forEach(y => {
            tempClasses[y] = Array.from(tempClasses[y]).sort();
          });
          Object.keys(tempStudents).forEach(k => {
            tempStudents[k].sort();
          });

          setAvailableClasses(tempClasses);
          setStudentsDict(tempStudents);
        } else {
          console.warn("Student index document not found in Kehadiran DB.");
        }
      } catch (error) {
        console.error("Error fetching from Kehadiran DB:", error);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudentsFromKehadiran();
  }, []);

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    
    // =========================================================================
    // ⚠️ VS CODE 部署提示 (IMPORTANT FOR VS CODE)
    // 当您在 VS Code 中运行时，请取消注释下面这行代码以使用 .env 文件中的安全密码：
    // const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    // 并且删除这行测试用的硬编码密码：
    const correctPassword = "BBC+9404";
    // =========================================================================

    if (adminPwd === correctPassword) {
      setIsAdmin(true);
      setView('admin');
      setAdminModalOpen(false);
      setAdminPwd('');
    } else {
      setAlertMessage("Katalaluan Salah / Incorrect Password!");
    }
  };

  const navigateTo = (newView) => {
    window.scrollTo(0, 0);
    setView(newView);
  }

  const handleBack = () => {
    window.scrollTo(0, 0);
    if (isAdmin) {
      setView('admin');
    } else {
      setView('home');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 selection:bg-blue-200">
      {showDisclaimer && <DisclaimerPopup onAccept={() => setShowDisclaimer(false)} />}
      
      {alertMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in text-center">
            <div className="text-lg font-bold mb-6 text-gray-800">{alertMessage}</div>
            <button onClick={() => setAlertMessage('')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold w-full transition">OK, Faham</button>
          </div>
        </div>
      )}

      {adminModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center justify-center"><Lock size={20} className="mr-2 text-red-600"/> Admin Access</h2>
            <form onSubmit={handleAdminSubmit}>
              <input type="password" placeholder="Kata Laluan / Password" className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-red-500 outline-none text-center tracking-widest" value={adminPwd} onChange={e => setAdminPwd(e.target.value)} autoFocus />
              <div className="flex gap-3">
                <button type="button" onClick={() => setAdminModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">Batal</button>
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition">Login</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- HEADER (Visible everywhere except Home and Admin) --- */}
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

      {/* --- 1. HOME VIEW (Linktree Style) --- */}
      {view === 'home' && (
        <div className="min-h-screen bg-gradient-to-br from-yellow-300 to-yellow-500 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <Bus size={120} className="absolute top-10 left-[-20px] text-yellow-600 opacity-20 rotate-[-15deg]" />
          <Car size={100} className="absolute bottom-20 right-[-10px] text-yellow-600 opacity-20" />
          
          <div className="mb-6 w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-white z-10">
            <span className="text-6xl" role="img" aria-label="School">🏫</span>
          </div>

          <div className="text-center z-10 mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">Sistem Pengangkutan</h1>
            <h2 className="text-xl font-bold text-gray-800 mt-1 opacity-90">交通管理系统</h2>
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
            <button 
              onClick={() => setAdminModalOpen(true)}
              className="mt-2 text-xs font-bold tracking-widest uppercase text-yellow-800 opacity-40 hover:opacity-100 transition-opacity"
            >
              Admin
            </button>
          </div>
        </div>
      )}

      {/* --- 2. PARENT DATA COLLECTION FORM --- */}
      {view === 'parentForm' && (
        <div className="max-w-xl mx-auto p-4 pb-24 animate-in fade-in">
          <div className="text-center mb-6 mt-2">
            <h2 className="text-2xl font-extrabold text-gray-900">Borang Ibu Bapa</h2>
            <p className="text-gray-600 font-medium">家长/监护人交通资料收集</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <h3 className="font-bold mb-5 text-lg flex items-center text-gray-800">
              <Users size={20} className="mr-2 text-blue-600" /> Maklumat Penjaga / 监护人资料
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">Nama Penuh / 全名</label>
                <input type="text" placeholder="Contoh: Tan Ah Kao" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">No. Kad Pengenalan / 身份证号码</label>
                <input type="text" placeholder="Contoh: 880101-10-5555" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold mb-1 text-gray-600">No. Telefon / 手机号码</label>
                  <input type="tel" placeholder="Contoh: 012-3456789" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold mb-1 text-gray-600">Hubungan / 关系</label>
                  <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Pilih / 选择</option>
                    <option value="ibubapa">IbuBapa / 父母</option>
                    <option value="penjaga">Penjaga / 监护人</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">Alamat Rumah / 家庭住址</label>
                <textarea placeholder="Alamat penuh..." className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" rows="2"></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
            <label className="block font-bold mb-2 text-gray-800 text-lg">Jumlah Anak di Sekolah Ini / 本校就读孩子数量</label>
            <p className="text-xs text-gray-500 mb-4">Sila pilih bilangan anak anda / 请选择</p>
            <select className="w-full p-3.5 border border-blue-200 rounded-xl bg-blue-50 text-blue-900 font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" value={numKids} onChange={(e) => setNumKids(parseInt(e.target.value))}>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Orang / 人</option>)}
            </select>
          </div>

          <div className="space-y-6">
            {Array.from({ length: numKids }).map((_, i) => (
              <ChildForm 
                key={i} 
                index={i} 
                availableClasses={availableClasses} 
                studentsDict={studentsDict} 
                isLoadingStudents={isLoadingStudents} 
              />
            ))}
          </div>

          <button onClick={() => { setAlertMessage("Borang Berjaya Dihantar / 提交成功!"); handleBack(); }} className="mt-8 w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all text-lg flex justify-center items-center">
            Hantar / 提交 <ArrowLeft size={20} className="ml-2 rotate-180" />
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
              Sila isi maklumat terkini anda untuk rujukan pihak sekolah dan kemudahan ibu bapa. / 请填写您的最新资料，以便校方记录及方便家长查阅。
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
                {mockDrivers.filter(d => d.gate === 'A3').map((driver, i) => (
                  <div key={`a3-${i}`} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition">
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
              </div>
            </div>

            <div>
              <div className="bg-blue-100 text-blue-800 font-bold text-center py-2.5 rounded-xl mb-4 shadow-sm border border-blue-200">
                Gate B
              </div>
              <div className="space-y-4">
                {mockDrivers.filter(d => d.gate === 'B').map((driver, i) => (
                  <div key={`b-${i}`} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition">
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
              <LogOut size={16} className="mr-2" /> Logout
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg mb-4 flex items-center"><Search size={18} className="mr-2 text-blue-500"/> Carian Pelajar / 搜索学生</h3>
              <input type="text" placeholder="Masukkan nama atau IC..." className="w-full p-3 border border-gray-200 rounded-xl mb-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
              <div className="relative mb-4">
                <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 appearance-none focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Filter mengikut Pemandu...</option>
                  {mockDrivers.map((d, i) => <option key={i} value={d.nickname}>{d.nickname}</option>)}
                </select>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition">Cari Rekod</button>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center"><PlusCircle size={18} className="mr-2 text-green-500"/> Tindakan Pantas / 快捷操作</h3>
                <div className="space-y-3">
                  <button className="w-full bg-purple-50 text-purple-700 border border-purple-200 py-3.5 rounded-xl font-bold hover:bg-purple-100 transition flex justify-center items-center">
                    Export Data ke Excel (CSV)
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center">Tetapan Sistem / 系统设置</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50 gap-4">
                  <div>
                    <div className="font-bold text-gray-800">Status Pendaftaran Pemandu</div>
                    <div className="text-xs text-gray-500 mt-1">Buka/tutup borang pendaftaran untuk kegunaan awam.</div>
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
          </div>
        </div>
      )}
    </div>
  );
}