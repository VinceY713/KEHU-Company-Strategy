/* ============================================================
   PlayCARD v2 · 编辑器
   - 赌注录入 / 编辑（保存受体检硬拦截：放弃、停损、30 天动作、
     先行指标不满足一律拒绝保存，提示文案见指引第 3 节）
   - 资源投向配比编辑
   - 三年方向编辑（不带任何数字）
   桌面端可用；移动端只读（入口已被 CSS 隐藏）。
   ============================================================ */
'use strict';
(function () {
  var PC = window.PlayCARD, PS = window.PlayState;
  var $ = function (id) { return document.getElementById(id); };
  var modal = $('modal'), body = $('me-body'), title = $('me-title');
  var esc = PC.esc;

  var ENG_OPTIONS = PC.ENG_ORDER.map(function (k) { return '<option value="' + k + '">' + PC.ENG[k] + '</option>'; }).join('');

  function open() { modal.hidden = false; $('me-close').focus(); }
  function close() { modal.hidden = true; body.innerHTML = ''; }
  $('me-close').addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

  /* ================= 赌注表单 ================= */
  function nextId() {
    var n = 0;
    PS.bets.forEach(function (b) { var m = /^B-(\d+)$/.exec(b.id); if (m) n = Math.max(n, +m[1]); });
    return 'B-' + String(n + 1).padStart(2, '0');
  }

  function mbtRow(m) {
    m = m || {};
    return '<div class="mbtrow">' +
      '<input class="inp" data-fn="mbk" value="' + esc(m.k || '') + '" aria-label="前提编号">' +
      '<input class="inp" data-fn="mbt" value="' + esc(m.t || '') + '" placeholder="前提陈述（可判真假）" aria-label="前提内容">' +
      '<input class="inp nu" type="number" min="1" max="5" data-fn="mbu" value="' + (m.u || '') + '" placeholder="不确定 1-5" aria-label="不确定性 1 到 5">' +
      '<input class="inp nu" type="number" min="1" max="5" data-fn="mbl" value="' + (m.l || '') + '" placeholder="致命 1-5" aria-label="致命性 1 到 5">' +
      '<button type="button" class="rowdel" aria-label="删除该前提">×</button></div>';
  }
  function sigRow(s) {
    s = s || {};
    return '<div class="sigrow">' +
      '<input class="inp" type="date" data-fn="sigd" value="' + esc(s.d || '') + '" aria-label="信号日期">' +
      '<input class="inp" data-fn="sigtext" value="' + esc(s.t || '') + '" placeholder="证伪信号内容" aria-label="信号内容">' +
      '<input class="inp sm" data-fn="sigby" value="' + esc(s.by || '') + '" placeholder="登记人" aria-label="登记人">' +
      '<button type="button" class="rowdel" aria-label="删除该信号">×</button></div>';
  }

  function betForm(b) {
    var isNew = !b;
    b = b || { id: nextId(), engine: 'data', irreversible: true, owner: '', claim: '', basis: [], kill: { t: '', d: '' }, sacrifice: '', probe: { a: '', d: '' }, crit: { m: '', kind: 'leading', u: '', now: '', thr: '', direction: 'up', src: '' }, mbt: [{ k: 'a', t: '', u: '', l: '' }, { k: 'b', t: '', u: '', l: '' }, { k: 'c', t: '', u: '', l: '' }], short: { by: '', q: '', arg: '', sigs: [] }, rv: [], createdAt: '' };
    title.textContent = isNew ? '录入赌注' : '编辑 ' + b.id;
    body.innerHTML =
      '<div class="editorfails" id="efails" hidden><b>保存被拒绝 · 体检未通过</b><div id="efailslist"></div></div>' +
      '<form id="betform" novalidate>' +
      '<fieldset class="fieldset"><legend>身份</legend>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">编号</label><input class="inp" data-fn="id" value="' + esc(b.id) + '"></div>' +
          '<div class="field"><label class="lbl">引擎</label><select class="inp" data-fn="engine">' + ENG_OPTIONS.replace('value="' + b.engine + '"', 'value="' + b.engine + '" selected') + '</select></div>' +
        '</div>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">负责人</label><input class="inp" data-fn="owner" value="' + esc(b.owner) + '"></div>' +
          '<div class="field revrow"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-fn="irreversible"' + (b.irreversible ? ' checked' : '') + '> 不可逆决策（只有不可逆的值得开战略会）</label></div>' +
        '</div>' +
      '</fieldset>' +
      '<fieldset class="fieldset"><legend>赌注五要素</legend>' +
        '<div class="field"><label class="lbl">我们赌什么 <span class="req">*</span><span class="hint">一句可判真假的陈述</span></label><textarea class="inp" data-fn="claim" rows="2">' + esc(b.claim) + '</textarea></div>' +
        '<div class="field"><label class="lbl">凭什么 <span class="req">*</span><span class="hint">每行一条已发生的事实，不接受“我认为”</span></label><textarea class="inp" data-fn="basis" rows="3">' + esc(b.basis.join('\n')) + '</textarea></div>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">什么会证明我们错 <span class="req">*</span><span class="hint">可观测、有阈值、有日期</span></label><textarea class="inp" data-fn="killt" rows="2">' + esc(b.kill.t) + '</textarea></div>' +
          '<div class="field"><label class="lbl">停损日 <span class="req">*</span></label><input class="inp" type="date" data-fn="killd" value="' + esc(b.kill.d) + '"></div>' +
        '</div>' +
        '<div class="field"><label class="lbl">为此放弃什么 <span class="req">*</span><span class="hint">具体到客户类型、岗位、收入区间。写不出放弃什么，说明资源根本没动</span></label><textarea class="inp" data-fn="sacrifice" rows="2">' + esc(b.sacrifice) + '</textarea></div>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">30 天真实动作 <span class="req">*</span><span class="hint">一次对外的真实交易或接触，不是内部论证</span></label><textarea class="inp" data-fn="probea" rows="2">' + esc(b.probe.a) + '</textarea></div>' +
          '<div class="field"><label class="lbl">截止日 <span class="req">*</span><span class="hint">必须设在 30 天内</span></label><input class="inp" type="date" data-fn="probed" value="' + esc(b.probe.d) + '"></div>' +
        '</div>' +
      '</fieldset>' +
      '<fieldset class="fieldset"><legend>判据（必须是先行指标）</legend>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">指标</label><input class="inp" data-fn="critm" value="' + esc(b.crit.m) + '"></div>' +
          '<div class="field"><label class="lbl">类型</label><select class="inp" data-fn="critkind"><option value="leading"' + (b.crit.kind === 'leading' ? ' selected' : '') + '>先行（行为 / 早期信号）</option><option value="lagging"' + (b.crit.kind === 'lagging' ? ' selected' : '') + '>滞后（结果）</option></select></div>' +
        '</div>' +
        '<div class="grid3">' +
          '<div class="field"><label class="lbl">单位</label><input class="inp" data-fn="critu" value="' + esc(b.crit.u) + '"></div>' +
          '<div class="field"><label class="lbl">当前值</label><input class="inp" type="number" step="any" data-fn="critnow" value="' + esc(b.crit.now) + '"></div>' +
          '<div class="field"><label class="lbl">阈值</label><input class="inp" type="number" step="any" data-fn="critthr" value="' + esc(b.crit.thr) + '"></div>' +
        '</div>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">方向</label><select class="inp" data-fn="critdir"><option value="up"' + (b.crit.direction !== 'down' ? ' selected' : '') + '>越高越好</option><option value="down"' + (b.crit.direction === 'down' ? ' selected' : '') + '>越低越好</option></select></div>' +
          '<div class="field"><label class="lbl">取值来源</label><input class="inp" data-fn="critsrc" value="' + esc(b.crit.src) + '"></div>' +
        '</div>' +
      '</fieldset>' +
      '<fieldset class="fieldset"><legend>必须为真（3–5 条，各打不确定性与致命性 1–5 分）</legend>' +
        '<div id="mbtrows">' + b.mbt.map(mbtRow).join('') + '</div>' +
        '<button type="button" class="addrow" id="add-mbt">+ 添加前提</button>' +
      '</fieldset>' +
      '<fieldset class="fieldset"><legend>空头意见（轮值，任务是论证它失败，不许附和）</legend>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">空头</label><input class="inp" data-fn="shortby" value="' + esc(b.short.by) + '"></div>' +
          '<div class="field"><label class="lbl">季度</label><input class="inp" data-fn="shortq" value="' + esc(b.short.q) + '" placeholder="如 2026 Q3"></div>' +
        '</div>' +
        '<div class="field"><label class="lbl">为什么这个赌注会失败</label><textarea class="inp" data-fn="shortarg" rows="2">' + esc(b.short.arg) + '</textarea></div>' +
        '<div class="field"><label class="lbl">证伪信号登记</label><div id="sigrows">' + (b.short.sigs || []).map(sigRow).join('') + '</div>' +
        '<button type="button" class="addrow" id="add-sig">+ 登记信号</button></div>' +
      '</fieldset>' +
      '<div class="formfoot">' +
        '<button type="submit" class="btn primary">保存（受体检硬拦截）</button>' +
        '<button type="button" class="btn ghost purple" id="me-cancel">取消</button>' +
        '<span class="note">放弃、停损、30 天动作、先行指标不满足将无法保存</span>' +
      '</div>' +
      '</form>';

    $('add-mbt').addEventListener('click', function () {
      var rows = body.querySelectorAll('.mbtrow');
      var k = String.fromCharCode(97 + rows.length); /* a, b, c … */
      var div = document.createElement('div'); div.innerHTML = mbtRow({ k: k });
      $('mbtrows').appendChild(div.firstChild);
    });
    $('add-sig').addEventListener('click', function () {
      var div = document.createElement('div'); div.innerHTML = sigRow({});
      $('sigrows').appendChild(div.firstChild);
    });
    body.addEventListener('click', function (e) {
      var del = e.target.closest('.rowdel');
      if (del) { var row = del.closest('.mbtrow, .sigrow'); if (row && row.parentNode) row.parentNode.removeChild(row); }
    });
    $('me-cancel').addEventListener('click', close);
    $('betform').addEventListener('submit', function (e) {
      e.preventDefault();
      submitBet(isNew, b.id);
    });
    open();
  }

  function flagBad(fn, bad) { body.querySelectorAll('[data-fn="' + fn + '"]').forEach(function (el) { el.dataset.flag = bad ? 'bad' : ''; }); }
  function clearFlags() { body.querySelectorAll('[data-flag="bad"]').forEach(function (el) { el.dataset.flag = ''; }); }

  function submitBet(isNew, oldId) {
    var q = function (fn) { var el = body.querySelector('[data-fn="' + fn + '"]'); return el ? el.value.trim() : ''; };
    var errors = [];

    /* 收集 */
    var bet = {
      id: q('id') || nextId(),
      engine: q('engine') || 'data',
      irreversible: body.querySelector('[data-fn="irreversible"]').checked,
      owner: q('owner'),
      claim: q('claim'),
      basis: q('basis').split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
      kill: { t: q('killt'), d: q('killd') },
      sacrifice: q('sacrifice'),
      probe: { a: q('probea'), d: q('probed') },
      crit: { m: q('critm'), kind: q('critkind'), u: q('critu'), now: +q('critnow') || 0, thr: +q('critthr') || 0, direction: q('critdir') || 'up', src: q('critsrc') },
      mbt: [],
      short: { by: q('shortby'), q: q('shortq'), arg: q('shortarg'), sigs: [] },
      rv: [],
      createdAt: ''
    };
    body.querySelectorAll('.mbtrow').forEach(function (r) {
      var t = r.querySelector('[data-fn="mbt"]').value.trim();
      if (!t) return;
      bet.mbt.push({
        k: (r.querySelector('[data-fn="mbk"]').value.trim() || 'x'),
        t: t,
        u: Math.min(5, Math.max(1, +r.querySelector('[data-fn="mbu"]').value || 1)),
        l: Math.min(5, Math.max(1, +r.querySelector('[data-fn="mbl"]').value || 1))
      });
    });
    body.querySelectorAll('.sigrow').forEach(function (r) {
      var t = r.querySelector('[data-fn="sigtext"]').value.trim();
      if (!t) return;
      bet.short.sigs.push({ d: r.querySelector('[data-fn="sigd"]').value, t: t, by: r.querySelector('[data-fn="sigby"]').value.trim() });
    });

    /* 基础校验 */
    clearFlags();
    if (!bet.claim) { errors.push('我们赌什么不能为空。判断不了真假的不是赌注。'); flagBad('claim', true); }
    if (!bet.basis.length) { errors.push('凭什么至少一条已发生的事实。不接受“我认为”。'); flagBad('basis', true); }
    if (bet.mbt.length < 3 || bet.mbt.length > 5) { errors.push('必须为真需要 3–5 条前提，当前 ' + bet.mbt.length + ' 条。'); }
    var dup = PS.bets.filter(function (x) { return x.id === bet.id && x.id !== oldId; });
    if (!bet.id || dup.length) { errors.push('编号为空或与现有赌注重复。'); flagBad('id', true); }

    /* 体检硬拦截（指引第 3 节：体检是硬拦截，不是提示） */
    var a = PC.audit(bet);
    a.forEach(function (c) {
      if (c.ok) return;
      errors.push(c.why);
      if (c.k === '放弃') flagBad('sacrifice', true);
      if (c.k === '可观测停损') { flagBad('killt', true); flagBad('killd', true); }
      if (c.k === '30天动作') { flagBad('probea', true); flagBad('probed', true); }
      if (c.k === '先行指标') flagBad('critkind', true);
    });

    if (errors.length) {
      $('efails').hidden = false;
      $('efailslist').innerHTML = errors.map(function (e) { return '<p style="margin:2px 0">· ' + esc(e) + '</p>'; }).join('');
      var firstBad = body.querySelector('[data-flag="bad"]');
      if (firstBad) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    /* 保存 */
    var wasNew = isNew || !PS.bets.some(function (x) { return x.id === oldId; });
    if (wasNew) {
      PS.bets.push(bet);
    } else {
      PS.bets = PS.bets.map(function (x) { return x.id === oldId ? bet : x; });
    }
    PS.save(); PS.refresh(); close();
  }

  /* ================= 资源投向配比 ================= */
  function allocForm() {
    var al = PS.alloc;
    title.textContent = '编辑资源投向 · ' + al.quarter;
    var rows = PC.ENG_ORDER.concat(['legacy']).map(function (k) {
      var r = al.rows.filter(function (x) { return x.k === k; })[0] || { stated: 0, actual: 0 };
      return '<div class="grid3">' +
        '<div class="field"><label class="lbl">' + PC.ALLOC_NAME[k] + '</label><input class="inp" value="' + PC.ALLOC_NAME[k] + '" disabled></div>' +
        '<div class="field"><label class="lbl">声称配比 %</label><input class="inp" type="number" min="0" max="100" data-fn="st-' + k + '" value="' + r.stated + '"></div>' +
        '<div class="field"><label class="lbl">实际人天 %</label><input class="inp" type="number" min="0" max="100" data-fn="ac-' + k + '" value="' + r.actual + '"></div>' +
      '</div>';
    }).join('');
    body.innerHTML =
      '<form id="allocform" novalidate>' +
      '<fieldset class="fieldset"><legend>季度</legend>' +
        '<div class="grid2">' +
          '<div class="field"><label class="lbl">季度标识</label><input class="inp" data-fn="quarter" value="' + esc(al.quarter) + '"></div>' +
        '</div>' +
      '</fieldset>' +
      '<fieldset class="fieldset"><legend>配比（%）</legend>' + rows + '</fieldset>' +
      '<div class="field"><label class="lbl">取数说明</label><textarea class="inp" data-fn="source" rows="2">' + esc(al.source) + '</textarea></div>' +
      '<div class="formfoot">' +
        '<button type="submit" class="btn primary">保存</button>' +
        '<button type="button" class="btn ghost purple" id="me-cancel">取消</button>' +
        '<span class="note">差值 ≥10 个百分点会自动标红</span>' +
      '</div></form>';
    $('me-cancel').addEventListener('click', close);
    $('allocform').addEventListener('submit', function (e) {
      e.preventDefault();
      var rows2 = PC.ENG_ORDER.concat(['legacy']).map(function (k) {
        return { k: k, stated: +body.querySelector('[data-fn="st-' + k + '"]').value || 0, actual: +body.querySelector('[data-fn="ac-' + k + '"]').value || 0 };
      });
      var sum = rows2.reduce(function (n, r) { return n + r.actual; }, 0);
      if (Math.abs(sum - 100) > 0.5) {
        window.alert('实际人天占比合计 ' + sum + '%，应约为 100%。');
        return;
      }
      PS.setAlloc({ quarter: body.querySelector('[data-fn="quarter"]').value.trim() || '未命名季度', source: body.querySelector('[data-fn="source"]').value.trim(), rows: rows2 });
      PS.save(); PS.refresh(); close();
    });
    open();
  }

  /* ================= 三年方向 ================= */
  function nsForm() {
    title.textContent = '三年方向陈述';
    body.innerHTML =
      '<div class="editorfails" id="efails" hidden><b>保存被拒绝</b><div id="efailslist"></div></div>' +
      '<form id="nsform" novalidate>' +
      '<div class="field"><label class="lbl">三年方向 <span class="hint">一句方向陈述，不带任何数字，不参与任何计算</span></label>' +
      '<textarea class="inp" data-fn="ns" rows="3">' + esc(PS.northstar) + '</textarea></div>' +
      '<div class="formfoot">' +
        '<button type="submit" class="btn primary">保存</button>' +
        '<button type="button" class="btn ghost purple" id="me-cancel">取消</button>' +
      '</div></form>';
    $('me-cancel').addEventListener('click', close);
    $('nsform').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = body.querySelector('[data-fn="ns"]').value.trim();
      if (/\d/.test(v)) {
        $('efails').hidden = false;
        $('efailslist').innerHTML = '<p style="margin:2px 0">· 三年方向不允许出现任何数字。所有量化判据只存在于 90 天这一层。</p>';
        return;
      }
      if (!v) { window.alert('方向陈述不能为空。'); return; }
      PS.setNorthstar(v); PS.save(); PS.refresh(); close();
    });
    open();
  }

  window.Editor = { openBet: betForm, openAlloc: allocForm, openNorthstar: nsForm, close: close };
})();
