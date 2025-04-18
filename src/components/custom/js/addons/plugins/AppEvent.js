/**
 * Trigger a custom event.
 * Useful when dealing with mutations in DOM
 */
class AppEvent extends Addon {
    constructor(el, args) {
        super(el, args)

        const ev = this.el.attr('data-js-appevent')
        this.log(`AppEvent ${ev}`)
        const event = new CustomEvent(ev, {detail: { el, name: ev }})
        document.dispatchEvent(event)
    }

}
