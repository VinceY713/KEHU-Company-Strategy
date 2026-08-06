/* 崃州项目 · 交付工作台 Demo — 视图层 */

(function () {
  'use strict';

  var R = window.RULES, M = window.MINUTES;
  var LS = 'kehu.workbench.v1';

  /* ---------------- state ---------------- */

  var S = null;

  function seedState() {
    return {
      today: window.DEMO.today,
      items: JSON.parse(JSON.stringify(window.DEMO.items)),
      log: [],
      snapshots: [],
      appliedPatches: {},   // 幂等：会议ID#事项#片段 → 已采纳
      view: 'agenda',
      filters: { type: '', phase: '', status: '', q: '', group: 'topic', gtype: '里程碑' },
      minutes: { meetingId: window.DEMO.meetings[0].id, text: window.DEMO.meetings[0].text, result: null }
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(LS);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && p.items && p.items.length) return p;
      }
    } catch (e) { /* 忽略，落回种子 */ }
    return seedState();
  }
  function save() {
    try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { /* 容量或隐私模式 */ }
  }

  function index() {
    var ix = {};
    S.items.forEach(function (it) { ix[it.id] = it; });
    return ix;
  }

  /* ---------------- helpers ---------------- */

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'html') el.innerHTML = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) el.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) el.appendChild(c); });
    return el;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }

  var STATUS_CLASS = {
    '已闭环': 's-ok', '进行中': 's-acc', '待客户确认': 's-warn', '阻塞': 's-crit', '未开始': ''
  };
  var STATUS_CHIP = {
    '已闭环': 'ok', '进行中': 'acc', '待客户确认': 'warn', '阻塞': 'crit', '未开始': 'mute'
  };

  function chip(text, kind) { return h('span', { class: 'chip ' + (kind || 'mute'), text: text }); }

  function flagChips(it) {
    return R.evaluate(it, S.today).slice(0, 3).map(function (f) {
      return chip(f.label, f.level === 'crit' ? 'crit' : (f.level === 'warn' ? 'warn' : (f.level === 'info' ? 'info' : 'mute')));
    });
  }

  function logChange(it, field, from, to, by) {
    S.log.push({ at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      id: it.id, field: field, from: from, to: to, by: by || '手工' });
  }

  /* ---------------- 事项行 ---------------- */

  function itemRow(it) {
    var right = flagChips(it);
    right.unshift(chip(it.status, STATUS_CHIP[it.status]));
    var mid = [h('div', { class: 't', text: it.title })];
    if (it.progress) mid.push(h('div', { class: 'p', text: it.progress }));
    if (it.next) {
      mid.push(h('div', { class: 'n', html: '<b>下一步：</b>' + esc(it.next)
        + (it.nextOwner ? '　·　' + esc(it.nextOwner) : '')
        + (it.nextDue ? '　·　' + esc(it.nextDue) : '') }));
    }
    return h('div', {
      class: 'row ' + (STATUS_CLASS[it.status] || ''),
      tabindex: '0',
      onclick: function () { openDrawer(it.id); },
      onkeydown: function (e) { if (e.key === 'Enter') openDrawer(it.id); }
    }, [
      h('div', { class: 'id', html: esc(it.id) + '<small>' + esc(it.type) + (it.phase ? ' · ' + esc(it.phase) : '') + '</small>' }),
      h('div', { class: 'mid' }, mid),
      h('div', { class: 'right' }, right)
    ]);
  }

  /* ---------------- 顶部健康条 ---------------- */

  function renderHealth() {
    var hb = document.getElementById('healthbar');
    var st = R.health(S.items, S.today);
    var cells = [
      ['健康度', st.levelText, st.level, '逾期×3 + 阻塞×4 + 升级×5 + 陈旧/3 = ' + st.score],
      ['已闭环', st.closed + ' / ' + st.total, 'green', '全部事项'],
      ['逾期', st.overdue, st.overdue ? 'red' : 'green', '计划完成日已过'],
      ['阻塞', st.blocked, st.blocked ? 'red' : 'green', '含依赖挂起'],
      ['待客户确认', st.waiting, st.waiting ? 'amber' : 'green', '球在客户方'],
      ['应升 L2', st.escalate, st.escalate ? 'red' : 'green', '连续 2 次周会未闭环'],
      ['7 天未更新', st.stale, st.stale ? 'amber' : 'green', '在办但无人动'],
      ['待澄清未闭环', st.openQuestions, st.openQuestions ? 'amber' : 'green', '须在确认书前闭环']
    ];
    hb.innerHTML = '';
    cells.forEach(function (c) {
      hb.appendChild(h('div', { class: 'hb ' + c[2], title: c[3] }, [
        h('b', { text: String(c[1]) }),
        h('span', { text: c[0] })
      ]));
    });
    document.getElementById('clock').textContent = '演示时钟 ' + S.today;
  }

  /* ---------------- 视图 · 周会工作台 ---------------- */

  function viewAgenda(main) {
    var buckets = R.buildAgenda(S.items, S.today);
    var total = buckets.reduce(function (n, b) { return n + b.items.length; }, 0);

    main.appendChild(h('div', { class: 'viewhead' }, [
      h('h1', { text: '周会工作台' }),
      h('p', { text: '会前自动生成议程，共 ' + total + ' 条候选。60 分钟过不完 ' + S.items.length + ' 条，系统只挑必须过的。分桶规则见每组副标题。' }),
      h('div', { class: 'toolbar' }, [
        h('button', { class: 'mini', text: '复制周会纪要草稿', onclick: copyAgendaMinutes }),
        h('button', { class: 'mini', text: '复制对客周报', onclick: copyClientReport })
      ])
    ]));

    buckets.forEach(function (b) {
      var sec = h('div', { class: 'bucket' });
      sec.appendChild(h('h2', {}, [
        h('span', { text: b.title }),
        h('span', { class: 'n', text: '（' + b.items.length + '）' }),
        h('span', { class: 'why', text: b.why })
      ]));
      if (!b.items.length) {
        sec.appendChild(h('div', { class: 'empty', text: '本周没有落入这一桶的事项' }));
      } else {
        var rows = h('div', { class: 'rows' });
        b.items.slice(0, 14).forEach(function (it) { rows.appendChild(itemRow(it)); });
        sec.appendChild(rows);
        if (b.items.length > 14) {
          sec.appendChild(h('div', { class: 'empty', text: '另有 ' + (b.items.length - 14) + ' 条同类事项，见「全部事项」视图' }));
        }
      }
      main.appendChild(sec);
    });

    if (S.snapshots.length) {
      var sn = h('div', { class: 'bucket' });
      sn.appendChild(h('h2', {}, [h('span', { text: '快照存档' }),
        h('span', { class: 'why', text: '每次点「快照」存一份当时的判断依据，复盘与 CR 争议时用' })]));
      var rows2 = h('div', { class: 'rows' });
      S.snapshots.slice().reverse().slice(0, 6).forEach(function (s) {
        rows2.appendChild(h('div', { class: 'row' }, [
          h('div', { class: 'id', text: s.at }),
          h('div', { class: 'mid' }, [h('div', { class: 'p', text: s.text })]),
          h('div', { class: 'right' }, [chip('健康度 ' + s.level, s.level === '红' ? 'crit' : (s.level === '黄' ? 'warn' : 'ok'))])
        ]));
      });
      sn.appendChild(rows2);
      main.appendChild(sn);
    }
  }

  /* ---------------- 视图 · 纪要回写 ---------------- */

  function viewMinutes(main) {
    var mtg = window.DEMO.meetings.filter(function (m) { return m.id === S.minutes.meetingId; })[0]
      || window.DEMO.meetings[0];

    main.appendChild(h('div', { class: 'viewhead' }, [
      h('h1', { text: '纪要回写' }),
      h('p', { text: 'AI 不写库，只提补丁。每条建议都指向具体某条事项的某个字段，并保留纪要原文出处；人点采纳才落盘。' })
    ]));

    var sel = h('select', { onchange: function (e) {
      var m = window.DEMO.meetings.filter(function (x) { return x.id === e.target.value; })[0];
      S.minutes.meetingId = m.id; S.minutes.text = m.text; S.minutes.result = null; save(); render();
    } });
    window.DEMO.meetings.forEach(function (m) {
      sel.appendChild(h('option', { value: m.id, text: m.date + '　' + m.title, selected: m.id === mtg.id ? 'selected' : null }));
    });

    var ta = h('textarea', { id: 'mtext', spellcheck: 'false' });
    ta.value = S.minutes.text;
    ta.addEventListener('input', function () { S.minutes.text = ta.value; });

    var left = h('div', { class: 'panel' }, [
      h('div', { class: 'ph' }, [
        h('b', { text: '① 纪要原文' }), sel, h('span', { class: 'sp' }),
        h('button', { class: 'pri', text: '分析并生成补丁', onclick: function () {
          var m = { id: mtg.id, title: mtg.title, date: mtg.date };
          S.minutes.result = M.analyze(S.minutes.text, m, S.items);
          save(); render();
          toast('识别 ' + S.minutes.result.stats.matched + ' 条更新，' + S.minutes.result.stats.news + ' 条新事项候选');
        } })
      ]),
      h('div', { class: 'pb' }, [ta,
        h('div', { class: 'mnote', html: '可直接编辑这段文本再分析。管道：<b>切分抽取 → 对齐匹配 → 生成字段补丁</b>。'
          + '本 Demo 的抽取与生成用确定性规则模拟，<b>匹配是真实实现</b>（显式编号优先，其次 CJK 二元组重合度），生产版把抽取与生成换成受 JSON Schema 约束的模型输出即可。' })])
    ]);

    var right = h('div', { class: 'panel' });
    var res = S.minutes.result;
    right.appendChild(h('div', { class: 'ph' }, [
      h('b', { text: '② 补丁确认台' }),
      h('span', { text: res ? ('片段 ' + res.stats.segments + ' · 命中 ' + res.stats.matched
        + ' · 高置信 ' + res.stats.high + ' · 待判断 ' + res.stats.low + ' · 新事项 ' + res.stats.news) : '尚未分析' }),
      h('span', { class: 'sp' }),
      res ? h('button', { class: 'mini go', text: '批量采纳高置信', onclick: function () {
        var n = 0;
        res.patches.forEach(function (p) {
          if (p.state === 'pending' && p.confidence >= 0.9) { applyPatch(p, mtg, true); n++; }
        });
        save(); render(); toast(n ? ('已采纳 ' + n + ' 条') : '没有待采纳的高置信补丁');
      } }) : null,
      res ? h('button', { class: 'mini', text: '生成会议智能总结', onclick: function () {
        var txt = M.summarize(res, mtg, index());
        S.minutes.summary = txt; save(); render();
      } }) : null
    ]));

    var body = h('div', { class: 'pb' });
    if (!res) {
      body.appendChild(h('div', { class: 'empty', text: '点左侧「分析并生成补丁」开始' }));
    } else {
      if (!res.patches.length && !res.unmatched.length) {
        body.appendChild(h('div', { class: 'empty', text: '没有从这份纪要里识别出可落地的更新' }));
      }
      res.patches.forEach(function (p) { body.appendChild(patchCard(p, mtg)); });
      res.unmatched.forEach(function (u) { body.appendChild(newItemCard(u, mtg)); });
      if (S.minutes.summary) {
        body.appendChild(h('div', { class: 'panel' }, [
          h('div', { class: 'ph' }, [h('b', { text: '③ 会议智能总结' }), h('span', { class: 'sp' }),
            h('button', { class: 'mini', text: '复制', onclick: function () { copy(S.minutes.summary); } })]),
          h('div', { class: 'pb' }, [h('div', { class: 'summary', text: S.minutes.summary })])
        ]));
      }
    }
    right.appendChild(body);

    main.appendChild(h('div', { class: 'mgrid' }, [left, right]));
  }

  function markQuote(quote, marks) {
    var out = esc(quote);
    (marks || []).forEach(function (m) {
      if (!m) return;
      var e = esc(m);
      if (out.indexOf('<mark>' + e) >= 0) return;
      out = out.split(e).join('<mark>' + e + '</mark>');
    });
    return out;
  }

  function patchCard(p, mtg) {
    var ix = index(), it = ix[p.itemId];
    if (!it) return null;
    var cls = 'patch' + (p.state === 'applied' ? ' applied' : (p.state === 'dropped' ? ' dropped' : ''));

    var head = h('div', { class: 'h' }, [
      h('span', { class: 'tt', text: p.itemId + '　' + it.title }),
      chip(p.via + ' ' + p.confidence, p.confidence >= 0.9 ? 'ok' : 'warn'),
      p.related.length ? chip('关联 ' + p.related.join(' '), 'info') : null,
      p.escalate ? chip('建议升 L2 · 5.3.1', 'crit') : null,
      h('span', { class: 'sp' }),
      h('span', { text: p.state === 'applied' ? '已采纳' : (p.state === 'dropped' ? '已忽略' : '') })
    ]);

    var body = h('div', { class: 'b' }, [
      h('div', { class: 'quote', html: markQuote(p.quote, p.marks) })
    ]);

    p.fields.forEach(function (f) {
      body.appendChild(h('div', { class: 'fld' }, [
        h('span', { class: 'fn', text: f.name + (f.guard === 'CR' ? '　· 5.3.3 需走 CR' : '') }),
        h('span', { class: 'ov', text: f.old }),
        h('span', { class: 'nv', text: f.val })
      ]));
    });

    if (p.alts && p.alts.length) {
      body.appendChild(h('div', { class: 'mnote', text: '其他候选：' + p.alts.map(function (a) {
        return a.id + '（' + a.score + '）';
      }).join('　') }));
    }

    if (p.state === 'pending') {
      body.appendChild(h('div', { class: 'acts' }, [
        h('button', { class: 'mini go', text: '采纳', onclick: function () { applyPatch(p, mtg); save(); render(); } }),
        h('button', { class: 'mini', text: '打开事项再改', onclick: function () { openDrawer(p.itemId); } }),
        h('button', { class: 'mini', text: '忽略', onclick: function () { p.state = 'dropped'; save(); render(); } })
      ]));
    }
    return h('div', { class: cls }, [head, body]);
  }

  function newItemCard(u, mtg) {
    var cls = 'patch newitem' + (u.state === 'applied' ? ' applied' : (u.state === 'dropped' ? ' dropped' : ''));
    var body = h('div', { class: 'b' }, [
      h('div', { class: 'quote', html: markQuote(u.quote, [u.title]) }),
      h('div', { class: 'fld' }, [h('span', { class: 'fn', text: '类型' }), h('span', { class: 'nv', text: u.newType })]),
      h('div', { class: 'fld' }, [h('span', { class: 'fn', text: '标题' }), h('span', { class: 'nv', text: u.title })]),
      h('div', { class: 'fld' }, [h('span', { class: 'fn', text: '责任人' }), h('span', { class: 'nv', text: u.owner || '待指定' })]),
      h('div', { class: 'fld' }, [h('span', { class: 'fn', text: '到期' }), h('span', { class: 'nv', text: u.due || '待定' })])
    ]);
    if (u.state === 'pending') {
      body.appendChild(h('div', { class: 'acts' }, [
        h('button', { class: 'mini go', text: '建为新事项', onclick: function () { createFromCandidate(u, mtg); save(); render(); } }),
        h('button', { class: 'mini', text: '忽略', onclick: function () { u.state = 'dropped'; save(); render(); } })
      ]));
    }
    return h('div', { class: cls }, [
      h('div', { class: 'h' }, [
        h('span', { class: 'tt', text: '新事项候选' }),
        chip('未匹配到已有事项', 'warn'), h('span', { class: 'sp' }),
        h('span', { text: u.state === 'applied' ? '已创建' : (u.state === 'dropped' ? '已忽略' : '') })
      ]),
      body
    ]);
  }

  /** 采纳补丁 —— 幂等：同一纪要同一事项同一片段只写一次 */
  function applyPatch(p, mtg, quiet) {
    if (p.state !== 'pending') return;
    if (S.appliedPatches[p.key]) { p.state = 'applied'; return; }
    var ix = index(), it = ix[p.itemId];
    if (!it) return;

    p.fields.forEach(function (f) {
      if (f.key === 'status' && f.val === '已闭环' && R.touchesCR(it)) {
        // 5.3.3：涉及范围、工期、费用的不得在会上直接闭环
        createCR(it, '会议纪要建议闭环，按 5.3.3 转 CR', mtg);
        return;
      }
      logChange(it, f.name, it[f.key] || '', f.val, '纪要 ' + mtg.id);
      it[f.key] = f.val;
    });
    it.updated = mtg.date;
    it.staleWeeks = 0;
    it.source = { meeting: mtg.id, quote: p.quote, at: mtg.date };
    S.appliedPatches[p.key] = { at: mtg.date, quote: p.quote };
    p.state = 'applied';
    if (!quiet) toast('已写入 ' + p.itemId + '，来源已留痕');
  }

  var crSeq = 0;
  function createCR(it, why, mtg) {
    crSeq++;
    var id = 'CR-' + String(S.items.filter(function (x) { return x.type === 'CR'; }).length + 1).padStart(3, '0');
    S.items.push({
      id: id, type: 'CR', phase: it.phase, topic: it.topic,
      title: '变更请求 · ' + it.title, party: '双方', owner: '陈亦 · PM',
      start: null, end: '', baseStart: null, baseEnd: '',
      status: '进行中', progress: why + '（源事项 ' + it.id + '）',
      next: '完成书面评估与报价，登记 CR 台账', nextOwner: '陈亦 · PM', nextDue: '',
      staleWeeks: 0, updated: mtg ? mtg.date : S.today, blockedBy: it.id,
      detail: '按 5.3.3，涉及范围、工期、费用的变化一律走书面评估与报价，不在会上口头拍板。源事项：' + it.id + ' ' + it.title,
      planText: '走 CR 流程', level: '—', priority: '', conclusion: '', confirmedAt: '', consensus: '', question: ''
    });
    toast('已生成 ' + id + ' 草稿并登记（5.3.3 拦截）');
  }

  function createFromCandidate(u, mtg) {
    var pre = { '风险': 'R', '问题': 'I', '决议': 'D', '行动项': 'A' }[u.newType] || 'A';
    var n = S.items.filter(function (x) { return x.type === u.newType; }).length + 1;
    var id = pre + '-' + String(n).padStart(3, '0');
    while (index()[id]) { n++; id = pre + '-' + String(n).padStart(3, '0'); }
    S.items.push({
      id: id, type: u.newType, phase: '一期', topic: '', title: u.title,
      party: '双方', owner: u.owner || '待指定',
      start: null, end: u.due || '', baseStart: null, baseEnd: u.due || '',
      status: '进行中', progress: u.detail, next: '', nextOwner: u.owner || '', nextDue: u.due || '',
      staleWeeks: 0, updated: mtg.date, blockedBy: null,
      detail: u.detail, planText: '会上新增', level: '中', priority: '',
      conclusion: '', confirmedAt: '', consensus: '', question: '',
      source: { meeting: mtg.id, quote: u.quote, at: mtg.date }
    });
    u.state = 'applied';
    toast('已创建 ' + id);
  }

  /* ---------------- 视图 · 看板 ---------------- */

  function viewBoard(main) {
    var f = S.filters;
    main.appendChild(h('div', { class: 'viewhead' }, [
      h('h1', { text: '执行看板' }),
      h('p', { text: '「待客户确认」单独成列 —— 57 条待澄清、2 条待确认变更、18 类交付物回签全停在这一档。等待天数自动计。' }),
      h('div', { class: 'toolbar' }, [
        h('label', { text: '分组' }),
        selectEl(['topic:按专题', 'owner:按负责人', 'phase:按期次', 'type:按类型'], f.group, function (v) { f.group = v; save(); render(); }),
        h('label', { text: '类型' }),
        selectEl([':全部'].concat(uniq('type').map(function (t) { return t + ':' + t; })), f.type, function (v) { f.type = v; save(); render(); }),
        h('label', { text: '期次' }),
        selectEl([':全部'].concat(uniq('phase').map(function (t) { return t + ':' + t; })), f.phase, function (v) { f.phase = v; save(); render(); })
      ])
    ]));

    var list = filtered();
    var board = h('div', { class: 'board' });
    R.STATUSES.forEach(function (st) {
      var col = h('div', { class: 'bcol' });
      var inCol = list.filter(function (it) { return it.status === st; });
      col.appendChild(h('div', { class: 'h' }, [h('b', { text: st }), h('span', { text: String(inCol.length) })]));

      var groups = {};
      inCol.forEach(function (it) {
        var k = (it[f.group] || '未归组');
        (groups[k] = groups[k] || []).push(it);
      });
      Object.keys(groups).sort().forEach(function (g) {
        col.appendChild(h('div', { class: 'bgroup', text: g + '（' + groups[g].length + '）' }));
        groups[g].slice(0, 8).forEach(function (it) {
          var fl = R.evaluate(it, S.today)[0];
          col.appendChild(h('div', {
            class: 'bcard ' + (STATUS_CLASS[it.status] || ''), tabindex: '0',
            onclick: function () { openDrawer(it.id); },
            onkeydown: function (e) { if (e.key === 'Enter') openDrawer(it.id); }
          }, [
            h('em', { text: it.id }),
            h('div', { class: 't', text: it.title }),
            h('div', { class: 'm', text: (it.owner || '') + (fl ? '　·　' + fl.label : '') })
          ]));
        });
        if (groups[g].length > 8) col.appendChild(h('div', { class: 'm', text: '　… 另 ' + (groups[g].length - 8) + ' 条' }));
      });
      board.appendChild(col);
    });
    main.appendChild(board);
  }

  /* ---------------- 视图 · 甘特 ---------------- */

  function viewGantt(main) {
    var f = S.filters;
    main.appendChild(h('div', { class: 'viewhead' }, [
      h('h1', { text: '排期甘特' }),
      h('p', { text: '细灰条是基线（首次承诺），粗色条是当前计划。灰条比色条短的地方，就是延期留下的痕迹。点任意一条打开的详情，与周会工作台是同一张卡片。' }),
      h('div', { class: 'toolbar' }, [
        h('label', { text: '类型' }),
        selectEl(uniq('type').map(function (t) { return t + ':' + t; }), f.gtype, function (v) { f.gtype = v; save(); render(); }),
        h('label', { text: '期次' }),
        selectEl([':全部'].concat(uniq('phase').map(function (t) { return t + ':' + t; })), f.phase, function (v) { f.phase = v; save(); render(); })
      ])
    ]));

    // 周列：2026-08-03（周一）起
    var start = new Date(2026, 7, 3), weeks = [], cur = new Date(start.getTime());
    for (var i = 0; i < 27; i++) { weeks.push(new Date(cur.getTime())); cur.setDate(cur.getDate() + 7); }
    function wi(dstr) {
      var d = R.D(dstr); if (!d) return null;
      var n = Math.floor((d - start) / (7 * 86400000));
      return Math.max(0, Math.min(weeks.length - 1, n));
    }

    var g = h('div', { class: 'gantt' });
    g.style.setProperty('--cols', weeks.length);

    var scale = h('div', { class: 'gscale' }, [h('div', { text: '事项' })]);
    var prevM = -1;
    weeks.forEach(function (w) {
      var mo = w.getMonth();
      scale.appendChild(h('div', { text: mo !== prevM ? ((mo + 1) + '月') : '' }));
      prevM = mo;
    });
    g.appendChild(scale);

    var list = S.items.filter(function (it) {
      return it.type === f.gtype && (!f.phase || it.phase === f.phase);
    });
    // 先按期次归组，组内按日期 —— 否则期次标题会反复出现
    var PORDER = { '一期': 0, '二期': 1, '通用': 2, '移出本期': 3 };
    list.sort(function (a, b) {
      var pa = PORDER[a.phase] === undefined ? 9 : PORDER[a.phase];
      var pb = PORDER[b.phase] === undefined ? 9 : PORDER[b.phase];
      if (pa !== pb) return pa - pb;
      return String(a.start || a.end || '') < String(b.start || b.end || '') ? -1 : 1;
    });

    if (!list.length) {
      g.appendChild(h('div', { class: 'empty', text: '当前筛选没有事项' }));
    }

    var lastPhase = null;
    list.forEach(function (it) {
      if (it.phase !== lastPhase) {
        g.appendChild(h('div', { class: 'gsec', text: it.phase || '未分期' }));
        lastPhase = it.phase;
      }
      var row = h('div', { class: 'grow' });
      var fl = R.evaluate(it, S.today)[0];
      var kind = it.status === '已闭环' ? 'ok' : (it.status === '阻塞' ? 'crit'
        : (fl && fl.level === 'crit' ? 'crit' : (fl && fl.level === 'warn' ? 'warn' : '')));

      row.appendChild(h('div', {
        class: 'gname', title: it.title, tabindex: '0',
        onclick: function () { openDrawer(it.id); },
        onkeydown: function (e) { if (e.key === 'Enter') openDrawer(it.id); }
      }, [h('em', { text: it.id }), h('span', { class: 'tx', text: it.title })]));

      var s = wi(it.start), e = wi(it.end);
      if (s !== null && e !== null && e > s) {
        var bar = h('div', { class: 'bar ' + kind, title: it.start + ' → ' + it.end,
          onclick: function () { openDrawer(it.id); } });
        bar.style.gridColumn = (s + 2) + ' / ' + (e + 3);
        row.appendChild(bar);
        var bs = wi(it.baseStart), be = wi(it.baseEnd);
        if (bs !== null && be !== null && (bs !== s || be !== e)) {
          var b2 = h('div', { class: 'bar base', title: '基线 ' + it.baseStart + ' → ' + it.baseEnd });
          b2.style.gridColumn = (bs + 2) + ' / ' + (be + 3);
          row.appendChild(b2);
        }
      } else if (e !== null) {
        var d = h('div', { class: 'dia ' + kind, title: it.end, onclick: function () { openDrawer(it.id); } });
        d.style.gridColumn = (e + 2);
        row.appendChild(d);
      }
      g.appendChild(row);
    });

    var tw = wi(S.today);
    var line = h('div', { class: 'gtoday' });
    line.style.left = 'calc(236px + (100% - 236px) * ' + (tw + 0.5) + ' / ' + weeks.length + ')';
    g.appendChild(line);

    main.appendChild(h('div', { class: 'gwrap' }, [g,
      h('div', { class: 'glegend' }, [
        h('span', { html: '<i class="l1"></i>当前计划' }),
        h('span', { html: '<i class="l2"></i>基线（首次承诺）' }),
        h('span', { html: '<i class="l3"></i>单点事项' }),
        h('span', { html: '<i class="l4"></i>今天 ' + S.today }),
        h('span', { text: '颜色 = 状态与规则标记：绿已闭环 · 红逾期或阻塞 · 黄临期' })
      ])
    ]));
  }

  /* ---------------- 视图 · 全部事项 ---------------- */

  function viewList(main) {
    var f = S.filters;
    main.appendChild(h('div', { class: 'viewhead' }, [
      h('h1', { text: '全部事项' }),
      h('p', { text: '统一事项模型：11 张表折叠成一种对象，用类型字段区分。共 ' + S.items.length + ' 条。' }),
      h('div', { class: 'toolbar' }, [
        h('input', { type: 'search', placeholder: '搜索编号 / 标题 / 内容', value: f.q,
          oninput: function (e) { f.q = e.target.value; save(); renderMainOnly(); } }),
        selectEl([':全部类型'].concat(uniq('type').map(function (t) { return t + ':' + t; })), f.type, function (v) { f.type = v; save(); render(); }),
        selectEl([':全部期次'].concat(uniq('phase').map(function (t) { return t + ':' + t; })), f.phase, function (v) { f.phase = v; save(); render(); }),
        selectEl([':全部状态'].concat(R.STATUSES.map(function (t) { return t + ':' + t; })), f.status, function (v) { f.status = v; save(); render(); })
      ])
    ]));

    var list = filtered();
    var tb = h('tbody');
    list.slice(0, 400).forEach(function (it) {
      var fl = R.evaluate(it, S.today)[0];
      tb.appendChild(h('tr', { tabindex: '0', onclick: function () { openDrawer(it.id); },
        onkeydown: function (e) { if (e.key === 'Enter') openDrawer(it.id); } }, [
        h('td', { class: 'k', text: it.id }),
        h('td', { text: it.type }),
        h('td', { text: it.phase || '—' }),
        h('td', { class: 'tt', text: it.title }),
        h('td', {}, [chip(it.status, STATUS_CHIP[it.status])]),
        h('td', { text: it.owner || '—' }),
        h('td', { class: 'd', text: it.end || '—' }),
        h('td', {}, [fl ? chip(fl.label, fl.level === 'crit' ? 'crit' : (fl.level === 'warn' ? 'warn' : 'mute')) : null])
      ]));
    });

    main.appendChild(h('div', { class: 'tablewrap' }, [
      h('table', {}, [
        h('thead', {}, [h('tr', {}, ['编号', '类型', '期次', '标题', '状态', '负责人', '计划完成', '规则标记'].map(function (t) {
          return h('th', { text: t });
        }))]),
        tb
      ])
    ]));
    if (list.length > 400) main.appendChild(h('div', { class: 'empty', text: '仅显示前 400 条，请用筛选缩小范围' }));
  }

  /* ---------------- 抽屉 ---------------- */

  function openDrawer(id) {
    var it = index()[id];
    if (!it) return;
    var d = document.getElementById('drawer'), sc = document.getElementById('scrim');
    d.innerHTML = ''; d.hidden = false; sc.hidden = false;

    var flags = R.evaluate(it, S.today);
    d.appendChild(h('div', { class: 'dh' }, [
      h('h2', { text: it.title }),
      h('button', { class: 'ghost', text: '关闭', onclick: closeDrawer })
    ]));
    d.appendChild(h('div', { class: 'dmeta' }, [
      chip(it.id, 'acc'), chip(it.type, 'mute'),
      it.phase ? chip(it.phase, 'mute') : null,
      it.topic ? chip(it.topic, 'info') : null,
      chip(it.status, STATUS_CHIP[it.status])
    ].concat(flags.map(function (f) {
      return chip(f.label + '　[' + f.src + ']', f.level === 'crit' ? 'crit' : (f.level === 'warn' ? 'warn' : 'info'));
    }))));

    if (it.blockedBy) {
      d.appendChild(h('div', { class: 'blockwarn', html: '阻塞于 <b>' + esc(it.blockedBy)
        + '</b>　—— 这条不解开，本事项动不了。' }));
    }

    d.appendChild(h('h3', { text: '详细情况' }));
    d.appendChild(h('div', { class: 'val', text: it.detail || '—' }));
    if (it.planText) {
      d.appendChild(h('h3', { text: '计划口径（明细表原文）' }));
      d.appendChild(h('div', { class: 'val', text: it.planText }));
    }

    d.appendChild(h('h3', { text: '状态' }));
    var stSel = h('select');
    R.STATUSES.forEach(function (s) {
      stSel.appendChild(h('option', { value: s, text: s, selected: s === it.status ? 'selected' : null }));
    });
    stSel.addEventListener('change', function () {
      var to = stSel.value;
      if (to === '已闭环' && R.touchesCR(it)) {
        stSel.value = it.status;
        if (confirm('按 5.3.3，涉及范围、工期、费用的事项不得在周会上直接闭环。\n\n是否生成 CR 草稿并登记编号？')) {
          createCR(it, '周会上尝试闭环，按 5.3.3 转 CR', null);
          save(); render(); closeDrawer();
        }
        return;
      }
      logChange(it, '状态', it.status, to);
      it.status = to; it.updated = S.today; it.staleWeeks = 0;
      save(); render(); openDrawer(id);
    });
    d.appendChild(stSel);

    d.appendChild(h('h3', { text: '最新进度' }));
    d.appendChild(field(it, 'progress', 'textarea', id));
    d.appendChild(h('h3', { text: '下一步' }));
    d.appendChild(field(it, 'next', 'textarea', id));
    d.appendChild(h('div', { class: 'two' }, [
      h('div', {}, [h('h3', { text: '下一步负责人' }), field(it, 'nextOwner', 'input', id)]),
      h('div', {}, [h('h3', { text: '下一步到期' }), field(it, 'nextDue', 'date', id)])
    ]));
    d.appendChild(h('div', { class: 'two' }, [
      h('div', {}, [h('h3', { text: '计划完成日' }), field(it, 'end', 'date', id)]),
      h('div', {}, [h('h3', { text: '基线完成日（只读）' }),
        h('input', { value: it.baseEnd || '—', disabled: 'disabled' })])
    ]));

    if (it.type === '待澄清') {
      d.appendChild(h('h3', { text: '结论（须在' + it.phase + '需求确认书出具前填写）' }));
      d.appendChild(field(it, 'conclusion', 'textarea', id));
      d.appendChild(h('h3', { text: '确认日期' }));
      d.appendChild(field(it, 'confirmedAt', 'date', id));
      if (it.question) {
        d.appendChild(h('h3', { text: '需求清单中已标注的问题' }));
        d.appendChild(h('div', { class: 'val', text: it.question }));
      }
    }

    if (it.source) {
      d.appendChild(h('h3', { text: '来源留痕' }));
      d.appendChild(h('div', { class: 'val', text: '会议 ' + it.source.meeting + '（' + it.source.at + '）原文：\n「' + it.source.quote + '」' }));
    }

    var hist = S.log.filter(function (l) { return l.id === it.id; }).slice(-8).reverse();
    d.appendChild(h('h3', { text: '更新记录' }));
    if (hist.length) {
      d.appendChild(h('div', { class: 'hist' }, hist.map(function (l) {
        return h('div', { html: '<b>' + esc(l.at) + '</b>　' + esc(l.field) + '　'
          + esc(String(l.from).slice(0, 26)) + ' → ' + esc(String(l.to).slice(0, 40)) + '　·　' + esc(l.by) });
      })));
    } else {
      d.appendChild(h('div', { class: 'val', text: '本次会话尚无改动。最近一次更新：' + (it.updated || '—') }));
    }

    d.appendChild(h('div', { class: 'dfoot' }, [
      h('button', { class: 'ghost', text: '标记为本周已过（清零升级计数）', onclick: function () {
        it.staleWeeks = 0; it.updated = S.today; logChange(it, '周会过审', '', S.today);
        save(); render(); closeDrawer();
      } }),
      h('button', { class: 'ghost', text: '关闭', onclick: closeDrawer })
    ]));
  }

  function field(it, key, kind, reopenId) {
    var el;
    if (kind === 'textarea') el = h('textarea', {});
    else el = h('input', { type: kind === 'date' ? 'date' : 'text' });
    el.value = it[key] || '';
    el.addEventListener('change', function () {
      var from = it[key] || '';
      if (from === el.value) return;
      logChange(it, key, from, el.value);
      it[key] = el.value;
      it.updated = S.today;
      save(); renderHealth();
      toast('已更新 ' + it.id);
    });
    return el;
  }

  function closeDrawer() {
    document.getElementById('drawer').hidden = true;
    document.getElementById('scrim').hidden = true;
    render();
  }

  /* ---------------- 筛选与工具 ---------------- */

  function uniq(key) {
    var m = {};
    S.items.forEach(function (it) { if (it[key]) m[it[key]] = 1; });
    return Object.keys(m);
  }
  function selectEl(opts, val, cb) {
    var s = h('select', { onchange: function (e) { cb(e.target.value); } });
    opts.forEach(function (o) {
      var i = o.indexOf(':');
      var v = o.slice(0, i), t = o.slice(i + 1);
      s.appendChild(h('option', { value: v, text: t, selected: v === val ? 'selected' : null }));
    });
    return s;
  }
  function filtered() {
    var f = S.filters, q = (f.q || '').trim().toLowerCase();
    return S.items.filter(function (it) {
      if (f.type && it.type !== f.type) return false;
      if (f.phase && it.phase !== f.phase) return false;
      if (f.status && it.status !== f.status) return false;
      if (q) {
        var hay = (it.id + it.title + it.detail + it.owner + it.progress).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('已复制到剪贴板'); },
        function () { fallbackCopy(text); });
    } else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('已复制到剪贴板'); }
    catch (e) { toast('复制失败，请手动选择'); }
    document.body.removeChild(ta);
  }

  function copyAgendaMinutes() {
    var b = R.buildAgenda(S.items, S.today), L = [];
    L.push('【工作组周会（L1）纪要草稿　' + S.today + '】');
    L.push('固定四块：排期计划进度更新 / 待办事项完成情况 / 需协助与需确认的问题 / RAID 台账');
    L.push('');
    b.forEach(function (bk) {
      if (!bk.items.length) return;
      L.push('■ ' + bk.title + '（' + bk.items.length + '）　—— ' + bk.why);
      bk.items.slice(0, 10).forEach(function (it) {
        L.push('  · [' + it.id + '] ' + it.title + '　状态：' + it.status);
        if (it.progress) L.push('    进度：' + it.progress);
        if (it.next) L.push('    下一步：' + it.next + '　' + (it.nextOwner || '') + '　' + (it.nextDue || ''));
      });
      L.push('');
    });
    copy(L.join('\n'));
  }

  function copyClientReport() {
    var st = R.health(S.items, S.today), L = [];
    L.push('崃州项目　周度进度同步　' + S.today);
    L.push('（依 7.6.4，进度与台账在工作组周会上展示，不另出书面月报）');
    L.push('');
    L.push('一、整体');
    L.push('　事项总数 ' + st.total + '，已闭环 ' + st.closed + '，逾期 ' + st.overdue + '，阻塞 ' + st.blocked + '。');
    L.push('');
    L.push('二、需客户方动作的事项');
    var wait = S.items.filter(function (it) { return it.status === '待客户确认'; });
    if (!wait.length) L.push('　（无）');
    wait.forEach(function (it) {
      var f = R.evaluate(it, S.today).filter(function (x) { return x.rule === 'R7'; })[0];
      L.push('　· [' + it.id + '] ' + it.title);
      L.push('　　需要：' + (it.next || '书面确认') + '　责任人：' + (it.nextOwner || it.owner) + '　建议 ' + (it.nextDue || '尽快') + ' 前反馈'
        + (f ? '　（' + f.label + '）' : ''));
    });
    L.push('');
    L.push('三、阻塞中');
    var blk = S.items.filter(function (it) { return it.status === '阻塞'; });
    if (!blk.length) L.push('　（无）');
    blk.forEach(function (it) {
      L.push('　· [' + it.id + '] ' + it.title + (it.blockedBy ? '　阻塞于 ' + it.blockedBy : ''));
    });
    copy(L.join('\n'));
  }

  function snapshot() {
    var st = R.health(S.items, S.today);
    S.snapshots.push({
      at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      level: st.levelText,
      text: '已闭环 ' + st.closed + '/' + st.total + '　逾期 ' + st.overdue + '　阻塞 ' + st.blocked
        + '　待客户确认 ' + st.waiting + '　应升 L2 ' + st.escalate + '　待澄清未闭环 ' + st.openQuestions
    });
    save(); render(); toast('已存快照，可在周会工作台底部回看');
  }

  /* ---------------- render ---------------- */

  function renderMainOnly() {
    var main = document.getElementById('main');
    main.innerHTML = '';
    ({ agenda: viewAgenda, minutes: viewMinutes, board: viewBoard, gantt: viewGantt, list: viewList }
      [S.view] || viewAgenda)(main);
  }

  function render() {
    renderHealth();
    renderMainOnly();
    Array.prototype.forEach.call(document.querySelectorAll('#viewNav button'), function (b) {
      b.classList.toggle('on', b.dataset.view === S.view);
    });
  }

  /* ---------------- init ---------------- */

  function init() {
    S = load();
    if (!S.filters) S.filters = seedState().filters;
    if (!S.minutes) S.minutes = seedState().minutes;

    document.getElementById('viewNav').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      S.view = b.dataset.view; save(); render();
      window.scrollTo(0, 0);
    });
    document.getElementById('btnPrint').addEventListener('click', function () { window.print(); });
    document.getElementById('btnSnapshot').addEventListener('click', snapshot);
    document.getElementById('btnReset').addEventListener('click', function () {
      if (!confirm('恢复为种子数据？本次演示中的所有改动会丢失。')) return;
      localStorage.removeItem(LS); S = seedState(); save(); render(); toast('已重置');
    });
    document.getElementById('scrim').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !document.getElementById('drawer').hidden) closeDrawer();
    });

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
