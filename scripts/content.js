(() => {
  "use strict";

  const PANEL_ID = "event-mirror-panel";
  const PANEL_COUNT_ID = "event-mirror-count";
  const PANEL_BODY_ID = "event-mirror-body";
  const SPLIT_CLASS = "event-mirror-split-layout";
  const PANEL_WIDTH_VAR = "--event-mirror-panel-width";

  const CONFIG = {
    cycleIntervalMs: 500,
    afterRefreshDelayMs: 100,
    afterOpenDelayMs: 100
  };

  const state = {
    copiedCount: 0,
    panelBody: null,
    started: false,
    resizeBound: false
  };

  function updateSplitWidth() {
    const vw = window.innerWidth || 1200;
    const preferred = Math.round(vw * 0.42);
    const minWidth = 280;
    const maxWidth = 720;
    const clamped = Math.min(maxWidth, Math.max(minWidth, preferred));
    const safeWidth = Math.min(clamped, Math.floor(vw * 0.55));

    document.documentElement.style.setProperty(PANEL_WIDTH_VAR, `${Math.max(safeWidth, 180)}px`);
  }

  function enableSplitLayout() {
    document.documentElement.classList.add(SPLIT_CLASS);
    updateSplitWidth();

    if (!state.resizeBound) {
      window.addEventListener("resize", updateSplitWidth, { passive: true });
      state.resizeBound = true;
    }
  }

  function createPanel() {
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("aside");
      panel.id = PANEL_ID;
      panel.innerHTML = [
        '<div class="event-mirror-header">裁判事件镜像</div>',
        '<div class="event-mirror-subtitle">自动复制 viewer-events 新增项</div>',
        `<div id="${PANEL_COUNT_ID}" class="event-mirror-count">已复制 0 项</div>`,
        `<div id="${PANEL_BODY_ID}" class="event-mirror-body"></div>`
      ].join("");
      document.body.appendChild(panel);
    }

    state.panelBody = document.getElementById(PANEL_BODY_ID);
    enableSplitLayout();
  }

  function updateCount() {
    const countEl = document.getElementById(PANEL_COUNT_ID);
    if (countEl) {
      countEl.textContent = `已复制 ${state.copiedCount} 项`;
    }
  }

  function copyNewEvents() {
    const source = document.getElementById("viewer-events");
    if (!source || !state.panelBody) {
      return;
    }

    const items = Array.from(source.children);

    if (items.length < state.copiedCount) {
      state.copiedCount = 0;
      state.panelBody.innerHTML = "";
    }

    if (items.length === state.copiedCount) {
      return;
    }

    const fragment = document.createDocumentFragment();

    for (let i = state.copiedCount; i < items.length; i += 1) {
      const wrapper = document.createElement("div");
      wrapper.className = "event-mirror-item";
      wrapper.appendChild(items[i].cloneNode(true));
      fragment.appendChild(wrapper);
    }

    state.panelBody.appendChild(fragment);
    state.copiedCount = items.length;
    updateCount();
    state.panelBody.scrollTop = state.panelBody.scrollHeight;
  }

  function getFirstGhostButton() {
    const listRoot = document.getElementById("match-records-list");
    if (!listRoot) {
      return null;
    }

    const firstDiv = Array.from(listRoot.children).find((el) => el.tagName === "DIV");
    if (!firstDiv) {
      return null;
    }

    return firstDiv.querySelector("button.btn-ghost");
  }

  function runClickCycle() {
    const refreshBtn = document.getElementById("btn-refresh-records");
    if (refreshBtn instanceof HTMLElement) {
      refreshBtn.click();
    }

    window.setTimeout(() => {
      const ghostBtn = getFirstGhostButton();
      if (ghostBtn instanceof HTMLElement) {
        ghostBtn.click();
      }

      window.setTimeout(copyNewEvents, CONFIG.afterOpenDelayMs);
    }, CONFIG.afterRefreshDelayMs);
  }

  function bindViewerObserver() {
    const tryBind = () => {
      const source = document.getElementById("viewer-events");
      if (!source) {
        return false;
      }

      const observer = new MutationObserver(() => {
        copyNewEvents();
      });

      observer.observe(source, { childList: true });
      return true;
    };

    if (tryBind()) {
      return;
    }

    const waitObserver = new MutationObserver(() => {
      if (tryBind()) {
        waitObserver.disconnect();
      }
    });

    waitObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function start() {
    if (state.started) {
      return;
    }

    createPanel();
    copyNewEvents();
    runClickCycle();
    bindViewerObserver();

    window.setInterval(runClickCycle, CONFIG.cycleIntervalMs);
    state.started = true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
