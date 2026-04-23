"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getKioskSession, setKioskSession } from "@/lib/kioskState";
import { formatPlate } from "@/types/reception";
import type { PlateInput } from "@/types/reception";
import { detectPlateColor, COLOR_CONFIG } from "@/components/PlateDisplay";
import KatakanaKeyboard from "@/components/KatakanaKeyboard";

/* ━━ プレートデータ ━━ */
interface PlateRegion {
  id: number;
  name: string;
  kana: string;
  sortOrder: number;
  isActive: boolean;
}

// API失敗時のフォールバック地名リスト（主要地名＋読み仮名）
const FALLBACK_REGIONS: PlateRegion[] = ([
  ["札幌","さっぽろ"],["函館","はこだて"],["旭川","あさひかわ"],["室蘭","むろらん"],["帯広","おびひろ"],["釧路","くしろ"],["北見","きたみ"],
  ["青森","あおもり"],["八戸","はちのへ"],["岩手","いわて"],["宮城","みやぎ"],["秋田","あきた"],["山形","やまがた"],["福島","ふくしま"],["いわき","いわき"],
  ["水戸","みと"],["つくば","つくば"],["宇都宮","うつのみや"],["とちぎ","とちぎ"],["群馬","ぐんま"],["前橋","まえばし"],["高崎","たかさき"],
  ["大宮","おおみや"],["所沢","ところざわ"],["熊谷","くまがや"],["春日部","かすかべ"],["川越","かわごえ"],["川口","かわぐち"],["越谷","こしがや"],
  ["千葉","ちば"],["成田","なりた"],["習志野","ならしの"],["野田","のだ"],["柏","かしわ"],["袖ヶ浦","そでがうら"],["船橋","ふなばし"],["松戸","まつど"],
  ["品川","しながわ"],["世田谷","せたがや"],["練馬","ねりま"],["杉並","すぎなみ"],["板橋","いたばし"],["足立","あだち"],["江東","こうとう"],["葛飾","かつしか"],["八王子","はちおうじ"],["多摩","たま"],
  ["横浜","よこはま"],["川崎","かわさき"],["相模","さがみ"],["湘南","しょうなん"],
  ["新潟","にいがた"],["長岡","ながおか"],["長野","ながの"],["松本","まつもと"],["富山","とやま"],["金沢","かなざわ"],["石川","いしかわ"],["福井","ふくい"],
  ["山梨","やまなし"],["岐阜","ぎふ"],["静岡","しずおか"],["浜松","はままつ"],["沼津","ぬまづ"],["富士山","ふじさん"],
  ["名古屋","なごや"],["豊橋","とよはし"],["三河","みかわ"],["岡崎","おかざき"],["豊田","とよた"],["尾張小牧","おわりこまき"],["一宮","いちのみや"],["春日井","かすがい"],
  ["三重","みえ"],["鈴鹿","すずか"],
  ["滋賀","しが"],["京都","きょうと"],["大阪","おおさか"],["なにわ","なにわ"],["和泉","いずみ"],["堺","さかい"],
  ["神戸","こうべ"],["姫路","ひめじ"],["奈良","なら"],["和歌山","わかやま"],
  ["鳥取","とっとり"],["島根","しまね"],["岡山","おかやま"],["倉敷","くらしき"],["広島","ひろしま"],["福山","ふくやま"],["山口","やまぐち"],["下関","しものせき"],
  ["徳島","とくしま"],["香川","かがわ"],["愛媛","えひめ"],["高知","こうち"],
  ["福岡","ふくおか"],["北九州","きたきゅうしゅう"],["久留米","くるめ"],["佐賀","さが"],["長崎","ながさき"],["熊本","くまもと"],["大分","おおいた"],["宮崎","みやざき"],["鹿児島","かごしま"],["沖縄","おきなわ"],
] as [string, string][]).map(([name, kana], i) => ({ id: 9000 + i, name, kana, sortOrder: i, isActive: true }));
const KANA_ROWS: (string|null)[][] = [
  ["あ","い","う","え","お"],
  ["か","き","く","け","こ"],
  ["さ","し","す","せ","そ"],
  ["た","ち","つ","て","と"],
  ["な","に","ぬ","ね","の"],
  ["は","ひ","ふ","へ","ほ"],
  ["ま","み","む","め","も"],
  ["や",null,"ゆ",null,"よ"],
  ["ら","り","る","れ","ろ"],
  ["わ","を",null,null,"ん"],
];
const HIRA_ROWS: (string|null)[][] = KANA_ROWS;
const HIRA_UNUSABLE = new Set(["し","へ","ん","お"]);
const HIRA_JIGYOYO = new Set(["あ","い","う","え","か","き","く","け","こ","を"]);
const HIRA_RENTAL  = new Set(["わ","れ"]);
const ALPHA_KEYS   = ["A","C","F","H","K","L","M","P","X","Y"];

type ActiveField = "company" | "name" | "maxLoad" | "plate";
type PlateSection = "region" | "classNum" | "hira" | "number";

/* ━━ 左サイドバーのサマリー行 ━━ */
function SideItem({ num, icon, label, value, placeholder, active, onClick }: {
  num: string; icon: string; label: string; value: string; placeholder: string;
  active: boolean; onClick: () => void;
}) {
  const filled = !!value;
  return (
    <button
      onPointerDown={onClick}
      className="flex flex-col text-left w-full transition-all duration-100 active:brightness-90"
      style={{
        padding: "16px 20px",
        background: active ? "rgba(255,255,255,0.15)" : "transparent",
        borderLeft: active ? "4px solid white" : "4px solid transparent",
        flexShrink: 0,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 18, opacity: 0.6 }}>{num}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.05em" }}>{label}</span>
        {filled
          ? <span style={{ marginLeft: "auto", fontSize: 12, color: "#4ade80", fontWeight: 800 }}>✓</span>
          : <span style={{ marginLeft: "auto", fontSize: 12, color: "#f87171", fontWeight: 800 }}>未入力</span>
        }
      </div>
      <span style={{
        fontSize: 28, fontWeight: 900, lineHeight: 1.2,
        color: filled ? "white" : "rgba(248,113,113,0.8)",
        paddingLeft: 4,
      }}>
        {value || placeholder}
      </span>
    </button>
  );
}

/* ━━ プレートプレビュー（左サイドバー用小型） ━━ */
function MiniPlate({ plate }: { plate: PlateInput }) {
  const color = detectPlateColor(plate.classNum, plate.hira);
  const { bg, text, dim, border } = COLOR_CONFIG[color];
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  const len = plate.number.length;

  const numEl = (
    <span style={{ display:"inline-flex", alignItems:"center", fontFamily:pf, fontWeight:900 }}>
      {[0,1,2,3].map(pos=>{
        const hasDigit = pos>=(4-len); const ch=hasDigit?plate.number[pos-(4-len)]:null;
        return <span key={pos} style={{display:"inline-flex",alignItems:"center"}}>
          {pos===2&&<span style={{visibility:len>=3?"visible":"hidden"}}>-</span>}
          {ch!==null?<span style={{display:"inline-block",width:"0.6em",textAlign:"center"}}>{ch}</span>:<span style={{display:"inline-block",width:"0.6em",textAlign:"center",opacity:0.35}}>・</span>}
        </span>;
      })}
    </span>
  );

  return (
    <div style={{
      width:240, height:120, background:bg, border:`4px solid ${border}`,
      borderRadius:8, boxShadow:"0 4px 12px rgba(0,0,0,0.3)",
      display:"flex", flexDirection:"column", padding:"5px 12px 7px",
      boxSizing:"border-box", userSelect:"none", margin:"8px 20px 16px",
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        <span style={{fontSize:18,fontWeight:900,fontFamily:pf,color:plate.region?text:dim}}>{plate.region||"地名"}</span>
        <span style={{fontSize:18,fontWeight:900,fontFamily:pf,letterSpacing:2,color:plate.classNum?text:dim}}>{plate.classNum||"・・・"}</span>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",position:"relative"}}>
        <span style={{position:"absolute",left:0,fontSize:28,fontWeight:900,fontFamily:pf,color:plate.hira?text:dim,lineHeight:1}}>{plate.hira||"あ"}</span>
        <span style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",paddingLeft:28,fontSize:52,color:plate.number?text:dim,transform:"scaleX(0.85)",transformOrigin:"center"}}>{numEl}</span>
      </div>
    </div>
  );
}

/* ━━ 右パネル：プレート入力 ━━ */
function PlatePanel({ plate, onChange }: {
  plate: PlateInput;
  onChange: (p: Partial<PlateInput>) => void;
}) {
  const [section, setSection] = useState<PlateSection>(() => {
    if (!plate.region) return "region";
    if (!plate.classNum) return "classNum";
    if (!plate.hira) return "hira";
    return "number";
  });
  const [kanaFilter, setKanaFilter] = useState<string|null>(null);
  const [regions, setRegions] = useState<PlateRegion[]>([]);

  // DBから地名マスタ取得（失敗時はフォールバック）
  useEffect(() => {
    fetch("/api/plate-masters")
      .then((r) => r.json())
      .then((data) => {
        if (data.regions && data.regions.length > 0) setRegions(data.regions);
        else setRegions(FALLBACK_REGIONS);
      })
      .catch(() => setRegions(FALLBACK_REGIONS));
  }, []);

  // ひらがな頭文字でフィルタした地名リスト
  const regionList = kanaFilter
    ? regions.filter((r) => r.kana.startsWith(kanaFilter))
    : [];

  const color = detectPlateColor(plate.classNum, plate.hira);
  const { bg, text, dim, border } = COLOR_CONFIG[color];
  const pf = '"Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",Arial,sans-serif';
  const len = plate.number.length;

  // BigPlate
  const numEl = (
    <span style={{display:"inline-flex",alignItems:"center",fontFamily:pf,fontWeight:900}}>
      {[0,1,2,3].map(pos=>{
        const hasDigit=pos>=(4-len); const ch=hasDigit?plate.number[pos-(4-len)]:null;
        return <span key={pos} style={{display:"inline-flex",alignItems:"center"}}>
          {pos===2&&<span style={{visibility:len>=3?"visible":"hidden"}}>-</span>}
          {ch!==null?<span style={{display:"inline-block",width:"0.6em",textAlign:"center"}}>{ch}</span>:<span style={{display:"inline-block",width:"0.6em",textAlign:"center",opacity:0.35}}>・</span>}
        </span>;
      })}
    </span>
  );
  const hl=(s:PlateSection):React.CSSProperties=>section===s
    ?{outline:"4px solid #FFE600",outlineOffset:3,borderRadius:8,background:"rgba(255,230,0,0.18)",cursor:"pointer"}
    :{borderRadius:8,cursor:"pointer"};

  const sectionLabels: Record<PlateSection, string> = {
    region:"① 地名", classNum:"② 分類番号", hira:"③ ひらがな", number:"④ 4桁番号",
  };
  const sectionColors: Record<PlateSection, string> = {
    region:"#1565C0", classNum:"#BF360C", hira:"#4A148C", number:"#1B5E20",
  };

  const numBtnStyle = "flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white text-gray-900 active:bg-gray-100 shadow-[0_4px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] transition-all duration-75 select-none touch-none";

  return (
    <div className="flex gap-6 h-full justify-center px-8">
      {/* BigPlate */}
      <div className="flex flex-col items-center justify-center flex-shrink-0" style={{width:400}}>
        <div style={{
          width:380,height:190,background:bg,border:`5px solid ${border}`,
          borderRadius:12,boxShadow:"0 6px 20px rgba(0,0,0,0.28)",
          display:"flex",flexDirection:"column",padding:"8px 18px 10px",boxSizing:"border-box",userSelect:"none",
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            <div onPointerDown={()=>setSection("region")} style={hl("region")}>
              <span style={{fontSize:32,fontWeight:900,fontFamily:pf,color:plate.region?text:dim}}>{plate.region||"地名"}</span>
            </div>
            <div onPointerDown={()=>setSection("classNum")} style={hl("classNum")}>
              <span style={{fontSize:32,fontWeight:900,fontFamily:pf,letterSpacing:3,color:plate.classNum?text:dim}}>{plate.classNum||"・・・"}</span>
            </div>
          </div>
          <div style={{flex:1,display:"flex",alignItems:"center",position:"relative"}}>
            <div onPointerDown={()=>setSection("hira")} style={{position:"absolute",left:0,...hl("hira")}}>
              <span style={{fontSize:44,fontWeight:900,fontFamily:pf,color:plate.hira?text:dim,lineHeight:1}}>{plate.hira||"あ"}</span>
            </div>
            <div onPointerDown={()=>setSection("number")} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",paddingLeft:44,transform:"scaleX(0.85)",transformOrigin:"center",...hl("number")}}>
              <span style={{fontSize:82,color:plate.number?text:dim}}>{numEl}</span>
            </div>
          </div>
        </div>
        <p style={{marginTop:8,fontSize:15,color:"#1a3a6b",fontWeight:800,background:"#DBEAFE",padding:"6px 16px",borderRadius:8,border:"2px solid #93C5FD"}}>▼ 修正したい部分をタッチ</p>
      </div>

      {/* 入力パネル */}
      <div className="flex flex-col overflow-hidden flex-1">
        {/* セクションバナー */}
        <div className="flex items-center px-6 flex-shrink-0" style={{
          height:80,background:sectionColors[section],
          boxShadow:`0 4px 0 rgba(0,0,0,0.25)`,
        }}>
          <span style={{fontSize:34,fontWeight:900,color:"white"}}>{sectionLabels[section]}</span>
        </div>

        {/* セクション別パネル */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ① 地名 */}
          {section==="region" && (
            kanaFilter===null ? (
              <div>
                <p style={{fontSize:22,fontWeight:700,color:"#475569",marginBottom:12}}>頭文字を選んでください</p>
                <div className="flex flex-col gap-2">
                  {KANA_ROWS.map((row,ri)=>(
                    <div key={ri} className="flex gap-2">
                      {row.map((k,ci)=>k===null
                        ? <div key={ci} style={{width:80,height:80}}/>
                        : <button key={ci} onPointerDown={()=>setKanaFilter(k)}
                            className="flex items-center justify-center font-bold rounded-xl border-2 border-gray-200 bg-white text-gray-800 active:bg-blue-50 shadow-[0_3px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[2px] transition-all duration-75"
                            style={{width:80,height:80,fontSize:26}}>
                            {k}
                          </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <button
                    onPointerDown={()=>setKanaFilter(null)}
                    className="flex items-center justify-center font-bold rounded-xl select-none touch-none active:scale-95"
                    style={{
                      height: 52, padding: "0 20px", fontSize: 18, fontWeight: 800,
                      border: "3px solid #F59E0B",
                      background: "#FFFBEB",
                      color: "#92400E",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>◀</span>
                    別の文字を選ぶ
                  </button>
                  <span style={{fontSize:22,fontWeight:700,color:"#475569"}}>
                    「<span style={{ color: "#D97706", fontWeight: 900 }}>{kanaFilter}</span>」から始まる地名
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {regionList.map(r=>(
                    <button key={r.id} onPointerDown={()=>{onChange({region:r.name});setKanaFilter(null);setTimeout(()=>setSection("classNum"),100);}}
                      className="flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white text-gray-900 active:bg-blue-50 shadow-[0_3px_0_#BDBDBD] active:translate-y-[2px] transition-all"
                      style={{height:72,padding:"0 24px",fontSize:30,minWidth:120}}>
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          {/* ② 分類番号 */}
          {section==="classNum" && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex flex-col gap-2">
                  {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row,ri)=>(
                    <div key={ri} className="flex gap-2">
                      {row.map(k=>(
                        <button key={k} onPointerDown={()=>{if(plate.classNum.length<3){const n=plate.classNum+k;onChange({classNum:n});if(n.length===3)setTimeout(()=>setSection("hira"),150);}}}
                          className={numBtnStyle} style={{width:100,height:100,fontSize:40}}>{k}</button>
                      ))}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button onPointerDown={()=>{if(plate.classNum.length<3){const n=plate.classNum+"0";onChange({classNum:n});if(n.length===3)setTimeout(()=>setSection("hira"),150);}}}
                      className={numBtnStyle} style={{width:214,height:100,fontSize:40}}>0</button>
                    <button onPointerDown={()=>onChange({classNum:plate.classNum.slice(0,-1)})}
                      className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_4px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-none"
                      style={{width:100,height:100,fontSize:24}}>消す</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {ALPHA_KEYS.map(k=>(
                    <button key={k} onPointerDown={()=>{if(plate.classNum.length<3){const n=plate.classNum+k;onChange({classNum:n});if(n.length===3)setTimeout(()=>setSection("hira"),150);}}}
                      className={numBtnStyle} style={{width:80,height:72,fontSize:28}}>{k}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ③ ひらがな */}
          {section==="hira" && (
            <div>
              <div className="flex gap-3 mb-3 flex-wrap" style={{fontSize:16,fontWeight:700}}>
                <span style={{color:"#2563eb"}}>■ 事業用(緑)</span>
                <span style={{color:"#ea580c"}}>■ レンタカー</span>
                <span style={{color:"#94a3b8"}}>■ 使用不可</span>
              </div>
              <div className="flex flex-col gap-2">
                {HIRA_ROWS.map((row,ri)=>(
                  <div key={ri} className="flex gap-2">
                    {row.map((k,ci)=>k===null
                      ? <div key={ci} style={{width:72,height:72}}/>
                      : (() => {
                          const unusable=HIRA_UNUSABLE.has(k);
                          const jigyoyo=HIRA_JIGYOYO.has(k);
                          const rental=HIRA_RENTAL.has(k);
                          return (
                            <button key={ci} disabled={unusable}
                              onPointerDown={()=>{if(!unusable){onChange({hira:k});setTimeout(()=>setSection("number"),120);}}}
                              className="flex items-center justify-center font-bold rounded-xl border-2 transition-all shadow-[0_3px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[2px] select-none touch-none"
                              style={{
                                width:72,height:72,fontSize:26,
                                background:unusable?"#e2e8f0":jigyoyo?"#dbeafe":rental?"#ffedd5":"white",
                                borderColor:unusable?"#cbd5e1":jigyoyo?"#93c5fd":rental?"#fb923c":"#e2e8f0",
                                color:unusable?"#94a3b8":jigyoyo?"#1d4ed8":rental?"#ea580c":"#26251e",
                                opacity:unusable?0.4:1,
                              }}>{k}</button>
                          );
                        })()
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ④ 4桁番号 */}
          {section==="number" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row,ri)=>(
                  <div key={ri} className="flex gap-2">
                    {row.map(k=>(
                      <button key={k} onPointerDown={()=>{if(plate.number.length<4)onChange({number:plate.number+k});}}
                        className={numBtnStyle} style={{width:100,height:100,fontSize:40}}>{k}</button>
                    ))}
                  </div>
                ))}
                <div className="flex gap-2">
                  <button onPointerDown={()=>{if(plate.number.length<4)onChange({number:plate.number+"0"});}}
                    className={numBtnStyle} style={{width:214,height:100,fontSize:40}}>0</button>
                  <button onPointerDown={()=>onChange({number:plate.number.slice(0,-1)})}
                    className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_4px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-none"
                    style={{width:100,height:100,fontSize:24}}>消す</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ━━ メイン ━━ */
export default function DataConfirmPage() {
  const router = useRouter();
  const [active, setActive] = useState<ActiveField>("company");
  const [company,  setCompany]  = useState("");
  const [name,     setName]     = useState("");
  const [maxLoad,  setMaxLoad]  = useState("");
  const [plate,    setPlate]    = useState<PlateInput>({region:"",classNum:"",hira:"",number:""});
  const [mounted,  setMounted]  = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const s = getKioskSession();
    if (!s.phone || !s.centerId) {
      router.replace("/kiosk");
      return;
    }
    setCompany(s.driverInput.companyName ?? "");
    setName(s.driverInput.driverName ?? "");
    setMaxLoad(s.driverInput.maxLoad ?? "");
    setPlate(s.plate);
    setMounted(true);
    // 未入力の最初の項目にフォーカス
    if (!s.driverInput.companyName) setActive("company");
    else if (!s.driverInput.driverName) setActive("name");
    else if (!s.driverInput.maxLoad) setActive("maxLoad");
    else setActive("plate");
  }, []);

  // セッション保存
  function saveCompany(v: string) {
    setCompany(v);
    const s = getKioskSession();
    setKioskSession({ driverInput: { ...s.driverInput, companyName: v } });
  }
  function saveName(v: string) {
    setName(v);
    const s = getKioskSession();
    setKioskSession({ driverInput: { ...s.driverInput, driverName: v } });
  }
  function saveMaxLoad(v: string) {
    if (v.length > 6) return;
    setMaxLoad(v);
    const s = getKioskSession();
    setKioskSession({ driverInput: { ...s.driverInput, maxLoad: v } });
  }
  function savePlate(partial: Partial<PlateInput>) {
    const next = { ...plate, ...partial };
    setPlate(next);
    setKioskSession({ plate: next });
  }

  const plateStr = formatPlate(plate);
  const isComplete = !!company && !!name && !!maxLoad && !!plateStr;

  if (!mounted) return <div className="w-screen h-screen" style={{background:"#f2f1ed"}}/>;

  // 数字パネル用
  const numBtnBase = "flex items-center justify-center font-black rounded-xl border-2 border-gray-200 bg-white text-gray-900 shadow-[0_4px_0_#BDBDBD] active:shadow-[0_1px_0_#BDBDBD] active:translate-y-[3px] transition-all duration-75 select-none touch-none";

  // タブの定義
  const tabs: { id: ActiveField; icon: string; label: string; value: string; accent: string }[] = [
    { id:"company",  icon:"🏢", label:"運送会社名",   value:company,  accent:"#1E5799" },
    { id:"name",     icon:"👤", label:"お名前",        value:name,     accent:"#7c3aed" },
    { id:"maxLoad",  icon:"⚖️", label:"最大積載量",    value:maxLoad?`${Number(maxLoad).toLocaleString()} kg`:"", accent:"#0369a1" },
    { id:"plate",    icon:"🚛", label:"車両ナンバー",  value:plateStr, accent:"#0d9488" },
  ];

  return (
    <div className="w-screen h-screen flex flex-col select-none overflow-hidden"
      style={{background:"#f2f1ed"}}>

      {/* ━━ ヘッダー ━━ */}
      <div className="flex items-center px-8 gap-6 flex-shrink-0"
        style={{background:"#1a3a6b",height:96}}>
        <button onPointerDown={()=>router.push("/kiosk/phone")}
          className="flex items-center justify-center font-bold rounded-xl border-2 border-white text-white active:bg-blue-800 flex-shrink-0"
          style={{height:68,width:240,fontSize:24}}>◀ 電話番号へ戻る</button>
        <h1 className="flex-1 text-3xl font-black text-white text-center tracking-wide">
          情報の入力・確認
        </h1>
        <button
          type="button"
          onPointerDown={()=>isComplete&&router.push("/kiosk/final-confirm")}
          disabled={!isComplete}
          style={{
            height:68, minWidth:240, fontSize:28, fontWeight:900,
            background:isComplete?"linear-gradient(180deg,#4caf50,#2E7D32)":"#d6d4cd",
            color:isComplete?"white":"#9a978c",
            borderRadius:14, border:"none",
            boxShadow:isComplete?"0 5px 0 #1B5E20":"0 4px 0 #a8a59c",
            padding:"0 32px", letterSpacing:"0.08em", flexShrink:0,
            cursor:isComplete?"pointer":"not-allowed",
          }}>
          {isComplete ? "次　へ　▶" : "次　へ"}
        </button>
      </div>

      {/* ━━ 上：タブ（4項目） ━━ */}
      <div className="flex flex-shrink-0" style={{background:"white",borderBottom:"2px solid #e2e8f0"}}>
        {tabs.map((tab,i)=>{
          const filled = !!tab.value;
          const isActive = active===tab.id;
          return (
            <button key={tab.id} onPointerDown={()=>setActive(tab.id)}
              className="flex-1 flex flex-col text-left transition-all active:brightness-95 overflow-hidden"
              style={{
                padding:"14px 24px 10px",
                background:isActive?"#f8fafc":"white",
                borderBottom:isActive?`3px solid ${tab.accent}`:"3px solid transparent",
                borderRight:i<3?"1px solid #e2e8f0":"none",
                position:"relative",
              }}>
              {/* ラベル行 */}
              <div className="flex items-center gap-2 mb-1">
                <span style={{fontSize:22}}>{tab.icon}</span>
                <span style={{fontSize:18,fontWeight:700,color:"#94a3b8"}}>{tab.label}</span>
                <span style={{
                  marginLeft:"auto", fontSize:13, fontWeight:800, borderRadius:8, padding:"2px 8px",
                  background:filled?tab.accent+"18":"#fee2e2",
                  color:filled?tab.accent:"#ef4444",
                }}>{filled?"✓ 入力済み":"！ 未入力"}</span>
              </div>
              {/* 値 */}
              {tab.id==="plate" && plateStr ? (
                <span style={{fontSize:26,fontWeight:900,color:"#26251e",letterSpacing:2}}>
                  {plateStr}
                </span>
              ) : (
                <span style={{
                  fontSize:32,fontWeight:900,lineHeight:1.15,
                  color:filled?"#26251e":"#f87171",
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%",
                }}>
                  {tab.value||"—"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ━━ 下：入力パネル ━━ */}
      <div className="flex-1 overflow-hidden bg-white">

        {/* 会社名 */}
        {active==="company" && (
          <div className="h-full flex flex-col px-8 pt-4 pb-3 gap-3">
            <div style={{background:company?"#FFF9C4":"#f8fafc",border:`3px solid ${company?"#F59E0B":"#e2e8f0"}`,borderRadius:14,padding:"10px 24px",minHeight:68,display:"flex",alignItems:"center",flexShrink:0}}>
              <span style={{fontSize:44,fontWeight:900,color:company?"#26251e":"#94a3b8"}}>{company||"ニホンセイフティー"}</span>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <KatakanaKeyboard value={company} onChange={saveCompany} onComplete={()=>setActive("name")} />
            </div>
          </div>
        )}

        {/* お名前 */}
        {active==="name" && (
          <div className="h-full flex flex-col px-8 pt-4 pb-3 gap-3">
            <div style={{background:name?"#FFF9C4":"#f8fafc",border:`3px solid ${name?"#F59E0B":"#e2e8f0"}`,borderRadius:14,padding:"10px 24px",minHeight:68,display:"flex",alignItems:"center",flexShrink:0}}>
              <span style={{fontSize:44,fontWeight:900,color:name?"#26251e":"#94a3b8"}}>{name||"タナカ タロウ"}</span>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <KatakanaKeyboard value={name} onChange={saveName} onComplete={()=>setActive("maxLoad")} />
            </div>
          </div>
        )}

        {/* 最大積載 */}
        {active==="maxLoad" && (
          <div className="h-full flex items-center justify-center gap-16 px-16">
            {/* 左：説明 + 表示 */}
            <div className="flex flex-col gap-5 flex-shrink-0" style={{width:400}}>
              <p style={{fontSize:26,fontWeight:700,color:"#475569",lineHeight:1.5}}>
                最大積載量を<br/>入力してください
              </p>
              <div style={{background:maxLoad?"#FFF9C4":"#f8fafc",border:`3px solid ${maxLoad?"#F59E0B":"#e2e8f0"}`,borderRadius:16,padding:"16px 28px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:80,fontWeight:900,color:maxLoad?"#26251e":"#94a3b8"}}>
                  {maxLoad ? Number(maxLoad).toLocaleString() : "0"}
                </span>
                <span style={{fontSize:40,fontWeight:700,color:"#64748b"}}>kg</span>
              </div>
            </div>
            {/* 右：テンキー */}
            <div className="flex gap-4 flex-shrink-0">
              <div className="flex flex-col gap-3">
                {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row,ri)=>(
                  <div key={ri} className="flex gap-3">
                    {row.map(k=>(
                      <button key={k} onPointerDown={()=>saveMaxLoad(maxLoad+k)}
                        className={numBtnBase} style={{width:156,height:122,fontSize:54}}>{k}</button>
                    ))}
                  </div>
                ))}
                <button onPointerDown={()=>saveMaxLoad(maxLoad+"0")}
                  className={numBtnBase} style={{width:492,height:122,fontSize:54}}>0</button>
              </div>
              <div className="flex flex-col gap-3">
                <button onPointerDown={()=>saveMaxLoad("")}
                  className="flex items-center justify-center font-bold rounded-xl border-2 border-red-500 bg-red-500 text-white active:bg-red-600 shadow-[0_4px_0_#B91C1C] active:shadow-[0_1px_0_#B91C1C] active:translate-y-[3px] transition-all select-none touch-none"
                  style={{width:172,height:122,fontSize:22,textAlign:"center",lineHeight:1.3}}>すべて<br/>消す</button>
                <button onPointerDown={()=>saveMaxLoad(maxLoad.slice(0,-1))}
                  className="flex items-center justify-center font-bold rounded-xl border-2 border-orange-400 bg-orange-400 text-white active:bg-orange-500 shadow-[0_4px_0_#C2410C] active:shadow-[0_1px_0_#C2410C] active:translate-y-[3px] transition-all select-none touch-none"
                  style={{width:172,height:122,fontSize:22,textAlign:"center",lineHeight:1.3}}>1文字<br/>消す</button>
                <button onPointerDown={()=>{if(maxLoad)setActive("plate");}}
                  className="flex items-center justify-center font-black rounded-xl border-2 border-teal-700 bg-teal-600 text-white active:bg-teal-700 shadow-[0_4px_0_#0F766E] active:shadow-[0_1px_0_#0F766E] active:translate-y-[3px] transition-all select-none touch-none"
                  style={{width:172,height:252,fontSize:40}}>OK</button>
              </div>
            </div>
          </div>
        )}

        {/* 車両ナンバー */}
        {active==="plate" && (
          <div className="h-full overflow-hidden">
            <PlatePanel plate={plate} onChange={savePlate} />
          </div>
        )}
      </div>
    </div>
  );
}
