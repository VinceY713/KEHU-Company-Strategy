/* 崃州项目 · 交付工作台 Demo
   纪要回写管道：切分抽取 → 对齐匹配 → 生成字段补丁。

   本 Demo 用确定性规则引擎模拟 STAGE 1/3 的抽取与生成，STAGE 2 的匹配是真实实现
   （显式编号优先，其次 CJK 二元组重合度）。生产版本把 STAGE 1/3 换成受 JSON Schema
   约束的模型输出即可，管道形状与人审环节不变。 */

(function (global) {
  'use strict';

  var R = global.RULES;

  /* ---------------- STAGE 1 · 切分与抽取 ---------------- */

  var HEAD_RE = /^\s*(【.*】|[一二三四五六七八九十]+、|参会[:：]|\d+[.、]\s*$)/;

  /** 按分隔符切分并保留分隔符（替代 lookbehind，兼容旧 Safari） */
  function splitKeep(s, sep) {
    var parts = s.split(sep), out = [];
    parts.forEach(function (p, i) {
      if (i < parts.length - 1) out.push(p + sep);
      else if (p) out.push(p);
    });
    return out;
  }

  function segment(text) {
    var out = [], lines = String(text).split(/\r?\n/);
    lines.forEach(function (line, li) {
      line = line.trim();
      if (!line) return;
      if (HEAD_RE.test(line)) { out.push({ i: li, text: line, head: true }); return; }
      // 句号切分（保留句号），复合句整段留给匹配器
      splitKeep(line, '。').forEach(function (s) {
        s = s.trim();
        if (s.length >= 6) out.push({ i: li, text: s, head: false });
      });
    });
    return out;
  }

  /* ---------------- 日期与人名解析 ---------------- */

  var WD = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };

  function resolveDate(clause, baseIso) {
    var base = R.D(baseIso);
    if (!base) return '';

    var m = clause.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (m) {
      var mo = +m[1], dy = +m[2];
      var y = base.getFullYear() + (mo < base.getMonth() + 1 - 6 ? 1 : 0);
      return R.iso(new Date(y, mo - 1, dy));
    }

    m = clause.match(/(本周|这周|下周|下下周)?\s*周([一二三四五六日天])/);
    if (m) {
      var offWeek = m[1] === '下周' ? 1 : (m[1] === '下下周' ? 2 : 0);
      var target = WD[m[2]];
      var d = new Date(base.getTime());
      var cur = d.getDay();
      var delta = target - cur;
      if (target === 0) delta = 7 - cur;          // 周日算本周末
      if (delta <= 0 && offWeek === 0) delta += 7; // 本周已过 → 下一个
      d.setDate(d.getDate() + delta + offWeek * 7);
      return R.iso(d);
    }

    if (/本周内|这周内|本周之内/.test(clause)) {
      var d2 = new Date(base.getTime());
      d2.setDate(d2.getDate() + (5 - d2.getDay() + 7) % 7 || 5);
      return R.iso(d2);
    }
    if (/下周/.test(clause)) {
      var d3 = new Date(base.getTime());
      d3.setDate(d3.getDate() + (5 - d3.getDay() + 7) % 7 + 7);
      return R.iso(d3);
    }
    m = clause.match(/(\d{1,2})\s*个?\s*工作日(内|之内)?/);
    if (m) {
      var d4 = new Date(base.getTime()), n = +m[1];
      while (n > 0) { d4.setDate(d4.getDate() + 1); if (d4.getDay() !== 0 && d4.getDay() !== 6) n--; }
      return R.iso(d4);
    }
    return '';
  }

  function buildRoster(items) {
    var map = {};
    items.forEach(function (it) {
      [it.owner, it.nextOwner].forEach(function (o) {
        if (!o) return;
        var name = o.split('·')[0].trim();
        if (name) map[name] = o;
      });
    });
    return map;
  }

  /** 认领动词：紧跟在人名后面的，才是这条待办的责任人，而不是发言人 */
  var CLAIM_RE = /^(认领|负责|来跟|来推|去推|给出|出具|回签|安排|承诺|确认|答复|催办)/;

  function findOwner(text, roster) {
    // 段首的「某某说 / 某某同步」是发言人，不作责任人
    var body = text.replace(SPEAKER_RE, '');
    var hits = [];
    Object.keys(roster).forEach(function (name) {
      var i = body.indexOf(name);
      while (i >= 0) {
        hits.push({ name: name, at: i, claim: CLAIM_RE.test(body.slice(i + name.length, i + name.length + 4)) });
        i = body.indexOf(name, i + 1);
      }
    });
    if (!hits.length) return '';
    var claimed = hits.filter(function (x) { return x.claim; });
    var pick = claimed.length ? claimed[claimed.length - 1]
      : hits.sort(function (a, b) { return a.at - b.at; })[hits.length - 1];
    return roster[pick.name];
  }

  /* ---------------- STAGE 2 · 对齐与匹配 ---------------- */

  var ID_RES = [
    /\d\.\d\.\d{1,2}/g,           // 3.1.05 / 4.4.29 / 6.3.5
    /[RIDA]-\d{3}/g,              // R-001 / I-002 / A-002
    /(?:^|[^0-9A-Za-z])([AB]\d{2})(?![0-9])/g  // A15 / B02
  ];

  function explicitIds(text, index) {
    var found = [];
    ID_RES.forEach(function (re) {
      re.lastIndex = 0;
      var m;
      while ((m = re.exec(text)) !== null) {
        var id = (m[1] || m[0]).trim();
        if (index[id] && found.indexOf(id) < 0) found.push(id);
      }
    });
    return found;
  }

  /** CJK 二元组集合 */
  function bigrams(s) {
    var t = String(s).replace(/[\s、·，。：:（）()\/]/g, ''), out = {};
    for (var i = 0; i < t.length - 1; i++) out[t.substr(i, 2)] = 1;
    return out;
  }
  function overlap(a, b) {
    var ka = Object.keys(a); if (!ka.length) return 0;
    var n = 0;
    ka.forEach(function (k) { if (b[k]) n++; });
    return n;
  }

  function fuzzyMatch(text, items, topN) {
    var bt = bigrams(text), scored = [];
    items.forEach(function (it) {
      var bi = bigrams((it.title || '') + (it.topic || ''));
      var n = overlap(bi, bt);
      if (n < 3) return;
      var denom = Math.min(Object.keys(bi).length, 24) || 1;
      scored.push({ id: it.id, score: Math.min(0.92, n / denom) });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, topN || 3);
  }

  /* ---------------- STAGE 3 · 生成字段补丁 ---------------- */

  var SPEAKER_RE = /^([一-龥]{2,3})(说|同步|提出|表示|反馈|认为|补充|那边)[，,：:]?\s*/;
  var CLOSE_RE = /(已完成|已闭环|已通过|已签字|已回签|已确认|已定稿|全部完成)/;
  var OPEN_RE = /(未闭环|还没|尚未|没回|未回|未定|未进|无进展|卡着|约不上|超期)/;
  var COMMIT_RE = /(之前|以前|前|内|之内|认领|负责|给出|出具|回签|提交|安排|排期|确认|答复|催办|定稿|评审)/;

  function cleanProgress(seg) {
    // 去掉发言人前缀，以及句首那个只用来点名的编号（编号已在卡片抬头显示）
    return seg
      .replace(SPEAKER_RE, '')
      .replace(/^(\d\.\d\.\d{1,2}|[RIDA]-\d{3}|[AB]\d{2})\s*的?\s*/, '')
      .replace(/^[，,、：:\s]+/, '')
      .trim();
  }

  function clauses(s) {
    return s.split(/[，,；;。]/).map(function (c) { return c.trim(); }).filter(function (c) { return c.length > 3; });
  }

  function extractNext(seg, baseIso) {
    var cs = clauses(seg), best = null;
    cs.forEach(function (c) {
      var due = resolveDate(c, baseIso);
      if (due && COMMIT_RE.test(c)) best = { text: c, due: due };
      else if (due && !best) best = { text: c, due: due };
    });
    if (!best) {
      for (var i = cs.length - 1; i >= 0; i--) {
        if (COMMIT_RE.test(cs[i])) { best = { text: cs[i], due: '' }; break; }
      }
    }
    if (!best) return null;
    var t = best.text
      .replace(SPEAKER_RE, '')
      .replace(/(本|这|下|下下)?周[一二三四五六日天](之前|以前|前)?/, '')
      .replace(/\d{1,2}\s*月\s*\d{1,2}\s*日(之前|以前|前)?/, '')
      .replace(/\d{1,2}\s*个?\s*工作日(内|之内)?/, '')
      .replace(/^(另外|还有|同时|并且|然后|不过|但是|预计|大概|大约|最快|一定|就是|说)\s*/g, '')
      .replace(/^(另外|还有|同时|并且|然后|不过|但是|预计|大概|大约|最快|一定|就是|说)\s*/g, '')
      .replace(/^[，,、：:\s]+/, '')
      .replace(/^(能|要|会|将|需|得)\s*/, '')
      .trim();
    if (t.length < 3) return { text: best.text.replace(SPEAKER_RE, '').trim(), due: best.due };
    return { text: t, due: best.due };
  }

  var NEWITEM_RE = /^(新增(一条)?(风险|问题|行动项|决议)|新起(一条)?(风险|问题))/;

  /** 风险的要害通常在转折之后：「A 已启动，但 B 拿不到数据」，取「但」之后那半句 */
  function candidateTitle(seg) {
    var body = cleanProgress(seg).replace(NEWITEM_RE, '').replace(/^[：:，,]\s*/, '');
    var turn = body.split(/但是|但|然而|不过/);
    var pick = turn.length > 1 ? turn.slice(1).join('') : body;
    return pick.split(/[，,。；;]/)[0].trim().slice(0, 40);
  }

  function typeOfNew(seg) {
    if (/风险/.test(seg)) return '风险';
    if (/问题/.test(seg)) return '问题';
    if (/决议/.test(seg)) return '决议';
    return '行动项';
  }

  /* ---------------- 主入口 ---------------- */

  /**
   * @param {string} text 纪要原文
   * @param {object} meeting {id,title,date}
   * @param {Array} items 当前全部事项
   * @returns {{patches:Array, unmatched:Array, stats:object}}
   */
  function analyze(text, meeting, items) {
    var index = {};
    items.forEach(function (it) { index[it.id] = it; });
    var roster = buildRoster(items);
    var segs = segment(text);
    var patches = [], unmatched = [], usedSeg = 0, consumed = {};

    segs.forEach(function (sg, si) {
      if (sg.head || consumed[si]) return;
      var seg = sg.text;
      usedSeg++;

      // 新事项候选：责任人与到期常落在紧邻的下一句，一并吸收
      if (NEWITEM_RE.test(seg)) {
        var nxt = segs[si + 1];
        var tail = (nxt && !nxt.head && nxt.i === sg.i && !NEWITEM_RE.test(nxt.text)) ? nxt.text : '';
        if (tail) consumed[si + 1] = 1;
        var whole = seg + tail;
        var nx0 = extractNext(whole, meeting.date);
        unmatched.push({
          key: 'new-' + si,
          quote: whole,
          newType: typeOfNew(seg),
          title: candidateTitle(seg),
          owner: findOwner(tail || seg, roster),
          due: nx0 ? nx0.due : '',
          detail: cleanProgress(whole),
          state: 'pending'
        });
        return;
      }

      var ids = explicitIds(seg, index);
      var conf, via, alts = [];
      if (ids.length) {
        conf = 0.97; via = '显式编号';
      } else {
        var fz = fuzzyMatch(seg, items, 3);
        if (!fz.length || fz[0].score < 0.34) return;
        ids = [fz[0].id];
        alts = fz.slice(1);
        conf = Math.round(fz[0].score * 100) / 100;
        via = '语义匹配';
      }

      var primary = ids[0];
      var related = ids.slice(1);
      var it = index[primary];
      if (!it) return;

      var prog = cleanProgress(seg);
      var nx = extractNext(seg, meeting.date);
      var owner = findOwner(seg, roster);

      var fields = [];
      if (prog && prog !== it.progress) {
        fields.push({ name: '最新进度', old: it.progress || '（空）', val: prog, key: 'progress' });
      }
      if (nx && nx.text && nx.text !== it.next) {
        fields.push({ name: '下一步', old: it.next || '（空）', val: nx.text, key: 'next' });
      }
      if (nx && nx.due && nx.due !== it.nextDue) {
        fields.push({ name: '下一步到期', old: it.nextDue || '（空）', val: nx.due, key: 'nextDue' });
      }
      if (owner && owner !== it.nextOwner) {
        fields.push({ name: '下一步负责人', old: it.nextOwner || '（空）', val: owner, key: 'nextOwner' });
      }
      // 状态改闭环要保守：整段里只要还有「还/待/尚未/等/剩」这类未了词，就不提闭环建议，
      // 避免「主体已完成，但某章节还等结论」被误判成整条闭环。
      var partial = /还|待|尚未|剩|未|等\s*[^的]/.test(seg);
      if (CLOSE_RE.test(seg) && !partial && it.status !== '已闭环') {
        fields.push({ name: '状态', old: it.status, val: '已闭环', key: 'status',
          guard: R.touchesCR(it) ? 'CR' : '' });
      } else if (OPEN_RE.test(seg) && it.status === '未开始') {
        fields.push({ name: '状态', old: it.status, val: '进行中', key: 'status' });
      }
      if (!fields.length) return;

      patches.push({
        key: meeting.id + '#' + primary + '#' + si,
        itemId: primary, related: related, alts: alts,
        confidence: conf, via: via,
        quote: seg, marks: ids.concat(nx && nx.text ? [nx.text] : []),
        fields: fields,
        escalate: it.staleWeeks >= 2 || /升到\s*L2|升\s*L2|连续第二周|连续 2 次/.test(seg),
        state: 'pending'
      });
    });

    return {
      patches: patches,
      unmatched: unmatched,
      stats: {
        segments: usedSeg,
        matched: patches.length,
        high: patches.filter(function (p) { return p.confidence >= 0.9; }).length,
        low: patches.filter(function (p) { return p.confidence < 0.9; }).length,
        news: unmatched.length
      }
    };
  }

  /** 会议智能总结 —— 由补丁集生成，不重新读原文 */
  function summarize(result, meeting, index) {
    var L = [];
    L.push('【' + meeting.title + '　' + meeting.date + '】');
    L.push('');
    L.push('一、本次更新覆盖 ' + result.patches.length + ' 条事项，新增候选 ' + result.unmatched.length + ' 条。');
    L.push('');
    L.push('二、进度与结论');
    result.patches.forEach(function (p) {
      var it = index[p.itemId];
      if (!it) return;
      var prog = (p.fields.filter(function (f) { return f.key === 'progress'; })[0] || {}).val;
      L.push('　· ' + p.itemId + '　' + it.title);
      if (prog) L.push('　　进度：' + prog);
    });
    L.push('');
    L.push('三、下一步待办（按责任人）');
    var byOwner = {};
    result.patches.forEach(function (p) {
      var nf = p.fields.filter(function (f) { return f.key === 'next'; })[0];
      if (!nf) return;
      var ow = (p.fields.filter(function (f) { return f.key === 'nextOwner'; })[0] || {}).val
        || (index[p.itemId] || {}).nextOwner || '待指定';
      var due = (p.fields.filter(function (f) { return f.key === 'nextDue'; })[0] || {}).val
        || (index[p.itemId] || {}).nextDue || '待定';
      (byOwner[ow] = byOwner[ow] || []).push('　　- [' + p.itemId + '] ' + nf.val + '　（' + due + '）');
    });
    Object.keys(byOwner).forEach(function (ow) {
      L.push('　' + ow);
      byOwner[ow].forEach(function (l) { L.push(l); });
    });
    if (!Object.keys(byOwner).length) L.push('　（无）');
    L.push('');
    L.push('四、升级建议（依据 5.3.1 / 5.3.2）');
    var esc = result.patches.filter(function (p) { return p.escalate; });
    if (esc.length) {
      esc.forEach(function (p) {
        var it = index[p.itemId] || {};
        L.push('　· ' + p.itemId + '　' + (it.title || '') + '　—— 已连续 ' + (it.staleWeeks || 2) + ' 次周会未闭环，建议升 L2 项目组负责人层');
      });
    } else {
      L.push('　（无）');
    }
    L.push('');
    L.push('五、新增事项候选');
    if (result.unmatched.length) {
      result.unmatched.forEach(function (u) {
        L.push('　· [' + u.newType + '] ' + u.title + '　责任人 ' + (u.owner || '待指定') + '　到期 ' + (u.due || '待定'));
      });
    } else {
      L.push('　（无）');
    }
    return L.join('\n');
  }

  global.MINUTES = { analyze: analyze, summarize: summarize, resolveDate: resolveDate };
})(window);
