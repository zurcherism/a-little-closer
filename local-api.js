// local-api.js — 懂你一点 · 纯前端部署的本地 API 适配器
// 用 localStorage + 链接内嵌数据取代原服务器（SQLite/D1），
// 完整实现原 /api 的语义：报告草稿、分享链接、双人邀请与共同报告。
import { giftQuestions } from './data.js';
import { scores } from './engine.js';

const uid = () => crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().slice(0, 8);
const digest = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), x => x.toString(16).padStart(2, '0')).join('');

const b64u = {
  enc: o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, ''),
  dec: s => JSON.parse(decodeURIComponent(escape(atob(s.replaceAll('-', '+').replaceAll('_', '/'))))),
};

const fail = (message, status = 400) => { const e = new Error(message); e.status = status; throw e; };

const store = {
  read(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch { return d } },
  write(k, v) { localStorage.setItem(k, JSON.stringify(v)) },
};
const allReports = () => store.read('closer.reports', {});
const putReports = m => store.write('closer.reports', m);
const allPairs = () => store.read('closer.pairs', {});
const putPairs = m => store.write('closer.pairs', m);

const clean = v => typeof v === 'string' ? v.trim().slice(0, 2000) : '';

// 与原服务器 validateData 完全一致
function validateData(kind, data, complete) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('问卷数据格式不正确');
  if (kind === 'gift') {
    const out = {};
    for (const q of giftQuestions) {
      let v = data[q.id];
      if (q.type === 'multi') {
        v = Array.isArray(v) ? [...new Set(v)].filter(s => q.options.includes(s)).slice(0, q.max || 3) : [];
        if (v.includes('不确定')) v = ['不确定'];
      } else {
        v = clean(v);
        if (q.type === 'choice' && !q.options.includes(v)) v = '';
      }
      if (complete && q.required && (!v || Array.isArray(v) && !v.length)) fail('请完成：' + q.label);
      out[q.id] = v;
    }
    if (complete && (!Number.isFinite(Number(out.budget)) || Number(out.budget) < 0 || Number(out.budget) > 1000000)) fail('请输入 0～1000000 之间的预算');
    if (complete && (!/^\d{4}-\d{2}-\d{2}$/.test(out.date) || Number.isNaN(Date.parse(out.date)))) fail('请填写有效日期');
    return out;
  }
  if (kind === 'relationship') {
    const answers = Array.from({ length: 24 }, (_, i) => {
      const v = data.answers?.[i];
      return Number.isInteger(v) && v >= 0 && v <= 5 ? v : null;
    });
    if (complete && answers.some(v => v === null)) fail('请完成所有题目；无法判断时可以跳过');
    return { answers, name: clean(data.name) || '我', duration: clean(data.duration), living: clean(data.living), change: clean(data.change), notes: clean(data.notes), mode: data.mode === 'duo' ? 'duo' : 'solo', consent: data.consent === true };
  }
  fail('未知问卷类型');
}

const titleOf = (kind, data) => kind === 'gift' ? `给${data.name || 'TA'}的送礼指南` : `${data.name || '我'}的关系体验`;

const sharePayload = r => r.kind === 'gift'
  ? r.data
  : { name: r.data.name, computed: scores(r.data.answers) };

const findPairByReport = (pairs, reportId) => Object.values(pairs).find(p => p.reportA === reportId || p.reportB === reportId) || null;

const json = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

async function handleApi(pathname, method, body) {
  // GET /api/reports — 列表
  if (pathname === '/api/reports' && method === 'GET') {
    const reports = Object.values(allReports()).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100)
      .map(({ id, kind, status, title, created_at }) => ({ id, kind, status, title, created_at }));
    return json({ reports });
  }

  // POST /api/reports — 新建
  if (pathname === '/api/reports' && method === 'POST') {
    const kind = body.kind, status = body.status === 'complete' ? 'complete' : 'draft';
    const data = validateData(kind, body.data, status === 'complete');
    const id = uid();
    const reports = allReports();
    reports[id] = { id, kind, status, title: titleOf(kind, data), data, created_at: new Date().toISOString() };
    let pairId = null;
    if (kind === 'relationship' && status === 'complete' && data.mode === 'duo') {
      const pairs = allPairs();
      pairId = uid();
      pairs[pairId] = { id: pairId, reportA: id, invite: 'u.' + b64u.enc({ a: data, ca: data.consent }), consentA: data.consent ? 1 : 0, reportB: null, consentB: 0, external: false, created_at: new Date().toISOString() };
      putPairs(pairs);
    }
    putReports(reports);
    return json({ id, pairId }, 201);
  }

  // GET|PATCH|DELETE /api/reports/:id
  let m = pathname.match(/^\/api\/reports\/([A-Za-z0-9._-]+)$/);
  if (m) {
    const id = m[1], reports = allReports(), row = reports[id];
    if (!row) fail('报告不存在，或不属于当前浏览器', 404);
    if (method === 'GET') return json({ ...row, pairId: findPairByReport(allPairs(), id)?.id || null });
    if (method === 'DELETE') {
      const pairs = allPairs();
      for (const [pid, p] of Object.entries(pairs)) if (p.reportA === id || p.reportB === id) delete pairs[pid];
      delete reports[id];
      putPairs(pairs); putReports(reports);
      return json({ ok: true });
    }
    if (method === 'PATCH') {
      if (body.feedback !== undefined) {
        if (!['helpful', 'not-helpful'].includes(body.feedback)) fail('无效反馈');
        row.feedback = body.feedback; putReports(reports);
        return json({ ok: true });
      }
      if (body.share !== undefined) {
        if (row.status !== 'complete') fail('草稿不能分享');
        if (findPairByReport(allPairs(), id)) fail('双人报告仅对已授权的双方开放');
        row.share = body.share === true ? 's.' + b64u.enc({ rid: id, kind: row.kind, title: row.title, data: sharePayload(row), created_at: row.created_at }) : null;
        putReports(reports);
        return json({ share: row.share });
      }
      if (row.status !== 'draft') fail('已完成的报告不能覆盖，请创建新测评');
      const status = body.status === 'complete' ? 'complete' : 'draft';
      const data = validateData(row.kind, body.data, status === 'complete');
      row.data = data; row.status = status; row.title = titleOf(row.kind, data);
      let pairId = null;
      if (status === 'complete' && row.kind === 'relationship' && data.mode === 'duo') {
        const pairs = allPairs();
        pairId = uid();
        pairs[pairId] = { id: pairId, reportA: id, invite: 'u.' + b64u.enc({ a: data, ca: data.consent }), consentA: data.consent ? 1 : 0, reportB: null, consentB: 0, external: false, created_at: new Date().toISOString() };
        putPairs(pairs);
      }
      putReports(reports);
      return json({ id, pairId });
    }
    fail('不支持此操作', 405);
  }

  // GET /api/shared/:token — 分享链接（数据内嵌在链接里，跨设备可用）
  m = pathname.match(/^\/api\/shared\/([A-Za-z0-9._-]+)$/);
  if (m && method === 'GET') {
    const token = m[1];
    if (!token.startsWith('s.')) fail('分享链接已撤销或不存在', 404);
    const payload = b64u.dec(token.slice(2));
    const local = payload.rid && allReports()[payload.rid];
    if (local && !local.share) fail('分享链接已撤销或不存在', 404);
    return json({ kind: payload.kind, title: payload.title, created_at: payload.created_at, data: payload.data });
  }

  // GET|POST /api/invite/:token — 伴侣邀请（发起人数据内嵌在链接里）
  m = pathname.match(/^\/api\/invite\/([A-Za-z0-9._-]+)$/);
  if (m) {
    const token = m[1];
    const pairs = allPairs();
    const localPair = Object.values(pairs).find(p => p.invite === token) || null;
    if (method === 'GET') {
      if (localPair) {
        if (localPair.reportB) return json({ available: false, pairId: localPair.id });
        fail('这是你自己的邀请，请让伴侣在另一个浏览器中打开', 403);
      }
      if (!token.startsWith('u.')) fail('邀请已撤销或不存在', 404);
      b64u.dec(token.slice(2)); // 校验格式
      return json({ available: true, pairId: null });
    }
    if (method === 'POST') {
      if (localPair) {
        if (localPair.reportB) fail('你已完成本次邀请，请从我的报告打开', 409);
        fail('这是你自己的邀请，请让伴侣在另一个浏览器中打开', 403);
      }
      if (!token.startsWith('u.')) fail('邀请已撤销或不存在', 404);
      const payload = b64u.dec(token.slice(2));
      const data = validateData('relationship', { ...body.data, mode: 'duo' }, true);
      const id = uid();
      const reports = allReports();
      reports[id] = { id, kind: 'relationship', status: 'complete', title: titleOf('relationship', data), data, created_at: new Date().toISOString() };
      const pairId = 'p' + (await digest(JSON.stringify([payload.a.name, payload.a.answers, data.name, data.answers]))).slice(0, 31);
      pairs[pairId] = { id: pairId, reportA: null, aData: payload.a, consentA: payload.ca ? 1 : 0, reportB: id, consentB: data.consent ? 1 : 0, invite: token, external: true, created_at: new Date().toISOString() };
      putReports(reports); putPairs(pairs);
      return json({ id, pairId }, 201);
    }
    fail('不支持此操作', 405);
  }

  // GET|PATCH /api/pairs/:id
  m = pathname.match(/^\/api\/pairs\/([A-Za-z0-9._-]+)$/);
  if (m) {
    const id = m[1], pairs = allPairs(), pair = pairs[id];
    if (!pair) fail('共同报告不存在或无权访问', 404);
    if (method === 'PATCH') {
      if (body.revokeInvite) {
        if (pair.external) fail('仅发起者可更换邀请', 403);
        const mine = allReports()[pair.reportA];
        pair.invite = 'u.' + b64u.enc({ a: mine.data, ca: !!pair.consentA });
        putPairs(pairs);
        return json({ ok: true });
      }
      if (pair.external) pair.consentB = body.consent === true ? 1 : 0;
      else pair.consentA = body.consent === true ? 1 : 0;
      putPairs(pairs);
      return json({ ok: true });
    }
    if (method === 'GET') {
      if (pair.external) {
        // 本设备是受邀方（B）
        const mineData = { ...allReports()[pair.reportB].data };
        const shared = !!(pair.consentA && pair.consentB);
        const partner = shared ? { name: pair.aData.name, computed: scores(pair.aData.answers, mineData.answers) } : null;
        if (shared) mineData.computed = scores(mineData.answers, pair.aData.answers);
        const returnLink = shared
          ? location.origin + location.pathname + '#joined/' + 'j.' + b64u.enc({
              n: await digest(pair.id),
              a: { name: pair.aData.name, answers: pair.aData.answers },
              b: { name: mineData.name, answers: mineData.answers },
              ca: !!pair.consentA, cb: !!pair.consentB,
            })
          : null;
        return json({ id, shared, partner, consent: !!pair.consentB, partnerReady: true, data: mineData, invite: null, returnLink });
      }
      // 本设备是发起方（A）
      const mineData = { ...allReports()[pair.reportA].data };
      const other = pair.reportB ? allReports()[pair.reportB] : null;
      const shared = !!(pair.consentA && pair.consentB && other);
      const partner = shared ? { name: other.data.name, computed: scores(other.data.answers, mineData.answers) } : null;
      if (shared) mineData.computed = scores(mineData.answers, other.data.answers);
      return json({ id, shared, partner, consent: !!pair.consentA, partnerReady: !!pair.reportB, data: mineData, invite: !pair.reportB ? pair.invite : null, returnLink: null });
    }
    fail('不支持此操作', 405);
  }

  // GET /api/joined/:token — 回传链接：在本设备落地共同报告
  m = pathname.match(/^\/api\/joined\/([A-Za-z0-9._-]+)$/);
  if (m && method === 'GET') {
    const token = m[1];
    if (!token.startsWith('j.')) fail('链接无效或已过期', 404);
    const p = b64u.dec(token.slice(2));
    const nonce = String(p.n || '').replace(/[^a-f0-9]/g, '').slice(0, 24) || uid().slice(0, 24);
    const now = new Date().toISOString();
    const reports = allReports();
    const reportA = 'ra' + nonce.slice(0, 30), reportB = 'rb' + nonce.slice(0, 30), pairId = 'rp' + nonce.slice(0, 30);
    const dataA = { ...p.a, mode: 'duo', consent: !!p.ca };
    const dataB = { ...p.b, mode: 'duo', consent: !!p.cb };
    reports[reportA] = reports[reportA] || { id: reportA, kind: 'relationship', status: 'complete', title: titleOf('relationship', dataA), data: dataA, created_at: now };
    reports[reportA].data = dataA; reports[reportA].status = 'complete'; reports[reportA].title = titleOf('relationship', dataA);
    reports[reportB] = reports[reportB] || { id: reportB, kind: 'relationship', status: 'complete', title: titleOf('relationship', dataB), data: dataB, created_at: now };
    reports[reportB].data = dataB; reports[reportB].status = 'complete'; reports[reportB].title = titleOf('relationship', dataB);
    const pairs = allPairs();
    pairs[pairId] = { id: pairId, reportA, invite: null, consentA: p.ca ? 1 : 0, reportB, consentB: p.cb ? 1 : 0, external: false, created_at: now };
    putReports(reports); putPairs(pairs);
    return json({ id: reportA });
  }

  fail('页面不存在', 404);
}

const realFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (!url.startsWith('/api') && !url.endsWith('/api') && !(url.startsWith('http') && new URL(url).pathname.startsWith('/api'))) {
    return realFetch(input, init);
  }
  try {
    const pathname = new URL(url, location.href).pathname;
    const method = (init.method || 'GET').toUpperCase();
    let body = {};
    if (!['GET', 'HEAD'].includes(method) && init.body) {
      if (String(init.body).length > 24000) fail('提交内容过长', 413);
      try { body = JSON.parse(init.body) } catch { fail('无法读取提交内容') }
    }
    return await handleApi(pathname, method, body);
  } catch (error) {
    return json({ error: error.status ? error.message : '暂时无法保存，请保留当前页面后重试。' }, error.status || 503);
  }
};
