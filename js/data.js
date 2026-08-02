/* ============================================================
   PlayCARD v2 · 数据层
   - 种子数据（文案由战略 owner 逐条确认，这里仅是格式示范）
   - 引擎映射、日期工具
   - 体检规则：四项硬拦截（sacrifice / kill / probe / leading）
   - 双语迁移：把字符串字段归一为 {zh, en}
   ============================================================ */
'use strict';
(function (global) {

  var I18N = global.PlayI18N;
  var t = I18N.t, norm = I18N.norm;

  var TODAY = (function () { var t2 = new Date(); t2.setHours(0, 0, 0, 0); return t2; })();
  var days = function (d) { return Math.round((new Date(d + 'T00:00:00') - TODAY) / 864e5); };

  var ENG = { data: 'data', tech: 'tech', client: 'client' };
  var ENG_KEY = { data: 'engData', tech: 'engTech', client: 'engClient' };
  var ENG_ORDER = ['data', 'tech', 'client'];

  /* ---------------- 种子赌注（纯中文文本，加载时迁移为双语） ---------------- */
  var SEED_BETS = [
    {
      id: 'B-01', engine: 'data', irreversible: true, owner: 'Vince',
      claim: '渠道终端数据可以脱离软件单独定价销售',
      basis: [
        '两家品牌口头表达采购意向，条件是数据可独立于软件采购（2026-07）',
        '行业主线转向去库存与动销，开瓶率上升为董事会级指标'
      ],
      kill: { t: '向三家客户正式报价后，无一家进入商务谈判', d: '2026-12-31' },
      sacrifice: '不再接受把数据所有权全部让渡的合同。按去年结构估算，约两成新签机会会因此谈不成。',
      probe: { a: '做一份独立的数据订阅报价单，向三个客户正式报出去', d: '2026-08-20' },
      crit: { m: '报价后进入商务谈判的客户数', kind: 'leading', u: '家', now: 0, thr: 2, src: '销售侧登记' },
      mbt: [
        { k: 'a', t: '合同层面拿得到去标识化聚合使用权', u: 5, l: 5 },
        { k: 'b', t: '数据覆盖密度够客户当参照用', u: 3, l: 5 },
        { k: 'c', t: '客户预算里存在“数据”这个科目', u: 4, l: 3 },
        { k: 'd', t: '采集边际成本低于订阅收入', u: 2, l: 3 }
      ],
      short: { by: 'Chris', q: '2026 Q3', arg: '品牌方更可能自建采集团队，或者第三方以更低价格提供同等覆盖。数据本身很难形成独立定价权，最后还是被当成软件的赠品。', sigs: [{ d: '2026-07-18', t: '某客户市场部已在自建终端走访小组，编制 6 人', by: 'BDA 团队' }] },
      rv: [{ d: '2026-06-30', v: 'keep', by: 'Vince', t: '条款模板已定稿，卡在销售端不敢提。本季改为签约必过项。' }]
    },
    {
      id: 'B-02', engine: 'client', irreversible: true, owner: 'Vince',
      claim: '一个人借助 agent 端到端负责一个账户，交付质量不下降',
      basis: [
        '首个试点账户需求到上线平均 11 天，对照组 19 天',
        '自有约 10100 条需求配置测试三元组，可作为交付 agent 语料'
      ],
      kill: { t: '连续两个季度试点缺陷率高于对照组，或客户书面要求恢复多点对接', d: '2026-09-30' },
      sacrifice: '解散需求与实施之间的交接岗，不再按人天报价。短期实施收入下滑，且部分老同事岗位会消失。',
      probe: { a: '把一份续约合同的实施部分改为固定包干价，看客户是否签', d: '2026-07-25' },
      crit: { m: '改为固定包干价并已签署的合同数', kind: 'leading', u: '份', now: 0, thr: 1, src: '销售侧登记' },
      mbt: [
        { k: 'a', t: '定价能与效率同步迁移', u: 5, l: 5 },
        { k: 'b', t: '客户接受单点联系人', u: 4, l: 4 },
        { k: 'c', t: '交付质量不依赖交叉复核', u: 3, l: 5 },
        { k: 'd', t: '核心人才不流失', u: 3, l: 4 }
      ],
      short: { by: 'Thomas', q: '2026 Q3', arg: '效率提升一定先于新定价到来。那段时间里我们按人天收费却只用一半人天，等于自己砍自己收入。而且单人承载账户，把交付质量绑在了个人状态上，一次离职就是客户级损失。', sigs: [
        { d: '2026-07-09', t: '客户商务可接受结果费，但要求上限封顶，实际收益空间被压扁', by: 'Vince' },
        { d: '2026-06-20', t: '试点客户要求保留第二联系人', by: '实施团队' }
      ] },
      rv: [
        { d: '2026-06-30', v: 'keep', by: 'Vince', t: '质量目前守得住。人才集中风险靠平台规则引擎兜底，不再加岗。' },
        { d: '2026-03-31', v: 'pivot', by: 'Vince', t: '原本赌的是速度，改为赌质量不下降。速度本来就不是客户的痛点。' }
      ]
    },
    {
      id: 'B-03', engine: 'tech', irreversible: false, owner: 'Chris',
      claim: '配置能力开放给 agent 后，客户可用自然语言改流程且不出事故',
      basis: [
        '无代码交付已占变更需求的 18%，其中 Business Rule 与 Layout 占多数'
      ],
      kill: { t: '五个真实变更的 agent 配置版本，UAT 缺陷率高出人工版本 50% 以上', d: '2026-10-31' },
      sacrifice: '停止为单客户写定制代码。短期内会丢掉部分强定制需求的客户，也会得罪几个习惯了随叫随到的甲方。',
      probe: { a: '选五个真实变更需求，全部只用 agent 配置完成，与人工版本做缺陷对比', d: '2026-08-28' },
      crit: { m: 'agent 配置版本相对人工的缺陷率倍数', kind: 'leading', u: '倍', now: 0, thr: 1.5, src: 'UAT 记录，越低越好' },
      mbt: [
        { k: 'a', t: 'agent 配置缺陷率不高于人工', u: 5, l: 4 },
        { k: 'b', t: '权限与数据隔离在配置层不被绕过', u: 3, l: 5 },
        { k: 'c', t: '语料标注速度跟得上', u: 3, l: 3 },
        { k: 'd', t: '客户愿意自己动手改流程', u: 4, l: 2 }
      ],
      short: { by: 'Vince', q: '2026 Q3', arg: '客户其实不想自己改流程，他们买的正是不用管。开放配置只是把维护责任推给客户，同时把事故面扩大。', sigs: [] },
      rv: [{ d: '2026-06-30', v: 'pivot', by: 'Chris', t: '原计划先扩 Hook，改为先补 Object Type 与权限模型，覆盖面更大。' }]
    },
    {
      /* B-04 是红灯样本：体检四项全挂，用于演示系统如何打回不合格赌注。真实环境该赌注无法被保存。 */
      id: 'B-04', engine: 'client', irreversible: false, owner: '待定',
      claim: '三年内数据类与结果类收入占比过半',
      basis: ['管理层共识'],
      kill: { t: '', d: '' },
      sacrifice: '',
      probe: { a: '', d: '' },
      crit: { m: '数据类与结果类收入占比', kind: 'lagging', u: '%', now: 8, thr: 50, src: '财务口径' },
      mbt: [{ k: 'a', t: '前面三个赌注全部成立', u: 4, l: 5 }],
      short: { by: '未指定', q: '2026 Q3', arg: '', sigs: [] },
      rv: []
    }
  ];

  /* ---------------- 资源投向种子（2026 Q2） ---------------- */
  var SEED_ALLOC = {
    quarter: '2026 Q2',
    source: 'Redmine 三份导出（Core、SaaS Apps、Platform Apps，2019 年至今约 10100 条），按 assignee 与 sprint 归属到引擎维度，归不上的进未归属。这一行是本表的重点。',
    rows: [
      { k: 'data', stated: 30, actual: 12 },
      { k: 'tech', stated: 35, actual: 31 },
      { k: 'client', stated: 35, actual: 14 },
      { k: 'legacy', stated: 0, actual: 43 }
    ]
  };
  var ALLOC_NAME = { data: 'engData', tech: 'engTech', client: 'engClient', legacy: 'legacyName' };

  var SEED_NORTHSTAR = '把渠道数据变成客湖的独家资产，让公司靠决策与结果收费，而不是靠许可与人天。';

  /* ---------------- 体检（四项硬拦截，文案见指引第 3 节，双语） ---------------- */
  var anyL = function (v) { v = norm(v); return !!(v.zh || v.en); };
  function audit(b) {
    var pd = b.probe && b.probe.d ? days(b.probe.d) : null;
    var hasProbeText = !!(b.probe && b.probe.a && anyL(b.probe.a));
    var probeOk = hasProbeText && pd !== null && pd >= 0 && pd <= 30;
    var probeWhy = !hasProbeText ? t('eProbeEmpty') : (pd < 0 ? t('eProbeOverdue') : t('eProbeFar'));
    return [
      { k: t('checkSacrifice'), ok: !!(b.sacrifice && anyL(b.sacrifice)), why: t('eSacrifice') },
      { k: t('checkKill'), ok: !!(b.kill && b.kill.t && anyL(b.kill.t) && b.kill.d), why: t('eKill') },
      { k: t('checkProbe'), ok: probeOk, why: probeWhy },
      { k: t('checkLeading'), ok: !!(b.crit && b.crit.kind === 'leading'), why: t('eLagging') }
    ];
  }
  var failCount = function (b) { return audit(b).filter(function (c) { return !c.ok; }).length; };
  var hot = function (b) { return (b.mbt || []).filter(function (m) { return m.u >= 4 && m.l >= 4; }); };

  /* HTML 转义：用户录入内容一律转义后再插入 innerHTML */
  var escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return escMap[c]; }); };

  /* ---------------- 双语迁移：字符串字段 → {zh, en} ---------------- */
  function migrateBet(b) {
    b.claim = norm(b.claim);
    b.sacrifice = norm(b.sacrifice);
    b.owner = norm(b.owner);
    b.basis = (b.basis || []).map(norm);
    b.kill.t = norm(b.kill.t);
    b.probe.a = norm(b.probe.a);
    b.crit.m = norm(b.crit.m); b.crit.u = norm(b.crit.u); b.crit.src = norm(b.crit.src);
    b.mbt = (b.mbt || []).map(function (m) { m.t = norm(m.t); return m; });
    b.short.by = norm(b.short.by); b.short.q = norm(b.short.q); b.short.arg = norm(b.short.arg);
    b.short.sigs = (b.short.sigs || []).map(function (s) { s.t = norm(s.t); s.by = norm(s.by); return s; });
    b.rv = (b.rv || []).map(function (r) { r.by = norm(r.by); r.t = norm(r.t); return r; });
    return b;
  }
  function migrateAlloc(a) { a.quarter = norm(a.quarter); a.source = norm(a.source); return a; }

  /* ---------------- 种子合并：中文种子 + 英文版 → 双语结构 ---------------- */
  function mergeSeedBets() {
    var en = global.PlayCARD_SEED_EN || { bets: [] };
    var enMap = {};
    (en.bets || []).forEach(function (e) { enMap[e.id] = e; });
    return SEED_BETS.map(function (b) {
      var e = enMap[b.id] || {};
      var pair = function (src, enKey) { return { zh: src, en: e[enKey] || '' }; };
      var ownerEn = b.owner === '待定' ? 'TBD' : b.owner;
      return {
        id: b.id, engine: b.engine, irreversible: b.irreversible,
        owner: { zh: b.owner, en: ownerEn },
        claim: pair(b.claim, 'claim'),
        basis: b.basis.map(function (x, i) { return { zh: x, en: (e.basis || [])[i] || '' }; }),
        kill: { t: pair(b.kill.t, 'kill_t'), d: b.kill.d },
        sacrifice: pair(b.sacrifice, 'sacrifice'),
        probe: { a: pair(b.probe.a, 'probe_a'), d: b.probe.d },
        crit: {
          m: pair(b.crit.m, 'crit_m'), kind: b.crit.kind, u: pair(b.crit.u, 'crit_u'),
          now: b.crit.now, thr: b.crit.thr, direction: b.crit.direction, src: pair(b.crit.src, 'crit_src')
        },
        mbt: b.mbt.map(function (m, i) { return { k: m.k, t: { zh: m.t, en: ((e.mbt || [])[i] || {}).t || '' }, u: m.u, l: m.l }; }),
        short: {
          by: pair(b.short.by, 'short_by'), q: pair(b.short.q, 'short_q'), arg: pair(b.short.arg, 'short_arg'),
          sigs: (b.short.sigs || []).map(function (s, i) {
            var se = (e.sigs || [])[i] || {};
            return { d: s.d, t: { zh: s.t, en: se.t || '' }, by: { zh: s.by, en: se.by || '' } };
          })
        },
        rv: (b.rv || []).map(function (r, i) {
          var re = (e.rv || [])[i] || {};
          return { d: r.d, v: r.v, by: { zh: r.by, en: re.by || '' }, t: { zh: r.t, en: re.t || '' } };
        }),
        createdAt: ''
      };
    });
  }
  function mergeSeedAlloc() {
    var en = global.PlayCARD_SEED_EN || {};
    var a = JSON.parse(JSON.stringify(SEED_ALLOC));
    a.quarter = { zh: a.quarter, en: a.quarter };
    a.source = { zh: a.source, en: en.alloc_source || '' };
    return a;
  }
  function mergeSeedNorthstar() {
    var en = global.PlayCARD_SEED_EN || {};
    return { zh: SEED_NORTHSTAR, en: en.northstar || '' };
  }

  global.PlayCARD = {
    TODAY: TODAY, days: days,
    ENG: ENG, ENG_KEY: ENG_KEY, ENG_ORDER: ENG_ORDER,
    SEED_BETS: SEED_BETS, SEED_ALLOC: SEED_ALLOC, SEED_NORTHSTAR: SEED_NORTHSTAR,
    ALLOC_NAME: ALLOC_NAME,
    audit: audit, failCount: failCount, hot: hot,
    esc: esc,
    migrateBet: migrateBet, migrateAlloc: migrateAlloc,
    mergeSeedBets: mergeSeedBets, mergeSeedAlloc: mergeSeedAlloc, mergeSeedNorthstar: mergeSeedNorthstar
  };
})(window);
