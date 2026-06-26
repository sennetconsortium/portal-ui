import React, { useEffect } from 'react'
import log from 'xac-loglevel'

const Draggable = ({ children, wrapperSelector = '.sui-resultsTable' }) => {
    const handleDrag = ($target) => {
        let isMouseDown = false
        let realDragging = false
        let startX = 0
        let startY = 0
        const THRESHOLD = 5 // Pixels to move before confirming a drag

        $target.addEventListener('mousedown', (e) => {
            isMouseDown = true
            startX = e.clientX
            startY = e.clientY
            realDragging = false
        })

        window.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return

            // Calculate how far the mouse has moved from the initial click point
            const deltaX = Math.abs(e.clientX - startX)
            const deltaY = Math.abs(e.clientY - startY)

            if (deltaX > THRESHOLD || deltaY > THRESHOLD) {
                realDragging = true
                log.debug(
                    'Draggable.Intentional dragging motion detected!',
                    e.clientX,
                    e.clientY
                )

                 $target.style.top = e.clientY + 'px'
                 $target.style.left = e.clientX + 'px'
                 $target.classList.add('isActive')
            }
        })

        window.addEventListener('mouseup', () => {
            isMouseDown = false
            $target.classList.remove('isActive')
            if (realDragging) {
                log.debug('Draggable.User finished dragging.')
            } else {
                log.debug('Draggable.User just clicked without dragging.')
            }
        })
    }
    useEffect(() => {
        const $draggables = document.querySelectorAll(wrapperSelector)
        if ($draggables) {
            $draggables.forEach(($draggable) => {
                handleDrag($draggable.querySelector(':first-child'))
            })
        }
    }, [])

    return <>{children}</>
}
export default Draggable
