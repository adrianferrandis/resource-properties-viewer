(function() {
  const vscode = acquireVsCodeApi();

  // State
  let bundleModel = null;
  let currentFilter = '';
  let filterMode = 'keys';
  let editingCell = null;
  let showTree = false;
  let showUnicode = true;
  let showRawView = false;
  let keySeparator = '.';
  
  function encodeUnicode(str) {
    return str.replace(/[^\x00-\x7F]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
  }

  function render() {
    const app = document.getElementById('app');
    if (!app || !bundleModel) return;
    app.innerHTML = '';
    renderHeader();
    renderToolbar();
    
    if (showRawView) {
      renderRawView();
    } else if (showTree) {
      renderTreeView();
    } else {
      renderFlatTable();
    }
  }

  function renderRawView() {
    const app = document.getElementById('app');
    const container = document.createElement('div');
    container.className = 'raw-view-container';
    
    const info = document.createElement('div');
    info.className = 'raw-info';
    info.textContent = 'Raw file content (read-only view):';
    container.appendChild(info);
    
    const textarea = document.createElement('textarea');
    textarea.className = 'raw-content';
    textarea.readOnly = true;
    
    let rawContent = '';
    if (bundleModel._rawContents && bundleModel._rawContents[0]) {
      rawContent = bundleModel._rawContents[0];
    } else {
      Object.keys(bundleModel.entries).sort().forEach(key => {
        const value = bundleModel.entries[key][bundleModel.locales[0]] || '';
        rawContent += `${key}=${value}\n`;
      });
    }
    
    textarea.value = rawContent;
    container.appendChild(textarea);
    app.appendChild(container);
  }

  function renderHeader() {
    const app = document.getElementById('app');
    const header = document.createElement('div');
    header.className = 'header';
    
    const fileCount = bundleModel.locales.length;
    const isSingleFile = fileCount === 1;
    
    const title = document.createElement('h1');
    title.textContent = isSingleFile ? 'Properties Editor' : 'Resource Properties Viewer';
    
    const subtitle = document.createElement('div');
    subtitle.className = 'subtitle';
    if (isSingleFile) {
      subtitle.textContent = `Editing ${bundleModel.locales[0] === 'default' ? 'single file' : bundleModel.locales[0]}`;
    } else {
      subtitle.textContent = `${fileCount} locales • ${Object.keys(bundleModel.entries).length} keys`;
    }
    
    header.appendChild(title);
    header.appendChild(subtitle);
    app.appendChild(header);
  }

  function renderToolbar() {
    const app = document.getElementById('app');
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    
    // Open as Text button
    const openTextBtn = document.createElement('button');
    openTextBtn.textContent = '📄 Open as Text';
    openTextBtn.title = 'Switch to text editor';
    openTextBtn.onclick = () => {
      vscode.postMessage({ type: 'openTextEditor' });
    };
    toolbar.appendChild(openTextBtn);
    
    // Separator
    const separator = document.createElement('div');
    separator.className = 'toolbar-separator';
    toolbar.appendChild(separator);
    
    // View toggle
    const viewGroup = document.createElement('div');
    viewGroup.className = 'btn-group';
    
    const flatBtn = document.createElement('button');
    flatBtn.textContent = '📋 Flat';
    flatBtn.className = !showTree ? 'active' : '';
    flatBtn.onclick = () => { showTree = false; render(); };
    
    const treeBtn = document.createElement('button');
    treeBtn.textContent = '🌳 Tree';
    treeBtn.className = showTree ? 'active' : '';
    treeBtn.onclick = () => { showTree = true; render(); };
    
    viewGroup.appendChild(flatBtn);
    viewGroup.appendChild(treeBtn);
    toolbar.appendChild(viewGroup);
    
    // Filter
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    
    const filterIcon = document.createElement('span');
    filterIcon.textContent = '🔍';
    
    const filterInput = document.createElement('input');
    filterInput.type = 'search';
    filterInput.placeholder = filterMode === 'keys' ? 'Filter keys...' : 'Filter keys or values...';
    filterInput.value = currentFilter;
    filterInput.className = 'filter-input';
    filterInput.oninput = (e) => {
      currentFilter = e.target.value || '';
      if (!showTree) renderFlatTable();
      else renderTreeView();
    };
    
    const filterModeBtn = document.createElement('button');
    filterModeBtn.textContent = filterMode === 'keys' ? '🔑' : '📝';
    filterModeBtn.title = filterMode === 'keys' ? 'Filter: Keys only (click to search values too)' : 'Filter: Keys + Values (click for keys only)';
    filterModeBtn.className = filterMode === 'all' ? 'btn-icon active' : 'btn-icon';
    filterModeBtn.onclick = () => {
      filterMode = filterMode === 'keys' ? 'all' : 'keys';
      filterInput.placeholder = filterMode === 'keys' ? 'Filter keys...' : 'Filter keys or values...';
      filterModeBtn.textContent = filterMode === 'keys' ? '🔑' : '📝';
      filterModeBtn.title = filterMode === 'keys' ? 'Filter: Keys only (click to search values too)' : 'Filter: Keys + Values (click for keys only)';
      filterModeBtn.className = filterMode === 'all' ? 'btn-icon active' : 'btn-icon';
      if (!showTree) renderFlatTable();
      else renderTreeView();
    };
    
    filterContainer.appendChild(filterIcon);
    filterContainer.appendChild(filterInput);
    filterContainer.appendChild(filterModeBtn);
    toolbar.appendChild(filterContainer);
    
    // Actions
    const actionGroup = document.createElement('div');
    actionGroup.className = 'btn-group';
    
    const addBtn = document.createElement('button');
    addBtn.textContent = '➕ Add Key';
    addBtn.className = 'btn-primary';
    addBtn.onclick = showAddKeyDialog;
    
    const unicodeBtn = document.createElement('button');
    unicodeBtn.textContent = showUnicode ? '🔤 Unicode' : '🔡 Text';
    unicodeBtn.onclick = () => {
      showUnicode = !showUnicode;
      localStorage.setItem('rbe_unicode', showUnicode);
      render();
    };
    
    const rawBtn = document.createElement('button');
    rawBtn.textContent = '📄 Raw';
    rawBtn.onclick = () => {
      showRawView = !showRawView;
      render();
    };
    
    actionGroup.appendChild(addBtn);
    actionGroup.appendChild(unicodeBtn);
    actionGroup.appendChild(rawBtn);
    toolbar.appendChild(actionGroup);
    
    app.appendChild(toolbar);
  }

  function renderFlatTable() {
    const app = document.getElementById('app');
    
    const existingContainer = app.querySelector('.table-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    const existingTree = app.querySelector('.tree-view-container');
    if (existingTree) {
      existingTree.remove();
    }
    
    const existingRaw = app.querySelector('.raw-view-container');
    if (existingRaw) {
      existingRaw.remove();
    }
    
    const container = document.createElement('div');
    container.className = 'table-container';
    
    const table = document.createElement('table');
    table.className = 'prop-table';
    
    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const keyTh = document.createElement('th');
    keyTh.className = 'key-col';
    keyTh.textContent = 'Key';
    headerRow.appendChild(keyTh);
    
    bundleModel.locales.forEach(loc => {
      const th = document.createElement('th');
      th.className = 'value-col';
      th.textContent = loc === 'default' ? '(default)' : loc;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Body
    const tbody = document.createElement('tbody');
    const searchTerm = currentFilter.toLowerCase();
    const keys = Object.keys(bundleModel.entries).sort()
      .filter(key => {
        if (!currentFilter) return true;
        if (key.toLowerCase().includes(searchTerm)) return true;
        if (filterMode === 'all') {
          const entry = bundleModel.entries[key];
          return bundleModel.locales.some(loc => {
            const val = entry[loc];
            return val && val.toLowerCase().includes(searchTerm);
          });
        }
        return false;
      });
    
    if (keys.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = bundleModel.locales.length + 1;
      emptyCell.className = 'empty-message';
      emptyCell.textContent = currentFilter ? 'No keys match your filter' : 'No keys found. Click "Add Key" to create one.';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      keys.forEach(key => {
        const row = document.createElement('tr');
        
        // Key cell
        const keyCell = document.createElement('td');
        keyCell.className = 'key-cell';
        keyCell.innerHTML = `<code>${escapeHtml(key)}</code>`;
        keyCell.title = 'Right-click for options';
        keyCell.oncontextmenu = (e) => showKeyContextMenu(e, key);
        row.appendChild(keyCell);
        
        // Value cells
        let rowHasMissing = false;
        bundleModel.locales.forEach(loc => {
          const cell = document.createElement('td');
          cell.className = 'value-cell editable';
          cell.dataset.key = key;
          cell.dataset.locale = loc;
          
          const value = bundleModel.entries[key][loc];
          const displayValue = value ?? '';
          
          if (displayValue === '') {
            cell.classList.add('empty');
            cell.innerHTML = '<span class="placeholder">(empty)</span>';
            rowHasMissing = true;
          } else {
            cell.textContent = showUnicode ? encodeUnicode(displayValue) : displayValue;
          }
          
          cell.onclick = () => startEdit(cell);
          row.appendChild(cell);
        });
        
        if (rowHasMissing) row.classList.add('has-missing');
        tbody.appendChild(row);
      });
    }
    
    table.appendChild(tbody);
    container.appendChild(table);
    app.appendChild(container);
  }

  function renderTreeView() {
    const app = document.getElementById('app');
    const container = document.createElement('div');
    container.className = 'tree-view-container';
    
    const leftPanel = document.createElement('div');
    leftPanel.className = 'tree-panel';
    
    const treeTitle = document.createElement('div');
    treeTitle.className = 'panel-title';
    treeTitle.textContent = 'Key Hierarchy';
    leftPanel.appendChild(treeTitle);
    
    const treeRoot = document.createElement('ul');
    treeRoot.className = 'tree-list';
    
    // Build tree
    const searchTerm = currentFilter.toLowerCase();
    const keys = Object.keys(bundleModel.entries).sort()
      .filter(key => {
        if (!currentFilter) return true;
        if (key.toLowerCase().includes(searchTerm)) return true;
        if (filterMode === 'all') {
          const entry = bundleModel.entries[key];
          return bundleModel.locales.some(loc => {
            const val = entry[loc];
            return val && val.toLowerCase().includes(searchTerm);
          });
        }
        return false;
      });
    
    const tree = {};
    keys.forEach(key => {
      const parts = key.split(keySeparator);
      let node = tree;
      parts.forEach((part, i) => {
        if (!node[part]) node[part] = { _children: {}, _key: i === parts.length - 1 ? key : null };
        node = node[part]._children;
      });
    });
    
    function renderNode(node, parent, level = 0) {
      Object.keys(node).sort().forEach(name => {
        const nodeData = node[name];
        const li = document.createElement('li');
        li.className = 'tree-item';
        li.style.paddingLeft = (level * 16) + 'px';
        
        const content = document.createElement('div');
        content.className = 'tree-item-content';
        
        if (Object.keys(nodeData._children).length > 0) {
          content.innerHTML = `<span class="tree-icon">📁</span> ${escapeHtml(name)}`;
          content.onclick = () => {
            li.classList.toggle('expanded');
            const children = li.querySelector('.tree-children');
            if (children) children.style.display = children.style.display === 'none' ? 'block' : 'none';
          };
        } else {
          content.innerHTML = `<span class="tree-icon">📝</span> ${escapeHtml(name)}`;
          content.onclick = () => scrollToKey(nodeData._key);
        }
        
        li.appendChild(content);
        
        if (Object.keys(nodeData._children).length > 0) {
          const childrenUl = document.createElement('ul');
          childrenUl.className = 'tree-children';
          renderNode(nodeData._children, childrenUl, level + 1);
          li.appendChild(childrenUl);
        }
        
        parent.appendChild(li);
      });
    }
    
    renderNode(tree, treeRoot);
    leftPanel.appendChild(treeRoot);
    container.appendChild(leftPanel);
    
    // Right panel with table for selected key
    const rightPanel = document.createElement('div');
    rightPanel.className = 'details-panel';
    rightPanel.innerHTML = '<div class="panel-title">Select a key from the tree to edit</div>';
    container.appendChild(rightPanel);
    
    app.appendChild(container);
  }

  function scrollToKey(key) {
    showTree = false;
    render();
    const cell = document.querySelector(`td[data-key="${key}"]`);
    if (cell) {
      cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cell.parentElement.classList.add('highlighted');
      setTimeout(() => cell.parentElement.classList.remove('highlighted'), 2000);
    }
  }

  function startEdit(cell) {
    if (editingCell) return;
    editingCell = cell;
    
    const key = cell.dataset.key;
    const locale = cell.dataset.locale;
    const currentValue = bundleModel.entries[key][locale] ?? '';
    
    cell.dataset.originalValue = currentValue;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.className = 'cell-input';
    
    input.onkeydown = (ev) => {
      if (ev.key === 'Enter') saveEdit(key, locale, input.value);
      if (ev.key === 'Escape') cancelEdit();
    };
    
    input.onblur = () => saveEdit(key, locale, input.value);
    
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();
  }

  function saveEdit(key, locale, value) {
    if (!editingCell) return;
    
    const originalValue = editingCell.dataset.originalValue;
    if (value !== originalValue) {
      vscode.postMessage({ type: 'edit', key, locale, value });
    }
    
    cancelEdit();
  }

  function cancelEdit() {
    if (!editingCell) return;
    const key = editingCell.dataset.key;
    const locale = editingCell.dataset.locale;
    const value = bundleModel.entries[key][locale] ?? '';
    
    if (value === '') {
      editingCell.innerHTML = '<span class="placeholder">(empty)</span>';
      editingCell.classList.add('empty');
    } else {
      editingCell.textContent = showUnicode ? encodeUnicode(value) : value;
      editingCell.classList.remove('empty');
    }
    
    editingCell = null;
  }

  function showAddKeyDialog() {
    const isSingleFile = bundleModel.locales.length === 1;
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'dialog';
    dialogContent.innerHTML = `
      <h3>Add New Key</h3>
      <div class="dialog-body">
        <label>Key name:</label>
        <input type="text" id="newKeyInput" placeholder="e.g., app.config.timeout" autofocus>
        <div class="hint">Use dots for hierarchy (e.g., ui.dialog.title)</div>
        ${isSingleFile ? '' : '<div class="info">This will add the key to all locale files</div>'}
      </div>
      <div class="dialog-actions">
        <button class="btn-secondary" id="addKeyCancel">Cancel</button>
        <button class="btn-primary" id="addKeySubmit">Add Key</button>
      </div>
    `;
    
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);
    
    const input = document.getElementById('newKeyInput');
    input.focus();
    input.onkeydown = (e) => {
      if (e.key === 'Enter') submitAddKey();
      if (e.key === 'Escape') dialog.remove();
    };
    
    function submitAddKey() {
      const key = input.value.trim();
      if (key) {
        vscode.postMessage({ type: 'addKey', key });
        dialog.remove();
      }
    }
    
    document.getElementById('addKeyCancel').onclick = () => dialog.remove();
    document.getElementById('addKeySubmit').onclick = submitAddKey;
  }

  function showKeyContextMenu(e, key) {
    e.preventDefault();
    
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    
    const deleteItem = document.createElement('div');
    deleteItem.className = 'menu-item danger';
    deleteItem.textContent = '🗑️ Delete Key';
    deleteItem.onclick = () => {
      menu.remove();
      showDeleteConfirmDialog(key);
    };
    
    const commentItem = document.createElement('div');
    commentItem.className = 'menu-item';
    commentItem.textContent = '💬 Toggle Comment';
    commentItem.onclick = () => {
      vscode.postMessage({ type: 'toggleComment', key });
      menu.remove();
    };
    
    menu.appendChild(commentItem);
    menu.appendChild(deleteItem);
    document.body.appendChild(menu);
    
    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 100);
  }
  
  function showDeleteConfirmDialog(key) {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'dialog';
    dialogContent.innerHTML = `
      <h3>⚠️ Delete Key</h3>
      <div class="dialog-body">
        <p>Are you sure you want to delete the key <strong>${escapeHtml(key)}</strong>?</p>
        <p class="warning-text">This action cannot be undone. The key will be removed from all locale files.</p>
      </div>
      <div class="dialog-actions">
        <button class="btn-secondary" id="deleteCancel">Cancel</button>
        <button class="btn-danger" id="deleteConfirm">Delete</button>
      </div>
    `;
    
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);
    
    document.getElementById('deleteCancel').onclick = () => dialog.remove();
    document.getElementById('deleteConfirm').onclick = () => {
      vscode.postMessage({ type: 'deleteKey', key });
      dialog.remove();
    };
    
    dialog.onkeydown = (e) => {
      if (e.key === 'Escape') dialog.remove();
    };
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Message handlers
  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.type) {
      case 'init':
      case 'update':
        bundleModel = msg.model;
        const saved = localStorage.getItem('rbe_unicode');
        if (saved !== null) showUnicode = saved === '1';
        render();
        break;
      case 'error':
        alert('Error: ' + msg.message);
        break;
    }
  });

  // Initial ready signal
  vscode.postMessage({ type: 'ready' });
})();
