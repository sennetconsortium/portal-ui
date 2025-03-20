import { useEffect, useState } from 'react'
import { useIdleTimer } from 'react-idle-timer'
import AppModal from "./AppModal";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {deleteCookies} from "../lib/auth";
import {getIngestEndPoint, IDLE_TIMEOUT} from "../config/config";
import {useRouter} from "next/router";
import {getCookie} from "cookies-next";
import { eq } from './custom/js/functions';

const timeout = IDLE_TIMEOUT
const promptBeforeIdle = 60000 // 1 minute

export default function IdleTimerPopup() {
    const router = useRouter()
    const [remaining, setRemaining] = useState(timeout)
    const [open, setOpen] = useState(false)

    const isAuthorized = () => eq(getCookie('isAuthenticated'), 'true')

    const onIdle = () => {
        setOpen(false)
        deleteCookies()
        // Call Ingest API logout to revoke token
        fetch(getIngestEndPoint() + 'logout').then()
        router.push('/')
    }

    const onActive = () => {
        setOpen(false)
    }

    const onPrompt = () => {
        if (isAuthorized()) {
            setOpen(true)
        }
    }

    const { getRemainingTime, activate } = useIdleTimer({
        onIdle,
        onActive,
        onPrompt,
        timeout,
        promptBeforeIdle,
        throttle: 500,
        crossTab: true
    })

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(Math.ceil(getRemainingTime() / 1000))
        }, 500)

        return () => {
            clearInterval(interval)
        }
    }, [])

    const handleStillHere = () => {
        activate()
    }

    // const timeTillPrompt = Math.max(remaining - promptBeforeIdle / 1000, 0)
    // const seconds = timeTillPrompt > 1 ? 'seconds' : 'second'

    const getModalTitle = () => {
        return <h4 className={'title-text'}><WarningAmberIcon sx={{color: '#f1c40f', fontSize: 32}} /> Are you still here?</h4>
    }

    const getModalBody = () => {
        return <div>
            <p>Your session is about to expire. You will be automatically logged out in {remaining} seconds.</p>
        </div>
    }

    return <AppModal
        className={`modal--ctaConfirm is-warning-outline`}
        showModal={open}
        modalTitle={getModalTitle()}
        modalBody={getModalBody()}
        secondaryBtnClassName={
'btn-outline-danger'}
        handlePrimaryBtn={handleStillHere}
        handleSecondaryBtn={
onIdle}
        secondaryBtnLabel={
'Log out'}
        primaryBtnLabel={'Stay logged in'}
    />

}
