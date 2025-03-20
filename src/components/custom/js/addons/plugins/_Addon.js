// Base class that should be an entry before the other plugins.
class Addon {
    route;

    constructor(el, args) {
        this.el = $(el)
        this.app = args.app
        this.data = args.data
        this.user = {}
        this.router = args.router
        this.entities = args.entities
        this.st = null
        if (args.data && args.data.user) {
            this.user = JSON.parse(args.data.user)
        }
        Addon.log(`Addons args of ${args.app}:`, {color: 'aqua', data: {el, args}})
        this.keycodes = {
            enter: 'Enter',
            esc: 'Escape'
        }
    }

    handleKeydown(e, trigger) {
        this.currentTarget(e).trigger(trigger)
        this.currentTarget(e).focus()
    }

    onKeydownEnter(sel, cb, trigger = 'click') {
        this.el.on('keydown', `${sel}`, ((e) => {
            if (this.isEnter(e)) {
                clearTimeout(this.st)
                this.st = setTimeout((()=> {
                    cb ? cb(e) : this.handleKeydown(e, trigger)
                }).bind(this), 100)
            }
        }).bind(this))
    }

    currentTarget(e) {
        return $(e.currentTarget)
    }
    /**
     * Prevents bubbling of javascript event to parent
     * @param {*} e Javascript event
     */
    stop(e) {
        e.stopPropagation()
    }

    /**
     * Determines whether a keydown/keypress operation is of Enter/13
     * @param {object} e Event
     * @returns {boolean}
     */
    isEnter(e) {
        return e.code === this.keycodes.enter
    }

    isEsc(e) {
        return e.code === this.keycodes.esc
    }

    static observeMutations(apps, args) {
        const initAddon = ()=> {
            for (let app in apps) {
                document
                    .querySelectorAll(`[class*='js-${app}--'], [data-js-${app}], .js-app--${app}`)
                    .forEach((el) => {
                        if (!$(el).data(app)) {
                            $(el).data(app, new apps[app](el, {app, ...args }))
                        }
                    })
            }
        }

        const observer = new MutationObserver(initAddon)
        observer.observe(document.body,  { childList: true, subtree: true })
    }

    static isLocal() {
        return (location.host.indexOf('localhost') !== -1) || (location.host.indexOf('.dev') !== -1)
    }

    static log(msg, ops) {
        ops = ops || {}
        let {fn, color, data} = ops
        fn = fn || 'log'
        color = color || '#bada55'
        data = data || ''
        if (Addon.isLocal()) {
            console[fn](`%c ${msg}`, `background: #222; color: ${color}`, data)
        }
    }

    log(msg, fn = 'log') {
        Addon.log(msg, {fn})
    }
}

