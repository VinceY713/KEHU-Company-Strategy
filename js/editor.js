/* ============================================================
   PlayCARD v2 · 编辑器（中英双语 + AI 一键翻译）
   - 赌注录入 / 编辑：保存受体检硬拦截（任一语言有值即算有）
   - AI 一键翻译：把当前语言内容按商业语境翻译成另一语言
     （经服务器 /api/translate 代理 DeepSeek，key 不落前端）
   - 资源投向配比 / 三年方向编辑
   桌面端可用；移动端只读（入口已被 CSS 隐藏）。
   ============================================================ */
'use strict';
(function () {
  var PC = window.PlayCARD, PS = window.PlayState, I18N = window.PlayI18N;
  var t = I18N.t, Lval = I18N.Lval, norm = I18N.norm, getLang = I18N.getLang, icon = I18N.icon;
  var $ = function (id) { return document.getElementById(id); };
  var modal = $('modal'), body = $('me-body'), title = $('me-title');
  var esc = PC.esc;
  var lang = getLang();
  var pendingDst = null; /* AI 翻译结果暂存，保存时合并 */

  var ENG_OPTIONS = PC.ENG_ORDER.map(function (k) { return '<option value="' + k + '">' + t(PC.ENG_KEY[k]) + '</option>'; }).join('');

  function open() { modal.hidden = false; $('me-close').focus(); }
  function close() { modal.hidden = true; body.innerHTML = ''; pendingDst = null; }
  $('me-close').addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

  /* 双语字段读写：表单始终编辑当前语言，翻译写入另一语言 */
  function setL(v, val, dl) { v = norm(v); v[dl] = val; return v; }
  function fshow(obj, key) { var v = obj[key]; return Lval(v); }
  function fset(obj, key, val) { obj[key] = setL(obj[key], val, getLang()); }
  function bi() { return { zh: '', en: '' }; }

  /* ================= 赌注表单 ================= */
  function nextId() {
    var n = 0;
    PS.bets.forEach(function (b) { var m = /^B-(\d+)$/.exec(b.id); if (m) n = Math.max(n, +m[1]); });
    return 'B-' + String(n + 1).padStart(2, '0');
  }

  function mbtRow(m) {
    m = m || {};
    return '<div class="mbtrow">' +
      '<input class="inp" data-fn="mbk" value="' + esc(m.k || '') + '" aria-label="' + t('mbK') + '">' +
      '<input class="inp" data-fn="mbt" value="' + esc(Lval(m.t)) + '" placeholder="' + t('mbTPh') + '" aria-label="' + t('mbT') + '">' +
      '<input class="inp nu" type="number" min="1" max="5" data-fn="mbu" value="' + (m.u || '') + '" placeholder="' + t('mbU') + '" aria-label="' + t('mbU') + '">' +
      '<input class="inp nu" type="number" min="1" max="5" data-fn="mbl" value="' + (m.l || '') + '" placeholder="' + t('mbL') + '" aria-label="' + t('mbL') + '">' +
      '<button type="button" class="rowdel" aria-label="' + t('mbDel') + '">' + icon('xmark', 13) + '</button></div>';
  }
  function sigRow(s) {
    s = s || {};
    return '<div class="sigrow">' +
      '<input class="inp" type="date" data-fn="sigd" value="' + esc(s.d || '') + '" aria-label="' + t('sigD') + '">' +
      '<input class="inp" data-fn="sigtext" value="' + esc(Lval(s.t)) + '" placeholder="' + t('sigText') + '" aria-label="' + t('sigText') + '">' +
      '<input class="inp sm" data-fn="sigby" value="' + esc(Lval(s.by)) + '" placeholder="' + t('sigBy') + '" aria-label="' + t('sigBy') + '">' +
      '<button type="button" class="rowdel" aria-label="' + t('sigDel') + '">' + icon('xmark', 13) + '</button></div>';
  }

  function newDraft() {
    return {
      id: nextId(), engine: 'data', irreversible: true, owner: bi(), claim: bi(),
      basis: [], kill: { t: bi(), d: '' }, sacrifice: bi(), probe: { a: bi(), d: '' },
      crit: { m: bi(), kind: 'leading', u: bi(), now: 0, thr: 0, direction: 'up', src: bi() },
      mbt: [{ k: 'a', t: bi(), u: 1, l: 1 }, { k: 'b', t: bi(), u: 1, l: 1 }, { k: 'c', t: bi(), u: 1, l: 1 }],
      short: { by: bi(), q: bi(), arg: bi(), sigs: [] },
      rv: [], createdAt: ''
    };
  }

  function betForm(idOrBet) {
    var b = (idOrBet && typeof idOrBet === 'object') ? idOrBet : PS.bets.filter(function (x) { return x.id === idOrBet; })[0];
    var isNew = !b;
    var origId = b ? b.id : null;
    var d = b ? JSON.parse(JSON.stringify(b)) : newDraft();
    lang = getLang();
    title.textContent = isNew ? t('edTitleNew') : t('edTitleEdit', { id: d.id });
    body.innerHTML =
      '<div class="editorfails" id="efails" hidden><b>' + t('edRejected') + '</b><div id="efailslist"></div></div>' +
      '<div class="editorok" id="eok" hidden></div>' +
      '<div class="hintbar">' + icon('lightbulb', 13) + ' ' + t('aiEnrichNote') + '</div>' +
      '<form id="betform" novalidate>' +
      '<fieldset class="fieldset"><legend>' + t('fsIdentity') + '</legend>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">' + t('fId') + '</label><input class="inp" data-fn="id" value="' + esc(d.id) + '"></div>' +
          '<div class="field"><label class="lbl">' + t('fEngine') + '</label><select class="inp" data-fn="engine">' + ENG_OPTIONS.replace('value="' + d.engine + '"', 'value="' + d.engine + '" selected') + '</select></div>' +
        '</div>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">' + t('fOwner') + '</label><input class="inp" data-fn="owner" value="' + esc(fshow(d, 'owner')) + '"></div>' +
          '<div class="field revrow"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-fn="irreversible"' + (d.irreversible ? ' checked' : '') + '> ' + t('fIrreversible') + '</label></div>' +
        '</div>' +
      '</fieldset>' +
      '<fieldset class="fieldset"><legend>' + t('fsFive') + '</legend>' +
        '<div class="field"><label class="lbl">' + t('fClaim') + ' <span class="req">*</span><span class="hint">' + t('fClaimHint') + '</span></label><textarea class="inp" data-fn="claim" rows="2">' + esc(fshow(d, 'claim')) + '</textarea></div>' +
        '<div class="field"><label class="lbl">' + t('fBasis2') + ' <span class="req">*</span><span class="hint">' + t('fBasisHint') + '</span></label><textarea class="inp" data-fn="basis" rows="3">' + esc(d.basis.map(Lval).join('\n')) + '</textarea></div>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">' + t('fKillT') + ' <span class="req">*</span><span class="hint">' + t('fKillHint') + '</span></label><textarea class="inp" data-fn="killt" rows="2">' + esc(fshow(d.kill, 't')) + '</textarea></div>' +
          '<div class="field"><label class="lbl">' + t('fKillD') + ' <span class="req">*</span></label><input class="inp" type="date" data-fn="killd" value="' + esc(d.kill.d) + '"></div>' +
        '</div>' +
        '<div class="field"><label class="lbl">' + t('fSacrifice2') + ' <span class="req">*</span><span class="hint">' + t('fSacrificeHint') + '</span></label><textarea class="inp" data-fn="sacrifice" rows="2">' + esc(fshow(d, 'sacrifice')) + '</textarea></div>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">' + t('fProbeA') + ' <span class="req">*</span><span class="hint">' + t('fProbeHint') + '</span></label><textarea class="inp" data-fn="probea" rows="2">' + esc(fshow(d.probe, 'a')) + '</textarea></div>' +
          '<div class="field"><label class="lbl">' + t('fProbeD') + ' <span class="req">*</span><span class="hint">' + t('fProbeDHint') + '</span></label><input class="inp" type="date" data-fn="probed" value="' + esc(d.probe.d) + '"></div>' +
        '</div>' +
      '</fieldset>' +
      '<fieldset class="fieldset"><legend>' + t('fsCrit') + '</legend>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">' + t('fCritM') + '</label><input class="inp" data-fn="critm" value="' + esc(fshow(d.crit, 'm')) + '"></div>' +
          '<div class="field"><label class="lbl">' + t('fCritKind') + '</label><select class="inp" data-fn="critkind"><option value="leading"' + (d.crit.kind === 'leading' ? ' selected' : '') + '>' + t('optLeading') + '</option><option value="lagging"' + (d.crit.kind === 'lagging' ? ' selected' : '') + '>' + t('optLagging') + '</option></select></div>' +
        '</div>' +
        '<div class="grid3">' +
          '<div class="field"><label class="lbl">' + t('fCritU') + '</label><input class="inp" data-fn="critu" value="' + esc(fshow(d.crit, 'u')) + '"></div>' +
          '<div class="field"><label class="lbl">' + t('fCritNow') + '</label><input class="inp" type="number" step="any" data-fn="critnow" value="' + esc(d.crit.now) + '"></div>' +
          '<div class="field"><label class="lbl">' + t('fCritThr') + '</label><input class="inp" type="number" step="any" data-fn="critthr" value="' + esc(d.crit.thr) + '"></div>' +
        '</div>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">' + t('fCritDir') + '</label><select class="inp" data-fn="critdir"><option value="up"' + (d.crit.direction !== 'down' ? ' selected' : '') + '>' + t('optUp') + '</option><option value="down"' + (d.crit.direction === 'down' ? ' selected' : '') + '>' + t('optDown') + '</option></select></div>' +
          '<div class="field"><label class="lbl">' + t('fCritSrc') + '</label><input class="inp" data-fn="critsrc" value="' + esc(fshow(d.crit, 'src')) + '"></div>' +
        '</div>' +
      '</fieldset>' +
      '<fieldset class="fieldset"><legend>' + t('fsMbt') + '（' + t('fMbtHint') + '）</legend>' +
        '<div id="mbtrows">' + d.mbt.map(mbtRow).join('') + '</div>' +
        '<button type="button" class="addrow" id="add-mbt">' + icon('plus', 12) + ' ' + t('mbAdd') + '</button>' +
      '</fieldset>' +
      '<fieldset class="fieldset"><legend>' + t('fsShort') + '</legend>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">' + t('fShortBy') + '</label><input class="inp" data-fn="shortby" value="' + esc(fshow(d.short, 'by')) + '"></div>' +
          '<div class="field"><label class="lbl">' + t('fShortQ') + '</label><input class="inp" data-fn="shortq" value="' + esc(fshow(d.short, 'q')) + '" placeholder="' + t('fShortQPh') + '"></div>' +
        '</div>' +
        '<div class="field"><label class="lbl">' + t('fShortArg') + '</label><textarea class="inp" data-fn="shortarg" rows="2">' + esc(fshow(d.short, 'arg')) + '</textarea></div>' +
        '<div class="field"><label class="lbl">' + t('fSigT') + '</label><div id="sigrows">' + (d.short.sigs || []).map(sigRow).join('') + '</div>' +
        '<button type="button" class="addrow" id="add-sig">' + icon('plus', 12) + ' ' + t('sigAdd') + '</button></div>' +
      '</fieldset>' +
      '<div class="formfoot">' +
        '<button type="submit" class="btn primary">' + t('save') + '</button>' +
        '<button type="button" class="btn ghost purple" id="ai-enrich">' + icon('sparkles') + ' ' + t('aiEnrich') + '</button>' +
        '<button type="button" class="btn ghost purple" id="ai-translate">' + icon('translate') + ' ' + t('aiTranslate') + '</button>' +
        '<button type="button" class="btn ghost purple" id="me-cancel">' + t('cancel') + '</button>' +
        '<span class="note">' + t('saveNote') + '</span>' +
      '</div>' +
      '</form>';

    $('add-mbt').addEventListener('click', function () {
      var rows = body.querySelectorAll('.mbtrow');
      var k = String.fromCharCode(97 + rows.length);
      var div = document.createElement('div'); div.innerHTML = mbtRow({ k: k, t: bi(), u: 1, l: 1 });
      $('mbtrows').appendChild(div.firstChild);
    });
    $('add-sig').addEventListener('click', function () {
      var div = document.createElement('div'); div.innerHTML = sigRow({ d: '', t: bi(), by: bi() });
      $('sigrows').appendChild(div.firstChild);
    });
    body.addEventListener('click', function (e) {
      var del = e.target.closest('.rowdel');
      if (del) { var row = del.closest('.mbtrow, .sigrow'); if (row && row.parentNode) row.parentNode.removeChild(row); }
    });
    $('me-cancel').addEventListener('click', close);
    $('ai-enrich').addEventListener('click', function () { aiEnrich(); });
    $('ai-translate').addEventListener('click', function () { aiTranslate(); });
    $('betform').addEventListener('submit', function (e) {
      e.preventDefault();
      submitBet(isNew, d, origId);
    });
    open();
  }

  function flagBad(fn, bad) { body.querySelectorAll('[data-fn="' + fn + '"]').forEach(function (el) { el.dataset.flag = bad ? 'bad' : ''; }); }
  function clearFlags() { body.querySelectorAll('[data-flag="bad"]').forEach(function (el) { el.dataset.flag = ''; }); }
  function showNote(msg, kind) {
    var el = $('eok');
    el.hidden = false;
    el.textContent = msg;
    el.className = 'editorok' + (kind === 'err' ? ' err' : '');
  }

  /* ---------------- AI 一键翻译（商业语境，不直译） ---------------- */
  function collectI18n() {
    var q = function (fn) { var el = body.querySelector('[data-fn="' + fn + '"]'); return el ? el.value.trim() : ''; };
    var mbt = [], sigs = [];
    body.querySelectorAll('.mbtrow').forEach(function (r) {
      var tt = r.querySelector('[data-fn="mbt"]').value.trim();
      if (tt) mbt.push({ t: tt });
    });
    body.querySelectorAll('.sigrow').forEach(function (r) {
      var tt = r.querySelector('[data-fn="sigtext"]').value.trim();
      if (tt) sigs.push({ t: tt, by: r.querySelector('[data-fn="sigby"]').value.trim() });
    });
    return {
      claim: q('claim'), basis: q('basis').split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
      kill_t: q('killt'), sacrifice: q('sacrifice'), probe_a: q('probea'),
      crit_m: q('critm'), crit_u: q('critu'), crit_src: q('critsrc'), owner: q('owner'),
      mbt: mbt, sigs: sigs, short_by: q('shortby'), short_q: q('shortq'), short_arg: q('shortarg')
    };
  }

  function buildTranslatePrompt(srcLang, payload) {
    var dir = srcLang === 'zh'
      ? '把输入 JSON 中的中文翻译成地道英文（US business English）。'
      : '把输入 JSON 中的英文翻译成地道中文（简体，商业语境）。';
    return '你是 KEHU（客湖科技）的商业战略文档翻译专家。' + dir + '\n' +
      '规则：\n' +
      '1. 按商业与战略语境翻译，绝不逐字直译；遵循目标语言商务表达习惯（英文用名词短语与主动语态，中文用动宾结构与短句）。\n' +
      '2. 术语对照：赌注=bet，停损/kill condition，先行指标=leading indicator，滞后指标=lagging indicator，必须为真=must-be-true premise，空头意见=short case，证伪信号=falsification signal，资源投向=resource allocation，30天真实动作=30-day real action，数据成功=Data Success，技术成功=Tech Success，客户成功=Client Success，未归属战略的存量交付=legacy work，报价单=quote/proposal，固定包干价=fixed package price。\n' +
      '3. 保持 JSON 键名与结构完全一致，只翻译字符串的值；不翻译日期、数字、英文专名（如人名、产品名）、已为英文的术语。\n' +
      '4. 直接输出 JSON，不要 markdown 代码块标记，不要任何解释文字。\n\n' +
      '输入 JSON：\n' + JSON.stringify(payload, null, 1);
  }

  function cleanJson(s) {
    s = String(s || '').trim();
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
    return s;
  }

  function aiTranslate() {
    var btn = $('ai-translate');
    var srcLang = getLang(), dstLang = srcLang === 'zh' ? 'en' : 'zh';
    var payload = collectI18n();
    if (!payload.claim && !payload.sacrifice && !payload.kill_t && !payload.basis.length) {
      showNote(t('aiFail', { msg: 'empty' }), 'err'); return;
    }
    btn.disabled = true; btn.textContent = t('aiTranslating');
    var prompt = buildTranslatePrompt(srcLang, payload);
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 3000
      })
    })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!content) throw new Error('empty response');
      pendingDst = JSON.parse(cleanJson(content));
      showNote(t('aiDone', { dst: dstLang === 'en' ? 'English' : '中文' }), 'ok');
    })
    .catch(function (e) { showNote(t('aiFail', { msg: e.message }), 'err'); })
    .finally(function () { btn.disabled = false; btn.innerHTML = icon('translate') + ' ' + t('aiTranslate'); });
  }

  /* 把翻译结果写入 draft 的目标语言槽位 */
  function writeTranslated(d, o, dl) {
    d.claim = setL(d.claim, o.claim || '', dl);
    d.owner = setL(d.owner, o.owner || '', dl);
    (o.basis || []).forEach(function (x, i) {
      if (x) d.basis[i] = setL(d.basis[i] || bi(), x, dl);
    });
    d.kill.t = setL(d.kill.t, o.kill_t || '', dl);
    d.sacrifice = setL(d.sacrifice, o.sacrifice || '', dl);
    d.probe.a = setL(d.probe.a, o.probe_a || '', dl);
    d.crit.m = setL(d.crit.m, o.crit_m || '', dl);
    d.crit.u = setL(d.crit.u, o.crit_u || '', dl);
    d.crit.src = setL(d.crit.src, o.crit_src || '', dl);
    d.short.by = setL(d.short.by, o.short_by || '', dl);
    d.short.q = setL(d.short.q, o.short_q || '', dl);
    d.short.arg = setL(d.short.arg, o.short_arg || '', dl);
    (o.mbt || []).forEach(function (m, i) { if (d.mbt[i]) d.mbt[i].t = setL(d.mbt[i].t, m.t || '', dl); });
    (o.sigs || []).forEach(function (s, i) {
      if (d.short.sigs[i]) { d.short.sigs[i].t = setL(d.short.sigs[i].t, s.t || '', dl); d.short.sigs[i].by = setL(d.short.sigs[i].by, s.by || '', dl); }
    });
  }

  /* ---------------- AI 优化补充（简单填入 → AI 按规范补全） ---------------- */
  function buildEnrichPrompt(payload) {
    var langName = getLang() === 'zh' ? '中文' : 'English';
    return '你是客湖科技（KEHU）的战略顾问，负责把团队的想法打磨成符合 PlayCARD 赌注规范的完整赌注。请用' + langName + '输出。\n' +
      '用户只提供了部分内容（可能只有一两句），请：\n' +
      '1. 精炼并优化已填内容（不改变事实，只改表达）；\n' +
      '2. 按以下规范补全缺失字段，输出完整赌注 JSON：\n' +
      '- claim：一句可判真假的陈述；\n' +
      '- basis：只能基于用户已提供的事实；如果用户没有提供任何已发生事实，输出占位“（待补充已发生的事实）”，绝对不得编造事实；\n' +
      '- kill_t + kill_d：可观测、有阈值、有日期的停损条件，日期格式 YYYY-MM-DD（未来 3–6 个月）；\n' +
      '- sacrifice：具体到放弃的客户类型、岗位或收入区间；\n' +
      '- probe_a + probe_d：30 天内的对外真实动作（报价、签约、试用等真实交易或接触，不是内部调研），日期格式 YYYY-MM-DD；\n' +
      '- crit_m / crit_kind=leading / crit_u / crit_now / crit_thr / crit_src：先行指标（行为或早期信号，不是结果指标），含单位、当前值、阈值、取值来源；\n' +
      '- mbt：3–5 条“必须为真”的前提，每条 {t, u(不确定性1–5), l(致命性1–5)}，确保至少一条落在右上象限（u≥4 且 l≥4），这正是本季唯一值得验证的；\n' +
      '- short_by / short_q / short_arg：轮值空头与“为什么这个赌注会失败”的反对意见（不许附和）；\n' +
      '- owner：负责人。\n' +
      '按商业常识判断合理性，不要堆砌套话。\n' +
      '输出 JSON 键名：{claim, basis[], kill_t, kill_d, sacrifice, probe_a, probe_d, crit_m, crit_u, crit_now, crit_thr, crit_src, mbt[{t,u,l}], short_by, short_q, short_arg, owner}\n' +
      '直接输出 JSON，不要 markdown 代码块标记，不要任何解释文字。\n\n' +
      '用户已填内容：\n' + JSON.stringify(payload, null, 1);
  }

  /* 把 AI 补全结果回填到表单（当前语言字段），mbt 行按结果重建 */
  function fillEnriched(o) {
    var set = function (fn, v) { var el = body.querySelector('[data-fn="' + fn + '"]'); if (el) el.value = v; };
    set('claim', o.claim || ''); set('owner', o.owner || '');
    set('basis', (o.basis || []).join('\n'));
    set('killt', o.kill_t || ''); set('killd', o.kill_d || '');
    set('sacrifice', o.sacrifice || '');
    set('probea', o.probe_a || ''); set('probed', o.probe_d || '');
    set('critm', o.crit_m || ''); set('critu', o.crit_u || '');
    set('critnow', o.crit_now || 0); set('critthr', o.crit_thr || 0);
    set('critsrc', o.crit_src || '');
    set('shortby', o.short_by || ''); set('shortq', o.short_q || ''); set('shortarg', o.short_arg || '');
    var rows = (o.mbt || []).filter(function (m) { return m.t && m.t.trim(); });
    if (rows.length) {
      $('mbtrows').innerHTML = rows.map(function (m, i) {
        var tt = bi(); tt[getLang()] = m.t;
        return mbtRow({ k: String.fromCharCode(97 + i), t: tt, u: Math.min(5, Math.max(1, +m.u || 1)), l: Math.min(5, Math.max(1, +m.l || 1)) });
      }).join('');
    }
  }

  function aiEnrich() {
    var btn = $('ai-enrich');
    var payload = collectI18n();
    if (!payload.claim && !payload.basis.length) {
      showNote(t('aiEnrichFail', { msg: 'empty' }), 'err'); return;
    }
    btn.disabled = true; btn.innerHTML = icon('sparkles') + ' ' + t('aiEnriching');
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: buildEnrichPrompt(payload) }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 3000
      })
    })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!content) throw new Error('empty response');
      var o = JSON.parse(cleanJson(content));
      fillEnriched(o);
      showNote(t('aiEnrichDone'), 'ok');
    })
    .catch(function (e) { showNote(t('aiEnrichFail', { msg: e.message }), 'err'); })
    .finally(function () { btn.disabled = false; btn.innerHTML = icon('sparkles') + ' ' + t('aiEnrich'); });
  }

  /* draft 当前语言 → 翻译 payload */
  function draftI18n(d) {
    return {
      claim: Lval(d.claim),
      basis: d.basis.map(Lval),
      kill_t: Lval(d.kill.t),
      sacrifice: Lval(d.sacrifice),
      probe_a: Lval(d.probe.a),
      crit_m: Lval(d.crit.m), crit_u: Lval(d.crit.u), crit_src: Lval(d.crit.src),
      owner: Lval(d.owner),
      mbt: d.mbt.map(function (m) { return { t: Lval(m.t) }; }),
      sigs: d.short.sigs.map(function (s2) { return { t: Lval(s2.t), by: Lval(s2.by) }; }),
      short_by: Lval(d.short.by), short_q: Lval(d.short.q), short_arg: Lval(d.short.arg)
    };
  }

  /* 全局轻提示（保存成功/翻译失败） */
  function toast(msg, kind) {
    var el = $('toast');
    el.textContent = msg;
    el.className = 'toast' + (kind === 'err' ? ' err' : '');
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 3400);
  }

  /* ---------------- 保存（体检硬拦截） ---------------- */
  function submitBet(isNew, d, origId) {
    var q = function (fn) { var el = body.querySelector('[data-fn="' + fn + '"]'); return el ? el.value.trim() : ''; };
    var errors = [];

    /* 当前语言字段写入 draft */
    d.id = q('id') || nextId();
    d.engine = q('engine') || 'data';
    d.irreversible = body.querySelector('[data-fn="irreversible"]').checked;
    fset(d, 'owner', q('owner'));
    fset(d, 'claim', q('claim'));
    d.basis = q('basis').split('\n').map(function (s) { return s.trim(); }).filter(Boolean).map(function (x, i) { return setL(d.basis[i] || bi(), x, getLang()); });
    fset(d.kill, 't', q('killt')); d.kill.d = q('killd');
    fset(d, 'sacrifice', q('sacrifice'));
    fset(d.probe, 'a', q('probea')); d.probe.d = q('probed');
    fset(d.crit, 'm', q('critm')); d.crit.kind = q('critkind'); fset(d.crit, 'u', q('critu'));
    d.crit.now = +q('critnow') || 0; d.crit.thr = +q('critthr') || 0;
    d.crit.direction = q('critdir') || 'up'; fset(d.crit, 'src', q('critsrc'));
    var oldMbt = d.mbt || [];
    d.mbt = [];
    body.querySelectorAll('.mbtrow').forEach(function (r, mi) {
      var tt = r.querySelector('[data-fn="mbt"]').value.trim();
      if (!tt) return;
      d.mbt.push({
        k: (r.querySelector('[data-fn="mbk"]').value.trim() || 'x'),
        t: setL((oldMbt[mi] || {}).t || bi(), tt, getLang()),
        u: Math.min(5, Math.max(1, +r.querySelector('[data-fn="mbu"]').value || 1)),
        l: Math.min(5, Math.max(1, +r.querySelector('[data-fn="mbl"]').value || 1))
      });
    });
    var oldSigs = d.short.sigs || [];
    d.short.sigs = [];
    body.querySelectorAll('.sigrow').forEach(function (r, si) {
      var tt = r.querySelector('[data-fn="sigtext"]').value.trim();
      if (!tt) return;
      d.short.sigs.push({ d: r.querySelector('[data-fn="sigd"]').value, t: setL((oldSigs[si] || {}).t || bi(), tt, getLang()), by: setL((oldSigs[si] || {}).by || bi(), r.querySelector('[data-fn="sigby"]').value.trim(), getLang()) });
    });
    fset(d.short, 'by', q('shortby')); fset(d.short, 'q', q('shortq')); fset(d.short, 'arg', q('shortarg'));

    /* 基础校验 */
    clearFlags();
    var anyL = function (v) { v = norm(v); return !!(v.zh || v.en); };
    if (!anyL(d.claim)) { errors.push(t('edClaimEmpty')); flagBad('claim', true); }
    if (!d.basis.length) { errors.push(t('edBasisEmpty')); flagBad('basis', true); }
    if (d.mbt.length < 3 || d.mbt.length > 5) { errors.push(t('edMbtCount', { n: d.mbt.length })); }
    var dup = PS.bets.filter(function (x) { return x.id === d.id && x.id !== origId; });
    if (!d.id || dup.length) { errors.push(t('edIdDup')); flagBad('id', true); }

    /* 体检硬拦截（指引第 3 节） */
    var a = PC.audit(d);
    a.forEach(function (c) {
      if (c.ok) return;
      errors.push(c.why);
      if (c.k === t('checkSacrifice')) flagBad('sacrifice', true);
      if (c.k === t('checkKill')) { flagBad('killt', true); flagBad('killd', true); }
      if (c.k === t('checkProbe')) { flagBad('probea', true); flagBad('probed', true); }
      if (c.k === t('checkLeading')) flagBad('critkind', true);
    });

    if (errors.length) {
      $('efails').hidden = false;
      $('efailslist').innerHTML = errors.map(function (e) { return '<p style="margin:2px 0">· ' + esc(e) + '</p>'; }).join('');
      var firstBad = body.querySelector('[data-flag="bad"]');
      if (firstBad) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var dl = getLang() === 'zh' ? 'en' : 'zh';

    function persist() {
      if (origId) {
        /* 编辑：原位替换（PlayState.bets 是 getter，须用 setBets） */
        PS.setBets(PS.bets.map(function (x) { return x.id === origId ? d : x; }));
      } else {
        PS.bets.push(d);
      }
      PS.save();
    }

    /* 1) 立即保存当前语言（同步落盘，刷新也不丢） */
    if (pendingDst) {
      /* 手动 AI 翻译结果一并合并进另一语言 */
      writeTranslated(d, pendingDst, dl);
      persist(); PS.refresh(); close();
      toast(t('savedBilingual'), 'ok');
      return;
    }
    persist(); PS.refresh(); close();
    toast(t('savedOk'), 'ok');

    /* 2) 后台异步生成另一语言：失败不影响已保存数据 */
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: buildTranslatePrompt(getLang(), draftI18n(d)) }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 3000
      })
    })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!content) throw new Error('empty');
      writeTranslated(d, JSON.parse(cleanJson(content)), dl);
      persist(); PS.refresh();
      toast(t('translatedDone', { dst: dl === 'en' ? 'English' : '中文' }), 'ok');
    })
    .catch(function () {
      /* 已保存；另一语言留空，英文界面会显示 translation pending，可编辑后手动翻译 */
    });
  }

  /* ================= 资源投向配比 ================= */
  function allocForm() {
    var al = JSON.parse(JSON.stringify(PS.alloc));
    lang = getLang();
    title.textContent = t('allocEditTitle', { q: Lval(al.quarter) });
    var rows = PC.ENG_ORDER.concat(['legacy']).map(function (k) {
      var r = al.rows.filter(function (x) { return x.k === k; })[0] || { stated: 0, actual: 0 };
      return '<div class="grid3">' +
        '<div class="field"><label class="lbl">' + t(PC.ALLOC_NAME[k]) + '</label><input class="inp" value="' + esc(t(PC.ALLOC_NAME[k])) + '" disabled></div>' +
        '<div class="field"><label class="lbl">' + t('fStated') + '</label><input class="inp" type="number" min="0" max="100" data-fn="st-' + k + '" value="' + r.stated + '"></div>' +
        '<div class="field"><label class="lbl">' + t('fActual') + '</label><input class="inp" type="number" min="0" max="100" data-fn="ac-' + k + '" value="' + r.actual + '"></div>' +
      '</div>';
    }).join('');
    body.innerHTML =
      '<form id="allocform" novalidate>' +
      '<fieldset class="fieldset"><legend>' + t('fQuarter') + '</legend>' +
        '<div class="field"><label class="lbl">' + t('fQuarter') + '</label><input class="inp" data-fn="quarter" value="' + esc(Lval(al.quarter)) + '"></div>' +
      '</fieldset>' +
      '<fieldset class="fieldset"><legend>' + t('fsAlloc') + '</legend>' + rows + '</fieldset>' +
      '<div class="field"><label class="lbl">' + t('fSource') + '</label><textarea class="inp" data-fn="source" rows="2">' + esc(Lval(al.source)) + '</textarea></div>' +
      '<div class="formfoot">' +
        '<button type="submit" class="btn primary">' + t('save') + '</button>' +
        '<button type="button" class="btn ghost purple" id="me-cancel">' + t('cancel') + '</button>' +
        '<span class="note">' + t('allocGapNote') + '</span>' +
      '</div></form>';
    $('me-cancel').addEventListener('click', close);
    $('allocform').addEventListener('submit', function (e) {
      e.preventDefault();
      var rows2 = PC.ENG_ORDER.concat(['legacy']).map(function (k) {
        return { k: k, stated: +body.querySelector('[data-fn="st-' + k + '"]').value || 0, actual: +body.querySelector('[data-fn="ac-' + k + '"]').value || 0 };
      });
      var sum = rows2.reduce(function (n, r) { return n + r.actual; }, 0);
      if (Math.abs(sum - 100) > 0.5) {
        window.alert(t('allocSumErr', { n: sum }));
        return;
      }
      al.quarter = setL(al.quarter, body.querySelector('[data-fn="quarter"]').value.trim() || '未命名季度', getLang());
      al.source = setL(al.source, body.querySelector('[data-fn="source"]').value.trim(), getLang());
      al.rows = rows2;
      PS.setAlloc(al); PS.save(); PS.refresh(); close();
    });
    open();
  }

  /* ================= 三年方向 ================= */
  function nsForm() {
    lang = getLang();
    title.textContent = t('nsTitle');
    body.innerHTML =
      '<div class="editorfails" id="efails" hidden><b>' + t('edRejected') + '</b><div id="efailslist"></div></div>' +
      '<form id="nsform" novalidate>' +
      '<div class="field"><label class="lbl">' + t('fNs') + ' <span class="hint">' + t('fNsHint') + '</span></label>' +
      '<textarea class="inp" data-fn="ns" rows="3">' + esc(Lval(PS.northstar)) + '</textarea></div>' +
      '<div class="formfoot">' +
        '<button type="submit" class="btn primary">' + t('save') + '</button>' +
        '<button type="button" class="btn ghost purple" id="me-cancel">' + t('cancel') + '</button>' +
      '</div></form>';
    $('me-cancel').addEventListener('click', close);
    $('nsform').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = body.querySelector('[data-fn="ns"]').value.trim();
      if (/\d/.test(v)) {
        $('efails').hidden = false;
        $('efailslist').innerHTML = '<p style="margin:2px 0">· ' + esc(t('nsDigitErr')) + '</p>';
        return;
      }
      if (!v) { window.alert(t('nsEmptyErr')); return; }
      var ns = norm(PS.northstar);
      ns = setL(ns, v, getLang());
      PS.setNorthstar(ns); PS.save(); PS.refresh(); close();
    });
    open();
  }

  window.Editor = { openBet: betForm, openAlloc: allocForm, openNorthstar: nsForm, close: close };
})();
