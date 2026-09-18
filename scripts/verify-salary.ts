
import { getSocsoEmployee, getEisContribution, getPCB } from "/home/pjpc/pjpc-app-prod/lib/perkeso-rates.ts";
import { readFileSync } from "fs";
const recs=JSON.parse(readFileSync("/tmp/sal2.json","utf8"));
let bad=0, okc=0, hourly=0;
console.log("类型      gross    | EPF              | SOCSO            | EIS             | 税              | 净薪             ");
for (const r of recs) {
  const g=r.gross||0;
  const isHourly = r.type==='hourly' || r.type==='commission';
  if (isHourly) hourly++;
  // 时薪/佣金：按设计不扣法定
  const eE=isHourly?0:Math.round(g*0.11*100)/100;
  const sE=isHourly?0:getSocsoEmployee(g);
  const ei=isHourly?0:getEisContribution(g);
  const tx=isHourly?0:getPCB(g);
  const expNet=Math.round((g-eE-sE-ei-tx)*100)/100;
  const ok=(Math.abs((r.epf||0)-eE)<0.02)&&(Math.abs((r.socso||0)-sE)<0.02)&&(Math.abs((r.eis||0)-ei)<0.02)&&(Math.abs((r.tax||0)-tx)<0.02)&&(Math.abs((r.net||0)-expNet)<0.02);
  ok?okc++:bad++;
  console.log(`${(r.type||'?').padEnd(9)} ${String(Math.round(g)).padEnd(8)} | ${String(r.epf).padEnd(8)}${String(eE).padEnd(7)} | ${String(r.socso).padEnd(8)}${String(sE).padEnd(7)} | ${String(r.eis).padEnd(7)}${String(ei).padEnd(6)} | ${String(r.tax).padEnd(7)}${String(tx).padEnd(6)} | ${String(Math.round((r.net||0)*100)/100).padEnd(9)}${expNet} ${ok?"✓":"❌"}`);
}
console.log(`\n通过 ${okc} / ${recs.length}  （时薪/佣金制 ${hourly} 条按设计不扣法定缴款）  不一致: ${bad}`);
