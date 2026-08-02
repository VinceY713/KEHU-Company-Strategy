/* ============================================================
   PlayCARD v2 · 数据层
   - 种子数据（文案由战略 owner 逐条确认，这里仅是格式示范）
   - 引擎映射、日期工具
   - 体检规则：四项硬拦截（sacrifice / kill / probe / leading）
   ============================================================ */
'use strict';
(function (global) {

  /* 基准日取真实当天，让倒计时与逾期状态始终是活的 */
  var TODAY = (function () { var t = new Date(); t.setHours(0, 0, 0, 0); return t; })();
  var days = function (d) { return Math.round((new Date(d + 'T00:00:00') - TODAY) / 864e5); };

  var ENG = { data: '数据成功', tech: '技术成功', client: '客户成功' };
  var ENG_ORDER = ['data', 'tech', 'client'];

  /* ---------------- 种子赌注 ---------------- */
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
  var ALLOC_NAME = { data: '数据成功', tech: '技术成功', client: '客户成功', legacy: '未归属战略的存量交付' };

  var SEED_NORTHSTAR = '把渠道数据变成客湖的独家资产，让公司靠决策与结果收费，而不是靠许可与人天。';

  /* ---------------- 体检（四项硬拦截，文案见指引第 3 节） ---------------- */
  function audit(b) {
    var pd = b.probe && b.probe.d ? days(b.probe.d) : null;
    var probeOk = !!(b.probe && b.probe.a && b.probe.a.trim()) && pd !== null && pd >= 0 && pd <= 30;
    var probeWhy = (!b.probe || !b.probe.a || !b.probe.a.trim())
      ? '没有 30 天内的对外动作。这个判断还没想清楚。'
      : (pd < 0 ? '30 天动作已逾期。' : '30 天动作必须在 30 天内截止。');
    return [
      { k: '放弃', ok: !!(b.sacrifice && b.sacrifice.trim()), why: '没写放弃什么。这是愿望，不是战略。' },
      { k: '可观测停损', ok: !!(b.kill && b.kill.t && b.kill.t.trim() && b.kill.d), why: '停损条件无法观测。半年后没人能判定它是否触发。' },
      { k: '30天动作', ok: probeOk, why: probeWhy },
      { k: '先行指标', ok: !!(b.crit && b.crit.kind === 'leading'), why: '判据是滞后指标。等它出结果时纠错已经来不及。' }
    ];
  }
  var failCount = function (b) { return audit(b).filter(function (c) { return !c.ok; }).length; };
  var hot = function (b) { return (b.mbt || []).filter(function (m) { return m.u >= 4 && m.l >= 4; }); };

  /* HTML 转义：用户录入内容一律转义后再插入 innerHTML */
  var escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return escMap[c]; }); };

  global.PlayCARD = {
    TODAY: TODAY, days: days,
    ENG: ENG, ENG_ORDER: ENG_ORDER,
    SEED_BETS: SEED_BETS, SEED_ALLOC: SEED_ALLOC, SEED_NORTHSTAR: SEED_NORTHSTAR,
    ALLOC_NAME: ALLOC_NAME,
    audit: audit, failCount: failCount, hot: hot,
    esc: esc
  };
})(window);
