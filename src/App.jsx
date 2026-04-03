import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowLeft, Bus, Car, FileText, Users, Search, PlusCircle, LogOut, Lock, Loader2, Trash2, DownloadCloud, Pencil, CheckCircle2, XCircle, BarChart3, Phone, IdCard } from 'lucide-react';
import { doc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// 引入真实数据库（完全基于您的生产环境配置）
import { db, kehadiranDb, kehadiranAuth } from './firebase';

// --- FORMATTER FUNCTIONS ---
const formatIC = (val) => {
  let cleaned = val.replace(/\D/g, ''); // 只保留数字
  if (cleaned.length > 12) cleaned = cleaned.slice(0, 12); // 限制最多 12 位
  if (cleaned.length > 8) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`; // 格式化为 123456-12-3456
  } else if (cleaned.length > 6) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned;
};

const formatPhone = (val) => {
  let cleaned = val.replace(/\D/g, ''); 
  if (cleaned.length > 3) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 12)}`; 
  }
  return cleaned;
};

const formatPlate = (val) => {
  let cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, ''); 
  let match = cleaned.match(/^([A-Z]+)(\d+.*)$/); 
  if (match) {
    return `${match[1]} ${match[2]}`; 
  }
  return cleaned;
};

// --- TRANSCRIBED EXCEL DRIVERS DATA (Pre-formatted & Merged) ---
const excelDrivers = [
  // Gate A3 (Merged Duplicates)
  { nickname: "Uncle Ong", plates: ["WHP 8890"], gate: "A3", phones: ["012 6569825"], fullName: "ONG SEE KIM" },
  { nickname: "Aunty Kuan", plates: ["WSW 6076"], gate: "A3", phones: ["012 3913357"], fullName: "YAP SIEW KEAN" },
  { nickname: "Emily", plates: ["VHV 9616", "WA 2834Y", "WWF 9616"], gate: "A3", phones: ["016 8101372"], fullName: "YEONG LAI KIN" },
  { nickname: "Uncle Sam", plates: ["VEF 8208"], gate: "A3", phones: ["016 2570708"], fullName: "LIM TEIN SENG" },
  { nickname: "Aunty Sanny", plates: ["BLM 8286", "WTK 4284", "WUF 9866", "WXR 1353", "BJU 2930"], gate: "A3", phones: ["017 2899262"], fullName: "TANG YIN LOOT" },
  { nickname: "Uncle Chua", plates: ["WPE 9682"], gate: "A3", phones: ["019 2299910"], fullName: "CHUA YOON KIONG" },
  
  // Gate B
  { nickname: "Jasmin Ngian", plates: ["WGU 8795"], gate: "B", phones: ["016 2736002"], fullName: "Ngian Geok Lan" },
  { nickname: "Auntie 小云", plates: ["BNW 2263"], gate: "B", phones: ["016 2256631"], fullName: "Lee Siew Wan" },
  { nickname: "Auntie Amy", plates: ["W 8087Q"], gate: "B", phones: ["012 2342312"], fullName: "Koo Hian Wah" },
  { nickname: "Auntie May", plates: ["WWT 3657"], gate: "B", phones: ["012 2538799"], fullName: "Chen Mei Fong" },
  { nickname: "Auntie Ying", plates: ["WPH 2338"], gate: "B", phones: ["016 9932893"], fullName: "Koh Yoke Ying" },
  { nickname: "Auntie Lai", plates: ["VKB 9915"], gate: "B", phones: ["016 2213598"], fullName: "Lai Yien Hua" },
  { nickname: "Auntie Mi", plates: ["VJB 7782"], gate: "B", phones: ["011 59351933"], fullName: "Yap Yuet Mei" },
  { nickname: "Auntie Sharon", plates: ["VAL 9649"], gate: "B", phones: ["013 3335481"], fullName: "Liau Sau Lun" },
  { nickname: "Uncle Phan", plates: ["VJ 9492"], gate: "B", phones: ["019 5899492"], fullName: "Phan Chai Choor" },
  { nickname: "Auntie 秀蓉", plates: ["VHG 5609"], gate: "B", phones: ["012 6906208"], fullName: "Leong Sow Yong" },
  { nickname: "Auntie Elly", plates: ["WVL 6043"], gate: "B", phones: ["012 9189172"], fullName: "Lee Kam Meei" },
  { nickname: "Auntie Cindy", plates: ["VKK 9828"], gate: "B", phones: ["012 9398919"], fullName: "Ong Saw Keng" },
  { nickname: "Auntie Chew", plates: ["WNB 3013"], gate: "B", phones: ["016 2678899"], fullName: "Chew Ah Choo" },
  { nickname: "Auntie May (Sea)", plates: ["BRM 8688"], gate: "B", phones: ["012 6528831"], fullName: "Tam Sea May" },
  { nickname: "Auntie Moon", plates: ["WC 1591A"], gate: "B", phones: ["018 2888216"], fullName: "Ong Moon San" },
  { nickname: "Auntie 玉珍", plates: ["BKD 8484"], gate: "B", phones: ["012 3351859"], fullName: "Ting Yoke Ting" },
  { nickname: "英姐", plates: ["VDM 9869"], gate: "B", phones: ["016 3300580"], fullName: "LEW AH YING" },
  { nickname: "Auntie Mei Young", plates: ["VEN 1408"], gate: "B", phones: ["016 3358365"], fullName: "LOW MEI YOUNG" },
  { nickname: "Auntie Ling", plates: ["WTS 9583"], gate: "B", phones: ["012 6529834"], fullName: "Wong Mee Ling" },
  { nickname: "Auntie Agnes", plates: ["VHR 6896"], gate: "B", phones: ["012 3592756"], fullName: "Ong Ai Siok" },
  { nickname: "Uncle Lai", plates: ["WUP 6896"], gate: "B", phones: ["012 6650708"], fullName: "Lai Yong Fong" },
  { nickname: "Auntie Teoh", plates: ["VMU 6684"], gate: "B", phones: ["017 3555931"], fullName: "Teoh Huey Lian" },
  { nickname: "Auntie Yap", plates: ["WB 5095L"], gate: "B", phones: ["016 9763432"], fullName: "Yap Mooi Yin" },
  { nickname: "Uncle Lee", plates: ["RY 3383", "WC 2354D"], gate: "B", phones: ["012 6686260"], fullName: "Lee Sing Long" }, 
  { nickname: "Auntie Lee", plates: ["WKW 906"], gate: "B", phones: ["012 6686261"], fullName: "Yee Siew Chin" },
  { nickname: "Mdm. Ding Su Ling", plates: ["WNU 6281"], gate: "B", phones: ["016 3181162"], fullName: "Ding Su Ling" },
  { nickname: "Mdm. Ding Su See", plates: ["BLH 2489"], gate: "B", phones: ["016 7787677"], fullName: "Ding Su See" },
  { nickname: "Uncle Paul", plates: ["WA 9759G"], gate: "B", phones: ["016 6396323"], fullName: "Khoo Kok Eng" },
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

const ChildForm = ({ index, data, onChange, availableClasses, studentsDict, isLoadingStudents, driversList, submittedStudentsSet, currentSelectedStudentsSet }) => {
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
            value={data.year} onChange={(e) => { 
              const selectedYear = e.target.value;
              handleChange('year', selectedYear); 
              handleChange('kelas', ''); 
              handleChange('name', ''); 
              
              // Auto-fill session based on year
              if (['1', '2', '3'].includes(selectedYear)) {
                handleChange('session', 'afternoon');
              } else if (['4', '5', '6'].includes(selectedYear)) {
                handleChange('session', 'morning');
              } else {
                handleChange('session', '');
              }
            }} disabled={isLoadingStudents}>
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
          {data.kelas && studentsDict[`${data.year}-${data.kelas}`]
            ?.filter(s => {
              const key = `${data.year}-${data.kelas}-${s}`;
              const isAlreadySubmitted = submittedStudentsSet.has(key);
              const isSelectedByOtherChild = currentSelectedStudentsSet.has(key) && data.name !== s;
              return !isAlreadySubmitted && !isSelectedByOtherChild;
            })
            ?.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-bold mb-1.5 text-gray-400 uppercase tracking-wider flex items-center justify-between">
          <span>Sesi / 班次</span>
          <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">Auto</span>
        </label>
        <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 font-bold outline-none cursor-not-allowed opacity-80" value={data.session} disabled={true}>
          <option value="">- Automatik mengikut Tahun -</option>
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
            <option value="A3">Gate A3 (Transporter / 司机)</option>
            <option value="B">Gate B</option>
          </select>
        </div>
        {(data.arriveGate === 'A3' || data.arriveGate === 'B') && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 pt-2">
            <label className="block text-xs font-bold mb-1.5 text-green-800 uppercase tracking-wider">Pemandu / 载送司机</label>
            <select className="w-full p-3 border border-green-300 rounded-xl mb-3 hover:border-green-400 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white shadow-sm transition-all duration-300 cursor-pointer" value={data.arriveDriver} onChange={(e) => handleChange('arriveDriver', e.target.value)}>
              <option value="">Pilih Pemandu / 请选择司机</option>
              {driversList.filter(d => d.gate === data.arriveGate).map((driver, i) => (
                <option key={driver.id || i} value={driver.nickname}>
                  {driver.nickname} ({(driver.plates || [driver.plate]).filter(Boolean).join(' / ')})
                </option>
              ))}
              <option value="others">Lain-lain / 其他 (Sila Nyatakan)</option>
            </select>
            {data.arriveDriver === 'others' && (
               <input type="text" className="w-full p-3 border border-green-300 rounded-xl outline-none hover:border-green-400 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-white shadow-sm transition-all duration-300 animate-in fade-in" value={data.arriveDriverOther} onChange={e => handleChange('arriveDriverOther', e.target.value)} />
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
            <option value="A3">Gate A3 (Transporter / 司机)</option>
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
                  {driversList.filter(d => d.gate === data.leaveGate).map((driver, i) => (
                    <option key={driver.id || i} value={driver.nickname}>
                      {driver.nickname} ({(driver.plates || [driver.plate]).filter(Boolean).join(' / ')})
                    </option>
                  ))}
                  <option value="others">Lain-lain / 其他 (Sila Nyatakan)</option>
                </select>
                {data.leaveDriver === 'others' && (
                   <input type="text" className="w-full p-3 border border-orange-300 rounded-xl outline-none hover:border-orange-400 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white shadow-sm transition-all duration-300 animate-in fade-in" value={data.leaveDriverOther} onChange={e => handleChange('leaveDriverOther', e.target.value)} />
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
  const [driversList, setDriversList] = useState([]);

  // Admin State
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('submissions'); // 'submissions' | 'progress' | 'drivers'
  const [expandedClass, setExpandedClass] = useState(null);
  const [adminDriverSearch, setAdminDriverSearch] = useState(''); // NEW

  const [isDriverFormOpen, setIsDriverFormOpen] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [isFetchingAdmin, setIsFetchingAdmin] = useState(false);
  const [isImporting, setIsImporting] = useState(false); 
  
  // Public Driver List State
  const [publicGateFilter, setPublicGateFilter] = useState('');
  const [publicSearchQuery, setPublicSearchQuery] = useState('');
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);

  // Modals State (Delete & Edit)
  const [deleteSubmissionId, setDeleteSubmissionId] = useState(null);
  const [deleteDriverId, setDeleteDriverId] = useState(null);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editingSub, setEditingSub] = useState(null);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [numKids, setNumKids] = useState(1);
  const [parentInfo, setParentInfo] = useState({ name: '', ic: '', phone: '', relation: '', address: '' });
  
  const initialChildState = { year: '', kelas: '', name: '', session: '', arriveGate: '', arriveDriver: '', arriveDriverOther: '', leaveGate: '', leaveDriver: '', leaveDriverOther: '', sameDriver: false, isRound2: false };
  const [childrenInfo, setChildrenInfo] = useState([initialChildState]);

  // Driver Registration Form State
  const [driverInfo, setDriverInfo] = useState({ fullName: '', nickname: '', phones: [''], plates: [''], gate: '' });

  // Firebase Fetching States
  const [availableClasses, setAvailableClasses] = useState({});
  const [studentsDict, setStudentsDict] = useState({});
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // Configure Chrome Tab Header
  useEffect(() => {
    document.title = "SJKC Sin Ming Transport System";
  }, []);

  // Function to fetch drivers from DB (with LocalStorage Cache!)
  const fetchDriversList = async (forceRefresh = false) => {
    try {
      const DRIVER_CACHE_KEY = 'sjkc_drivers_cache';
      const DRIVER_CACHE_TIME = 'sjkc_drivers_cache_time';
      
      if (!forceRefresh) {
        const cached = localStorage.getItem(DRIVER_CACHE_KEY);
        const cacheTime = localStorage.getItem(DRIVER_CACHE_TIME);
        // 缓存有效时间：1 小时 (1 hour)
        if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 1000 * 60 * 60) {
          setDriversList(JSON.parse(cached));
          return; // 使用缓存，停止向 Firebase 发送请求，节省额度！
        }
      }

      const qSnap = await getDocs(collection(db, "drivers"));
      const fetchedDrivers = [];
      qSnap.forEach(doc => {
        fetchedDrivers.push({ id: doc.id, ...doc.data() });
      });
      fetchedDrivers.sort((a, b) => a.nickname.localeCompare(b.nickname));
      setDriversList(fetchedDrivers);
      
      // 更新缓存
      localStorage.setItem(DRIVER_CACHE_KEY, JSON.stringify(fetchedDrivers));
      localStorage.setItem(DRIVER_CACHE_TIME, Date.now().toString());

    } catch (err) {
      console.error("Error fetching drivers from DB:", err);
    }
  };

  // 2. Fetch Submissions Logic (Global for duplicate checking)
  const fetchSubmissions = async (forceRefresh = false) => {
    setIsFetchingAdmin(true);
    try {
      const SUB_CACHE_KEY = 'sjkc_subs_cache';
      const SUB_CACHE_TIME = 'sjkc_subs_cache_time';
      
      if (!forceRefresh) {
        const cached = localStorage.getItem(SUB_CACHE_KEY);
        const cacheTime = localStorage.getItem(SUB_CACHE_TIME);
        // 缓存有效时间：5 分钟 (5 minutes for public visitors to save quota)
        if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 1000 * 60 * 5) {
          setSubmissions(JSON.parse(cached));
          setIsFetchingAdmin(false);
          return; 
        }
      }

      const querySnapshot = await getDocs(collection(db, "transport_submissions"));
      const subs = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() });
      });
      subs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setSubmissions(subs);
      
      localStorage.setItem(SUB_CACHE_KEY, JSON.stringify(subs));
      localStorage.setItem(SUB_CACHE_TIME, Date.now().toString());
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setIsFetchingAdmin(false);
    }
  };

  // 1. Initialization (Auth + Fetching data)
  useEffect(() => {
    if (!localStorage.getItem('hideTransportDisclaimer')) {
      setShowDisclaimer(true);
    }

    const initDatabasesAndFetch = async () => {
      setIsLoadingStudents(true);
      try {
        const defaultAuth = getAuth();
        await signInAnonymously(defaultAuth);
        await fetchDriversList(); // 会优先使用缓存
        await fetchSubmissions(); // Fetch submissions to prevent duplicates (uses 5 min cache)
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
        const STUDENT_CACHE_KEY = 'sjkc_students_cache';
        const STUDENT_CACHE_TIME = 'sjkc_students_cache_time';

        // 检查学生名单的本地缓存（缓存 24 小时，极大节省 Firebase Reads 额度）
        const cachedStudents = localStorage.getItem(STUDENT_CACHE_KEY);
        const cachedTime = localStorage.getItem(STUDENT_CACHE_TIME);
        if (cachedStudents && cachedTime && Date.now() - parseInt(cachedTime) < 1000 * 60 * 60 * 24) {
           const { tempClasses, tempStudents } = JSON.parse(cachedStudents);
           setAvailableClasses(tempClasses);
           setStudentsDict(tempStudents);
           setIsLoadingStudents(false);
           return; // 命中缓存，停止向下执行，不调用 Firebase
        }

        // 如果没有缓存，则连接 Kehadiran 数据库读取
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

          // 写入本地缓存，留待下次使用
          localStorage.setItem(STUDENT_CACHE_KEY, JSON.stringify({ tempClasses, tempStudents }));
          localStorage.setItem(STUDENT_CACHE_TIME, Date.now().toString());
        }
      } catch (error) {
        console.error("Error fetching from Kehadiran DB:", error);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    initDatabasesAndFetch();
  }, []);

  useEffect(() => {
    if (view === 'admin' && isAdmin) {
      fetchSubmissions(true); // Admin 强制刷新，跳过缓存
      fetchDriversList(true); // Admin 强制刷新司机列表
    }
  }, [view, isAdmin]);

  // Handle Importing the Excel Data
  const handleImportExcelDrivers = async () => {
    if (driversList.length > 0) {
      setAlertMessage("Operasi gagal. Data pemandu telah pun diimport / wujud. \n 操作失败，数据已被导入或已存在。");
      return;
    }

    if(!window.confirm("Adakah anda pasti mahu mengimport 40 orang pemandu? Pastikan pangkalan data 'drivers' kosong untuk mengelakkan pertindihan.\n\n您确定要导入40名司机吗？请确保数据库是空的，以免重复。")) {
      return;
    }
    
    setIsImporting(true);
    try {
      for (const driver of excelDrivers) {
        await addDoc(collection(db, "drivers"), {
          fullName: driver.fullName,
          nickname: driver.nickname,
          phones: driver.phones,
          plates: driver.plates,
          gate: driver.gate,
          createdAt: serverTimestamp()
        });
      }
      setAlertMessage("Semua 40 Pemandu telah berjaya diimport! \n 40位司机已成功导入！");
      await fetchDriversList(true); // 强制刷新
    } catch (err) {
      console.error("Error importing drivers:", err);
      setAlertMessage("Ralat semasa import. Sila semak Firestore Rules (memerlukan kebenaran 'create').\n 导入失败，请检查规则是否允许 'create'。");
    } finally {
      setIsImporting(false);
    }
  };

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
      newArr[index] = { ...newArr[index], [field] : value };
      return newArr;
    });
  };

  const handleParentSubmit = async () => {
    if (!parentInfo.name || !parentInfo.phone) {
      setAlertMessage("Sila isikan sekurang-kurangnya Nama dan No. Telefon penjaga. \n 请至少填写监护人姓名与电话号码。");
      return;
    }

    const hasIncompleteChild = childrenInfo.some(c => !c.year || !c.kelas || !c.name || !c.arriveGate || !c.leaveGate);
    if(hasIncompleteChild) {
      setAlertMessage("Sila lengkapkan maklumat bagi setiap anak. \n 请完善每个孩子的表格信息。");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "transport_submissions"), {
        parent: parentInfo,
        children: childrenInfo,
        createdAt: serverTimestamp()
      });
      
      // Update local submissions array immediately to block duplicate entry
      const newSub = { id: docRef.id, parent: parentInfo, children: childrenInfo };
      const updatedSubs = [newSub, ...submissions];
      setSubmissions(updatedSubs);
      localStorage.setItem('sjkc_subs_cache', JSON.stringify(updatedSubs));

      setAlertMessage("Borang Berjaya Dihantar! \n 提交成功！");
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

  // Driver Submission Dynamic Arrays Handlers
  const handleUpdateDriverPhones = (index, val) => {
    const newArr = [...driverInfo.phones];
    newArr[index] = formatPhone(val);
    setDriverInfo({...driverInfo, phones: newArr});
  }
  const handleAddDriverPhone = () => setDriverInfo({...driverInfo, phones: [...driverInfo.phones, '']});
  const handleRemoveDriverPhone = (index) => setDriverInfo({...driverInfo, phones: driverInfo.phones.filter((_, i) => i !== index)});

  const handleUpdateDriverPlates = (index, val) => {
    const newArr = [...driverInfo.plates];
    newArr[index] = formatPlate(val);
    setDriverInfo({...driverInfo, plates: newArr});
  }
  const handleAddDriverPlate = () => setDriverInfo({...driverInfo, plates: [...driverInfo.plates, '']});
  const handleRemoveDriverPlate = (index) => setDriverInfo({...driverInfo, plates: driverInfo.plates.filter((_, i) => i !== index)});

  // Driver Submit Handler
  const handleDriverSubmit = async () => {
    const cleanedPhones = driverInfo.phones.filter(p => p.trim() !== '');
    const cleanedPlates = driverInfo.plates.filter(p => p.trim() !== '');

    if (!driverInfo.fullName || !driverInfo.nickname || !driverInfo.gate || cleanedPhones.length === 0 || cleanedPlates.length === 0) {
       setAlertMessage("Sila lengkapkan borang (Nama, Panggilan, Plat, Telefon & Gate wajib diisi). \n 请完善表格（全名，称呼，车牌，电话与门均为必填）。");
       return;
    }
    
    const flatPlates = driversList.flatMap(d => d.plates || [d.plate]).filter(Boolean).map(p => p.replace(/\s/g, ''));
    const flatPhones = driversList.flatMap(d => d.phones || [d.phone]).filter(Boolean).map(p => p.replace(/\s/g, ''));

    const duplicatePlate = cleanedPlates.find(p => flatPlates.includes(p.replace(/\s/g, '')));
    if (duplicatePlate) {
      setAlertMessage(`Pendaftaran ditolak. Plat kereta ${duplicatePlate} telah didaftarkan sebelum ini.\n注册拒绝。车牌 ${duplicatePlate} 已经被别人注册过了。`);
      return;
    }

    const duplicatePhone = cleanedPhones.find(p => flatPhones.includes(p.replace(/\s/g, '')));
    if (duplicatePhone) {
      setAlertMessage(`Pendaftaran ditolak. No Telefon ${duplicatePhone} telah didaftarkan sebelum ini.\n注册拒绝。电话号码 ${duplicatePhone} 已经被别人注册过了。`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "drivers"), {
        fullName: driverInfo.fullName,
        nickname: driverInfo.nickname,
        gate: driverInfo.gate,
        phones: cleanedPhones,
        plates: cleanedPlates,
        createdAt: serverTimestamp()
      });
      setAlertMessage("Pendaftaran Pemandu Berjaya Disimpan! \n 司机资料注册成功！");
      setDriverInfo({ fullName: '', nickname: '', phones: [''], plates: [''], gate: '' });
      await fetchDriversList(true); // 新注册，强制刷新缓存
      handleBack();
    } catch (error) {
      console.error("Error saving driver: ", error);
      setAlertMessage("Ralat semasa menghantar. Sila semak Rules Firebase. \n 提交时发生错误，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editing Handlers for Admin
  const handleSaveDriverEdit = async () => {
    try {
      const cleanedPhones = editingDriver.phones.filter(p => p.trim() !== '');
      const cleanedPlates = editingDriver.plates.filter(p => p.trim() !== '');
      await updateDoc(doc(db, "drivers", editingDriver.id), {
        fullName: editingDriver.fullName,
        nickname: editingDriver.nickname,
        gate: editingDriver.gate,
        phones: cleanedPhones,
        plates: cleanedPlates
      });
      setAlertMessage("Data pemandu berjaya dikemas kini! \n 司机资料更新成功！");
      setEditingDriver(null);
      await fetchDriversList(true); // 修改了数据，强制刷新缓存
    } catch(e) {
      console.error("Error updating driver: ", e);
      setAlertMessage("Gagal kemas kini. Pastikan Rules membenarkan 'update'. \n 更新失败，请检查数据库权限是否允许 'update'。");
    }
  };

  const handleSaveSubEdit = async () => {
    try {
      await updateDoc(doc(db, "transport_submissions", editingSub.id), {
        parent: editingSub.parent,
        children: editingSub.children
      });
      setAlertMessage("Rekod berjaya dikemas kini! \n 记录更新成功！");
      setEditingSub(null);
      fetchSubmissions(true);
    } catch(e) {
      console.error("Error updating submission: ", e);
      setAlertMessage("Gagal kemas kini. Pastikan Rules membenarkan 'update'. \n 更新失败，请检查数据库权限是否允许 'update'。");
    }
  };

  // Admin Login Handler
  const handleAdminLogin = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    if (adminPwd === correctPassword) {
      setIsAdmin(true);
      setView('admin');
      setAdminTab('submissions'); // Default tab
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

  const handleDeleteDriver = async () => {
    if (!deleteDriverId) return;
    try {
      await deleteDoc(doc(db, "drivers", deleteDriverId));
      setDriversList(prev => prev.filter(d => d.id !== deleteDriverId));
      setDeleteDriverId(null);
      // 同时更新缓存，以免重新读取到被删除的司机
      await fetchDriversList(true); 
    } catch (error) {
      console.error("Error deleting driver: ", error);
      setAlertMessage("Gagal memadam pemandu. Sila semak Firestore Rules. \n 无法删除司机，请检查数据库权限。");
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
    const matchesQuery = !q || 
      (sub.parent?.name || '').toLowerCase().includes(q) || 
      (sub.parent?.ic || '').toLowerCase().includes(q) ||
      (sub.children || []).some(c => (c.name || '').toLowerCase().includes(q));

    const matchesDriver = !filterDriver || (sub.children || []).some(c => {
      const actualArrive = c.arriveDriver === 'others' ? c.arriveDriverOther : c.arriveDriver;
      const actualLeave = c.sameDriver ? actualArrive : (c.leaveDriver === 'others' ? c.leaveDriverOther : c.leaveDriver);
      return actualArrive === filterDriver || actualLeave === filterDriver;
    });

    return matchesQuery && matchesDriver;
  });

  // Filter Drivers for Admin View
  const filteredAdminDrivers = driversList.filter(d => {
    const q = adminDriverSearch.toLowerCase();
    if (!q) return true;
    const matchNickname = (d.nickname || '').toLowerCase().includes(q);
    const matchFullName = (d.fullName || '').toLowerCase().includes(q);
    const matchPlate = (d.plates || [d.plate]).filter(Boolean).some(p => p.toLowerCase().includes(q));
    const matchPhone = (d.phones || [d.phone]).filter(Boolean).some(p => p.replace(/\s/g, '').includes(q.replace(/\s/g, '')));
    return matchNickname || matchFullName || matchPlate || matchPhone;
  });

  // --- CALCULATION FOR CLASS PROGRESS & PREVENT DUPLICATES ---
  const getProgressStats = () => {
    const submittedStudentsSet = new Set();
    submissions.forEach(sub => {
      (sub.children || []).forEach(c => {
        if (c.year && c.kelas && c.name) {
          submittedStudentsSet.add(`${c.year}-${c.kelas}-${c.name}`);
        }
      });
    });

    const classStats = [];
    Object.keys(availableClasses).sort().forEach(year => {
      (availableClasses[year] || []).forEach(kelas => {
        const classKey = `${year}-${kelas}`;
        const students = studentsDict[classKey] || [];
        const total = students.length;
        let submittedCount = 0;
        students.forEach(student => {
          if(submittedStudentsSet.has(`${year}-${kelas}-${student}`)) {
            submittedCount++;
          }
        });
        classStats.push({
          year,
          kelas,
          classKey,
          total,
          submitted: submittedCount,
          students,
          submittedSet: submittedStudentsSet
        });
      });
    });

    return { classStats, submittedStudentsSet };
  };

  const { classStats: progressStats, submittedStudentsSet } = getProgressStats();
  
  // Set to avoid selecting same child in different dropdowns of the same form
  const currentSelectedStudentsSet = new Set();
  childrenInfo.forEach(c => {
    if (c.year && c.kelas && c.name) {
       currentSelectedStudentsSet.add(`${c.year}-${c.kelas}-${c.name}`);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 selection:bg-blue-200 pb-12 overflow-x-hidden">
      {showDisclaimer && <DisclaimerPopup onAccept={() => setShowDisclaimer(false)} />}
      
      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all duration-500">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out text-center">
            <div className="text-lg font-bold mb-8 text-gray-800 whitespace-pre-line leading-relaxed">{alertMessage}</div>
            <button onClick={() => setAlertMessage('')} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-2xl font-bold w-full transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">OK, Faham / 好的</button>
          </div>
        </div>
      )}

      {/* Admin: Edit Driver Modal */}
      {editingDriver && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all duration-500">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out">
             <h3 className="font-extrabold text-2xl mb-6 text-gray-900 tracking-tight">Edit Pemandu / 编辑司机</h3>
             
             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nama Penuh (IC)</label>
                  <input className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={editingDriver.fullName} onChange={e => setEditingDriver({...editingDriver, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nama Panggilan</label>
                  <input className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={editingDriver.nickname} onChange={e => setEditingDriver({...editingDriver, nickname: e.target.value})} />
                </div>

                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <label className="block text-xs font-bold mb-3 text-gray-600 uppercase tracking-wider">No. Telefon</label>
                  {(editingDriver.phones || []).map((phone, i) => (
                    <div key={i} className="flex gap-2 mb-3">
                      <input className="flex-1 p-3 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none font-medium" value={phone} onChange={e => {
                        const newP = [...editingDriver.phones];
                        newP[i] = formatPhone(e.target.value);
                        setEditingDriver({...editingDriver, phones: newP});
                      }} />
                      <button onClick={() => setEditingDriver({...editingDriver, phones: editingDriver.phones.filter((_, idx) => idx !== i)})} className="p-3 text-red-400 bg-red-50/50 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all"><Trash2 size={18}/></button>
                    </div>
                  ))}
                  <button onClick={() => setEditingDriver({...editingDriver, phones: [...(editingDriver.phones || []), '']})} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-xs font-bold flex items-center transition-colors">+ Add Phone</button>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <label className="block text-xs font-bold mb-3 text-gray-600 uppercase tracking-wider">No. Plat</label>
                  {(editingDriver.plates || []).map((plate, i) => (
                    <div key={i} className="flex gap-2 mb-3">
                      <input className="flex-1 p-3 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none uppercase font-bold tracking-wider" value={plate} onChange={e => {
                        const newP = [...editingDriver.plates];
                        newP[i] = formatPlate(e.target.value);
                        setEditingDriver({...editingDriver, plates: newP});
                      }} />
                      <button onClick={() => setEditingDriver({...editingDriver, plates: editingDriver.plates.filter((_, idx) => idx !== i)})} className="p-3 text-red-400 bg-red-50/50 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all"><Trash2 size={18}/></button>
                    </div>
                  ))}
                  <button onClick={() => setEditingDriver({...editingDriver, plates: [...(editingDriver.plates || []), '']})} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-xs font-bold flex items-center transition-colors">+ Add Plate</button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Gate</label>
                  <select className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={editingDriver.gate} onChange={e => setEditingDriver({...editingDriver, gate: e.target.value})}>
                    <option value="A3">Gate A3</option>
                    <option value="B">Gate B</option>
                  </select>
                </div>
             </div>

             <div className="flex gap-4 mt-8">
               <button onClick={() => setEditingDriver(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold transition-all duration-300 active:scale-95">Batal</button>
               <button onClick={handleSaveDriverEdit} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">Simpan</button>
             </div>
          </div>
        </div>
      )}

      {/* Admin: Edit Submission Modal */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all duration-500">
          <div className="bg-white p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 fade-in duration-300 ease-out custom-scrollbar">
            <h3 className="font-extrabold text-2xl mb-6 text-gray-900 tracking-tight">Edit Rekod / 编辑记录</h3>
            
            <div className="mb-6">
              <h4 className="font-extrabold text-sm text-blue-600 mb-3 uppercase tracking-wider flex items-center"><Users size={16} className="mr-1.5"/>Maklumat Penjaga</h4>
              <div className="grid grid-cols-2 gap-4">
                 <input className="p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={editingSub.parent?.name || ''} onChange={(e) => setEditingSub({...editingSub, parent: {...editingSub.parent, name: e.target.value}})} placeholder="Nama Penuh" />
                 <input className="p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={editingSub.parent?.phone || ''} onChange={(e) => setEditingSub({...editingSub, parent: {...editingSub.parent, phone: formatPhone(e.target.value)}})} placeholder="No Telefon" />
                 <input className="p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all col-span-2" value={editingSub.parent?.ic || ''} onChange={(e) => setEditingSub({...editingSub, parent: {...editingSub.parent, ic: formatIC(e.target.value)}})} placeholder="No IC" />
              </div>
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-blue-600 mb-3 uppercase tracking-wider flex items-center"><FileText size={16} className="mr-1.5"/>Maklumat Pelajar</h4>
              {(editingSub.children || []).map((c, idx) => (
                 <div key={idx} className="p-4 bg-gray-50/80 rounded-2xl mb-4 border border-gray-100">
                    <div className="font-bold text-gray-800 text-sm mb-3">Anak {idx + 1}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                       <input className="p-3 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold" value={c.name || ''} onChange={(e) => {
                          const newChildren = [...editingSub.children];
                          newChildren[idx].name = e.target.value;
                          setEditingSub({...editingSub, children: newChildren});
                       }} placeholder="Nama Pelajar" />
                       <div className="flex gap-2">
                         <input className="w-1/2 p-3 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold text-center" value={c.year || ''} onChange={(e) => {
                            const newChildren = [...editingSub.children];
                            newChildren[idx].year = e.target.value;
                            setEditingSub({...editingSub, children: newChildren});
                         }} placeholder="Tahun" />
                         <input className="w-1/2 p-3 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-semibold text-center" value={c.kelas || ''} onChange={(e) => {
                            const newChildren = [...editingSub.children];
                            newChildren[idx].kelas = e.target.value;
                            setEditingSub({...editingSub, children: newChildren});
                         }} placeholder="Kelas" />
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <div>
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Pemandu Datang ({c.arriveGate})</label>
                         <input className="w-full p-3 border border-green-200 rounded-xl bg-green-50/30 focus:bg-white focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm font-semibold" value={c.arriveDriver === 'others' ? (c.arriveDriverOther || '') : (c.arriveDriver || '')} onChange={(e) => {
                            const newChildren = [...editingSub.children];
                            newChildren[idx].arriveDriver = 'others'; 
                            newChildren[idx].arriveDriverOther = e.target.value;
                            setEditingSub({...editingSub, children: newChildren});
                         }} placeholder="Nama Pemandu" />
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1 block">Pemandu Balik ({c.leaveGate})</label>
                         <input className="w-full p-3 border border-orange-200 rounded-xl bg-orange-50/30 focus:bg-white focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm font-semibold" value={c.sameDriver ? (c.arriveDriver === 'others' ? (c.arriveDriverOther || '') : (c.arriveDriver || '')) : (c.leaveDriver === 'others' ? (c.leaveDriverOther || '') : (c.leaveDriver || ''))} onChange={(e) => {
                            const newChildren = [...editingSub.children];
                            newChildren[idx].sameDriver = false; 
                            newChildren[idx].leaveDriver = 'others';
                            newChildren[idx].leaveDriverOther = e.target.value;
                            setEditingSub({...editingSub, children: newChildren});
                         }} placeholder="Nama Pemandu" />
                       </div>
                    </div>
                 </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
               <button onClick={() => setEditingSub(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold transition-all duration-300 active:scale-95">Batal</button>
               <button onClick={handleSaveSubEdit} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Submission Confirmation Modal */}
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

      {/* Delete Driver Confirmation Modal */}
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
              <input type="password" placeholder="" className="w-full p-4 border border-gray-200 rounded-2xl mb-6 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none text-center tracking-widest transition-all duration-300" value={adminPwd} onChange={e => setAdminPwd(e.target.value)} autoFocus />
              <div className="flex gap-4">
                <button type="button" onClick={() => setAdminModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-all duration-300 active:scale-95">Batal / 取消</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">Login / 登录</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation Header */}
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
                <input type="text" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-blue-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300" value={parentInfo.name} onChange={e => setParentInfo({...parentInfo, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">No. Kad Pengenalan / 身份证号码</label>
                <input type="text" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-blue-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300" value={parentInfo.ic} onChange={e => setParentInfo({...parentInfo, ic: formatIC(e.target.value)})} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">No. Telefon / 手机号码</label>
                  <input type="tel" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-blue-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300" value={parentInfo.phone} onChange={e => setParentInfo({...parentInfo, phone: formatPhone(e.target.value)})} />
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
                <textarea className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-blue-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300" rows="2" value={parentInfo.address} onChange={e => setParentInfo({...parentInfo, address: e.target.value})}></textarea>
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
                submittedStudentsSet={submittedStudentsSet}
                currentSelectedStudentsSet={currentSelectedStudentsSet}
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
                <input type="text" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-green-300 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300" value={driverInfo.fullName} onChange={e => setDriverInfo({...driverInfo, fullName: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-wider">Nama Panggilan / 称呼 (Yang dikenali murid)</label>
                <input type="text" className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white hover:border-green-300 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300" value={driverInfo.nickname} onChange={e => setDriverInfo({...driverInfo, nickname: e.target.value})} />
                <p className="text-xs text-gray-400 mt-2 font-medium">Nama ini akan dipaparkan dalam senarai awam.</p>
              </div>

              {/* Dynamic Phones Input */}
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <label className="block text-xs font-bold mb-3 text-gray-600 uppercase tracking-wider flex items-center"><Search size={14} className="mr-1.5 text-blue-500"/>No. Telefon / 手机号码</label>
                {driverInfo.phones.map((phone, i) => (
                  <div key={i} className="flex gap-2 mb-3 animate-in fade-in zoom-in-95 duration-300">
                    <input type="tel" className="flex-1 p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300 font-medium" value={phone} onChange={e => handleUpdateDriverPhones(i, e.target.value)} />
                    {i > 0 && <button type="button" onClick={() => handleRemoveDriverPhone(i)} className="p-3 text-red-400 bg-red-50/50 border border-red-100 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all active:scale-95"><Trash2 size={18}/></button>}
                  </div>
                ))}
                <button type="button" onClick={handleAddDriverPhone} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-xs font-bold flex items-center transition-colors active:scale-95"><PlusCircle size={14} className="mr-1.5"/> Add More Phone</button>
              </div>

              {/* Dynamic Plates Input */}
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <label className="block text-xs font-bold mb-3 text-gray-600 uppercase tracking-wider flex items-center"><Car size={14} className="mr-1.5 text-orange-500"/>No. Plat Kereta / 车牌号码</label>
                {driverInfo.plates.map((plate, i) => (
                  <div key={i} className="flex gap-2 mb-3 animate-in fade-in zoom-in-95 duration-300">
                    <input type="text" className="flex-1 p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold uppercase transition-all duration-300 tracking-wider" value={plate} onChange={e => handleUpdateDriverPlates(i, e.target.value)} />
                    {i > 0 && <button type="button" onClick={() => handleRemoveDriverPlate(i)} className="p-3 text-red-400 bg-red-50/50 border border-red-100 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all active:scale-95"><Trash2 size={18}/></button>}
                  </div>
                ))}
                <button type="button" onClick={handleAddDriverPlate} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-xs font-bold flex items-center transition-colors active:scale-95"><PlusCircle size={14} className="mr-1.5"/> Add More Plate</button>
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

            <button onClick={handleDriverSubmit} disabled={isSubmitting} className="mt-10 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-extrabold py-4.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 active:translate-y-0 transition-all duration-300 text-lg flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed group">
              {isSubmitting ? <><Loader2 size={22} className="mr-3 animate-spin" /> Sedang Menyimpan / 正在保存...</> : <>Daftar / 提交注册 <PlusCircle size={22} className="ml-2.5 group-hover:rotate-90 transition-transform duration-500" /></>}
            </button>
          </div>
        </div>
      )}

      {/* --- 4. PUBLIC DRIVER LIST VIEW --- */}
      {view === 'driverList' && (
        <div className="max-w-5xl mx-auto p-4 animate-in slide-in-from-bottom-4 fade-in duration-500 ease-out">
          <div className="text-center mb-8 mt-4">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Senarai Pemandu</h2>
            <p className="text-gray-500 font-bold mt-1 tracking-wide">载送方公共列表</p>
          </div>
          
          {/* NEW FILTER BAR */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-8 z-20 relative max-w-2xl mx-auto">
            {/* Gate Filter */}
            <select 
              className="w-full md:w-1/3 p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold text-gray-700 transition-all cursor-pointer"
              value={publicGateFilter}
              onChange={(e) => setPublicGateFilter(e.target.value)}
            >
              <option value="">Semua Gate / 所有校门</option>
              <option value="A3">Gate A3</option>
              <option value="B">Gate B</option>
            </select>

            {/* Driver Jump-to Dropdown */}
            <div className="relative w-full md:w-2/3">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Cari atau pilih pemandu..." 
                className="w-full pl-12 p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-medium text-gray-800"
                value={publicSearchQuery}
                onChange={(e) => {
                  setPublicSearchQuery(e.target.value);
                  setIsDriverDropdownOpen(true);
                }}
                onFocus={() => setIsDriverDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDriverDropdownOpen(false), 200)}
              />
              
              {isDriverDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar z-50 overflow-hidden">
                  {driversList
                    .filter(d => (!publicGateFilter || d.gate === publicGateFilter) && 
                                 (d.nickname.toLowerCase().includes(publicSearchQuery.toLowerCase()) || 
                                 (d.plates || [d.plate]).some(p => p.toLowerCase().includes(publicSearchQuery.toLowerCase()))))
                    .map(d => (
                      <div 
                        key={d.id} 
                        className="p-3.5 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
                        onClick={() => {
                          setPublicSearchQuery(''); 
                          setIsDriverDropdownOpen(false);
                          if (publicGateFilter && publicGateFilter !== d.gate) {
                            setPublicGateFilter(d.gate);
                          }
                          setTimeout(() => {
                            const el = document.getElementById(`driver-card-${d.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              el.classList.add('ring-4', 'ring-purple-500', 'scale-105', 'bg-purple-50/50', 'z-10');
                              setTimeout(() => el.classList.remove('ring-4', 'ring-purple-500', 'scale-105', 'bg-purple-50/50', 'z-10'), 2000);
                            }
                          }, 100);
                        }}
                      >
                        <div className="font-extrabold text-gray-800">{d.nickname}</div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-500 font-bold text-[10px] uppercase">Gate {d.gate}</span>
                          {(d.plates || [d.plate]).filter(Boolean).map((pl, idx) => (
                            <span key={idx} className="bg-white px-2 py-0.5 rounded-md text-gray-700 font-mono text-[10px] font-black tracking-wider border border-gray-200 shadow-sm">{pl}</span>
                          ))}
                        </div>
                      </div>
                  ))}
                  {driversList.filter(d => (!publicGateFilter || d.gate === publicGateFilter) && (d.nickname.toLowerCase().includes(publicSearchQuery.toLowerCase()) || (d.plates || [d.plate]).some(p => p.toLowerCase().includes(publicSearchQuery.toLowerCase())))).length === 0 && (
                    <div className="p-5 text-center text-sm font-bold text-gray-400">Tiada padanan / 无匹配结果</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LIST RENDER */}
          <div className={`grid grid-cols-1 ${publicGateFilter ? 'md:grid-cols-1 max-w-3xl mx-auto' : 'md:grid-cols-2'} gap-8 w-full`}>
            {(!publicGateFilter || publicGateFilter === 'A3') && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                <div className="bg-gradient-to-r from-green-100 to-green-50 text-green-800 font-black text-center py-3.5 rounded-2xl mb-5 shadow-sm border border-green-200/60 uppercase tracking-widest">
                  Gate A3
                </div>
                <div className="space-y-4">
                  {driversList.filter(d => d.gate === 'A3').map((driver, i) => (
                    <div id={`driver-card-${driver.id}`} key={driver.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group scroll-mt-24">
                      <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl mr-5 flex-shrink-0 overflow-hidden border border-green-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                        <Bus size={28} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-extrabold text-lg text-gray-900 group-hover:text-green-700 transition-colors duration-300 truncate mb-1.5">{driver.nickname}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(driver.plates || [driver.plate]).filter(Boolean).map((pl, idx) => (
                            <span key={idx} className="bg-gray-100 px-2.5 py-1 rounded-lg text-gray-700 font-mono text-xs font-black tracking-wider border border-gray-200 shadow-sm">{pl}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {driversList.filter(d => d.gate === 'A3').length === 0 && <div className="text-sm text-gray-400 font-medium text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">Tiada pemandu.</div>}
                </div>
              </div>
            )}

            {(!publicGateFilter || publicGateFilter === 'B') && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
                <div className="bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 font-black text-center py-3.5 rounded-2xl mb-5 shadow-sm border border-blue-200/60 uppercase tracking-widest">
                  Gate B
                </div>
                <div className="space-y-4">
                  {driversList.filter(d => d.gate === 'B').map((driver, i) => (
                    <div id={`driver-card-${driver.id}`} key={driver.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group scroll-mt-24">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mr-5 flex-shrink-0 overflow-hidden border border-blue-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                        <Bus size={28} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-extrabold text-lg text-gray-900 group-hover:text-blue-700 transition-colors duration-300 truncate mb-1.5">{driver.nickname}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(driver.plates || [driver.plate]).filter(Boolean).map((pl, idx) => (
                            <span key={idx} className="bg-gray-100 px-2.5 py-1 rounded-lg text-gray-700 font-mono text-xs font-black tracking-wider border border-gray-200 shadow-sm">{pl}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {driversList.filter(d => d.gate === 'B').length === 0 && <div className="text-sm text-gray-400 font-medium text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">Tiada pemandu.</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- 5. ADMIN VIEW (Protected) --- */}
      {view === 'admin' && (
        <div className="max-w-7xl mx-auto p-4 animate-in fade-in zoom-in-95 duration-500 ease-out">
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

          {/* ADMIN TABS NAVIGATION */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button 
              onClick={() => setAdminTab('submissions')} 
              className={`px-6 py-3 rounded-2xl font-extrabold text-sm transition-all duration-300 flex items-center shadow-sm hover:shadow-md ${adminTab === 'submissions' ? 'bg-blue-600 text-white ring-2 ring-blue-600/50 scale-105' : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'}`}
            >
              <FileText size={18} className="mr-2" /> Senarai Rekod / 提交记录
            </button>
            <button 
              onClick={() => setAdminTab('drivers')} 
              className={`px-6 py-3 rounded-2xl font-extrabold text-sm transition-all duration-300 flex items-center shadow-sm hover:shadow-md ${adminTab === 'drivers' ? 'bg-purple-600 text-white ring-2 ring-purple-600/50 scale-105' : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-200'}`}
            >
              <Bus size={18} className="mr-2" /> Maklumat Pemandu / 司机信息
            </button>
            <button 
              onClick={() => setAdminTab('progress')} 
              className={`px-6 py-3 rounded-2xl font-extrabold text-sm transition-all duration-300 flex items-center shadow-sm hover:shadow-md ${adminTab === 'progress' ? 'bg-green-600 text-white ring-2 ring-green-600/50 scale-105' : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'}`}
            >
              <BarChart3 size={18} className="mr-2" /> Laporan Kelas / 班级进度
            </button>
          </div>

          {adminTab === 'submissions' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
              <div className="lg:col-span-4 space-y-6 h-fit">
                {/* Search Controls */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                  <h3 className="font-extrabold text-lg mb-5 flex items-center text-gray-900"><Search size={20} className="mr-2.5 text-blue-500"/> Carian / 过滤</h3>
                  <input type="text" placeholder="Cari nama ibu bapa, IC, murid..." className="w-full p-3.5 border border-gray-200 rounded-xl mb-4 bg-gray-50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all duration-300" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <div className="relative mb-5">
                    <select className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all duration-300 cursor-pointer" value={filterDriver} onChange={e => setFilterDriver(e.target.value)}>
                      <option value="">Semua Pemandu / 所有司机</option>
                      {driversList.map((d) => <option key={d.id} value={d.nickname}>{d.nickname} ({(d.plates || [d.plate]).join(' / ')})</option>)}
                    </select>
                  </div>
                  <div className="text-sm font-semibold text-gray-600 text-center bg-blue-50/50 border border-blue-100 py-3 rounded-xl">
                    Jumpa / 找到: <span className="text-blue-600 font-black text-base">{filteredSubmissions.length}</span> rekod
                  </div>
                </div>
              </div>

              {/* Submissions List */}
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
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingSub(sub)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2.5 rounded-xl transition-all duration-200 active:scale-95" title="Edit Rekod">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => setDeleteSubmissionId(sub.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all duration-200 active:scale-95" title="Padam Rekod">
                            <Trash2 size={18} />
                          </button>
                        </div>
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
          )}

          {/* NEW DRIVERS TAB */}
          {adminTab === 'drivers' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              {/* Header Controls for Drivers */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                   <h3 className="font-extrabold text-2xl text-gray-900 tracking-tight flex items-center"><Bus className="mr-3 text-purple-500" size={28} /> Pengurusan Pemandu</h3>
                   <p className="text-gray-500 font-medium mt-1">司机管理与设置</p>
                 </div>
                 <div className="flex flex-wrap gap-3 w-full md:w-auto">
                   <button 
                      onClick={() => setIsDriverFormOpen(!isDriverFormOpen)} 
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm flex items-center ${isDriverFormOpen ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'}`}
                    >
                      {isDriverFormOpen ? 'Tutup Pendaftaran (Close)' : 'Buka Pendaftaran (Open)'}
                    </button>
                    <button onClick={handleImportExcelDrivers} disabled={isImporting} className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center disabled:opacity-50">
                      {isImporting ? <Loader2 size={16} className="animate-spin mr-2" /> : <DownloadCloud size={16} className="mr-2"/>} Import 40
                    </button>
                 </div>
              </div>

              {/* SEARCH BAR FOR ADMIN DRIVERS */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center max-w-xl transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-purple-500/20">
                 <Search size={20} className="text-gray-400 mr-3 ml-2" />
                 <input 
                   type="text" 
                   placeholder="Cari pemandu (Nama, Plat, Telefon)..." 
                   className="w-full outline-none text-gray-700 font-medium bg-transparent"
                   value={adminDriverSearch}
                   onChange={e => setAdminDriverSearch(e.target.value)}
                 />
              </div>

              {/* Drivers Grid */}
              {isFetchingAdmin ? (
                <div className="flex justify-center p-10"><Loader2 size={32} className="animate-spin text-purple-500" /></div>
              ) : filteredAdminDrivers.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-gray-300 shadow-sm text-gray-400 font-medium">
                  Tiada pemandu dijumpai. / 未找到该司机。
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAdminDrivers.map(driver => (
                    <div key={driver.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
                      
                      {/* Top Banner (Gate Color) */}
                      <div className={`p-4 flex justify-between items-start ${driver.gate === 'A3' ? 'bg-green-50' : 'bg-blue-50'}`}>
                        <div>
                          <div className={`text-xs font-black tracking-widest uppercase mb-1 ${driver.gate === 'A3' ? 'text-green-600' : 'text-blue-600'}`}>Gate {driver.gate}</div>
                          <div className="font-extrabold text-lg text-gray-900 truncate pr-2 leading-tight" title={driver.nickname}>{driver.nickname}</div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingDriver({
                            ...driver,
                            phones: driver.phones && driver.phones.length > 0 ? driver.phones : (driver.phone ? [driver.phone] : ['']),
                            plates: driver.plates && driver.plates.length > 0 ? driver.plates : (driver.plate ? [driver.plate] : [''])
                          })} className="p-1.5 bg-white text-gray-500 rounded-lg hover:text-blue-600 shadow-sm transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteDriverId(driver.id)} className="p-1.5 bg-white text-gray-500 rounded-lg hover:text-red-600 shadow-sm transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-5 flex-1 flex flex-col gap-4">
                        {/* Full Name */}
                        <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-gray-100 rounded-md text-gray-400"><IdCard size={14}/></div>
                           <span className="text-xs font-bold text-gray-500 uppercase tracking-wide truncate" title={driver.fullName}>{driver.fullName || 'TIADA NAMA IC'}</span>
                        </div>

                        {/* Phones List */}
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center"><Phone size={10} className="mr-1" /> Telefon</div>
                          <div className="flex flex-col gap-1">
                            {(driver.phones || [driver.phone]).filter(Boolean).map((ph, idx) => (
                               <a key={idx} href={`tel:${ph.replace(/\s/g, '')}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1">
                                 {ph}
                               </a>
                            ))}
                          </div>
                        </div>

                        {/* Plates List */}
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center"><Car size={10} className="mr-1" /> Plat Kereta</div>
                          <div className="flex flex-wrap gap-1.5">
                            {(driver.plates || [driver.plate]).filter(Boolean).map((pl, idx) => (
                               <span key={idx} className="bg-white px-2 py-1 rounded-md text-gray-700 font-mono text-[11px] font-black tracking-wider border border-gray-200 shadow-sm">{pl}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {adminTab === 'progress' && (
            /* PROGRESS TAB CONTENT */
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in duration-500">
              <div className="mb-6">
                <h3 className="font-black text-2xl text-gray-900 tracking-tight">Laporan Kemajuan Kelas</h3>
                <p className="text-gray-500 font-medium mt-1">班级表格提交进度表</p>
              </div>

              {isFetchingAdmin ? (
                <div className="flex justify-center p-10"><Loader2 size={32} className="animate-spin text-green-500" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {progressStats.map(stat => {
                    const percentage = stat.total > 0 ? Math.round((stat.submitted / stat.total) * 100) : 0;
                    const isComplete = percentage === 100 && stat.total > 0;
                    
                    return (
                      <div key={stat.classKey} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${expandedClass === stat.classKey ? 'border-green-400 shadow-md ring-4 ring-green-500/10' : 'border-gray-200 hover:border-green-300 hover:shadow-md'}`}>
                        {/* Card Header (Clickable) */}
                        <div 
                          className={`p-5 cursor-pointer flex flex-col justify-between h-24 ${expandedClass === stat.classKey ? 'bg-green-50/50' : 'bg-gray-50/50 hover:bg-gray-50'}`}
                          onClick={() => setExpandedClass(expandedClass === stat.classKey ? null : stat.classKey)}
                        >
                          <div className="flex justify-between items-start w-full">
                            <div className="font-extrabold text-gray-900 text-lg tracking-tight">Tahun {stat.year} {stat.kelas}</div>
                            <div className={`font-black text-sm px-2.5 py-1 rounded-lg ${isComplete ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-200 text-gray-600 shadow-sm'}`}>
                              {percentage}%
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-gray-500 flex justify-between w-full items-end mt-2">
                             <span>{stat.submitted} / {stat.total} Pelajar</span>
                             {isComplete && <CheckCircle2 size={16} className="text-green-500" />}
                          </div>
                        </div>

                        {/* Progress Bar Line */}
                        <div className="w-full bg-gray-100 h-2">
                          <div className={`h-2 transition-all duration-1000 ease-out ${isComplete ? 'bg-green-500' : 'bg-green-400'}`} style={{ width: `${percentage}%` }}></div>
                        </div>

                        {/* Expanded Dropdown Content */}
                        {expandedClass === stat.classKey && (
                          <div className="p-4 bg-white max-h-72 overflow-y-auto custom-scrollbar border-t border-green-100">
                             {stat.students.map((student, sIdx) => {
                               const isSubbed = stat.submittedSet.has(`${stat.year}-${stat.kelas}-${student}`);
                               return (
                                 <div key={sIdx} className={`text-xs font-bold p-3 mb-2 rounded-xl flex justify-between items-center border transition-all ${isSubbed ? 'bg-green-50/50 border-green-200/60 text-green-800 shadow-sm' : 'bg-red-50/50 border-red-200/60 text-red-800'}`}>
                                   <span className="truncate pr-2">{student}</span>
                                   {isSubbed ? <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" /> : <XCircle size={16} className="text-red-500 flex-shrink-0" />}
                                 </div>
                               );
                             })}
                             {stat.students.length === 0 && <div className="text-center text-xs text-gray-400 py-4 font-medium">Tiada pelajar dalam kelas ini.</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
