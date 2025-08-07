import $ from "jquery";

export const getCheckboxes = () => $('.rdt_TableBody [type=checkbox]')

export const getCheckAll = () => {
    const $headers = $('.rdt_TableHeadRow .rdt_TableCol')
    const $checkAllHeader = $headers.eq(0)
    return $checkAllHeader.find('.sui-check-all input')
}

const $span = ($el) => {
    $el = $el || getCheckAll()
    return $el.parent().find('span')
}

const handleCheckAllTotal = ($el, total) => {
    $el.attr('data-total', total)
    const counter = total ? ` (${total})` : ''
    $span($el).html(counter)
}

const getTotal = () => {
    let total = 0
    getCheckboxes().each((i, el) => {
        if ($(el).is(':checked')) {
            total++
        }
    })
    return total
}

export const handleCheckbox = (e) => {
    e.stopPropagation()
    const $el = $(e.currentTarget)
    const isChecked = $el.is(':checked')
    let total = getCheckAll().attr('data-total')
    total = total ? Number(total) : 0
    total = isChecked ? ++total : --total
    getCheckAll().prop('checked', total === getCheckboxes().length)
    handleCheckAllTotal(getCheckAll(), total)
}

export const handleCheckAll = (setTotalSelected) => {
    // getCheckAll().parent().parent().addClass('sui-tbl-actions-wrapper')
    // handleCheckAllTotal(getCheckAll(), 0)
    getCheckAll().prop('checked', false)
}
