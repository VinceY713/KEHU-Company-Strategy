/* ============================================================
   PlayCARD v2 · 渲染层（中英双语）
   赌注台 / 必须为真矩阵 / 资源投向对照 / 详情抽屉
   数据持久化 localStorage，语言切换后整体重渲染
   ============================================================ */
'use strict';
(function () {
  var PC = window.PlayCARD, I18N = window.PlayI18N;
  var t = I18N.t, L = I18N.L, norm = I18N.norm, esc = PC.esc;
  var $ = function (id) { return document.getElementById(id); };
  var LS_BETS = 'playcard.v2.bets', LS_ALLOC = 'playcard.v2.alloc', LS_NS = 'playcard.v2.northstar';

  function load(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function save() {
    try {
      localStorage.setItem(LS_BETS, JSON.stringify(bets));
      localStorage.setItem(LS_ALLOC, JSON.stringify(alloc));
      localStorage.setItem(LS_NS, JSON.stringify(northstar));
    } catch (e) { /* 隐私模式等场景静默失败 */ }
  }

  /* ---------------- 状态（加载时迁移为双语结构；种子为双语合并版） ---------------- */
  var bets = load(LS_BETS) ? load(LS_BETS).map(PC.migrateBet) : PC.mergeSeedBets();
  var alloc = load(LS_ALLOC) ? PC.migrateAlloc(load(LS_ALLOC)) : PC.mergeSeedAlloc();
  var northstar = norm(load(LS_NS) || PC.mergeSeedNorthstar());
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
    if (!window.confirm(t('resetConfirm'))) return;
    bets = PC.mergeSeedBets();
    alloc = PC.mergeSeedAlloc();
    northstar = PC.mergeSeedNorthstar();
    sel = bets[0].id;
    save();
    renderAll();
  }

  /* ---------------- 语言切换 ---------------- */
  function setLangUI() {
    var btn = $('lang-btn');
    btn.textContent = I18N.isEn() ? t('switchLang') : 'EN';
    btn.title = I18N.isEn() ? 'Switch to 中文' : 'Switch to English';
  }
  $('lang-btn').addEventListener('click', function () {
    I18N.setLang(I18N.isEn() ? 'zh' : 'en');
    renderAll();
  });

  /* ---------------- 顶部 ---------------- */
  function renderStrip() {
    var bad = bets.filter(function (b) { return PC.failCount(b) > 0; }).length;
    var focus = bets.reduce(function (n, b) { return n + PC.hot(b).length; }, 0);
    var legacyRow = alloc.rows.filter(function (r) { return r.k === 'legacy'; })[0];
    $('strip').innerHTML =
      '<div class="stat"><div class="k">' + t('statBets') + '</div><div class="v">' + bets.length + '<em>' + t('unitBet') + '</em></div></div>' +
      '<div class="stat' + (bad ? ' bad' : '') + '"><div class="k">' + t('statFails') + '</div><div class="v">' + bad + '<em>' + t('unitFail') + '</em></div></div>' +
      '<div class="stat focus"><div class="k">' + t('statFocus') + '</div><div class="v">' + focus + '<em>' + t('unitFocus') + '</em></div></div>' +
      '<div class="stat bad"><div class="k">' + t('statLegacy') + '</div><div class="v">' + (legacyRow ? legacyRow.actual : '-') + '%<em>' + t('unitLegacy') + '</em></div></div>' +
      '<div class="stat"><div class="k">' + t('statOverdue') + '</div><div class="v">' + bets.filter(function (b) { return b.probe && b.probe.d && PC.days(b.probe.d) < 0; }).length + '<em>' + t('unitOverdue') + '</em></div></div>';
  }

  /* ---------------- 赌注卡 ---------------- */
  function betCard(b) {
    var a = PC.audit(b), f = PC.failCount(b);
    var scale = Math.max(b.crit.thr, b.crit.now) * 1.25 || 1;
    var pd = b.probe.d ? PC.days(b.probe.d) : null, kd = b.kill.d ? PC.days(b.kill.d) : null;
    var probeTxt = pd === null ? t('notSet') : (pd < 0 ? t('daysOverdue', { n: -pd }) : t('daysLeft', { n: pd }));
    return '<div class="bet ' + (b.id === sel ? 'sel' : '') + (f >= 3 ? ' dead' : '') + '" data-id="' + esc(b.id) + '" tabindex="0" role="button" aria-pressed="' + (b.id === sel) + '">' +
      '<div class="bhead">' +
        '<span class="code">' + esc(b.id) + '</span><span class="eng">' + t(PC.ENG_KEY[b.engine]) + '</span>' +
        (b.irreversible ? '<span class="irr">' + t('irr') + '</span>' : '<span class="rev">' + t('rev') + '</span>') +
        '<button class="editbtn onlydesktop" data-edit="' + esc(b.id) + '" aria-label="' + t('edit') + ' ' + esc(b.id) + '">' + t('edit') + '</button>' +
      '</div>' +
      '<p class="claim">' + esc(L(b.claim)) + '</p>' +
      '<div class="checks">' + a.map(function (c) { return '<span class="chk ' + (c.ok ? 'pass' : 'fail') + '" title="' + (c.ok ? 'OK' : esc(c.why)) + '">' + (c.ok ? '' : t('missing')) + esc(c.k) + '</span>'; }).join('') + '</div>' +
      '<div class="crit">' +
        '<div class="m"><span class="kind ' + b.crit.kind + '">' + (b.crit.kind === 'leading' ? t('leading') : t('lagging')) + '</span>' + esc(L(b.crit.m)) + '</div>' +
        '<div class="track"><div class="fill" style="width:' + Math.min(100, b.crit.now / scale * 100) + '%"></div><div class="mark2" style="left:' + Math.min(100, b.crit.thr / scale * 100) + '%"></div></div>' +
        '<div class="read">' + esc(b.crit.now) + esc(L(b.crit.u)) + '<span>' + t('threshold') + ' ' + esc(b.crit.thr) + esc(L(b.crit.u)) + '</span></div>' +
      '</div>' +
      '<div class="clocks">' +
        '<div class="clock' + (pd !== null && pd < 0 ? ' over' : '') + '"><em>' + t('clockProbe') + '</em><b>' + probeTxt + '</b></div>' +
        '<div class="clock' + (kd === null ? ' over' : '') + '"><em>' + t('clockKill') + '</em><b>' + (kd === null ? t('notSet') : esc(b.kill.d.slice(5))) + '</b></div>' +
        '<button class="more" data-open="' + esc(b.id) + '">' + t('expand') + '</button>' +
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
    $('mxlede').textContent = b.id + '　' + L(b.claim);
    var X = function (v) { return 52 + (v - 1) / 4 * 386; }, Y = function (v) { return 258 - (v - 1) / 4 * 228; };
    var hotSet = {};
    PC.hot(b).forEach(function (m) { hotSet[m.k] = true; });
    var s = '';
    s += '<rect x="' + X(3.5) + '" y="' + (Y(5) - 16) + '" width="' + (X(5) - X(3.5) + 30) + '" height="' + (Y(3.5) - Y(5) + 16) + '" fill="var(--kehu-gold-tint)" stroke="var(--kehu-gold)" stroke-width="1" rx="4"/>';
    s += '<text x="' + (X(3.5) + 8) + '" y="' + (Y(5) - 4) + '" font-size="10.5" font-weight="700" fill="#3D004F" letter-spacing="0.5">' + esc(t('hotZone')) + '</text>';
    s += '<line x1="52" y1="258" x2="468" y2="258" stroke="var(--line)" stroke-width="1"/>';
    s += '<line x1="52" y1="20" x2="52" y2="258" stroke="var(--line)" stroke-width="1"/>';
    s += '<text x="52" y="284" font-size="10.5" fill="var(--muted)">' + t('low') + '</text>';
    s += '<text x="438" y="284" font-size="10.5" fill="var(--muted)">' + t('high') + '</text>';
    s += '<text x="200" y="300" font-size="11" fill="var(--ink-soft)" font-weight="600">' + t('uncertainty') + '</text>';
    s += '<text x="46" y="258" font-size="10.5" fill="var(--muted)" text-anchor="end">' + t('low') + '</text>';
    s += '<text x="46" y="34" font-size="10.5" fill="var(--muted)" text-anchor="end">' + t('high') + '</text>';
    s += '<text x="18" y="160" font-size="11" fill="var(--ink-soft)" font-weight="600" transform="rotate(-90 18 160)" text-anchor="middle">' + t('lethality') + '</text>';
    b.mbt.forEach(function (m) {
      var isHot = hotSet[m.k];
      s += '<circle cx="' + X(m.u) + '" cy="' + Y(m.l) + '" r="' + (isHot ? 15 : 12) + '" fill="' + (isHot ? 'var(--kehu-gold)' : 'var(--kehu-purple-tint)') + '" stroke="' + (isHot ? 'var(--kehu-purple-deep)' : 'var(--kehu-purple-mid)') + '" stroke-width="' + (isHot ? 2 : 1.5) + '"/>';
      s += '<text x="' + X(m.u) + '" y="' + (Y(m.l) + 4) + '" font-size="12" font-weight="700" text-anchor="middle" fill="var(--kehu-purple-deep)" font-family="Consolas,monospace">' + esc(m.k) + '</text>';
    });
    $('mx').innerHTML = s;
    $('mxlegend').innerHTML = b.mbt.map(function (m) {
      return '<li class="' + (hotSet[m.k] ? 'hot' : '') + '"><span class="tag">' + esc(m.k) + '</span><span>' + esc(L(m.t)) + '</span><span class="sc">' + t('scUncertainty', { u: m.u }) + ' · ' + t('scLethality', { l: m.l }) + '</span></li>';
    }).join('');
    var h = PC.hot(b);
    $('focusline').innerHTML = h.length
      ? '<b>' + t('focusLabel') + '</b>' + h.map(function (m) { return esc(m.k) + '　' + esc(L(m.t)); }).join('；') + t('focusSuffix')
      : '<b>' + t('focusLabel') + '</b>' + t('focusNone');
  }

  /* ---------------- 资源投向 ---------------- */
  function renderAlloc() {
    $('alloclede').textContent = L(alloc.quarter) + ' — ' + t('allocLede');
    $('alloc').innerHTML = alloc.rows.map(function (a) {
      var gap = a.actual - a.stated, off = Math.abs(gap) >= 10;
      return '<li class="' + (off ? 'off' : '') + '">' +
        '<div class="arow"><span>' + t(PC.ALLOC_NAME[a.k]) + '</span>' +
          '<span class="num">' + t('actual') + ' ' + a.actual + '% · ' + t('stated') + ' ' + a.stated + '%</span>' +
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
    $('d-code').textContent = b.id + ' · ' + t(PC.ENG_KEY[b.engine]) + ' · ' + (b.irreversible ? t('irrDecision') : t('revDecision')) + ' · ' + L(b.owner);
    $('d-claim').textContent = L(b.claim);
    var fails = a.filter(function (c) { return !c.ok; });
    var basisIsOpinion = b.basis.length === 0 || L(b.basis[0]) === '管理层共识';
    $('d-body').innerHTML =
      (fails.length ? '<div class="shortbox"><b>' + t('drawerFails', { n: fails.length }) + '</b>' + fails.map(function (c) { return '<p style="margin-bottom:4px">' + esc(c.why) + '</p>'; }).join('') + '</div>' : '') +
      '<div class="f"><b>' + t('fBasis') + '</b>' + (!basisIsOpinion ? '<ul>' + b.basis.map(function (x) { return '<li>' + esc(L(x)) + '</li>'; }).join('') + '</ul>' : '<p style="color:var(--alert)">' + esc(t('eBasisOpinion', { t: L(b.basis[0] || '') })) + '</p>') + '</div>' +
      '<div class="f kill"><b>' + t('fKill') + '</b><p>' + (L(b.kill.t) ? esc(L(b.kill.t)) + '　' + t('killDeadline') + ' ' + esc(b.kill.d) : '<span style="color:var(--alert)">' + esc(t('eKillEmpty')) + '</span>') + '</p></div>' +
      '<div class="f sacr"><b>' + t('fSacrifice') + '</b><p>' + (L(b.sacrifice) ? esc(L(b.sacrifice)) : '<span style="color:var(--alert)">' + esc(t('eSacrificeEmpty')) + '</span>') + '</p></div>' +
      '<div class="f probe"><b>' + t('fProbe') + '</b><p>' + (L(b.probe.a) ? esc(L(b.probe.a)) + '　' + t('probeDeadline') + ' ' + esc(b.probe.d) + (PC.days(b.probe.d) < 0 ? esc(t('overdueDays', { n: -PC.days(b.probe.d) })) : '') : '<span style="color:var(--alert)">' + esc(t('eProbeEmpty2')) + '</span>') + '</p></div>' +
      '<div class="f"><b>' + t('fMbt') + '</b><ul class="mbt">' + b.mbt.map(function (m) { return '<li class="' + (hotSet[m.k] ? 'hot' : '') + '"><span style="font-family:var(--font-data);font-weight:700;width:14px;flex:none">' + esc(m.k) + '</span><span>' + esc(L(m.t)) + '</span><span class="sc">' + m.u + ' · ' + m.l + '</span></li>'; }).join('') + '</ul></div>' +
      '<div class="shortbox"><b>' + t('fShort') + '　' + esc(L(b.short.by) || '—') + ' · ' + esc(L(b.short.q) || '') + '</b>' +
        (L(b.short.arg) ? '<p>' + esc(L(b.short.arg)) + '</p>' : '<p style="color:var(--muted)">' + esc(t('noShort')) + '</p>') +
        (b.short.sigs || []).map(function (s) { return '<div class="sig"><time>' + esc(s.d) + '</time><span>' + esc(L(s.t)) + '<span style="color:var(--muted)">　' + esc(L(s.by)) + '</span></span></div>'; }).join('') +
      '</div>' +
      '<div class="f"><b>' + t('fCrit') + '</b><p><span class="kind ' + b.crit.kind + '">' + (b.crit.kind === 'leading' ? t('leading') : t('lagging')) + '</span> ' + esc(L(b.crit.m)) + '　' + t('current') + ' ' + esc(b.crit.now) + esc(L(b.crit.u)) + '，' + t('threshold') + ' ' + esc(b.crit.thr) + esc(L(b.crit.u)) + '<br><span style="color:var(--muted);font-size:11.5px">' + t('valueFrom') + ' ' + esc(L(b.crit.src)) + '</span></p></div>' +
      '<div class="f"><b>' + t('fReview') + '</b>' + (b.rv.length ? '<ul class="tl">' + b.rv.map(function (r) {
        var vk = { keep: t('vKeep'), pivot: t('vPivot'), kill: t('vKill') }[r.v] || r.v;
        return '<li><span class="stampv ' + esc(r.v) + '">' + esc(vk) + '</span><time>' + esc(r.d) + '</time><span style="color:var(--muted);font-size:11.5px">　' + esc(L(r.by)) + '</span><p>' + esc(L(r.t)) + '</p></li>';
      }).join('') + '</ul>' : '<p style="color:var(--muted)">' + esc(t('noReview')) + '</p>') + '</div>';
    drawer.classList.add('open'); scrim.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    $('dclose').focus();
  }
  function closeDrawer() { drawer.classList.remove('open'); scrim.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }

  /* ---------------- 使用说明 ---------------- */
  var helpModal = $('help-modal');
  function renderHelp() {
    $('help-title').textContent = t('helpTitle');
    $('help-body').innerHTML = '<p class="help-lede">' + esc(t('helpLede')) + '</p>' + t('helpBody');
  }
  function openHelp() { renderHelp(); helpModal.hidden = false; $('help-close').focus(); }
  function closeHelp() { helpModal.hidden = true; }

  function renderAll() {
    $('ns-text').textContent = L(northstar);
    $('cd').textContent = 'Q3 · D-' + Math.abs(PC.days('2026-09-30'));
    $('add-bet').innerHTML = I18N.icon('plus', 13) + ' ' + t('addBet');
    $('help-btn').innerHTML = I18N.icon('lightbulb', 13) + ' ' + t('helpBtn');
    if (!helpModal.hidden) renderHelp();
    setLangUI();
    renderStrip(); renderBets(); renderMatrix(); renderAlloc();
  }

  /* ---------------- 事件绑定 ---------------- */
  $('dclose').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); closeHelp(); window.Editor && window.Editor.close(); } });
  $('add-bet').addEventListener('click', function () { window.Editor.openBet(null); });
  $('edit-alloc').addEventListener('click', function () { window.Editor.openAlloc(); });
  $('ns-edit').addEventListener('click', function () { window.Editor.openNorthstar(); });
  $('reset-seed').addEventListener('click', resetSeed);
  $('help-btn').addEventListener('click', openHelp);
  $('help-close').addEventListener('click', closeHelp);
  helpModal.addEventListener('click', function (e) { if (e.target === helpModal) closeHelp(); });

  renderAll();
})();
