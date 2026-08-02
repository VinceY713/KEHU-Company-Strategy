/* ============================================================
   PlayCARD v2 · 渲染层
   赌注台 / 必须为真矩阵 / 资源投向对照 / 详情抽屉
   数据持久化到 localStorage，本地修改通过编辑器写入。
   ============================================================ */
'use strict';
(function () {
  var PC = window.PlayCARD;
  var $ = function (id) { return document.getElementById(id); };
  var esc = PC.esc;
  var LS_BETS = 'playcard.v2.bets', LS_ALLOC = 'playcard.v2.alloc', LS_NS = 'playcard.v2.northstar';

  function load(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function save() {
    try {
      localStorage.setItem(LS_BETS, JSON.stringify(bets));
      localStorage.setItem(LS_ALLOC, JSON.stringify(alloc));
      localStorage.setItem(LS_NS, JSON.stringify(northstar));
    } catch (e) { /* 隐私模式等场景静默失败 */ }
  }

  /* ---------------- 状态 ---------------- */
  var bets = load(LS_BETS) || JSON.parse(JSON.stringify(PC.SEED_BETS));
  var alloc = load(LS_ALLOC) || JSON.parse(JSON.stringify(PC.SEED_ALLOC));
  var northstar = load(LS_NS) || PC.SEED_NORTHSTAR;
  var sel = bets.length ? bets[0].id : 'B-01';

  window.PlayState = {
    get bets() { return bets; },
    get alloc() { return alloc; },
    get northstar() { return northstar; },
    setBets: function (v) { bets = v; },
    setAlloc: function (v) { alloc = v; },
    setNorthstar: function (v) { northstar = v; },
    save: save,
    refresh: renderAll
  };

  function resetSeed() {
    if (!window.confirm('重置为种子数据？当前本地录入的赌注与配比会被覆盖。')) return;
    bets = JSON.parse(JSON.stringify(PC.SEED_BETS));
    alloc = JSON.parse(JSON.stringify(PC.SEED_ALLOC));
    northstar = PC.SEED_NORTHSTAR;
    sel = bets[0].id;
    save();
    renderAll();
  }

  /* ---------------- 顶部 ---------------- */
  function renderStrip() {
    var bad = bets.filter(function (b) { return PC.failCount(b) > 0; }).length;
    var focus = bets.reduce(function (n, b) { return n + PC.hot(b).length; }, 0);
    var legacyRow = alloc.rows.filter(function (r) { return r.k === 'legacy'; })[0];
    $('strip').innerHTML =
      '<div class="stat"><div class="k">在册赌注</div><div class="v">' + bets.length + '<em>个</em></div></div>' +
      '<div class="stat' + (bad ? ' bad' : '') + '"><div class="k">体检未通过</div><div class="v">' + bad + '<em>个</em></div></div>' +
      '<div class="stat focus"><div class="k">本季验证焦点</div><div class="v">' + focus + '<em>条前提</em></div></div>' +
      '<div class="stat bad"><div class="k">未归属战略的投入</div><div class="v">' + (legacyRow ? legacyRow.actual : '-') + '%<em>上季人天</em></div></div>' +
      '<div class="stat"><div class="k">逾期的对外动作</div><div class="v">' + bets.filter(function (b) { return b.probe && b.probe.d && PC.days(b.probe.d) < 0; }).length + '<em>个</em></div></div>';
  }

  /* ---------------- 赌注卡 ---------------- */
  function betCard(b) {
    var a = PC.audit(b), f = PC.failCount(b);
    var scale = Math.max(b.crit.thr, b.crit.now) * 1.25 || 1;
    var pd = b.probe.d ? PC.days(b.probe.d) : null, kd = b.kill.d ? PC.days(b.kill.d) : null;
    return '<div class="bet ' + (b.id === sel ? 'sel' : '') + (f >= 3 ? ' dead' : '') + '" data-id="' + esc(b.id) + '" tabindex="0" role="button" aria-pressed="' + (b.id === sel) + '">' +
      '<div class="bhead">' +
        '<span class="code">' + esc(b.id) + '</span><span class="eng">' + PC.ENG[b.engine] + '</span>' +
        (b.irreversible ? '<span class="irr">不可逆</span>' : '<span class="rev">可逆</span>') +
        '<button class="editbtn onlydesktop" data-edit="' + esc(b.id) + '" aria-label="编辑 ' + esc(b.id) + '">编辑</button>' +
      '</div>' +
      '<p class="claim">' + esc(b.claim) + '</p>' +
      '<div class="checks">' + a.map(function (c) { return '<span class="chk ' + (c.ok ? 'pass' : 'fail') + '" title="' + (c.ok ? '通过' : esc(c.why)) + '">' + (c.ok ? '' : '缺 ') + esc(c.k) + '</span>'; }).join('') + '</div>' +
      '<div class="crit">' +
        '<div class="m"><span class="kind ' + b.crit.kind + '">' + (b.crit.kind === 'leading' ? '先行' : '滞后') + '</span>' + esc(b.crit.m) + '</div>' +
        '<div class="track"><div class="fill" style="width:' + Math.min(100, b.crit.now / scale * 100) + '%"></div><div class="mark2" style="left:' + Math.min(100, b.crit.thr / scale * 100) + '%"></div></div>' +
        '<div class="read">' + esc(b.crit.now) + esc(b.crit.u) + '<span>阈值 ' + esc(b.crit.thr) + esc(b.crit.u) + '</span></div>' +
      '</div>' +
      '<div class="clocks">' +
        '<div class="clock' + (pd !== null && pd < 0 ? ' over' : '') + '"><em>30 天动作</em><b>' + (pd === null ? '未设' : (pd < 0 ? '逾期 ' + (-pd) + ' 天' : '剩 ' + pd + ' 天')) + '</b></div>' +
        '<div class="clock' + (kd === null ? ' over' : '') + '"><em>停损日</em><b>' + (kd === null ? '未设' : esc(b.kill.d.slice(5))) + '</b></div>' +
        '<button class="more" data-open="' + esc(b.id) + '">展开</button>' +
      '</div>' +
    '</div>';
  }

  function renderBets() {
    $('bets').innerHTML = bets.map(betCard).join('');
    document.querySelectorAll('.bet').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.dataset.open || e.target.dataset.edit) return;
        sel = el.dataset.id; renderBets(); renderMatrix();
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.dataset.edit) return;
          e.preventDefault(); sel = el.dataset.id; renderBets(); renderMatrix();
        }
      });
    });
    document.querySelectorAll('[data-open]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); openBet(b.dataset.open); }); });
    document.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); window.Editor.openBet(b.dataset.edit); }); });
  }

  /* ---------------- 必须为真矩阵 ---------------- */
  function renderMatrix() {
    var b = bets.filter(function (x) { return x.id === sel; })[0] || bets[0];
    if (!b) return;
    $('mxlede').textContent = b.id + '　' + b.claim;
    var X = function (v) { return 52 + (v - 1) / 4 * 386; }, Y = function (v) { return 258 - (v - 1) / 4 * 228; };
    var hotSet = {};
    PC.hot(b).forEach(function (m) { hotSet[m.k] = true; });
    var s = '';
    s += '<rect x="' + X(3.5) + '" y="' + (Y(5) - 16) + '" width="' + (X(5) - X(3.5) + 30) + '" height="' + (Y(3.5) - Y(5) + 16) + '" fill="var(--kehu-gold-tint)" stroke="var(--kehu-gold)" stroke-width="1" rx="4"/>';
    s += '<text x="' + (X(3.5) + 8) + '" y="' + (Y(5) - 4) + '" font-size="10.5" font-weight="700" fill="#3D004F" letter-spacing="0.5">本季度唯一该验证的</text>';
    s += '<line x1="52" y1="258" x2="468" y2="258" stroke="var(--line)" stroke-width="1"/>';
    s += '<line x1="52" y1="20" x2="52" y2="258" stroke="var(--line)" stroke-width="1"/>';
    s += '<text x="52" y="284" font-size="10.5" fill="var(--muted)">低</text>';
    s += '<text x="438" y="284" font-size="10.5" fill="var(--muted)">高</text>';
    s += '<text x="200" y="300" font-size="11" fill="var(--ink-soft)" font-weight="600">不确定性</text>';
    s += '<text x="46" y="258" font-size="10.5" fill="var(--muted)" text-anchor="end">低</text>';
    s += '<text x="46" y="34" font-size="10.5" fill="var(--muted)" text-anchor="end">高</text>';
    s += '<text x="18" y="160" font-size="11" fill="var(--ink-soft)" font-weight="600" transform="rotate(-90 18 160)" text-anchor="middle">致命性</text>';
    b.mbt.forEach(function (m) {
      var isHot = hotSet[m.k];
      s += '<circle cx="' + X(m.u) + '" cy="' + Y(m.l) + '" r="' + (isHot ? 15 : 12) + '" fill="' + (isHot ? 'var(--kehu-gold)' : 'var(--kehu-purple-tint)') + '" stroke="' + (isHot ? 'var(--kehu-purple-deep)' : 'var(--kehu-purple-mid)') + '" stroke-width="' + (isHot ? 2 : 1.5) + '"/>';
      s += '<text x="' + X(m.u) + '" y="' + (Y(m.l) + 4) + '" font-size="12" font-weight="700" text-anchor="middle" fill="var(--kehu-purple-deep)" font-family="Consolas,monospace">' + esc(m.k) + '</text>';
    });
    $('mx').innerHTML = s;
    $('mxlegend').innerHTML = b.mbt.map(function (m) {
      return '<li class="' + (hotSet[m.k] ? 'hot' : '') + '"><span class="tag">' + esc(m.k) + '</span><span>' + esc(m.t) + '</span><span class="sc">不确定 ' + m.u + ' · 致命 ' + m.l + '</span></li>';
    }).join('');
    var h = PC.hot(b);
    $('focusline').innerHTML = h.length
      ? '<b>本季度验证焦点</b>' + h.map(function (m) { return esc(m.k) + '　' + esc(m.t); }).join('；') + '。其余前提本季不讨论，先当它成立。'
      : '<b>本季度验证焦点</b>没有条件落在右上象限。要么这个赌注已经足够确定，要么打分打得太保守，重打一次。';
  }

  /* ---------------- 资源投向 ---------------- */
  function renderAlloc() {
    $('alloclede').textContent = alloc.quarter + ' 实际人天占比，对照嘴上说的配比。深色竖线是声称值。';
    $('alloc').innerHTML = alloc.rows.map(function (a) {
      var gap = a.actual - a.stated, off = Math.abs(gap) >= 10;
      return '<li class="' + (off ? 'off' : '') + '">' +
        '<div class="arow"><span>' + PC.ALLOC_NAME[a.k] + '</span>' +
          '<span class="num">实际 ' + a.actual + '% · 声称 ' + a.stated + '%</span>' +
          '<span class="gap">' + (gap > 0 ? '+' : '') + gap + '</span></div>' +
        '<div class="track"><div class="fill" style="width:' + a.actual + '%"></div><div class="mark2" style="left:' + a.stated + '%"></div></div>' +
      '</li>';
    }).join('');
  }

  /* ---------------- 抽屉 ---------------- */
  var drawer = $('drawer'), scrim = $('scrim');
  function openBet(id) {
    var b = bets.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    var a = PC.audit(b), hotSet = {};
    PC.hot(b).forEach(function (m) { hotSet[m.k] = true; });
    $('d-code').textContent = b.id + ' · ' + PC.ENG[b.engine] + ' · ' + (b.irreversible ? '不可逆决策' : '可逆决策') + ' · ' + b.owner;
    $('d-claim').textContent = b.claim;
    var fails = a.filter(function (c) { return !c.ok; });
    $('d-body').innerHTML =
      (fails.length ? '<div class="shortbox"><b>体检未通过 ' + fails.length + ' 项</b>' + fails.map(function (c) { return '<p style="margin-bottom:4px">' + esc(c.why) + '</p>'; }).join('') + '</div>' : '') +
      '<div class="f"><b>凭什么</b>' + (b.basis.length && b.basis[0] !== '管理层共识' ? '<ul>' + b.basis.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p style="color:var(--alert)">只有“' + esc(b.basis[0] || '无') + '”。这不是已发生的事实。</p>') + '</div>' +
      '<div class="f kill"><b>什么会证明我们错</b><p>' + (b.kill.t ? esc(b.kill.t) + '　停损日 ' + esc(b.kill.d) : '<span style="color:var(--alert)">未填。立赌注时不写死停损，半年后就没人愿意承认它错了。</span>') + '</p></div>' +
      '<div class="f sacr"><b>为此放弃什么</b><p>' + (b.sacrifice ? esc(b.sacrifice) : '<span style="color:var(--alert)">未填。写不出放弃什么，说明资源根本没动。</span>') + '</p></div>' +
      '<div class="f probe"><b>30 天真实动作</b><p>' + (b.probe.a ? esc(b.probe.a) + '　截止 ' + esc(b.probe.d) + (PC.days(b.probe.d) < 0 ? '（已逾期 ' + (-PC.days(b.probe.d)) + ' 天）' : '') : '<span style="color:var(--alert)">未填。不能在 30 天内变成一次对外动作的判断，多半还没想清楚。</span>') + '</p></div>' +
      '<div class="f"><b>必须为真</b><ul class="mbt">' + b.mbt.map(function (m) { return '<li class="' + (hotSet[m.k] ? 'hot' : '') + '"><span style="font-family:var(--font-data);font-weight:700;width:14px;flex:none">' + esc(m.k) + '</span><span>' + esc(m.t) + '</span><span class="sc">' + m.u + ' · ' + m.l + '</span></li>'; }).join('') + '</ul></div>' +
      '<div class="shortbox"><b>空头意见　' + esc(b.short.by || '未指定') + ' · ' + esc(b.short.q || '') + '</b>' +
        (b.short.arg ? '<p>' + esc(b.short.arg) + '</p>' : '<p style="color:var(--muted)">本季未指定空头。没有对手的赌注不该进复盘。</p>') +
        (b.short.sigs || []).map(function (s) { return '<div class="sig"><time>' + esc(s.d) + '</time><span>' + esc(s.t) + '<span style="color:var(--muted)">　' + esc(s.by) + '</span></span></div>'; }).join('') +
      '</div>' +
      '<div class="f"><b>判据</b><p><span class="kind ' + b.crit.kind + '">' + (b.crit.kind === 'leading' ? '先行' : '滞后') + '</span> ' + esc(b.crit.m) + '　当前 ' + esc(b.crit.now) + esc(b.crit.u) + '，阈值 ' + esc(b.crit.thr) + esc(b.crit.u) + '<br><span style="color:var(--muted);font-size:11.5px">取值来源 ' + esc(b.crit.src) + '</span></p></div>' +
      '<div class="f"><b>复盘</b>' + (b.rv.length ? '<ul class="tl">' + b.rv.map(function (r) {
        var t = { keep: '维持', pivot: '转向', kill: '终止' }[r.v] || r.v;
        return '<li><span class="stampv ' + esc(r.v) + '">' + esc(t) + '</span><time>' + esc(r.d) + '</time><span style="color:var(--muted);font-size:11.5px">　' + esc(r.by) + '</span><p>' + esc(r.t) + '</p></li>';
      }).join('') + '</ul>' : '<p style="color:var(--muted)">还没有被正式复盘过。</p>') + '</div>';
    drawer.classList.add('open'); scrim.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    $('dclose').focus();
  }
  function closeDrawer() { drawer.classList.remove('open'); scrim.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }

  function renderAll() {
    $('ns-text').textContent = northstar;
    $('cd').textContent = 'Q3 复盘 D-' + Math.abs(PC.days('2026-09-30'));
    renderStrip(); renderBets(); renderMatrix(); renderAlloc();
  }

  /* ---------------- 事件绑定 ---------------- */
  $('dclose').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); window.Editor && window.Editor.close(); } });
  $('add-bet').addEventListener('click', function () { window.Editor.openBet(null); });
  $('edit-alloc').addEventListener('click', function () { window.Editor.openAlloc(); });
  $('ns-edit').addEventListener('click', function () { window.Editor.openNorthstar(); });
  $('reset-seed').addEventListener('click', resetSeed);

  renderAll();
})();
