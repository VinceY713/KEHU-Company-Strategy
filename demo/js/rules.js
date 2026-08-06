/* 崃州项目 · 交付工作台 Demo
   规则引擎：把《项目明细表》第 5 章治理机制与第 7 章 SLA 条款变成可执行判定。
   每条规则都标注了明细表出处，规则本身不写数据，只产出标记。 */

(function (global) {
  'use strict';

  var MS = 86400000;

  function D(s) {
    if (!s) return null;
    var p = String(s).split('-');
    if (p.length !== 3) return null;
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function iso(d) {
    if (!d) return '';
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function days(a, b) { // b - a，日历日
    if (!a || !b) return null;
    return Math.round((b - a) / MS);
  }
  function cn(s) { // 2026-09-10 -> 9/10
    if (!s) return '—';
    var p = s.split('-');
    return (+p[1]) + '/' + (+p[2]);
  }
  /** 工作日差（粗算，仅扣周末，不含节假日） */
  function workdays(a, b) {
    if (!a || !b) return null;
    var n = 0, dir = b >= a ? 1 : -1, cur = new Date(a.getTime());
    while (dir > 0 ? cur < b : cur > b) {
      cur.setDate(cur.getDate() + dir);
      var w = cur.getDay();
      if (w !== 0 && w !== 6) n += dir;
    }
    return n;
  }

  var OPEN = ['未开始', '进行中', '待客户确认', '阻塞'];
  function isOpen(it) { return OPEN.indexOf(it.status) >= 0; }

  /** 需求确认书出具日 —— 4.4 要求待澄清问题须在此前逐条闭环 */
  var CONFIRM_DUE = { '一期': '2026-09-07', '二期': '2026-09-30' };

  /**
   * 对单条事项求值，返回全部标记。
   * flags[].rule 是规则代号，flags[].src 是明细表出处。
   */
  function evaluate(it, todayStr) {
    var today = D(todayStr);
    var f = [];
    var end = D(it.end);
    var upd = D(it.updated);

    var overdue = isOpen(it) && end ? days(end, today) : null;
    if (overdue !== null && overdue > 0) {
      f.push({ rule: 'R4', src: '4.4 / 8.1', level: 'crit',
        label: '逾期 ' + overdue + ' 天', sort: 100 + overdue });
    } else if (overdue !== null && overdue > -7 && overdue <= 0) {
      f.push({ rule: 'R4', src: '4.4 / 8.1', level: 'warn',
        label: (-overdue === 0 ? '今天到期' : (-overdue) + ' 天后到期'), sort: 60 });
    }

    // R1 升级 L2 —— 5.3.1 工作组连续 2 次周会未闭环的议题自动升 L2
    if (isOpen(it) && it.staleWeeks >= 2) {
      f.push({ rule: 'R1', src: '5.3.1', level: 'crit',
        label: '连续 ' + it.staleWeeks + ' 次未闭环 · 升 L2', sort: 200 });
    }

    // R9 更新新鲜度 —— 5.1.1 会上逐条过并更新进度
    if (isOpen(it) && it.status !== '未开始') {
      var stale = upd ? days(upd, today) : null;
      if (stale !== null && stale >= 7) {
        f.push({ rule: 'R9', src: '5.1.1', level: 'warn',
          label: stale + ' 天未更新', sort: 50 + stale });
      }
    }

    // R7 待客户确认等待时长 —— 6.3 待客户 IT 确认项
    if (it.status === '待客户确认' && upd) {
      var w = days(upd, today);
      f.push({ rule: 'R7', src: '6.3 / 7.6.3', level: w >= 10 ? 'crit' : 'warn',
        label: '已等 ' + w + ' 天', sort: 40 + w });
    }

    // 阻塞链 —— 依赖另一条事项
    if (it.status === '阻塞' && it.blockedBy) {
      f.push({ rule: 'R-blk', src: '5.1.1', level: 'crit',
        label: '阻塞于 ' + it.blockedBy, sort: 150 });
    }

    // R3 CR 拦截 —— 5.3.3 涉及范围、工期、费用的一律走 CR
    if (touchesCR(it)) {
      f.push({ rule: 'R3', src: '5.3.3', level: 'info',
        label: '涉范围/工期/费用 · 闭环须走 CR', sort: 30 });
    }

    // R4 待澄清倒排 —— 绑定需求确认书出具日
    if (it.type === '待澄清' && isOpen(it)) {
      var due = CONFIRM_DUE[it.phase];
      if (due) {
        var wd = workdays(today, D(due));
        f.push({ rule: 'R4', src: '4.4', level: wd <= 0 ? 'crit' : (wd <= 5 ? 'warn' : 'mute'),
          label: wd <= 0 ? '已过确认书出具日' : '距确认书 ' + wd + ' 个工作日', sort: 70 });
      }
    }

    f.sort(function (a, b) { return b.sort - a.sort; });
    return f;
  }

  /** 5.3.3：涉及范围、工期、费用的变化一律走 CR，不在会上口头拍板 */
  function touchesCR(it) {
    if (it.type === '变更') return true;
    if (it.type === '里程碑') return true;
    var t = (it.title || '') + (it.detail || '');
    return /费用|计费|报价|工期|延期|范围|移入|移出/.test(t);
  }

  /** 议程分桶 —— 会前自动生成，对应 5.1.1 固定四块议题 */
  function buildAgenda(items, todayStr) {
    var today = D(todayStr);
    var weekEnd = new Date(today.getTime() + 7 * MS);
    var seen = {};
    var buckets = [
      { key: 'escalate', title: '升级候选', why: '连续 2 次周会未闭环，按 5.3.1 应升 L2', test: function (it, f) {
          return isOpen(it) && it.staleWeeks >= 2; } },
      { key: 'blocked', title: '阻塞中', why: '状态为阻塞，或被其他事项挂着', test: function (it) {
          return it.status === '阻塞'; } },
      { key: 'waiting', title: '待客户确认', why: '球在客户方，需在会上当面推', test: function (it) {
          return it.status === '待客户确认'; } },
      { key: 'overdue', title: '已逾期', why: '计划完成日已过但未闭环', test: function (it) {
          var e = D(it.end); return isOpen(it) && e && e < today; } },
      { key: 'thisweek', title: '本周到期', why: '计划完成日落在未来 7 天内', test: function (it) {
          var e = D(it.end); return isOpen(it) && e && e >= today && e <= weekEnd; } },
      { key: 'stale', title: '7 天未更新', why: '在办但没人动过，最容易烂掉的一类', test: function (it) {
          var u = D(it.updated);
          return isOpen(it) && it.status !== '未开始' && u && days(u, today) >= 7; } }
    ];

    return buckets.map(function (b) {
      var list = items.filter(function (it) {
        if (seen[it.id]) return false;
        if (!b.test(it)) return false;
        seen[it.id] = 1;
        return true;
      });
      list.sort(function (a, c) {
        var fa = evaluate(a, todayStr), fc = evaluate(c, todayStr);
        return (fc[0] ? fc[0].sort : 0) - (fa[0] ? fa[0].sort : 0);
      });
      b.items = list;
      return b;
    });
  }

  /** 顶部健康度 —— 四个可计算输入，不做主观打分 */
  function health(items, todayStr) {
    var today = D(todayStr);
    var open = items.filter(isOpen);
    var overdue = open.filter(function (it) { var e = D(it.end); return e && e < today; });
    var waiting = items.filter(function (it) { return it.status === '待客户确认'; });
    var blocked = items.filter(function (it) { return it.status === '阻塞'; });
    var esc = open.filter(function (it) { return it.staleWeeks >= 2; });
    var stale = open.filter(function (it) {
      var u = D(it.updated);
      return it.status !== '未开始' && u && days(u, today) >= 7;
    });
    var openQ = items.filter(function (it) { return it.type === '待澄清' && isOpen(it); });
    var closed = items.filter(function (it) { return it.status === '已闭环'; });

    var score = overdue.length * 3 + blocked.length * 4 + esc.length * 5 + Math.floor(stale.length / 3);
    var level = score >= 60 ? 'red' : (score >= 25 ? 'amber' : 'green');

    return {
      level: level,
      levelText: level === 'red' ? '红' : (level === 'amber' ? '黄' : '绿'),
      total: items.length, closed: closed.length,
      overdue: overdue.length, waiting: waiting.length,
      blocked: blocked.length, escalate: esc.length,
      stale: stale.length, openQuestions: openQ.length,
      score: score
    };
  }

  global.RULES = {
    D: D, iso: iso, days: days, cn: cn, workdays: workdays,
    isOpen: isOpen, touchesCR: touchesCR,
    evaluate: evaluate, buildAgenda: buildAgenda, health: health,
    CONFIRM_DUE: CONFIRM_DUE,
    STATUSES: ['未开始', '进行中', '待客户确认', '阻塞', '已闭环']
  };
})(window);
