
    (() => {
      const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="#0a0a0a"/><circle cx="64" cy="64" r="42" fill="#c9a84c"/><path d="M64 22c14 21 14 63 0 84M22 64h84M34 34c18 14 42 14 60 0M34 94c18-14 42-14 60 0" fill="none" stroke="#0a0a0a" stroke-width="8" stroke-linecap="round"/></svg>';
      const manifest = {
        name: 'BTH Operator',
        short_name: 'BTH',
        start_url: '.',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [{ src: `data:image/svg+xml,${encodeURIComponent(iconSvg)}`, sizes: 'any', type: 'image/svg+xml' }]
      };
      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = URL.createObjectURL(blob);
      document.head.appendChild(link);
    })();
  


// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  CONSTANTS                                   â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const GYM_DAYS = [1, 2, 4, 5]; // Mon Tue Thu Fri (0=Sun)

const BACKUP_TASKS = [
  "Write 3 content hooks",
  "Write tomorrow's 3 tasks",
  "Reply to 3 comments or DMs",
  "Organize 1 BTH content folder",
  "Post 1 story to IG or TikTok",
  "Read for 15 minutes",
  "Do SI joint reset (15 min)",
  "Outline next video script",
  "Engage with 5 accounts in your niche",
  "Plan next filming session"
];

const BTH_ITEMS = [
  { key: 'posted',   label: 'Posted',   icon: '📤' },
  { key: 'filmed',   label: 'Filmed',   icon: '📹' },
  { key: 'edited',   label: 'Edited',   icon: '✂️' },
  { key: 'engaged',  label: 'Engaged',  icon: '💬' },
  { key: 'planned',  label: 'Planned',  icon: '📋' },
  { key: 'recovery', label: 'Recovery', icon: '🦴' },
];

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  DATE HELPERS                                â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Ty's day starts at 6 AM. Before 6 AM = previous calendar day.
function tyNow() {
  const d = new Date();
  if (d.getHours() < 6) d.setDate(d.getDate() - 1);
  return d;
}

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function todayKey() { return dateKey(tyNow()); }

function yesterdayKey() {
  const d = tyNow();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

function tomorrowKey() {
  const d = tyNow();
  d.setDate(d.getDate() + 1);
  return dateKey(d);
}

let activeLogKey = todayKey();
let currentBackupTasks = [];
let saveTimer;
let pendingSave = null;

function keyToDate(k) {
  const [y,m,d] = k.split('-').map(Number);
  return new Date(y, m-1, d);
}

function mondayKey(d) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return dateKey(dt);
}

function isGymDay(d) { return GYM_DAYS.includes(d.getDay()); }

function fmtDate(d) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function fmtShortDay(d) {
  return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][(d.getDay() + 6) % 7];
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  STORAGE                                     â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function load(k) {
  try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
}
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

function getDaily(key)       { return load('bth_d_' + key) || {}; }
function setDaily(key, data) { save('bth_d_' + key, data); }
function getTasks(key)       { return load('bth_t_' + key); }
function setTasks(key, data) { save('bth_t_' + key, data); }

function getWeekDays(refDate) {
  const monKey = mondayKey(refDate);
  const monday = keyToDate(monKey);
  return Array.from({length:7}, (_,i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const k = dateKey(d);
    return { date: d, key: k, daily: getDaily(k), tasks: getTasks(k) };
  });
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  DAY TYPE & MODE                             â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function getDayType(date) {
  const daily = getDaily(dateKey(date));
  const working = !!daily.working;
  const gym = isGymDay(date);
  if (gym && working)  return 'GYM_WORK';
  if (gym && !working) return 'GYM_OFF';
  if (!gym && working) return 'OFF_WORK';
  return 'OFF_OFF';
}

function dayTypeLabel(t) {
  return { GYM_WORK:'Gym Day · Work Night', GYM_OFF:'Gym Day · Off Night',
           OFF_WORK:'Off Gym · Work Night',  OFF_OFF:'Off Gym · Off Night' }[t] || 'Off Day';
}

function bthMinutes(t) {
  return { GYM_WORK:30, GYM_OFF:120, OFF_WORK:90, OFF_OFF:120 }[t] || 120;
}

function getMode(daily) {
  const sleep  = parseFloat(daily.sleep)  || 0;
  const energy = parseInt(daily.energy)   || 0;
  if (sleep < 5.5 || energy <= 2) return 'rest';
  if (energy <= 3)                return 'minimum';
  if (energy <= 5 || sleep < 6.5) return 'reduced';
  return 'full';
}

function modeConfig(mode) {
  return {
    full:    { label:'FULL EXECUTE',      icon:'⚡', cls:'mode-full' },
    reduced: { label:'REDUCED LOAD',      icon:'⚡', cls:'mode-reduced' },
    minimum: { label:'MINIMUM VIABLE',    icon:'🔋', cls:'mode-minimum' },
    rest:    { label:'REST DAY PROTOCOL', icon:'😴', cls:'mode-rest' },
  }[mode] || { label:'FULL EXECUTE', icon:'⚡', cls:'mode-full' };
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  ALERTS                                      â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function buildAlerts(daily) {
  const alerts = [];
  const sleep   = parseFloat(daily.sleep)   || 0;
  const energy  = parseInt(daily.energy)    || 0;
  const protein = parseInt(daily.protein)   || 0;
  const water   = parseInt(daily.water)     || 0;
  const hour    = new Date().getHours();

  if (sleep  > 0 && sleep  < 5.5)               alerts.push({ t:'red',  m:`Only ${sleep}h sleep. Low-effort tasks today. Recovery is the priority.` });
  if (energy > 0 && energy <= 3)                 alerts.push({ t:'red',  m:`Energy at ${energy}/10. Low-energy protocol active. Backup tasks only.` });
  if (protein > 0 && protein < 100 && hour >= 18) alerts.push({ t:'gold', m:`Protein at ${protein}g past 6 PM. Have your second shake now.` });
  if (water   > 0 && water   < 4   && hour >= 15) alerts.push({ t:'gold', m:`Water at ${water}/8 cups. You're behind — drink 2 cups before shift.` });

  // 3-day low energy check
  let lowDays = energy > 0 && energy < 4 ? 1 : 0;
  for (let i = 1; i <= 3 && lowDays < 3; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const prev = getDaily(dateKey(d));
    if (prev && parseInt(prev.energy) > 0 && parseInt(prev.energy) < 4) lowDays++;
  }
  if (lowDays >= 3) alerts.push({ t:'red', m:'3+ consecutive low-energy days. Systemic issue. Check sleep debt and protein — both are probably short.' });

  return alerts;
}

function needsBackupAlert(key = todayKey()) {
  const tasks = getTasks(key);
  const hasAny = tasks && tasks.tasks && tasks.tasks.some(t => t && t.trim());
  if (hasAny) return false;
  const today = todayKey();
  const now  = key === today ? tyNow() : keyToDate(key);
  const mins = key === today ? now.getHours() * 60 + now.getMinutes() : 24 * 60;
  const cutoff = isGymDay(now) ? (15*60+30) : (12*60+30);
  return mins >= cutoff;
}

function pickBackupTasks(n) {
  return [...BACKUP_TASKS].sort(() => Math.random()-0.5).slice(0,n);
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  WEEKLY ANALYTICS                            â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function calcStats(days) {
  let gym=0, posted=0, filmed=0, edited=0, engaged=0, planned=0, recovery=0;
  let sleepSum=0, sleepN=0, proteinSum=0, proteinN=0, energySum=0, energyN=0;
  let reading=0, active=0, taskTot=0, taskDone=0;

  for (const { daily, tasks } of days) {
    if (!daily || Object.keys(daily).length === 0) continue;
    if (daily.gym)      gym++;
    if (daily.posted)   posted++;
    if (daily.filmed)   filmed++;
    if (daily.edited)   edited++;
    if (daily.engaged)  engaged++;
    if (daily.planned)  planned++;
    if (daily.recovery) recovery++;

    const sl = parseFloat(daily.sleep);
    if (sl > 0) { sleepSum += sl; sleepN++; }
    const pr = parseInt(daily.protein);
    if (pr > 0) { proteinSum += pr; proteinN++; }
    const en = parseInt(daily.energy);
    if (en > 0) { energySum += en; energyN++; }

    reading += parseInt(daily.reading) || 0;

    const isActive = !!(daily.posted || daily.filmed || daily.edited || daily.engaged || daily.planned || daily.recovery);
    if (isActive) active++;

    if (tasks && tasks.tasks) {
      tasks.tasks.forEach((t, i) => {
        if (t && t.trim()) {
          taskTot++;
          if (tasks.completed && tasks.completed[i]) taskDone++;
        }
      });
    }
  }

  return {
    gym, posted, filmed, edited, engaged, planned, recovery,
    sleepAvg:   sleepN   ? +(sleepSum/sleepN).toFixed(1)     : null,
    proteinAvg: proteinN ? Math.round(proteinSum/proteinN)    : null,
    energyAvg:  energyN  ? +(energySum/energyN).toFixed(1)   : null,
    reading, active,
    taskTot, taskDone,
    taskRate: taskTot ? Math.round(taskDone/taskTot*100) : null
  };
}

function hasLoggedData(day) {
  const daily = day.daily || {};
  const hasDaily = Object.values(daily).some(v => {
    if (v === true) return true;
    if (typeof v === 'number') return v > 0;
    if (typeof v === 'string') return v.trim() !== '';
    return false;
  });
  const tasks = day.tasks;
  const hasTasks = !!(tasks && (
    (tasks.tasks || []).some(t => t && t.trim()) ||
    (tasks.completed || []).some(Boolean)
  ));
  return hasDaily || hasTasks;
}

function calcScore(s) {
  let sc = 0;
  sc += Math.min(25, (s.gym/4)*25);
  sc += Math.min(25, (s.posted/3)*25);
  if (s.taskRate !== null) sc += (s.taskRate/100)*20;
  const sl = parseFloat(s.sleepAvg);
  if (!isNaN(sl)) { if(sl>=7) sc+=10; else if(sl>=6) sc+=7; else if(sl>=5) sc+=4; }
  const pr = parseInt(s.proteinAvg);
  if (!isNaN(pr)) { if(pr>=200) sc+=10; else if(pr>=150) sc+=7; else if(pr>=100) sc+=4; }
  sc += (s.active/7)*10;
  return Math.round(sc);
}

function scoreGrade(sc) {
  if (sc>=90) return 'A';
  if (sc>=80) return 'B';
  if (sc>=70) return 'C';
  if (sc>=60) return 'D';
  return 'F';
}

function buildReport(s, score) {
  const grade = scoreGrade(score);
  const wellDone = [], improve = [];

  if (s.gym >= 4)      wellDone.push(`Hit all 4 gym sessions. Physical execution is locked in.`);
  else if (s.gym >= 3) wellDone.push(`Made it to the gym ${s.gym}x. Showed up.`);

  if (s.posted >= 3)            wellDone.push(`${s.posted} posts published. Content pipeline is moving.`);
  if (s.taskRate >= 80)         wellDone.push(`${s.taskRate}% task completion. That's high-level execution.`);
  if (parseFloat(s.sleepAvg) >= 7)   wellDone.push(`Sleep averaged ${s.sleepAvg}h. Recovery is in a good place.`);
  if (parseInt(s.proteinAvg) >= 185) wellDone.push(`Protein averaged ${s.proteinAvg}g. Nutrition is dialed.`);
  if (s.active >= 6)            wellDone.push(`${s.active}/7 active BTH days. No-zero discipline is strong.`);
  if (s.recovery >= 5)          wellDone.push(`Recovery protocol done ${s.recovery} days. Protecting your body long-term.`);

  if (s.gym < 3)                         improve.push(`Only ${s.gym} gym sessions. Target is 4. Don't miss Monday.`);
  if (s.posted < 2)                      improve.push(`${s.posted} posts published. Content pipeline problem, not motivation. Fix the filming first.`);
  if (s.filmed === 0)                    improve.push(`Zero clips filmed. You can't edit or post what doesn't exist. Batch film day is non-negotiable.`);
  if (s.taskRate !== null && s.taskRate < 60) improve.push(`${s.taskRate}% task completion. Tasks are too big or energy is too low. Use backup tasks on rough days.`);
  if (parseFloat(s.sleepAvg) < 6)       improve.push(`Sleep averaged ${s.sleepAvg}h. That's a performance tax on everything else.`);
  if (parseInt(s.proteinAvg) < 150)     improve.push(`Protein at ${s.proteinAvg}g avg. Under 150g is hurting your energy and recovery. This is the first fix.`);
  if (s.active < 5)                     improve.push(`Only ${s.active} active BTH days. Even one backup task counts. Protect the chain.`);

  // Key recommendation — biggest lever
  const sl = parseFloat(s.sleepAvg), pr = parseInt(s.proteinAvg), en = parseFloat(s.energyAvg);
  let keyRec;
  if (pr < 150 && en < 5) {
    keyRec = `Your energy averages ${en}/10 because your protein averages ${pr}g. Fix protein first — hit 200g every single day — and your energy will climb. Everything else follows from that.`;
  } else if (sl < 6 && en < 5) {
    keyRec = `Low sleep (${sl}h avg) is killing your energy (${en}/10). Protect your sleep window. One extra hour changes your whole output.`;
  } else if (s.filmed === 0 && s.posted === 0) {
    keyRec = `Your content pipeline is completely empty. Zero filming = zero posts. Block one 45-minute filming session this week. That single action unlocks the entire content chain.`;
  } else if (s.filmed > 0 && s.posted === 0) {
    keyRec = `You filmed ${s.filmed} clips but published 0 posts. Bottleneck is editing. Block one edit session and get those clips out.`;
  } else if (s.posted < 2 && s.gym >= 3) {
    keyRec = `You're showing up to the gym but not to your content. Apply the same discipline you have in the weight room to your posting schedule.`;
  } else if (s.gym < 3 && s.posted >= 2) {
    keyRec = `Content is moving but gym dropped to ${s.gym}x. Don't let one area slip while another improves. Monday session sets the tone.`;
  } else if (s.taskRate !== null && s.taskRate < 60) {
    keyRec = `Task completion at ${s.taskRate}% means your tasks are too ambitious for your energy. Use backup tasks on low-energy days. Done beats perfect.`;
  } else if (s.recovery < 4) {
    keyRec = `Recovery protocol done only ${s.recovery} times. The daily hip reset takes 10 minutes and is the insurance policy on your entire training career. Do it every day.`;
  } else {
    keyRec = `Solid week. The next edge: set tomorrow's tasks every night before bed. That one habit raises your execution rate across every category.`;
  }

  return { grade, score, wellDone, improve, keyRec };
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  STREAKS                                     â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function calcBTHStreak() {
  let streak = 0;
  const today = tyNow();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const daily = getDaily(dateKey(d));
    if (!daily || Object.keys(daily).length === 0) { if (i===0) continue; break; }
    const active = !!(daily.posted||daily.filmed||daily.edited||daily.engaged||daily.planned||daily.recovery);
    if (active) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function calcGymStreak() {
  let streak = 0;
  const today = tyNow();
  for (let i = 0; i < 200; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (!isGymDay(d)) continue;
    const daily = getDaily(dateKey(d));
    if (!daily || Object.keys(daily).length === 0) { if (i===0) continue; break; }
    if (daily.gym) streak++;
    else break;
  }
  return streak;
}

function calcReadingStreak() {
  let streak = 0;
  const today = tyNow();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const daily = getDaily(dateKey(d));
    if (!daily || Object.keys(daily).length === 0) { if (i===0) continue; break; }
    if (parseInt(daily.reading) > 0) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function updateStreakBest(key, current) {
  const stored = parseInt(localStorage.getItem('bth_best_' + key) || '0');
  const best = Math.max(stored, current);
  localStorage.setItem('bth_best_' + key, best);
  return best;
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER: TODAY                               â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderToday() {
  if (!activeLogKey) activeLogKey = todayKey();
  const key   = activeLogKey;
  const now   = keyToDate(key);
  const daily = getDaily(key);
  const tasks = getTasks(key);

  // Subtitle
  const gymBadge = isGymDay(now) ? 'GYM DAY' : 'OFF GYM';
  document.getElementById('today-sub').textContent =
    `${fmtDate(now).toUpperCase()} · ${gymBadge}`;

  renderMicroSummary(daily);
  renderDateModeControls();

  // Mode banner
  const mode = getMode(daily);
  const mc   = modeConfig(mode);
  const banner = document.getElementById('mode-banner');
  banner.className = `mode-banner ${mc.cls}`;
  document.getElementById('mode-icon').textContent  = mc.icon;
  document.getElementById('mode-label').textContent = mc.label;

  // Alerts
  const alerts = buildAlerts(daily);
  if (needsBackupAlert(key)) {
    alerts.unshift({ t:'gold', m:'No tasks set for today. Auto-backup tasks shown below. Set tomorrow\'s tasks tonight.' });
  }
  document.getElementById('alerts-wrap').innerHTML = alerts
    .map(a => `<div class="alert alert-${a.t}">${a.m}</div>`)
    .join('');

  // Tasks
  renderTasks(key, tasks, mode);

  // Inputs
  document.getElementById('inp-sleep').value   = daily.sleep   ?? '';
  document.getElementById('inp-protein').value = daily.protein ?? '';
  document.getElementById('inp-water').value   = daily.water   ?? '';
  document.getElementById('inp-shakes').value  = daily.shakes  ?? '';
  document.getElementById('inp-reading').value = daily.reading ?? '';
  document.getElementById('inp-gym').checked     = !!daily.gym;
  document.getElementById('inp-working').checked = !!daily.working;
  renderProteinBar(daily.protein);

  // Energy scale
  renderEnergyScale(parseInt(daily.energy) || 0);

  // BTH checklist
  renderBTH(daily);
}

function renderTasks(key, tasks, mode) {
  const el = document.getElementById('tasks-list');
  let arr  = (tasks && tasks.tasks) ? tasks.tasks : [];
  let done = (tasks && tasks.completed) ? tasks.completed : [false,false,false];

  // Show backup tasks if past deadline and nothing set
  if (needsBackupAlert(key) && !arr.some(t => t && t.trim())) {
    const backup = pickBackupTasks(3);
    currentBackupTasks = backup;
    el.innerHTML = backup.map((t, i) => `
      <div class="task-item">
        <div class="task-num">${i+1}</div>
        <div class="task-check" onclick="checkBackup(${i})"></div>
        <div class="task-text">${esc(t)} <span style="color:var(--muted);font-size:10px">(backup)</span></div>
      </div>
    `).join('');
    return;
  }
  currentBackupTasks = [];

  if (!arr.some(t => t && t.trim())) {
    el.innerHTML = `<div class="task-empty">No tasks set yet.<br>Set tomorrow's tasks tonight before bed — that's the rule.</div>`;
    return;
  }

  el.innerHTML = arr.map((t, i) => {
    if (!t || !t.trim()) return '';
    return `
      <div class="task-item">
        <div class="task-num">${i+1}</div>
        <div class="task-check ${done[i]?'done':''}" onclick="toggleTask('${key}',${i})"></div>
        <div class="task-text ${done[i]?'done':''}">${esc(t)}</div>
      </div>
    `;
  }).join('');
}

function renderEnergyScale(val) {
  const el  = document.getElementById('energy-scale');
  const lbl = document.getElementById('energy-val-label');
  el.innerHTML = Array.from({length:10}, (_,i) => {
    const n = i+1;
    let cls = '';
    if (n <= val) {
      if (n <= 3)      cls = 'sel-low';
      else if (n <= 6) cls = 'sel-mid';
      else             cls = 'sel-high';
    }
    return `<div class="energy-pip ${cls}" onclick="setEnergy(${n})">${n}</div>`;
  }).join('');
  lbl.textContent = val ? `${val}/10` : '';
}

function renderBTH(daily) {
  document.getElementById('btch-grid').innerHTML = BTH_ITEMS.map(item => `
    <div class="btch-item ${daily[item.key]?'done':''}" onclick="toggleBTH('${item.key}')">
      <div class="btch-dot"></div>
      <div class="btch-label">${item.icon} ${item.label}</div>
    </div>
  `).join('');
  const allDone = BTH_ITEMS.every(item => !!daily[item.key]);
  document.getElementById('btch-all-done')?.classList.toggle('show', allDone);
}

function renderProteinBar(value) {
  const bar = document.getElementById('protein-bar');
  if (!bar) return;
  const protein = parseInt(value) || 0;
  const pct = Math.min(100, (protein / 200) * 100);
  bar.style.width = `${pct}%`;
  bar.classList.toggle('hit', protein >= 200);
}

function renderMicroSummary(daily = getDaily(activeLogKey)) {
  const el = document.getElementById('today-micro');
  if (!el) return;
  const sleep = parseFloat(daily.sleep) || 0;
  const protein = parseInt(daily.protein) || 0;
  const bthDone = BTH_ITEMS.filter(item => !!daily[item.key]).length;
  const hasData = sleep > 0 || protein > 0 || bthDone > 0 ||
    parseInt(daily.water) > 0 || parseInt(daily.shakes) > 0 ||
    parseInt(daily.reading) > 0 || parseInt(daily.energy) > 0 ||
    daily.gym || daily.working;
  el.textContent = hasData
    ? `\u26a1 ${sleep ? sleep + 'h' : '0h'} \u00b7 ${protein}g protein \u00b7 ${bthDone}/6 BTH`
    : 'No data logged yet \u2014 tap to start';
}

function renderDateModeControls() {
  const banner = document.getElementById('date-mode-banner');
  const label = document.getElementById('date-mode-label');
  const toggle = document.getElementById('log-date-toggle');
  const isPast = activeLogKey !== todayKey();
  banner?.classList.toggle('show', isPast);
  if (label) label.textContent = isPast ? `LOGGING ${fmtDate(keyToDate(activeLogKey)).toUpperCase()}` : '';
  if (toggle) toggle.textContent = isPast ? 'BACK TO TODAY' : 'LOG YESTERDAY';
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER: SCHEDULE                            â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderSchedule() {
  const now     = tyNow();
  const daily   = getDaily(todayKey());
  const working = !!daily.working;
  const gym     = isGymDay(now);
  const type    = getDayType(now);
  const bthMin  = bthMinutes(type);
  const bthLbl  = bthMin >= 60 ? `${Math.floor(bthMin/60)}h${bthMin%60?` ${bthMin%60}m`:''}` : `${bthMin}m`;

  document.getElementById('schedule-sub').textContent = dayTypeLabel(type).toUpperCase();

  let blocks = [];

  if (type === 'GYM_WORK') {
    blocks = [
      { time:'2:00 PM',  name:'WAKE UP',      detail:'Hydrate, eat, get moving', hi:false },
      { time:'2:30 PM',  name:'GYM',           detail:'Training session — non-negotiable', hi:false },
      { time:'~4:00 PM', name:'POST-GYM',      detail:'Recovery food, protein shake #1', hi:false },
      { time:'5:00 PM',  name:'BTH BLOCK',     detail:`${bthLbl} — execute one task from your list`, hi:true },
      { time:'5:50 PM',  name:'TASK PREP',     detail:"Write tomorrow's 3 tasks", hi:false },
      { time:'6:00 PM',  name:'SHIFT START',   detail:'Mannington Mills · 12-hour night', hi:false },
      { time:'6:00 AM',  name:'FRESH START',   detail:'Log the day. Sleep.', hi:false },
    ];
  } else if (type === 'GYM_OFF') {
    blocks = [
      { time:'2:00 PM',  name:'WAKE UP',       detail:'Hydrate, eat, get moving', hi:false },
      { time:'2:30 PM',  name:'GYM',           detail:'Training session — non-negotiable', hi:false },
      { time:'~4:00 PM', name:'POST-GYM',      detail:'Recovery food, protein shake', hi:false },
      { time:'5:00 PM',  name:'BTH BLOCK 1',   detail:'60 min — create or publish', hi:true },
      { time:'6:30 PM',  name:'BREAK',         detail:'Eat, walk, decompress', hi:false },
      { time:'8:00 PM',  name:'BTH BLOCK 2',   detail:'60 min — planning or engagement', hi:true },
      { time:'10:00 PM', name:'TASK PREP',     detail:"Write tomorrow's 3 tasks before bed", hi:false },
    ];
  } else if (type === 'OFF_WORK') {
    blocks = [
      { time:'11:00 AM', name:'WAKE UP',       detail:'Hydrate, stretch, eat', hi:false },
      { time:'11:30 AM', name:'BTH BLOCK 1',   detail:'45 min — content creation focus', hi:true },
      { time:'12:30 PM', name:'MIDDAY BREAK',  detail:'Eat, rest, recovery work', hi:false },
      { time:'2:30 PM',  name:'BTH BLOCK 2',   detail:'45 min — engagement or planning', hi:true },
      { time:'4:00 PM',  name:'SHIFT PREP',    detail:'Meal prep, get ready for work', hi:false },
      { time:'5:50 PM',  name:'TASK PREP',     detail:"Write tomorrow's 3 tasks", hi:false },
      { time:'6:00 PM',  name:'SHIFT START',   detail:'Mannington Mills · 12-hour night', hi:false },
      { time:'6:00 AM',  name:'FRESH START',   detail:'Log the day. Sleep.', hi:false },
    ];
  } else {
    blocks = [
      { time:'11:00 AM', name:'WAKE UP',       detail:'Recover, eat, hydrate', hi:false },
      { time:'12:00 PM', name:'BTH BLOCK 1',   detail:'60 min — biggest BTH task', hi:true },
      { time:'1:30 PM',  name:'BREAK',         detail:'Walk, eat, decompress', hi:false },
      { time:'3:00 PM',  name:'BTH BLOCK 2',   detail:'60 min — filming or editing', hi:true },
      { time:'5:00 PM',  name:'PHYSICAL RESET', detail:'SI joint protocol + walk', hi:false },
      { time:'8:00 PM',  name:'EVENING',       detail:'Read, meal prep, plan', hi:false },
      { time:'10:00 PM', name:'TASK PREP',     detail:"Write tomorrow's 3 tasks before bed", hi:false },
      { time:'3:00 AM',  name:'BED',           detail:'Full recovery sleep', hi:false },
    ];
  }

  const gymBadge = gym
    ? `<span class="badge badge-gold">GYM DAY</span>`
    : `<span class="badge badge-gray">OFF GYM</span>`;
  const workBadge = working
    ? `<span class="badge badge-red" style="margin-left:6px">WORK TONIGHT</span>`
    : `<span class="badge badge-green" style="margin-left:6px">OFF TONIGHT</span>`;

  document.getElementById('schedule-content').innerHTML = `
    <div style="margin-bottom:14px">${gymBadge}${workBadge}</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:14px">
      Toggle "Working Tonight" on the Today tab to switch the schedule view.
    </div>

    <div class="card">
      <div class="card-title">TODAY'S SCHEDULE</div>
      ${blocks.map(b => `
        <div class="time-block ${b.hi?'highlight':''}">
          <div class="time-label">${b.time}</div>
          <div class="time-content">
            <div class="time-name">${b.name}</div>
            <div class="time-detail">${b.detail}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="card-title">DAILY RECOVERY PROTOCOL</div>
      <div style="font-size:13px;line-height:1.9;color:var(--white)">
        Takes 10 minutes — do it every day.<br>
        · Supine reset<br>
        · 90/90 hip decompression<br>
        · Dead bug<br>
        · Lying hip CARs
      </div>
      <div style="margin-top:12px;font-size:11px;color:var(--muted)">
        Priority: decompression, NOT aggressive stretching.<br>
        Anterior hip pinch + SI joint history — protect it daily.
      </div>
    </div>

    <div class="card">
      <div class="card-title">BTH TIME TODAY</div>
      <div style="font-size:32px;font-family:'Space Mono',monospace;font-weight:700;color:var(--gold)">${bthLbl}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">${dayTypeLabel(type)}</div>
    </div>
  `;
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER: PIPELINE                            â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderPipeline() {
  const days  = getWeekDays(tyNow());
  const stats = calcStats(days);
  const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  let alertHtml = '';
  if (stats.filmed === 0) {
    alertHtml = `<div class="alert alert-red">Pipeline is empty. Zero clips filmed = zero posts. Film today. Nothing else matters until this is done.</div>`;
  } else if (stats.posted === 0 && stats.edited === 0) {
    alertHtml = `<div class="alert alert-gold">You filmed ${stats.filmed} clip(s) but haven't edited yet. Block an edit session today.</div>`;
  } else if (stats.posted === 0 && stats.edited > 0) {
    alertHtml = `<div class="alert alert-gold">Clips are edited. Time to post. Pick the best one and get it up today.</div>`;
  } else if (stats.posted < 3) {
    const n = 3 - stats.posted;
    alertHtml = `<div class="alert alert-gold">Need ${n} more post${n>1?'s':''} to hit 3/3 this week.</div>`;
  } else {
    alertHtml = `<div class="alert alert-green">3/3 posts published this week. Pipeline target hit. ✓</div>`;
  }

  const dotRow = days.map(({ daily, date }, i) => {
    const p = daily && daily.posted;
    const f = daily && daily.filmed;
    const e = daily && daily.edited;
    const isTday = dateKey(date) === todayKey();
    return `
      <div style="text-align:center;flex:1">
        <div style="font-size:9px;color:${isTday?'var(--gold)':'var(--muted)'};font-family:'Space Mono',monospace;margin-bottom:4px">${DAYS[i]}</div>
        <div style="width:9px;height:9px;border-radius:50%;margin:2px auto;background:${p?'var(--green)':'var(--gray)'}"></div>
        <div style="width:9px;height:9px;border-radius:50%;margin:2px auto;background:${f?'var(--gold)':'var(--gray)'}"></div>
        <div style="width:9px;height:9px;border-radius:50%;margin:2px auto;background:${e?'var(--blue)':'var(--gray)'}"></div>
      </div>
    `;
  }).join('');

  function bar(count, target, color) {
    const pct = Math.min(100, Math.round(count/target*100));
    return `<div class="pipeline-bar"><div class="pipeline-fill" style="width:${pct}%;background:${color}"></div></div>`;
  }

  document.getElementById('pipeline-content').innerHTML = `
    ${alertHtml}

    <div class="card">
      <div class="card-title">THIS WEEK</div>
      <div class="pipeline-row">
        <div class="pipeline-top">
          <div class="pipeline-name">📹 FILMED</div>
          <div class="pipeline-num">${stats.filmed}/3</div>
        </div>
        ${bar(stats.filmed, 3, 'var(--gold)')}
      </div>
      <div class="pipeline-row">
        <div class="pipeline-top">
          <div class="pipeline-name">✂️ EDITED</div>
          <div class="pipeline-num">${stats.edited}/3</div>
        </div>
        ${bar(stats.edited, 3, 'var(--blue)')}
      </div>
      <div class="pipeline-row">
        <div class="pipeline-top">
          <div class="pipeline-name">📤 POSTED</div>
          <div class="pipeline-num">${stats.posted}/3</div>
        </div>
        ${bar(stats.posted, 3, 'var(--green)')}
      </div>
    </div>

    <div class="card">
      <div class="card-title">DAILY BREAKDOWN</div>
      <div style="display:flex;gap:4px">${dotRow}</div>
      <div style="display:flex;gap:16px;justify-content:center;margin-top:10px;font-size:10px;color:var(--muted)">
        <span>🟢 Posted</span><span>🟡 Filmed</span><span>🔵 Edited</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">CONTENT STRATEGY</div>
      <div style="font-size:12px;line-height:2;color:var(--white)">
        <b style="color:var(--gold)">Batch film:</b> All 3 clips in one session<br>
        <b style="color:var(--gold)">Edit session:</b> Next available block<br>
        <b style="color:var(--gold)">Post schedule:</b> One per day · 3 days<br>
        <div class="divider"></div>
        <b style="color:var(--gold)">Authority content angles:</b><br>
        · Hip injury rebuild journey<br>
        · Vertical jump training<br>
        · Hooper performance tips<br>
        · Night shift + athlete life
      </div>
    </div>
  `;
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER: WEEK                                â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderWeek() {
  const days  = getWeekDays(tyNow());
  const s     = calcStats(days);
  const score = calcScore(s);
  const { grade, wellDone, improve, keyRec } = buildReport(s, score);

  const mon = days[0].date, sun = days[6].date;
  document.getElementById('week-sub').textContent =
    `${fmtDate(mon).slice(0,-5)} – ${fmtDate(sun)}`.toUpperCase();

  const loggedDays = days.filter(hasLoggedData).length;
  if (loggedDays < 2) {
    document.getElementById('week-content').innerHTML = `
      <div class="card">
        <div class="week-empty">
          <div class="week-empty-title">No data yet this week.</div>
          <div>Log at least 2 days to see your grade.</div>
        </div>
      </div>
    `;
    return;
  }

  function rn(label, val, target, unit, flip) {
    const v = parseFloat(val), t = parseFloat(target);
    const hasVal = val !== null && !isNaN(v);
    const good   = hasVal && (flip ? v<=t : v>=t);
    const bad    = hasVal && (flip ? v>t  : v<t);
    const cls    = !hasVal ? '' : good ? 'good' : bad ? 'bad' : '';
    const disp   = hasVal ? `${val}${unit}` : '—';
    return `
      <div class="report-row">
        <div class="rn-label">${label}</div>
        <div class="rn-val ${cls}">${disp} <span style="color:var(--muted);font-size:10px">/ ${target}${unit}</span></div>
      </div>
    `;
  }

  document.getElementById('week-content').innerHTML = `
    <div class="card">
      <div class="grade-display">
        <div class="grade-letter grade-${grade}">${grade}</div>
        <div class="grade-score">${score} / 100</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">BY THE NUMBERS</div>
      ${rn('Gym Sessions',      s.gym,        4,   'x')}
      ${rn('Posts Published',   s.posted,     3,   'x')}
      ${rn('Clips Filmed',      s.filmed,     3,   'x')}
      ${rn('Clips Edited',      s.edited,     3,   'x')}
      ${rn('Sleep Average',     s.sleepAvg,   7,   'h')}
      ${rn('Protein Average',   s.proteinAvg, 200, 'g')}
      ${rn('Energy Average',    s.energyAvg,  7,   '/10')}
      ${rn('Active BTH Days',   s.active,     7,   '/7')}
      ${rn('Task Completion',   s.taskRate,   80,  '%')}
      ${rn('Recovery Sessions', s.recovery,   7,   'x')}
      ${rn('Reading',           s.reading,    60,  ' min')}
    </div>

    ${wellDone.length ? `
    <div class="card">
      <div class="card-title">WHAT YOU DID WELL</div>
      <div class="report-text">${wellDone.map(w=>`· ${w}`).join('<br><br>')}</div>
    </div>` : ''}

    ${improve.length ? `
    <div class="card">
      <div class="card-title">AREAS TO FIX</div>
      <div class="report-text">${improve.map(w=>`· ${w}`).join('<br><br>')}</div>
    </div>` : ''}

    <div class="card" style="border-color:var(--gold)">
      <div class="card-title">KEY RECOMMENDATION</div>
      <div class="report-text" style="color:var(--gold)">${keyRec}</div>
    </div>
  `;
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER: STREAKS                             â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderStreaks() {
  const bth   = calcBTHStreak();
  const gym   = calcGymStreak();
  const read  = calcReadingStreak();

  const bthBest  = updateStreakBest('bth',  bth);
  const gymBest  = updateStreakBest('gym',  gym);
  const readBest = updateStreakBest('read', read);

  function streakColor(n) {
    if (n >= 14) return 'var(--green)';
    if (n >= 7)  return 'var(--gold)';
    if (n >= 3)  return 'var(--white)';
    return 'var(--muted)';
  }

  function streakCard(n, title, sub, best, icon) {
    return `
      <div class="card">
        <div class="streak-row">
          <div class="streak-num" style="color:${streakColor(n)}">${n}</div>
          <div class="streak-info">
            <div class="streak-title">${icon} ${title}</div>
            <div class="streak-sub">${sub}</div>
            <div class="streak-best">Personal best: ${best} days</div>
          </div>
        </div>
      </div>
    `;
  }

  const wdays = getWeekDays(tyNow());
  const ws    = calcStats(wdays);

  document.getElementById('streaks-content').innerHTML = `
    ${streakCard(bth,  'BTH NO-ZERO STREAK', 'Consecutive days with BTH activity', bthBest,  '🏀')}
    ${streakCard(gym,  'GYM STREAK',          'Consecutive gym sessions hit',       gymBest,  '💪')}
    ${streakCard(read, 'READING STREAK',       'Consecutive reading days',           readBest, '📚')}

    <div class="card">
      <div class="card-title">THIS WEEK AT A GLANCE</div>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-val ${ws.gym>=4?'good':ws.gym>=2?'':'warn'}">${ws.gym}</div>
          <div class="stat-label">GYM / 4</div>
        </div>
        <div class="stat-box">
          <div class="stat-val ${ws.posted>=3?'good':''}">${ws.posted}</div>
          <div class="stat-label">POSTS / 3</div>
        </div>
        <div class="stat-box">
          <div class="stat-val ${ws.active>=7?'good':ws.active>=5?'':''}">${ws.active}</div>
          <div class="stat-label">ACTIVE / 7</div>
        </div>
        <div class="stat-box">
          <div class="stat-val ${ws.recovery>=5?'good':''}">${ws.recovery}</div>
          <div class="stat-label">RECOVERY / 7</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">NO-ZERO RULE</div>
      <div style="font-size:13px;line-height:1.7;color:var(--white)">
        A zero day = you did <em style="color:var(--gold)">nothing</em> for BTH.<br><br>
        Even one backup task keeps the chain alive. Breaking a streak doesn't end anything — it just resets the counter. Start again tomorrow.
      </div>
    </div>
  `;
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  INTERACTION HANDLERS                        â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function switchTab(name, btn) {
  flushSaveLog();
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
  ({ today: renderToday, schedule: renderSchedule, pipeline: renderPipeline,
     week: renderWeek, streaks: renderStreaks })[name]?.();
}

function toggleSection(id) {
  const body  = document.getElementById('body-' + id);
  const arrow = document.getElementById('arr-' + id);
  const isOpen = body.dataset.open !== 'false';
  const nextOpen = !isOpen;
  body.dataset.open = nextOpen ? 'true' : 'false';
  arrow.textContent = nextOpen ? '\u25bc' : '\u25b6';
}

function setEnergy(val) {
  const key   = activeLogKey;
  const daily = getDaily(key);
  daily.energy = val;
  setDaily(key, daily);
  renderEnergyScale(val);
  refreshModeBanner(daily);
  refreshAlerts(daily);
  renderMicroSummary(daily);
}

function toggleTask(key, i) {
  const tasks = getTasks(key) || { tasks:['','',''], completed:[false,false,false] };
  if (!tasks.completed) tasks.completed = [false,false,false];
  tasks.completed[i] = !tasks.completed[i];
  setTasks(key, tasks);
  renderTasks(key, tasks, getMode(getDaily(key)));
}

function checkBackup(i) {
  const key = activeLogKey;
  const backup = currentBackupTasks.length ? currentBackupTasks : pickBackupTasks(3);
  const completed = [false, false, false];
  completed[i] = true;
  const tasks = {
    tasks: backup,
    completed,
    setAt: new Date().toISOString()
  };
  setTasks(key, tasks);
  renderTasks(key, tasks, getMode(getDaily(key)));
  refreshAlerts(getDaily(key));
  toast('Backup tasks saved for this day.');
}

function toggleBTH(field) {
  const key   = activeLogKey;
  const daily = getDaily(key);
  daily[field] = !daily[field];
  setDaily(key, daily);
  renderBTH(daily);
  renderMicroSummary(daily);
}

function readLogValues() {
  return {
    sleep:   document.getElementById('inp-sleep').value,
    protein: document.getElementById('inp-protein').value,
    water:   document.getElementById('inp-water').value,
    shakes:  document.getElementById('inp-shakes').value,
    reading: document.getElementById('inp-reading').value,
    gym:     document.getElementById('inp-gym').checked,
    working: document.getElementById('inp-working').checked
  };
}

function mergeLogValues(key, values) {
  const daily = getDaily(key);
  Object.assign(daily, values);
  setDaily(key, daily);
  return daily;
}

function saveLog() {
  const key = activeLogKey;
  const values = readLogValues();
  const preview = { ...getDaily(key), ...values };
  renderProteinBar(values.protein);
  renderMicroSummary(preview);
  refreshModeBanner(preview);
  refreshAlerts(preview);

  pendingSave = { key, values };
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const saved = mergeLogValues(pendingSave.key, pendingSave.values);
    if (pendingSave.key === activeLogKey) {
      refreshModeBanner(saved);
      refreshAlerts(saved);
      renderMicroSummary(saved);
    }
    pendingSave = null;
  }, 600);
}

function flushSaveLog() {
  if (!pendingSave) return;
  clearTimeout(saveTimer);
  mergeLogValues(pendingSave.key, pendingSave.values);
  pendingSave = null;
}

function refreshModeBanner(daily) {
  const mode = getMode(daily);
  const mc   = modeConfig(mode);
  const b    = document.getElementById('mode-banner');
  if (!b) return;
  b.className = `mode-banner ${mc.cls}`;
  document.getElementById('mode-icon').textContent  = mc.icon;
  document.getElementById('mode-label').textContent = mc.label;
}

function refreshAlerts(daily) {
  const w = document.getElementById('alerts-wrap');
  if (!w) return;
  const alerts = buildAlerts(daily);
  if (needsBackupAlert(activeLogKey)) alerts.unshift({ t:'gold', m:"No tasks set. Backup tasks shown." });
  w.innerHTML = alerts.map(a => `<div class="alert alert-${a.t}">${a.m}</div>`).join('');
}

function setActiveLogKey(key) {
  flushSaveLog();
  activeLogKey = key;
  renderToday();
}

function toggleLogDateMode() {
  setActiveLogKey(activeLogKey === todayKey() ? yesterdayKey() : todayKey());
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  MODAL: TOMORROW TASKS                       â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function openTaskModal() {
  const tKey     = tomorrowKey();
  const tomorrow = keyToDate(tKey);
  const existing = getTasks(tKey);

  document.getElementById('modal-date-label').textContent =
    'FOR ' + fmtDate(tomorrow).toUpperCase();
  document.getElementById('t-inp-1').value = existing?.tasks?.[0] ?? '';
  document.getElementById('t-inp-2').value = existing?.tasks?.[1] ?? '';
  document.getElementById('t-inp-3').value = existing?.tasks?.[2] ?? '';

  document.getElementById('modal-tasks').classList.add('open');
  document.getElementById('t-inp-1').focus();
}

function closeTaskModal(e) {
  if (e.target === document.getElementById('modal-tasks')) closeTaskModalDirect();
}

function closeTaskModalDirect() {
  document.getElementById('modal-tasks').classList.remove('open');
}

function saveTaskModal() {
  const t1 = document.getElementById('t-inp-1').value.trim();
  const t2 = document.getElementById('t-inp-2').value.trim();
  const t3 = document.getElementById('t-inp-3').value.trim();
  if (!t1 && !t2 && !t3) { toast('Add at least one task.'); return; }
  setTasks(tomorrowKey(), {
    tasks: [t1, t2, t3],
    completed: [false, false, false],
    setAt: new Date().toISOString()
  });
  closeTaskModalDirect();
  toast('Tasks locked in for tomorrow.');
}

function fillBackupTasks() {
  const backup = pickBackupTasks(3);
  document.getElementById('t-inp-1').value = backup[0] || '';
  document.getElementById('t-inp-2').value = backup[1] || '';
  document.getElementById('t-inp-3').value = backup[2] || '';
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  TOAST                                       â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  UTILS                                       â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function syncCollapsibles() {
  document.querySelectorAll('.collapsible-body').forEach(body => {
    if (!body.dataset.open) body.dataset.open = 'true';
    const id = body.id.replace('body-', '');
    const arrow = document.getElementById('arr-' + id);
    if (arrow) arrow.textContent = body.dataset.open === 'true' ? '\u25bc' : '\u25b6';
  });
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  INIT                                        â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
syncCollapsibles();
renderToday();

