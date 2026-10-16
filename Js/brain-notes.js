(() => {
      'use strict';
      const STORAGE_KEY = 'notelab.notes.v1';
      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
      const today = () => new Date().toISOString();
      const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const starterNotes = [
        { id: 'starter-1', title: 'O que significa viver bem?', body: 'Aristóteles relaciona a vida boa à eudaimonia: não apenas sentir prazer, mas cultivar virtudes e agir bem ao longo do tempo.\n\nUma pergunta para continuar: como distinguir uma vida boa de uma vida simplesmente confortável?\n\nIdeia relacionada: [[Atenção como recurso limitado]]', tags: ['filosofia','ética'], favorite: true, createdAt: '2026-10-12T12:00:00.000Z', updatedAt: '2026-10-12T12:00:00.000Z' },
        { id: 'starter-2', title: 'Atenção como recurso limitado', body: 'A atenção determina o que conseguimos perceber, aprender e lembrar. Interrupções frequentes tornam mais difícil sustentar o raciocínio; criar períodos sem notificações pode ajudar a aprofundar uma tarefa.\n\nPergunta aberta: que condições tornam o foco mais fácil?', tags: ['psicologia','foco','estudos'], favorite: false, createdAt: '2026-10-08T15:00:00.000Z', updatedAt: '2026-10-15T18:20:00.000Z' },
        { id: 'starter-3', title: 'Um segundo cérebro sem burocracia', body: 'Um sistema de notas deve facilitar o pensamento, não transformar cada ideia em uma tarefa administrativa. É melhor registrar primeiro e organizar depois.\n\nPrincípio: poucas regras, busca boa e conexões que tenham significado. Veja também [[O que significa viver bem?]]', tags: ['metodologia','filosofia'], favorite: true, createdAt: '2026-09-28T13:00:00.000Z', updatedAt: '2026-10-13T11:45:00.000Z' },
        { id: 'starter-4', title: 'Como estudar com recuperação ativa', body: 'Depois de estudar um assunto, feche o material e tente explicar o conceito com suas próprias palavras. Em seguida, confira o que esqueceu e corrija as lacunas.\n\nUma sessão pode terminar com três perguntas: o que aprendi, o que ainda confundo e como vou testar isso amanhã?', tags: ['estudos','metodologia'], favorite: false, createdAt: '2026-10-10T16:20:00.000Z', updatedAt: '2026-10-10T16:20:00.000Z' }
      ];

      let notes = loadNotes();
      let activeView = 'overview';
      let activeTag = 'all';
      let searchQuery = '';
      let toastTimer;
      let graphPoints = [];
      let lastFocusedElement = null;

      const elements = {
        grid: $('#notesGrid'), empty: $('#emptyState'), search: $('#searchInput'), sort: $('#sortSelect'),
        drawer: $('#editorDrawer'), backdrop: $('#drawerBackdrop'), form: $('#noteForm'), title: $('#noteTitleInput'),
        body: $('#noteBodyInput'), tags: $('#noteTagsInput'), id: $('#noteId'), favorite: $('#noteFavoriteInput'),
        deleteBtn: $('#deleteNoteBtn'), toast: $('#toast'), graph: $('#graphCanvas')
      };

      function loadNotes() {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (!saved) return starterNotes.map(n => ({ ...n, tags: [...n.tags] }));
          const parsed = JSON.parse(saved);
          if (!Array.isArray(parsed)) throw new Error('Invalid notes data');
          return parsed.filter(n => n && typeof n.id === 'string' && typeof n.title === 'string' && typeof n.body === 'string').map(normalizeNote);
        } catch (error) {
          console.warn('Não foi possível carregar as notas salvas.', error);
          return starterNotes.map(n => ({ ...n, tags: [...n.tags] }));
        }
      }
      function normalizeNote(note) {
        return {
          id: note.id || uid(), title: String(note.title || 'Sem título').slice(0, 140), body: String(note.body || ''),
          tags: Array.isArray(note.tags) ? [...new Set(note.tags.map(cleanTag).filter(Boolean))] : [],
          favorite: Boolean(note.favorite), createdAt: note.createdAt || today(), updatedAt: note.updatedAt || note.createdAt || today()
        };
      }
      function persist() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); return true; }
        catch (error) { showToast('Não foi possível salvar. O armazenamento do navegador pode estar cheio.'); console.error(error); return false; }
      }
      function cleanTag(tag) { return String(tag || '').trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase().slice(0, 32); }
      function allTags() { return [...new Set(notes.flatMap(note => note.tags))].sort((a,b) => a.localeCompare(b, 'pt-BR')); }
      function countConnections() { return buildEdges().length; }
      function buildEdges() {
        const edges = new Map();
        const byTitle = new Map(notes.map(n => [n.title.trim().toLocaleLowerCase('pt-BR'), n]));
        notes.forEach(note => {
          const referencedTitles = [...note.body.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1].trim().toLocaleLowerCase('pt-BR'));
          referencedTitles.forEach(title => { const target = byTitle.get(title); if (target && target.id !== note.id) { const key = [note.id,target.id].sort().join('::'); edges.set(key, { a: note.id, b: target.id }); } });
        });
        // Tags em comum criam uma relação visual de tema compartilhado.
        for (let i = 0; i < notes.length; i++) for (let j = i + 1; j < notes.length; j++) {
          if (notes[i].tags.some(tag => notes[j].tags.includes(tag))) {
            const key = [notes[i].id, notes[j].id].sort().join('::');
            if (!edges.has(key)) edges.set(key, { a: notes[i].id, b: notes[j].id });
          }
        }
        return [...edges.values()];
      }
      function formatDate(dateString, includeYear = false) {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return 'Data desconhecida';
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', ...(includeYear ? {year:'numeric'} : {}) }).format(date).replace('.', '').toUpperCase();
      }
      function excerpt(text, max = 170) { const trimmed = text.replace(/\[\[([^\]]+)\]\]/g, '$1').trim(); return trimmed.length > max ? trimmed.slice(0, max).trimEnd() + '…' : trimmed; }
      function escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
      function showToast(message) {
        clearTimeout(toastTimer); elements.toast.textContent = message; elements.toast.classList.add('show');
        toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2400);
      }
      function setView(view, tag = 'all') {
        activeView = view; activeTag = tag;
        $$('.nav-item[data-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
        const viewNames = {overview:'Visão geral',all:'Todas as notas',favorites:'Favoritas',tags:'Etiquetas'};
        $('#breadcrumbTitle').textContent = tag !== 'all' && tag !== 'favorites' ? `#${tag}` : viewNames[view] || 'Biblioteca';
        if (view === 'overview') {
          $('#welcomeEyebrow').textContent = 'UM ESPAÇO PARA PENSAR';
          $('#welcomeTitle').innerHTML = 'Suas ideias merecem<br>um lugar para crescer.';
          $('#welcomeSubtitle').textContent = 'Registre o que importa. Encontre de novo. Descubra conexões.';
          $('#notesHeading').textContent = 'Notas recentes';
          $('#notesSubheading').textContent = 'Tudo o que você registrou, em um só lugar.';
        } else if (view === 'favorites') {
          $('#welcomeEyebrow').textContent = 'COISAS QUE VALEM UMA SEGUNDA LEITURA';
          $('#welcomeTitle').textContent = 'Suas notas favoritas.';
          $('#welcomeSubtitle').textContent = 'Guarde aqui as ideias às quais você quer voltar.';
          $('#notesHeading').textContent = 'Favoritas';
          $('#notesSubheading').textContent = 'Ideias que você marcou para revisitar.';
        } else if (view === 'tags') {
          $('#welcomeEyebrow').textContent = 'ORGANIZAÇÃO LEVE';
          $('#welcomeTitle').textContent = 'Explore por assunto.';
          $('#welcomeSubtitle').textContent = 'As etiquetas ajudam a encontrar ideias sem criar pastas demais.';
          $('#notesHeading').textContent = tag !== 'all' ? `Notas com #${tag}` : 'Todas as notas';
          $('#notesSubheading').textContent = 'Escolha uma etiqueta para filtrar seu acervo.';
        } else {
          $('#welcomeEyebrow').textContent = 'SUA BIBLIOTECA PESSOAL';
          $('#welcomeTitle').textContent = 'Todas as suas notas.';
          $('#welcomeSubtitle').textContent = 'Tudo o que você pensa, aprende e quer lembrar.';
          $('#notesHeading').textContent = tag !== 'all' ? `Notas com #${tag}` : 'Todas as notas';
          $('#notesSubheading').textContent = 'Pesquise, edite e construa relações entre ideias.';
        }
        renderAll();
        $('#sidebar').classList.remove('menu-open'); $('#mobileMenuBtn').setAttribute('aria-expanded','false');
      }
      function getFilteredNotes() {
        let result = [...notes];
        if (activeView === 'favorites' || activeTag === 'favorites') result = result.filter(note => note.favorite);
        else if (activeTag !== 'all') result = result.filter(note => note.tags.includes(activeTag));
        const query = searchQuery.toLocaleLowerCase('pt-BR');
        if (query) result = result.filter(note => `${note.title} ${note.body} ${note.tags.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query));
        const sort = elements.sort.value;
        if (sort === 'title') result.sort((a,b) => a.title.localeCompare(b.title,'pt-BR'));
        else if (sort === 'created') result.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
        else result.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return result;
      }
      function renderNoteCard(note) {
        const tagsHTML = note.tags.length ? note.tags.slice(0,4).map((tag,i) => `<span class="tag ${i % 2 ? 'neutral' : ''}">#${escapeHTML(tag)}</span>`).join('') : '<span class="tag neutral">sem-etiquetas</span>';
        return `<article class="note-card" data-note-id="${escapeHTML(note.id)}">
          <div class="note-topline"><span class="note-kind">${note.favorite ? '★ NOTA FAVORITA' : 'NOTA PESSOAL'}</span><button class="favorite-btn ${note.favorite ? 'active' : ''}" data-action="favorite" data-id="${escapeHTML(note.id)}" aria-label="${note.favorite ? 'Remover das' : 'Adicionar às'} favoritas" title="${note.favorite ? 'Remover das favoritas' : 'Adicionar às favoritas'}">${note.favorite ? '★' : '☆'}</button></div>
          <button class="note-title" data-action="open" data-id="${escapeHTML(note.id)}">${escapeHTML(note.title || 'Sem título')}</button>
          <p class="note-excerpt">${escapeHTML(excerpt(note.body || 'Esta nota ainda não tem conteúdo.', 185))}</p>
          <div class="note-tags">${tagsHTML}</div>
          <div class="note-footer"><span>ATUALIZADA ${formatDate(note.updatedAt)}</span><span class="edit-hint">Abrir nota ↗</span></div>
        </article>`;
      }
      function renderNotes() {
        const filtered = getFilteredNotes();
        elements.grid.innerHTML = filtered.map(renderNoteCard).join('');
        elements.empty.hidden = filtered.length > 0;
        if (!filtered.length) {
          const noNotes = notes.length === 0;
          $('#emptyTitle').textContent = searchQuery ? 'Nenhuma nota encontrada.' : noNotes ? 'Sua biblioteca começa com uma ideia.' : activeView === 'favorites' || activeTag === 'favorites' ? 'Nenhuma favorita por enquanto.' : 'Nenhuma nota por aqui.';
          $('#emptyDescription').textContent = searchQuery ? 'Tente outro termo ou limpe a busca para ver suas notas.' : noNotes ? 'Escreva um pensamento, uma pergunta ou algo que queira lembrar.' : 'Experimente outro filtro ou crie uma nova nota.';
          $('#emptyCreateBtn').textContent = noNotes ? '＋ Criar minha primeira nota' : '＋ Criar uma nota';
        }
      }
      function renderStats() {
        $('#allCount').textContent = notes.length; $('#favoriteCount').textContent = notes.filter(n => n.favorite).length;
        $('#statNotes').textContent = notes.length; $('#statFavorites').textContent = notes.filter(n => n.favorite).length;
        $('#statTags').textContent = allTags().length; $('#statLinks').textContent = countConnections();
      }
      function renderTags() {
        const tags = allTags();
        $('#tagList').innerHTML = tags.length ? tags.slice(0,8).map(tag => `<button class="tag-row" data-action="tag" data-tag="${escapeHTML(tag)}"><span># ${escapeHTML(tag)}</span><span class="tag-count">${notes.filter(n => n.tags.includes(tag)).length}</span></button>`).join('') : '<p class="graph-caption">Suas etiquetas aparecerão aqui quando você criar notas.</p>';
        const filters = $('#filterRow');
        const fixedTags = ['filosofia','psicologia','estudos'];
        const visibleTags = [...new Set([...fixedTags, ...tags])].slice(0,5);
        filters.innerHTML = `<button class="filter-chip ${activeTag === 'all' ? 'active' : ''}" data-tag="all">Todas</button>` + visibleTags.map(tag => `<button class="filter-chip ${activeTag === tag ? 'active' : ''}" data-tag="${escapeHTML(tag)}"># ${escapeHTML(tag)}</button>`).join('') + `<button class="filter-chip ${activeTag === 'favorites' || activeView === 'favorites' ? 'active' : ''}" data-tag="favorites">☆ Favoritas</button>`;
      }
      function renderRecent() {
        const recent = [...notes].sort((a,b) => new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,3);
        $('#recentList').innerHTML = recent.length ? recent.map(n => `<button class="recent-item" data-action="open" data-id="${escapeHTML(n.id)}"><span class="recent-mark"></span><span class="recent-text"><span class="recent-title">${escapeHTML(n.title || 'Sem título')}</span><span class="recent-date">${formatDate(n.updatedAt, true)}</span></span></button>`).join('') : '<p class="graph-caption">As notas recentes aparecerão aqui.</p>';
      }
      function renderAll() { renderStats(); renderNotes(); renderTags(); renderRecent(); requestAnimationFrame(drawGraph); }

      function getGraphData() {
        const list = [...notes].sort((a,b) => new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,12);
        const ids = new Set(list.map(n => n.id));
        const edges = buildEdges().filter(e => ids.has(e.a) && ids.has(e.b));
        return {list, edges};
      }
      function drawGraph() {
        const canvas = elements.graph; if (!canvas) return;
        const rect = canvas.getBoundingClientRect(); if (!rect.width) return;
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
        const ctx = canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
        const w = rect.width, h = rect.height;
        ctx.clearRect(0,0,w,h);
        const {list, edges} = getGraphData();
        graphPoints = [];
        $('#graphCount').textContent = `${list.length} NÓS`;
        if (!list.length) { ctx.fillStyle = '#918a7e'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Suas ideias vão aparecer aqui',w/2,h/2); return; }
        const centerX = w/2, centerY = h/2;
        list.forEach((note,i) => {
          const angle = -Math.PI/2 + (2*Math.PI*i/list.length);
          const radius = list.length === 1 ? 0 : Math.min(w*.34,h*.34);
          graphPoints.push({ id:note.id, note, x:centerX + Math.cos(angle)*radius, y:centerY + Math.sin(angle)*radius });
        });
        const byId = new Map(graphPoints.map(p => [p.id,p]));
        ctx.lineWidth = 1;
        edges.forEach(edge => { const a=byId.get(edge.a), b=byId.get(edge.b); if (!a||!b) return; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.strokeStyle='rgba(105,114,90,.37)'; ctx.stroke(); });
        graphPoints.forEach((p,i) => {
          ctx.beginPath(); ctx.arc(p.x,p.y,p.note.favorite ? 5 : 4,0,Math.PI*2); ctx.fillStyle = p.note.favorite ? '#a66f52' : '#69725a'; ctx.fill();
          ctx.beginPath(); ctx.arc(p.x,p.y,8,0,Math.PI*2); ctx.strokeStyle='rgba(105,114,90,.12)'; ctx.stroke();
          if (list.length <= 6 || i < 5) {
            let label = p.note.title; if (label.length > 13) label = label.slice(0,12)+'…';
            ctx.font = '9px Inter, sans-serif'; ctx.fillStyle='#716b60'; ctx.textAlign = p.x > centerX+8 ? 'left' : p.x < centerX-8 ? 'right' : 'center';
            const dx = p.x > centerX+8 ? 9 : p.x < centerX-8 ? -9 : 0; const dy = p.y < centerY ? -9 : 15;
            ctx.fillText(label,p.x+dx,p.y+dy);
          }
        });
      }

      function openEditor(note = null) {
        lastFocusedElement = document.activeElement;
        elements.form.reset();
        if (note) {
          elements.id.value = note.id; elements.title.value = note.title; elements.body.value = note.body;
          elements.tags.value = note.tags.join(', '); elements.favorite.checked = note.favorite;
          $('#editorMode').textContent = 'EDITAR ANOTAÇÃO'; elements.deleteBtn.hidden = false;
        } else {
          elements.id.value = ''; elements.title.value = ''; elements.body.value = ''; elements.tags.value = ''; elements.favorite.checked = false;
          $('#editorMode').textContent = 'NOVA ANOTAÇÃO'; elements.deleteBtn.hidden = true;
        }
        elements.backdrop.classList.add('open'); elements.drawer.classList.add('open'); elements.drawer.setAttribute('aria-hidden','false');
        document.body.style.overflow = 'hidden'; setTimeout(() => elements.title.focus(), 100);
      }
      function closeEditor() {
        elements.backdrop.classList.remove('open'); elements.drawer.classList.remove('open'); elements.drawer.setAttribute('aria-hidden','true'); document.body.style.overflow = '';
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
      }
      function saveNote(event) {
        event.preventDefault();
        const title = elements.title.value.trim(); const body = elements.body.value.trim();
        if (!title) { elements.title.focus(); showToast('Dê um título para a sua nota.'); return; }
        const tags = [...new Set(elements.tags.value.split(',').map(cleanTag).filter(Boolean))];
        const existingIndex = notes.findIndex(n => n.id === elements.id.value);
        const old = existingIndex >= 0 ? notes[existingIndex] : null;
        const note = normalizeNote({ id: old ? old.id : uid(), title, body, tags, favorite: elements.favorite.checked, createdAt: old ? old.createdAt : today(), updatedAt: today() });
        if (old) notes[existingIndex] = note; else notes.unshift(note);
        if (!persist()) return;
        closeEditor();
        if (!old) { searchQuery = ''; elements.search.value = ''; setView('overview', 'all'); }
        else { setView(activeView, activeTag); }
        showToast(old ? 'Nota atualizada e salva.' : 'Nota criada e salva.');
      }
      function deleteCurrentNote() {
        const id = elements.id.value; const note = notes.find(n => n.id === id); if (!note) return;
        if (!window.confirm(`Excluir “${note.title}”? Essa ação não pode ser desfeita.`)) return;
        notes = notes.filter(n => n.id !== id); persist(); closeEditor(); setView(activeView, activeTag); showToast('Nota excluída.');
      }
      function toggleFavorite(id) {
        const note = notes.find(n => n.id === id); if (!note) return;
        note.favorite = !note.favorite; persist(); renderAll();
        showToast(note.favorite ? 'Adicionada às favoritas.' : 'Removida das favoritas.');
      }
      function exportBackup() {
        const payload = { app: 'NoteLab', formatVersion: 1, exportedAt: today(), notes };
        const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
        a.download = `notelab-backup-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('Backup exportado em JSON.');
      }
      function importBackup(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result)); const imported = Array.isArray(parsed) ? parsed : parsed.notes;
            if (!Array.isArray(imported) || !imported.every(n => n && typeof n.title === 'string' && typeof n.body === 'string')) throw new Error('Formato inválido');
            if (!window.confirm(`O backup contém ${imported.length} nota(s). Substituir as notas atuais? Exporte um backup antes para manter uma cópia.`)) return;
            notes = imported.map(n => normalizeNote({...n, id: n.id || uid()})); persist(); searchQuery = ''; elements.search.value = ''; setView('overview'); showToast(`${notes.length} nota(s) importada(s).`);
          } catch (error) { showToast('Arquivo inválido. Selecione um backup JSON do NoteLab.'); }
          $('#importFile').value = '';
        };
        reader.readAsText(file);
      }
      function handleAction(target) {
        const actionEl = target.closest('[data-action]'); if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (action === 'open') { const note = notes.find(n => n.id === actionEl.dataset.id); if (note) openEditor(note); }
        if (action === 'favorite') { toggleFavorite(actionEl.dataset.id); }
        if (action === 'tag') { searchQuery = ''; elements.search.value = ''; setView('tags', actionEl.dataset.tag); }
      }

      // Eventos principais
      $('#newNoteBtn').addEventListener('click', () => openEditor());
      $('#emptyCreateBtn').addEventListener('click', () => openEditor());
      $('#closeEditorBtn').addEventListener('click', closeEditor);
      $('#cancelEditorBtn').addEventListener('click', closeEditor);
      elements.backdrop.addEventListener('click', closeEditor);
      elements.form.addEventListener('submit', saveNote);
      elements.deleteBtn.addEventListener('click', deleteCurrentNote);
      elements.grid.addEventListener('click', event => {
        if (event.target.closest('[data-action]')) { handleAction(event.target); return; }
        const card = event.target.closest('.note-card');
        if (card) { const note = notes.find(n => n.id === card.dataset.noteId); if (note) openEditor(note); }
      });
      $('#tagList').addEventListener('click', event => handleAction(event.target));
      $('#recentList').addEventListener('click', event => handleAction(event.target));
      $('#filterRow').addEventListener('click', event => {
        const chip = event.target.closest('[data-tag]'); if (!chip) return;
        const tag = chip.dataset.tag; if (tag === 'favorites') setView('favorites','favorites'); else if (tag === 'all') setView(activeView === 'favorites' ? 'all':'overview','all'); else setView(activeView === 'overview' ? 'all' : activeView,tag);
      });
      $$('.nav-item[data-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view, btn.dataset.view === 'favorites' ? 'favorites' : 'all')));
      elements.search.addEventListener('input', () => { searchQuery = elements.search.value.trim(); renderNotes(); });
      elements.sort.addEventListener('change', renderNotes);
      $('#clearTagBtn').addEventListener('click', () => setView(activeView === 'favorites' ? 'favorites' : 'all', activeView === 'favorites' ? 'favorites' : 'all'));
      $('#exportBtn').addEventListener('click', exportBackup); $('#backupFooterBtn').addEventListener('click', exportBackup);
      $('#importBtn').addEventListener('click', () => $('#importFile').click());
      $('#importFile').addEventListener('change', event => importBackup(event.target.files[0]));
      $('#mobileMenuBtn').addEventListener('click', () => { const open = $('#sidebar').classList.toggle('menu-open'); $('#mobileMenuBtn').setAttribute('aria-expanded',String(open)); });
      $('#brandHome').addEventListener('click', event => { event.preventDefault(); setView('overview','all'); window.scrollTo({top:0,behavior:'smooth'}); });
      $('#howItWorksBtn').addEventListener('click', () => window.alert('O NoteLab guarda suas notas neste navegador. Crie uma nota, adicione etiquetas separadas por vírgulas e conecte ideias usando [[título exato de outra nota]]. Use Exportar backup para salvar uma cópia JSON. Não existe sincronização em nuvem nesta versão.'));
      elements.graph.addEventListener('click', event => {
        const rect = elements.graph.getBoundingClientRect(); const x = event.clientX - rect.left, y = event.clientY - rect.top;
        const nearest = graphPoints.map(p => ({...p, distance:Math.hypot(x-p.x,y-p.y)})).sort((a,b)=>a.distance-b.distance)[0];
        if (nearest && nearest.distance < 18) openEditor(nearest.note);
      });
      elements.graph.addEventListener('keydown', event => {
        if ((event.key === 'Enter' || event.key === ' ') && graphPoints[0]) { event.preventDefault(); openEditor(graphPoints[0].note); }
      });
      document.addEventListener('keydown', event => {
        const key = event.key.toLowerCase();
        if ((event.ctrlKey || event.metaKey) && key === 'k') { event.preventDefault(); elements.search.focus(); elements.search.select(); }
        if ((event.ctrlKey || event.metaKey) && key === 'n') { event.preventDefault(); openEditor(); }
        if (event.key === 'Escape' && elements.drawer.classList.contains('open')) closeEditor();
      });
      window.addEventListener('resize', () => requestAnimationFrame(drawGraph));

      // Data inicial e primeira renderização
      persist();
      const date = new Date();
      $('#todayDate').innerHTML = `${new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(date).toLocaleUpperCase('pt-BR')}<br>${new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric'}).format(date).toLocaleUpperCase('pt-BR')}`;
      renderAll();
      // Allows Brain Notes to open a specific item directly in the editor.
      const pageParams = new URLSearchParams(window.location.search);
      const requestedNoteId = pageParams.get('note');
      const requestedView = pageParams.get('view');
      if (requestedNoteId) {
        const requestedNote = notes.find(note => note.id === requestedNoteId);
        if (requestedNote) requestAnimationFrame(() => openEditor(requestedNote));
      } else if (pageParams.get('new') === '1') {
        requestAnimationFrame(() => openEditor());
      } else if (['overview', 'all', 'favorites', 'tags'].includes(requestedView)) {
        requestAnimationFrame(() => setView(requestedView, requestedView === 'favorites' ? 'favorites' : 'all'));
      }
    })();
