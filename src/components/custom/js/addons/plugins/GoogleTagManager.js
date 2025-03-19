/**
 * Sends user events on various components to the app's GTM container.
 */
class GoogleTagManager extends Addon {
    constructor(el, args) {
        super(el, args)
        this.sel = {
            facets: {
                title: '.sui-facet__title'
            }
        }
        this.extractEvent()
        this.modules()
    }

    extractEvent() {
        if (this.el == null || !this.el.length) return
        this.el[0].classList.forEach(((val) => {
            if (val.indexOf(this.app) !== -1) {
                this.event = val.split('--')[1]
            }
        }).bind(this))
        this.log(`Google Tag manager ... ${this.event}`)
    }

    modules() {
        switch (this.event) {
            case 'search':
                this.search()
                break
            case 'facets':
                this.facets()
                break
            case 'dateFacets':
                this.dateFacets()
                break
            case 'results':
                this.results()
                break
            case 'download':
                this.download()
                break
            default:
                this.numericFacets() // As these facets can be conditional
                this.page()
                this.cta()
                this.links()
        }
    }

    handleSearch(e) {
        const keywords = this.currentTarget(e).parent().find('#search').val()
        this.gtm({ keywords })
    }

    search() {
        this.el.on('click', 'button', ((e) => {
            this.handleSearch(e)
        }).bind(this))

        this.el.on('keydown', 'button, input', ((e) => {
            if (this.isEnter(e)) this.handleSearch(e)
        }).bind(this))
    }

    handleFacets(e) {
        const label = $(e.target).parent().find('.sui-multi-checkbox-facet__input-text').text()
        this.gtm({ group: this.group, label, trail: `${this.group}.${label}` })
    }

    handleDateFacets(e) {
        // const label = this.currentTarget(e).val()
        this.event = 'facets'
        this.gtm({ group: this.group, label: this.subGroup, trail: `${this.group}.${this.subGroup}` })
    }

    handleNumericFacets(e) {
        this.event = 'facets'
        let label = this.currentTarget(e).find('input').val()
        this.gtm({ group: this.group, label, trail: `${this.group}.${label}` })
    }

    storeLoaded(key) {
        return GoogleTagManager.storeLoaded(key)
    }

    static storeLoaded(key) {
        const $body = $('body')
        if ($body.data(key)) return null
        $body.attr(`data-${key}`, true)
        return `.js-gtm--${key}`
    }

    facets() {
        const sel = this.storeLoaded('facets')
        if (!sel) return
        const pre = 'sui-multi-checkbox-facet__'
        const body = document.querySelector('body')
        body.addEventListener('click', ((e) => {
            const el = e.target
            if (el.classList.contains(`${pre}checkbox`) || el.classList.contains(`${pre}option-input-wrapper`)) {
                this.group = $(el).parents(sel).parent().find(this.sel.facets.title).text()
                this.handleFacets(e)
            }
        }).bind(this),true)
    }

    dateFacets() {
        this.group = this.el.parent().find(this.sel.facets.title).text()
        this.subGroup = this.el.find('.sui-multi-checkbox-facet').text()
        this.el.on(
            'change',
            'input',
            ((e) => {
                this.stop(e)
                this.handleDateFacets(e)
            }).bind(this)
        )
    }

    static dispatch(results) {
        if (results.key === 'numericFacets') {
            const sel = GoogleTagManager.storeLoaded(results.key)
            $(`${sel} .MuiSlider-thumb`).trigger(results.key)
        }
    }

    numericFacets() {
        const sel = this.storeLoaded('numericFacets')
        if (!sel) return
        $('body').on(
            'numericFacets',
            `${sel} .MuiSlider-thumb`,
            ((e) => {
                this.stop(e)
                const $el = this.currentTarget(e)
                let val = $el.attr('data-val')
                let ioVal = $el.find('input').val()
                // on DOMSubtreeModified, multiple triggers for same value, so only gtm once
                if (val !== ioVal) {
                    $el.attr('data-val', ioVal)
                    this.group = this.currentTarget(e).parents(sel).parent().parent().find(this.sel.facets.title).text()
                    this.handleNumericFacets(e)
                }
            }).bind(this)
        )
    }

    handleResults(e) {
        const td = this.currentTarget(e)
        const th = ['sennet_id', 'entity_type', 'lab_id', 'group_name']
        const data = {}
        for (let i = 0; i < th.length; i++) {
            data[th[i]] = td.parent().find(`[data-field="${th[i]}"]`).text().trim()
        }
        this.gtm(data)
    }

    results() {
        this.el.on('click', '.rdt_TableBody .rdt_TableCell:not(div[data-column-id="1"])', ((e) => {
            this.handleResults(e)
        }).bind(this))
    }

    handleDownload(e) {
        this.event = 'cta'
        const action = 'download'
        const label = this.currentTarget(e).text()
        this.gtm({action, label})
    }

    download() {
        this.el.on('click', 'a', ((e) => {
            this.handleDownload(e)
        }).bind(this))
    }

    getPath() {
        const path = window.location.pathname + window.location.search
        return path.length > 70 ? window.location.pathname : path;
    }

    handleLinks(e) {
        this.event = 'links'
        const $el = this.currentTarget(e)
        const link  = $el.text() || $el.attr('aria-label') || $el.attr('alt')
        if (link !== undefined) {
            this.gtm({link})
        }
    }

    links() {
        $('body').on('click', 'a', ((e) => {
            this.stop(e)
            this.handleLinks(e)
        }).bind(this))
    }

    handleCta(e) {
        const $el = this.currentTarget(e)
        const className = $el.attr('class')
        this.event = 'cta'
        let action
        const actions = ['json', 'submit', 'login', 'save', 'revert', 'validate', 'reorganize', 'process']
        if (className) {
            for (let i = 0; i < actions.length; i++) {
                if (className.includes(actions[i])){
                    action = actions[i]
                }
            }
        }

        if (action) {
            let data = { }
            data = this.entityPage(data, false)
            let action2 = data.action || null
            data = { ...data, action: (action2 ? `${action}.${action2}`: action), uuid: this.getUuid() }
            this.gtm(data)
        }

    }

    cta() {
        $('body').on('click', '[role="button"], .btn, button', ((e) => {
            this.handleCta(e)
        }).bind(this))
    }

    page() {
        this.event = 'page'
        let data = {data: 'view'}
        this.entityPage(data)
    }

    getUuid() {
        const uuid = this.router.asPath.split('uuid=')
        // Fully fetch the uuid, split(&)[0] in case more params follow
        return uuid.length && uuid.length > 1 ? this.router.asPath.split('uuid=')[1].split('&')[0] : null
    }

    entityPage(data, send = true) {

        const entities = Object.keys(this.entities)

        let pos = -1
        for (let i = 0; i < entities.length; i++) {
            if (this.router.route.includes(entities[i])) pos = i
        }

        if ( pos !== -1) {
            data.entity = this.entities[entities[pos]]
            const actions = ['register', 'edit']
            for (let action of actions) {
                if (window.location.href.indexOf(action) !== -1) {
                    data.action = action
                    break
                }
            }
            data.uuid = this.getUuid()

            if (send) {
                this.gtm(data) // push Page view
                this.event = 'entity'
                this.gtm(data) // push Entity Page view
            }
        } else {
            if (send) this.gtm(data) // push Page view
        }
        return data
    }
    getPerson(bto = false) {
        const id = this.user.email
        let result
        if (id) {
            result = bto ? btoa(id.replace('@', '*')) : `${id.split('@')[0]}***`
        }
        return result
    }
    gtm(args) {
        let data = {
            event: this.event,
            path: this.getPath(),
            person: this.getPerson(),
            user_id: this.getPerson(true),
            globus_id: this.user.globus_id,
            session: (this.user.email !== undefined), ...args
        }
        Addon.log(`GTM, ${this.event} event ...`, {color: 'pink', data})
        dataLayer.push(data)
    }
}