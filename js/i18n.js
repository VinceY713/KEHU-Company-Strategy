/* ============================================================
   PlayCARD v2 · 国际化（中 / EN）
   - 界面文案全部走 t(key)
   - 数据内容双语字段 {zh, en}，lang() 取当前语言，回退中文
   ============================================================ */
'use strict';
(function (global) {
  var DICT = {
    zh: {
      /* 顶栏 */
      brand: 'PlayCARD 客湖战略赌注台',
      addBet: '+ 录入赌注',
      /* 三年方向 */
      northstarLabel: '三年方向',
      northstarHint: '这一层不设指标。所有数字只存在于 90 天内。',
      editNorthstar: '改',
      /* 统计条 */
      statBets: '在册赌注', unitBet: '个',
      statFails: '体检未通过', unitFail: '个',
      statFocus: '本季验证焦点', unitFocus: '条前提',
      statLegacy: '未归属战略的投入', unitLegacy: '上季人天',
      statOverdue: '逾期的对外动作', unitOverdue: '个',
      /* 赌注区 */
      betTitle: '赌注',
      betSubtitle: '不是目标。目标只说要做到什么，赌注还要说凭什么、什么算错、为此放弃什么。',
      irr: '不可逆', rev: '可逆',
      edit: '编辑',
      missing: '缺 ',
      checkSacrifice: '放弃', checkKill: '可观测停损', checkProbe: '30天动作', checkLeading: '先行指标',
      leading: '先行', lagging: '滞后',
      threshold: '阈值',
      clockProbe: '30 天动作', clockKill: '停损日',
      daysLeft: '剩 {n} 天', daysOverdue: '逾期 {n} 天', notSet: '未设',
      expand: '展开',
      /* 矩阵 */
      mbtTitle: '必须为真',
      low: '低', high: '高',
      uncertainty: '不确定性', lethality: '致命性',
      hotZone: '本季度唯一该验证的',
      scUncertainty: '不确定 {u}', scLethality: '致命 {l}',
      focusLabel: '本季度验证焦点',
      focusSuffix: '。其余前提本季不讨论，先当它成立。',
      focusNone: '没有条件落在右上象限。要么这个赌注已经足够确定，要么打分打得太保守，重打一次。',
      /* 资源投向 */
      allocTitle: '资源投向',
      allocLede: '上季度实际人天占比，对照嘴上说的配比。深色竖线是声称值。',
      editAlloc: '编辑配比',
      actual: '实际', stated: '声称',
      legacyName: '未归属战略的存量交付',
      verdict1: '看日历和看工资单，是检验战略是否存在的唯一硬指标。',
      verdict2: '如果连续两个季度实际投向不动，战略就是假的。',
      /* foot */
      foot: '点击赌注卡切换必须为真矩阵，点“展开”看完整赌注与空头意见。桌面端可录入与编辑赌注，保存受体检硬拦截；移动端只读。数据仅存本机浏览器。',
      resetSeed: '重置为种子数据',
      resetConfirm: '重置为种子数据？当前本地录入的赌注与配比会被覆盖。',
      /* 抽屉 */
      irrDecision: '不可逆决策', revDecision: '可逆决策',
      drawerFails: '体检未通过 {n} 项',
      fBasis: '凭什么', fKill: '什么会证明我们错', fSacrifice: '为此放弃什么', fProbe: '30 天真实动作',
      fMbt: '必须为真', fShort: '空头意见', fCrit: '判据', fReview: '复盘',
      killDeadline: '停损日', probeDeadline: '截止',
      overdueDays: '（已逾期 {n} 天）',
      current: '当前', valueFrom: '取值来源',
      vKeep: '维持', vPivot: '转向', vKill: '终止',
      noReview: '还没有被正式复盘过。',
      noShort: '本季未指定空头。没有对手的赌注不该进复盘。',
      close: '关闭',
      /* 体检错误文案（指引 v2 原文） */
      eSacrifice: '没写放弃什么。这是愿望，不是战略。',
      eKill: '停损条件无法观测。半年后没人能判定它是否触发。',
      eProbeEmpty: '没有 30 天内的对外动作。这个判断还没想清楚。',
      eProbeOverdue: '30 天动作已逾期。',
      eProbeFar: '30 天动作必须在 30 天内截止。',
      eLagging: '判据是滞后指标。等它出结果时纠错已经来不及。',
      eBasisOpinion: '只有“{t}”。这不是已发生的事实。',
      eKillEmpty: '未填。立赌注时不写死停损，半年后就没人愿意承认它错了。',
      eSacrificeEmpty: '未填。写不出放弃什么，说明资源根本没动。',
      eProbeEmpty2: '未填。不能在 30 天内变成一次对外动作的判断，多半还没想清楚。',
      /* 编辑器 */
      edTitleNew: '录入赌注', edTitleEdit: '编辑 {id}',
      edRejected: '保存被拒绝 · 体检未通过',
      fsIdentity: '身份', fsFive: '赌注五要素', fsCrit: '判据（必须是先行指标）', fsMbt: '必须为真', fsShort: '空头意见',
      fId: '编号', fEngine: '引擎', fOwner: '负责人', fIrreversible: '不可逆决策（只有不可逆的值得开战略会）',
      engData: '数据成功', engTech: '技术成功', engClient: '客户成功',
      fClaim: '我们赌什么', fClaimHint: '一句可判真假的陈述',
      fBasis2: '凭什么', fBasisHint: '每行一条已发生的事实，不接受“我认为”',
      fKillT: '什么会证明我们错', fKillHint: '可观测、有阈值、有日期', fKillD: '停损日',
      fSacrifice2: '为此放弃什么', fSacrificeHint: '具体到客户类型、岗位、收入区间。写不出放弃什么，说明资源根本没动',
      fProbeA: '30 天真实动作', fProbeHint: '一次对外的真实交易或接触，不是内部论证', fProbeD: '截止日', fProbeDHint: '必须设在 30 天内',
      fCritM: '指标', fCritKind: '类型', optLeading: '先行（行为 / 早期信号）', optLagging: '滞后（结果）',
      fCritU: '单位', fCritNow: '当前值', fCritThr: '阈值', fCritDir: '方向', optUp: '越高越好', optDown: '越低越好', fCritSrc: '取值来源',
      fMbtHint: '3–5 条，各打不确定性与致命性 1–5 分',
      mbK: '前提编号', mbT: '前提内容', mbTPh: '前提陈述（可判真假）', mbU: '不确定 1-5', mbL: '致命 1-5', mbDel: '删除该前提', mbAdd: '+ 添加前提',
      fShortBy: '空头', fShortQ: '季度', fShortQPh: '如 2026 Q3', fShortArg: '为什么这个赌注会失败', fSigT: '证伪信号登记',
      sigD: '信号日期', sigText: '证伪信号内容', sigBy: '登记人', sigDel: '删除该信号', sigAdd: '+ 登记信号',
      save: '保存（受体检硬拦截）', cancel: '取消', saveNote: '放弃、停损、30 天动作、先行指标不满足将无法保存',
      aiTranslate: 'AI 一键翻译', aiTranslating: 'AI 翻译中…', aiDone: '已生成{dst}版，保存后生效，切换语言可查看', aiFail: '翻译失败：{msg}',
      edClaimEmpty: '我们赌什么不能为空。判断不了真假的不是赌注。',
      edBasisEmpty: '凭什么至少一条已发生的事实。不接受“我认为”。',
      edMbtCount: '必须为真需要 3–5 条前提，当前 {n} 条。',
      edIdDup: '编号为空或与现有赌注重复。',
      /* 配比编辑器 */
      allocEditTitle: '编辑资源投向 · {q}',
      fQuarter: '季度标识', fsAlloc: '配比（%）', fStated: '声称配比 %', fActual: '实际人天 %', fSource: '取数说明',
      allocGapNote: '差值 ≥10 个百分点会自动标红',
      allocSumErr: '实际人天占比合计 {n}%，应约为 100%。',
      /* 方向编辑器 */
      nsTitle: '三年方向陈述', fNs: '三年方向', fNsHint: '一句方向陈述，不带任何数字，不参与任何计算',
      nsDigitErr: '三年方向不允许出现任何数字。所有量化判据只存在于 90 天这一层。',
      nsEmptyErr: '方向陈述不能为空。',
      /* 语言切换 */
      switchLang: 'EN'
    },

    en: {
      brand: 'PlayCARD · KEHU Strategy Bet Board',
      addBet: '+ New Bet',
      northstarLabel: '3-YEAR DIRECTION',
      northstarHint: 'No metrics here. All numbers live only within 90 days.',
      editNorthstar: 'Edit',
      statBets: 'Active bets', unitBet: '',
      statFails: 'Failed checks', unitFail: '',
      statFocus: 'Quarterly focus', unitFocus: 'premises',
      statLegacy: 'Unallocated effort', unitLegacy: 'last-qtr ppl-days',
      statOverdue: 'Overdue probes', unitOverdue: '',
      betTitle: 'BETS',
      betSubtitle: 'Not goals. A goal says what we want; a bet says why we hold it, what would prove us wrong, and what we give up.',
      irr: 'IRREV.', rev: 'REV.',
      edit: 'Edit',
      missing: 'no ',
      checkSacrifice: 'Sacrifice', checkKill: 'Kill cond.', checkProbe: '30-day probe', checkLeading: 'Leading',
      leading: 'LEADING', lagging: 'LAGGING',
      threshold: 'threshold',
      clockProbe: '30-DAY PROBE', clockKill: 'KILL DATE',
      daysLeft: '{n} days left', daysOverdue: '{n} days overdue', notSet: 'Not set',
      expand: 'Detail',
      mbtTitle: 'MUST-BE-TRUE',
      low: 'Low', high: 'High',
      uncertainty: 'Uncertainty', lethality: 'Lethality',
      hotZone: 'THE ONLY THING TO VERIFY THIS QUARTER',
      scUncertainty: 'U {u}', scLethality: 'L {l}',
      focusLabel: 'QUARTERLY VERIFICATION FOCUS',
      focusSuffix: '. All other premises are assumed true this quarter.',
      focusNone: 'No premise lands in the top-right quadrant. Either this bet is already certain enough, or the scores are too conservative — re-score it.',
      allocTitle: 'RESOURCE ALLOCATION',
      allocLede: 'Actual person-days last quarter vs. what we claimed. Dark tick = stated.',
      editAlloc: 'Edit',
      actual: 'Actual', stated: 'Stated',
      legacyName: 'Legacy work (unallocated)',
      verdict1: 'The calendar and the payroll are the only hard evidence that strategy exists.',
      verdict2: 'If actual allocation does not move for two consecutive quarters, the strategy is fake.',
      foot: 'Click a bet card to switch the must-be-true matrix; “Detail” opens the full bet with the short case. Desktop: create & edit bets with hard-gated saves; mobile is read-only. Data stays in your browser.',
      resetSeed: 'Reset to seed data',
      resetConfirm: 'Reset to seed data? This overwrites locally entered bets and allocation.',
      irrDecision: 'IRREVERSIBLE DECISION', revDecision: 'REVERSIBLE DECISION',
      drawerFails: '{n} health check(s) failed',
      fBasis: 'BASIS', fKill: 'WHAT WOULD PROVE US WRONG', fSacrifice: 'WHAT WE GIVE UP', fProbe: '30-DAY REAL ACTION',
      fMbt: 'MUST-BE-TRUE', fShort: 'SHORT CASE', fCrit: 'METRIC', fReview: 'REVIEWS',
      killDeadline: 'by', probeDeadline: 'due',
      overdueDays: ' ({n}d overdue)',
      current: 'now', valueFrom: 'source',
      vKeep: 'Keep', vPivot: 'Pivot', vKill: 'Kill',
      noReview: 'Not formally reviewed yet.',
      noShort: 'No short named this quarter. A bet with no opponent should not enter review.',
      close: 'Close',
      eSacrifice: 'No sacrifice stated. This is a wish, not a strategy.',
      eKill: 'Kill condition is not observable. In six months nobody will be able to tell whether it fired.',
      eProbeEmpty: 'No external action within 30 days. This bet is not thought through yet.',
      eProbeOverdue: 'The 30-day action is overdue.',
      eProbeFar: 'The 30-day action must be due within 30 days.',
      eLagging: 'The metric is lagging. By the time it moves, it is too late to correct.',
      eBasisOpinion: 'Only “{t}”. That is an opinion, not an established fact.',
      eKillEmpty: 'Not set. A bet without a hard kill condition nobody will admit it failed later.',
      eSacrificeEmpty: 'Not set. If you cannot state what you give up, no resources have actually moved.',
      eProbeEmpty2: 'Not set. A judgment that cannot become an external action within 30 days is probably not thought through.',
      edTitleNew: 'New Bet', edTitleEdit: 'Edit {id}',
      edRejected: 'SAVE REJECTED · HEALTH CHECK FAILED',
      fsIdentity: 'IDENTITY', fsFive: 'THE BET — FIVE ELEMENTS', fsCrit: 'METRIC (MUST BE LEADING)', fsMbt: 'MUST-BE-TRUE PREMISES', fsShort: 'SHORT CASE',
      fId: 'ID', fEngine: 'Engine', fOwner: 'Owner', fIrreversible: 'Irreversible decision (only irreversible ones deserve a strategy meeting)',
      engData: 'Data', engTech: 'Tech', engClient: 'Client Success',
      fClaim: 'The claim', fClaimHint: 'a statement that can be proven true or false',
      fBasis2: 'Basis', fBasisHint: 'one established fact per line — “I believe” is not accepted',
      fKillT: 'What would prove us wrong', fKillHint: 'observable, with a threshold and a date', fKillD: 'Kill date',
      fSacrifice2: 'What we give up', fSacrificeHint: 'be specific: customer segment, role, revenue band. If you cannot state it, nothing has moved',
      fProbeA: '30-day real action', fProbeHint: 'a real external transaction or contact, not internal debate', fProbeD: 'Due date', fProbeDHint: 'must be within 30 days',
      fCritM: 'Metric', fCritKind: 'Type', optLeading: 'Leading (behavior / early signal)', optLagging: 'Lagging (outcome)',
      fCritU: 'Unit', fCritNow: 'Current', fCritThr: 'Threshold', fCritDir: 'Direction', optUp: 'higher is better', optDown: 'lower is better', fCritSrc: 'Source',
      fMbtHint: '3–5 premises, each scored uncertainty & lethality 1–5',
      mbK: 'Key', mbT: 'Premise', mbTPh: 'premise statement (provable)', mbU: 'U 1-5', mbL: 'L 1-5', mbDel: 'Delete premise', mbAdd: '+ Add premise',
      fShortBy: 'Short', fShortQ: 'Quarter', fShortQPh: 'e.g. 2026 Q3', fShortArg: 'Why this bet will fail', fSigT: 'Falsification signals',
      sigD: 'Date', sigText: 'Signal', sigBy: 'By', sigDel: 'Delete signal', sigAdd: '+ Add signal',
      save: 'Save (hard-gated)', cancel: 'Cancel', saveNote: 'Sacrifice, kill condition, 30-day probe and leading metric are mandatory',
      aiTranslate: 'AI Translate', aiTranslating: 'Translating…', aiDone: '{dst} version generated — save to apply, then switch language to view', aiFail: 'Translation failed: {msg}',
      edClaimEmpty: 'The claim cannot be empty. A bet must be provable true or false.',
      edBasisEmpty: 'Basis needs at least one established fact. “I believe” is not accepted.',
      edMbtCount: 'Must-be-true needs 3–5 premises, currently {n}.',
      edIdDup: 'ID is empty or duplicates an existing bet.',
      allocEditTitle: 'Edit allocation · {q}',
      fQuarter: 'Quarter label', fsAlloc: 'ALLOCATION (%)', fStated: 'Stated %', fActual: 'Actual person-days %', fSource: 'Data source note',
      allocGapNote: 'A gap ≥10 pts is flagged red',
      allocSumErr: 'Actual person-days sum to {n}%, should be ≈100%.',
      nsTitle: '3-Year Direction Statement', fNs: 'Direction', fNsHint: 'one direction sentence, no numbers, not part of any computation',
      nsDigitErr: 'No digits allowed in the 3-year direction. All quantified criteria live only within the 90-day layer.',
      nsEmptyErr: 'The direction statement cannot be empty.',
      switchLang: '中文'
    }
  };

  var lang = 'zh';
  try { lang = localStorage.getItem('playcard.v2.lang') || 'zh'; } catch (e) {}
  if (DICT[lang] === undefined) lang = 'zh';

  function t(key, vars) {
    var s;
    if (DICT[lang] && DICT[lang][key] !== undefined) s = DICT[lang][key];
    else s = (DICT.zh[key] !== undefined) ? DICT.zh[key] : key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(vars[k]);
      });
    }
    return s;
  }
  function setLang(l) { lang = (l === 'en') ? 'en' : 'zh'; try { localStorage.setItem('playcard.v2.lang', lang); } catch (e) {} }
  function getLang() { return lang; }
  function isEn() { return lang === 'en'; }
  /* 双语数据字段：取当前语言，回退 zh */
  function norm(v) {
    if (v == null) return { zh: '', en: '' };
    if (typeof v === 'string') return { zh: v, en: '' };
    if (typeof v === 'object' && !Array.isArray(v)) return { zh: v.zh || '', en: v.en || '' };
    return v;
  }
  function L(v) {
    v = norm(v);
    return (v[lang] && v[lang].trim()) || v.zh || '';
  }
  function LOther(v) { /* 当前语言的另一语言 */
    v = norm(v);
    return lang === 'zh' ? (v.en || '') : (v.zh || '');
  }
  /* 递归迁移整棵数据对象为双语结构 */
  function migrate(obj, keys) {
    if (!obj || typeof obj !== 'object') return obj;
    keys.forEach(function (k) {
      if (k === '*basis' || k === '*sigs' || k === '*mbt') {
        if (Array.isArray(obj[k])) obj[k] = obj[k].map(function (item) { return migrate(item, keys); });
      } else if (obj[k] !== undefined) {
        if (Array.isArray(obj[k])) { obj[k] = obj[k].map(function (x) { return norm(x); }); }
        else { obj[k] = norm(obj[k]); }
      }
    });
    return obj;
  }

  global.PlayI18N = { t: t, setLang: setLang, getLang: getLang, isEn: isEn, norm: norm, L: L, LOther: LOther, migrate: migrate };
})(window);
