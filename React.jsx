```react
import React, { useState, useEffect } from 'react';
import { Armchair, LogOut, Shield, User, ArrowLeft, Trash2, CheckCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';

// --- รายชื่อนักเรียนจากรูปภาพของคุณ ---
const STUDENT_LIST = {
  "1": "ด.ช.กรวัฒน์ ผดาวัน", "2": "ด.ช.ชนพัฒน์ บุญดี", "3": "ด.ช.ณัฐกฤต แซ่เตีย",
  "4": "ด.ช.ณัฐนันท์ แซ่โอ่ว", "5": "ด.ช.ณัฐสิทธิ์ ชะรารัมย์", "6": "ด.ช.ดนย์ศิรา ฟักทองพรรณ",
  "7": "ด.ช.ต้นแรม ต้นสิงห์", "8": "ด.ช.เตชิษฐ์ กาเจริญ", "9": "ด.ช.ธนภูมิ นาคบุตร",
  "10": "ด.ช.ธีรดนย์ นามวิจิตร", "11": "ด.ช.นพดล ทองจันทร์", "12": "ด.ช.ปัณณทัต อินทปัตย์",
  "13": "ด.ช.ปัณณวิชญ์ พลวลัยรัตน์", "14": "ด.ช.พัธรกฤษฎิ์ สว่างแก้ว", "15": "ด.ช.พัทรศักดิ์ โพธะกัน",
  "16": "ด.ช.พิรุฬห์กร ทองดี", "17": "ด.ช.พีระพล คำพันชนะ", "18": "ด.ช.ภูพัฒน์ แสนกุล",
  "19": "ด.ช.สุรเชษฐ์ จอมโคตร", "20": "ด.ช.เอกวิศว์ สุขลิ้ม", "21": "ด.ญ.กรมาณี ทองลือ",
  "22": "ด.ญ.ครองขวัญ สร้อยสูงเนิน", "23": "ด.ญ.จิระประไพ ฉัตรทัน", "24": "ด.ญ.ญาดาจันทมาศ ทองรักษ์",
  "25": "ด.ญ.ณพิชญา หนูปลอด", "26": "ด.ญ.ธนพร เกิดพุ่ม", "27": "ด.ญ.ธนัญญา โพธิ์มี",
  "28": "ด.ญ.ธัญญาภิทย์ กุยยาวัฒนานนท์", "29": "ด.ญ.ธัญลักษณ์ เหงสกุล", "30": "ด.ญ.ธันยภรณ์ ยิ่งผล",
  "31": "ด.ญ.ธีรนาฏ สิทธิมงคล", "32": "ด.ญ.นพกาญจน์ ไตรรวรรัตน์", "33": "ด.ญ.นิชาภัทร ไชยพร",
  "34": "ด.ญ.ปัญณวีร์ ชัยมาลา", "35": "ด.ญ.พาขวัญ อนันตวงษ์", "36": "ด.ญ.ภคพร ประเสริฐไทย",
  "37": "ด.ญ.วิชญา ศรีหริ่ง", "38": "ด.ญ.วิภาดา ภู่เอี่ยม", "39": "ด.ญ.วิลาสินี รอดภัย",
  "40": "ด.ญ.ศิรินภา ศรีวิเศษ", "3205": "ผู้ดูแลระบบ (Admin)"
};

// Firebase Setup
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'classroom-seating-v1';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [inputNo, setInputNo] = useState('');
  const [seats, setSeats] = useState({});

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'seats');
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = {};
      snap.forEach(doc => data[doc.id] = doc.data());
      setSeats(data);
    }, (err) => console.error("Firestore Error:", err));
    return () => unsubscribe();
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === 'admin') {
      if (inputNo === '3205') setIsLoggedIn(true);
      else alert("รหัสผ่าน Admin ไม่ถูกต้อง");
    } else {
      if (STUDENT_LIST[inputNo] && inputNo !== '3205') setIsLoggedIn(true);
      else alert("ไม่พบเลขที่นักเรียนนี้");
    }
  };

  const handleSeatAction = async (row, col, side) => {
    const key = `${row}-${col}-${side}`;
    if (role === 'admin') {
      if (seats[key]) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'seats', key));
      }
      return;
    }

    if (seats[key]) return;
    
    const alreadyBooked = Object.values(seats).find(s => s.no === inputNo);
    if (alreadyBooked) {
      alert("คุณได้จองที่นั่งไปแล้ว ไม่สามารถจองเพิ่มได้");
      return;
    }

    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'seats', key), {
      no: inputNo,
      name: STUDENT_LIST[inputNo],
      uid: user.uid,
      time: Date.now()
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/50 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
          {!role ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                  <Armchair size={40} className="text-blue-500" />
                </div>
                <h1 className="text-3xl font-bold text-white">ระบบจองที่นั่ง</h1>
                <p className="text-slate-400 mt-2">Classroom Seating System</p>
              </div>
              <div className="grid gap-4">
                <button onClick={() => setRole('student')} className="flex items-center gap-4 p-5 bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all font-bold text-white shadow-lg shadow-blue-900/20 active:scale-[0.98]">
                  <User size={24} /> <span>เข้าใช้งานสำหรับนักเรียน</span>
                </button>
                {/* เปลี่ยนปุ่ม Admin เป็นสีแดงตามคำขอ */}
                <button onClick={() => setRole('admin')} className="flex items-center gap-4 p-5 bg-red-600 hover:bg-red-500 rounded-2xl transition-all font-bold text-white shadow-lg shadow-red-900/20 active:scale-[0.98]">
                  <Shield size={24} /> <span>ผู้ดูแลระบบ (ครู)</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in zoom-in duration-300">
              <button type="button" onClick={() => {setRole(null); setInputNo('');}} className="text-slate-500 flex items-center gap-1 text-sm mb-4 hover:text-slate-300 transition-colors"><ArrowLeft size={14}/> ย้อนกลับ</button>
              <h2 className="text-2xl font-bold text-white">{role === 'admin' ? 'ระบุรหัส Admin' : 'ระบุเลขที่นักเรียน'}</h2>
              <input 
                type={role === 'admin' ? "password" : "number"} 
                className={`w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-center text-4xl font-black focus:border-opacity-100 outline-none transition-all ${role === 'admin' ? 'text-red-500 focus:border-red-500' : 'text-blue-400 focus:border-blue-500'}`}
                placeholder={role === 'admin' ? "••••" : "00"}
                value={inputNo}
                onChange={e => setInputNo(e.target.value)}
                autoFocus
              />
              {/* เปลี่ยนปุ่มยืนยันของ Admin เป็นสีแดงให้เข้าชุดกัน */}
              <button className={`w-full py-5 rounded-2xl font-bold text-white text-lg shadow-xl active:scale-95 transition-transform ${role === 'admin' ? 'bg-red-600 shadow-red-900/40' : 'bg-blue-600 shadow-blue-900/40'}`}>
                ยืนยันเข้าสู่ระบบ
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900/80 border border-white/10 p-4 rounded-3xl mb-8 sticky top-4 z-50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${role === 'admin' ? 'bg-red-600 shadow-red-900/40' : 'bg-blue-600 shadow-blue-900/40'}`}>
              {role === 'admin' ? 'AD' : inputNo}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{role === 'admin' ? 'ADMIN PANEL' : 'STUDENT BOOKING'}</p>
              <p className="font-bold truncate max-w-[150px] md:max-w-none">{STUDENT_LIST[inputNo]}</p>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="p-3 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-xl transition-all">
            <LogOut size={20} />
          </button>
        </div>

        {/* Classroom Layout */}
        <div className="relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-8 md:p-16 overflow-x-auto min-w-[900px] shadow-2xl">
          {/* Front of Room */}
          <div className="flex justify-between items-start mb-24 border-b border-white/5 pb-12">
            <div className="w-24 h-24 border-2 border-red-500/20 rounded-2xl flex items-center justify-center text-red-500/40 font-bold text-xs rotate-[-10deg]">บอร์ด</div>
            <div className="flex-1 max-w-lg mx-12">
              <div className="h-1.5 w-full bg-blue-500/20 rounded-full mb-6"></div>
              <div className="bg-slate-800/50 border-4 border-slate-700/50 h-32 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                <span className="text-slate-600 font-black text-4xl tracking-[1.5em] uppercase">กระดาน</span>
              </div>
            </div>
            <div className="w-24 h-24 border-2 border-red-500/20 rounded-2xl flex items-center justify-center text-red-500/40 font-bold text-xs rotate-[10deg]">บอร์ด</div>
          </div>

          {/* Details */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-16 bg-blue-400/10 rounded-full"></div>)}
            <span className="text-[10px] text-blue-400/30 font-bold uppercase -rotate-90 mt-4 tracking-widest">หน้าต่าง</span>
          </div>

          <div className="absolute right-12 top-48 w-40 h-24 border-2 border-green-500/20 bg-green-500/5 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.05)]">
            <span className="text-green-500/40 font-black text-xs tracking-widest">โต๊ะครู</span>
          </div>

          <div className="absolute right-0 top-72 w-2 h-24 bg-orange-400/20 rounded-l-full flex items-center justify-center">
            <span className="text-[9px] text-orange-400/30 font-bold uppercase rotate-90 absolute -right-3">ประตู</span>
          </div>
          <div className="absolute right-0 bottom-32 w-2 h-24 bg-orange-400/20 rounded-l-full flex items-center justify-center">
            <span className="text-[9px] text-orange-400/30 font-bold uppercase rotate-90 absolute -right-3">ประตู</span>
          </div>

          {/* Seating Grid */}
          <div className="grid grid-cols-5 gap-x-12 gap-y-20 relative z-10">
            {Array.from({ length: 4 }).map((_, row) => (
              Array.from({ length: 5 }).map((_, col) => {
                const keyL = `${row}-${col}-L`;
                const keyR = `${row}-${col}-R`;
                return (
                  <div key={`${row}-${col}`} className="group relative">
                    <div className="absolute -top-6 left-0 right-0 text-center text-[10px] font-bold text-slate-700 tracking-tighter">กลุ่ม {col+1} แถว {row+1}</div>
                    <div className="flex bg-slate-950/80 border border-white/5 rounded-2xl overflow-hidden shadow-2xl group-hover:border-blue-500/30 transition-all duration-500">
                      <Seat 
                        data={seats[keyL]} 
                        currentNo={inputNo} 
                        isAdmin={role === 'admin'} 
                        onClick={() => handleSeatAction(row, col, 'L')} 
                      />
                      <div className="w-[1px] bg-white/5"></div>
                      <Seat 
                        data={seats[keyR]} 
                        currentNo={inputNo} 
                        isAdmin={role === 'admin'} 
                        onClick={() => handleSeatAction(row, col, 'R')} 
                      />
                    </div>
                  </div>
                );
              })
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          <LegendItem color="bg-slate-800" label="ว่าง" />
          <LegendItem color="bg-emerald-500" label="จองแล้ว" />
          <LegendItem color="bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" label="ที่นั่งของคุณ" />
        </div>
      </div>
    </div>
  );
}

function Seat({ data, currentNo, isAdmin, onClick }) {
  const isMine = data?.no === currentNo;
  return (
    <button 
      onClick={onClick}
      className={`flex-1 h-20 flex flex-col items-center justify-center transition-all relative group/seat
        ${data ? (isMine ? 'bg-blue-600 text-white' : 'bg-emerald-600/40 text-emerald-100') : 'hover:bg-blue-500/10 text-slate-800'}
      `}
    >
      <Armchair size={data ? 22 : 18} className={data ? 'mb-1 drop-shadow-md' : 'opacity-10'} />
      {data ? (
        <div className="text-center animate-in fade-in duration-500">
          <p className="text-[10px] font-black leading-none">{isMine ? 'ME' : data.no}</p>
          <p className="text-[7px] font-bold opacity-70 truncate w-14 px-1">{data.name.split(' ')[0]}</p>
        </div>
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-white/5"></div>
      )}

      {isAdmin && data && (
        <div className="absolute inset-0 bg-red-600/90 flex items-center justify-center opacity-0 group-hover/seat:opacity-100 transition-opacity">
          <Trash2 size={18} className="text-white" />
        </div>
      )}
    </button>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-full border border-white/5">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

```
