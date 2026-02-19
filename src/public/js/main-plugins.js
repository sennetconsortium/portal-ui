// Base class that should be an entry before the other plugins.
class Addon {
  route;
  constructor(el, args) {
    this.el = $(el);
    this.app = args.app;
    this.data = args.data;
    this.user = {};
    this.router = args.router;
    this.entities = args.entities;
    this.st = null;
    if (args.data && args.data.user) {
      this.user = JSON.parse(args.data.user);
    }
    Addon.log(`Addons args of ${args.app}:`, {
      color: 'aqua',
      data: {
        el,
        args
      }
    });
    this.keycodes = {
      enter: 'Enter',
      esc: 'Escape'
    };
  }
  handleKeydown(e, trigger) {
    this.currentTarget(e).trigger(trigger);
    this.currentTarget(e).focus();
  }
  onKeydownEnter(sel, cb, trigger = 'click') {
    this.el.on('keydown', `${sel}`, (e => {
      if (this.isEnter(e)) {
        clearTimeout(this.st);
        this.st = setTimeout((() => {
          cb ? cb(e) : this.handleKeydown(e, trigger);
        }).bind(this), 100);
      }
    }).bind(this));
  }
  currentTarget(e) {
    return $(e.currentTarget);
  }
  /**
   * Prevents bubbling of javascript event to parent
   * @param {*} e Javascript event
   */
  stop(e) {
    e.stopPropagation();
  }

  /**
   * Determines whether a keydown/keypress operation is of Enter/13
   * @param {object} e Event
   * @returns {boolean}
   */
  isEnter(e) {
    return e.code === this.keycodes.enter;
  }
  isEsc(e) {
    return e.code === this.keycodes.esc;
  }
  static observeMutations(apps, args) {
    const initAddon = () => {
      for (let app in apps) {
        document.querySelectorAll(`[class*='js-${app}--'], [data-js-${app}], .js-app--${app}`).forEach(el => {
          if (!$(el).data(app)) {
            $(el).data(app, new apps[app](el, {
              app,
              ...args
            }));
          }
        });
      }
    };
    const observer = new MutationObserver(initAddon);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  static isLocal() {
    return location.host.indexOf('localhost') !== -1 || location.host.indexOf('.dev') !== -1;
  }
  static log(msg, ops) {
    ops = ops || {};
    let {
      fn,
      color,
      data
    } = ops;
    fn = fn || 'log';
    color = color || '#bada55';
    data = data || '';
    if (Addon.isLocal()) {
      console[fn](`%c ${msg}`, `background: #222; color: ${color}`, data);
    }
  }
  log(msg, fn = 'log') {
    Addon.log(msg, {
      fn
    });
  }
}
/**
 * This adds web accessibility functionality to
 * elements.
 */
class Ada extends Addon {
  constructor(el, args) {
    super(el, args);
    this._el = this.el.data(`js-${this.app}`);
    if (this[this._el]) {
      this[this._el]();
    } else {
      this.events();
    }
  }
  tableResults() {
    const data = this.el.data('ada-data');
    this.el.find(data.tabIndex).attr('tabindex', 0);
    this.events(data.tabIndex, data.trigger);
  }
  facets() {
    Addon.log('Ada > Facets');
    this.onKeydownEnter('.sui-facet__title, .sui-select__control');
    this.onKeydownEnter('.sui-multi-checkbox-facet__checkbox', (e => {
      this.currentTarget(e).parent().trigger('click');
      this.currentTarget(e).focus();
    }).bind(this));
  }
  modal() {
    $(window).on('keydown', (e => {
      Addon.log('Ada > Modal');
      if (this.isEsc(e)) {
        $('.modal-footer .btn').eq(0).click();
      }
    }).bind(this));
  }
  events(sel, sel2) {
    sel = sel || this._el;
    this.el.on('keydown', `${sel}`, (e => {
      if (this.isEnter(e)) {
        const $el = sel2 ? this.currentTarget(e).find(sel2) : this.currentTarget(e);
        $el.click();
      }
    }).bind(this));
  }
}
/**
 * Trigger a custom event.
 * Useful when dealing with mutations in DOM
 */
class AppEvent extends Addon {
  constructor(el, args) {
    super(el, args);
    const ev = this.el.attr('data-js-appevent');
    this.log(`AppEvent ${ev}`);
    const event = new CustomEvent(ev, {
      detail: {
        el,
        name: ev
      }
    });
    document.dispatchEvent(event);
  }
}
/**
 * Sends user events on various components to the app's GTM container.
 */
class GoogleTagManager extends Addon {
  constructor(el, args) {
    super(el, args);
    this.sel = {
      facets: {
        title: '.sui-facet__title'
      }
    };
    this.extractEvent();
    this.modules();
  }
  extractEvent() {
    if (this.el == null || !this.el.length) return;
    this.el[0].classList.forEach((val => {
      if (val.indexOf(this.app) !== -1) {
        this.event = val.split('--')[1];
      }
    }).bind(this));
    this.log(`Google Tag manager ... ${this.event}`);
  }
  modules() {
    switch (this.event) {
      case 'search':
        this.search();
        break;
      case 'facets':
        this.facets();
        break;
      case 'dateFacets':
        this.dateFacets();
        break;
      case 'results':
        this.results();
        break;
      case 'download':
        this.download();
        break;
      default:
        this.numericFacets(); // As these facets can be conditional
        this.page();
        this.cta();
        this.links();
    }
  }
  handleSearch(e) {
    const keywords = this.currentTarget(e).parent().find('#search').val();
    this.gtm({
      keywords
    });
  }
  search() {
    this.el.on('click', 'button', (e => {
      this.handleSearch(e);
    }).bind(this));
    this.el.on('keydown', 'button, input', (e => {
      if (this.isEnter(e)) this.handleSearch(e);
    }).bind(this));
  }
  handleFacets(e) {
    const label = $(e.target).parent().find('.sui-multi-checkbox-facet__input-text').text();
    this.gtm({
      group: this.group,
      label,
      trail: `${this.group}.${label}`
    });
  }
  handleDateFacets(e) {
    // const label = this.currentTarget(e).val()
    this.event = 'facets';
    this.gtm({
      group: this.group,
      label: this.subGroup,
      trail: `${this.group}.${this.subGroup}`
    });
  }
  handleNumericFacets(e) {
    this.event = 'facets';
    let label = this.currentTarget(e).find('input').val();
    this.gtm({
      group: this.group,
      label,
      trail: `${this.group}.${label}`
    });
  }
  storeLoaded(key) {
    return GoogleTagManager.storeLoaded(key);
  }
  static storeLoaded(key) {
    const $body = $('body');
    if ($body.data(key)) return null;
    $body.attr(`data-${key}`, true);
    return `.js-gtm--${key}`;
  }
  facets() {
    const sel = this.storeLoaded('facets');
    if (!sel) return;
    const pre = 'sui-multi-checkbox-facet__';
    const body = document.querySelector('body');
    body.addEventListener('click', (e => {
      const el = e.target;
      if (el.classList.contains(`${pre}checkbox`) || el.classList.contains(`${pre}option-input-wrapper`)) {
        this.group = $(el).parents(sel).parent().find(this.sel.facets.title).text();
        this.handleFacets(e);
      }
    }).bind(this), true);
  }
  dateFacets() {
    this.group = this.el.parent().find(this.sel.facets.title).text();
    this.subGroup = this.el.find('.sui-multi-checkbox-facet').text();
    this.el.on('change', 'input', (e => {
      this.stop(e);
      this.handleDateFacets(e);
    }).bind(this));
  }
  static dispatch(results) {
    if (results.key === 'numericFacets') {
      const sel = GoogleTagManager.storeLoaded(results.key);
      $(`${sel} .MuiSlider-thumb`).trigger(results.key);
    }
  }
  numericFacets() {
    const sel = this.storeLoaded('numericFacets');
    if (!sel) return;
    $('body').on('numericFacets', `${sel} .MuiSlider-thumb`, (e => {
      this.stop(e);
      const $el = this.currentTarget(e);
      let val = $el.attr('data-val');
      let ioVal = $el.find('input').val();
      // on DOMSubtreeModified, multiple triggers for same value, so only gtm once
      if (val !== ioVal) {
        $el.attr('data-val', ioVal);
        this.group = this.currentTarget(e).parents(sel).parent().parent().find(this.sel.facets.title).text();
        this.handleNumericFacets(e);
      }
    }).bind(this));
  }
  handleResults(e) {
    const td = this.currentTarget(e);
    const th = ['sennet_id', 'entity_type', 'lab_id', 'group_name'];
    const data = {};
    for (let i = 0; i < th.length; i++) {
      data[th[i]] = td.parent().find(`[data-field="${th[i]}"]`).text().trim();
    }
    this.gtm(data);
  }
  results() {
    this.el.on('click', '.rdt_TableBody .rdt_TableCell:not(div[data-column-id="1"])', (e => {
      this.handleResults(e);
    }).bind(this));
  }
  handleDownload(e) {
    this.event = 'cta';
    const action = 'download';
    const label = this.currentTarget(e).text();
    this.gtm({
      action,
      label
    });
  }
  download() {
    this.el.on('click', 'a', (e => {
      this.handleDownload(e);
    }).bind(this));
  }
  getPath() {
    const path = window.location.pathname + window.location.search;
    return path.length > 70 ? window.location.pathname : path;
  }
  handleLinks(e) {
    this.event = 'links';
    const $el = this.currentTarget(e);
    const link = $el.text() || $el.attr('aria-label') || $el.attr('alt');
    if (link !== undefined) {
      this.gtm({
        link
      });
    }
  }
  links() {
    $('body').on('click', 'a', (e => {
      this.stop(e);
      this.handleLinks(e);
    }).bind(this));
  }
  handleCta(e) {
    const $el = this.currentTarget(e);
    const className = $el.attr('class');
    this.event = 'cta';
    let action;
    const actions = ['json', 'submit', 'login', 'save', 'revert', 'validate', 'reorganize', 'process'];
    if (className) {
      for (let i = 0; i < actions.length; i++) {
        if (className.includes(actions[i])) {
          action = actions[i];
        }
      }
    }
    if (action) {
      let data = {};
      data = this.entityPage(data, false);
      let action2 = data.action || null;
      data = {
        ...data,
        action: action2 ? `${action}.${action2}` : action,
        uuid: this.getUuid()
      };
      this.gtm(data);
    }
  }
  cta() {
    $('body').on('click', '[role="button"], .btn, button', (e => {
      this.handleCta(e);
    }).bind(this));
  }
  page() {
    this.event = 'page';
    let data = {
      data: 'view'
    };
    this.entityPage(data);
  }
  getUuid() {
    const uuid = this.router.asPath.split('uuid=');
    // Fully fetch the uuid, split(&)[0] in case more params follow
    return uuid.length && uuid.length > 1 ? this.router.asPath.split('uuid=')[1].split('&')[0] : null;
  }
  entityPage(data, send = true) {
    const entities = Object.keys(this.entities);
    let pos = -1;
    for (let i = 0; i < entities.length; i++) {
      if (this.router.route.includes(entities[i])) pos = i;
    }
    if (pos !== -1) {
      data.entity = this.entities[entities[pos]];
      const actions = ['register', 'edit'];
      for (let action of actions) {
        if (window.location.href.indexOf(action) !== -1) {
          data.action = action;
          break;
        }
      }
      data.uuid = this.getUuid();
      if (send) {
        this.gtm(data); // push Page view
        this.event = 'entity';
        this.gtm(data); // push Entity Page view
      }
    } else {
      if (send) this.gtm(data); // push Page view
    }
    return data;
  }
  getPerson(bto = false) {
    const id = this.user.email;
    let result;
    if (id) {
      result = bto ? btoa(id.replace('@', '*')) : `${id.split('@')[0]}***`;
    }
    return result;
  }
  gtm(args) {
    let data = {
      event: this.event,
      path: this.getPath(),
      person: this.getPerson(),
      user_id: this.getPerson(true),
      globus_id: this.user.globus_id,
      session: this.user.email !== undefined,
      ...args
    };
    Addon.log(`GTM, ${this.event} event ...`, {
      color: 'pink',
      data
    });
    dataLayer.push(data);
  }
}
/**
 * This displays our own components when @elastic/react-search-ui spits an error from search
 */
class SearchErrorBoundary extends Addon {
  constructor(el, args) {
    super(el, args);
    this.prettyError();
  }
  getComponent(key) {
    try {
      const data = JSON.parse(atob(this.el.data('components')));
      if (Addon.isLocal()) {
        console.log('SearchErrorBoundary', data);
      }
      if (data[key]) {
        this.el.removeClass('sui-search-error alert alert-danger ');
        this.el.html(data[key]);
      }
    } catch (e) {}
  }
  prettyError() {
    const error = this.el.html().trim().toLowerCase();
    if (error.contains("header is either invalid or expired")) {
      this.getComponent('token');
    } else {
      this.getComponent('notFound');
    }
  }
}
/**
 * Display a tooltip on click of an element.
 */
class Tooltip extends Addon {
  constructor(el, args) {
    super(el, args);
    this.ops = this.el.data('js-tooltip');
    this.timeouts;
    if (this.ops) {
      Addon.log('Tooltip ops...', {
        data: this.ops
      });
      this.events();
    } else {
      this.ops = {};
      this.text = args.text;
      this.e = args.e;
      this.show();
    }
  }
  handleToolTip(e) {
    const text = $(this.ops.data).attr('data-tooltiptext');
    if (text) {
      this.text = text;
      this.show();
      clearTimeout(this.timeouts);
      this.timeouts = setTimeout(() => {
        $('.js-popover').remove();
      }, 3000);
    }
  }
  events() {
    this.el.on('click', this.ops.trigger, (e => {
      this.e = e;
      const _t = this;
      clearTimeout(this.timeouts);
      this.timeouts = setTimeout(() => {
        $('.js-popover').remove();
        _t.handleToolTip(e);
      }, 200);
    }).bind(this));
  }
  getPosition() {
    const rect = this.e.currentTarget.getBoundingClientRect();
    const x = this.e.clientX - rect.left / 2;
    const y = this.e.clientY + (this.ops.diffY || 0);
    return {
      x,
      y
    };
  }
  buildHtml() {
    const pos = this.getPosition();
    return `<div role="tooltip" x-placement="right" class="fade show popover bs-popover-end js-popover ${this.ops.class || ''}" id="popover-basic"
             data-popper-reference-hidden="false" data-popper-escaped="false" data-popper-placement="right"
             style="position: absolute; display: block; inset: 0px auto auto 0px; transform: translate(${pos.x}px, ${pos.y}px);">
            <div class="popover-arrow" style="position: absolute; top: 0px; transform: translate(0px, 47px);"></div>
            <div class="popover-body">${this.text}</div>
        </div>`;
  }
  show() {
    this.el.append(this.buildHtml());
  }
}
