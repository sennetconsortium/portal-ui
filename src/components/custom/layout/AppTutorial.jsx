import React, {useContext, useEffect, useState} from 'react'
import {getCookie, setCookie} from "cookies-next";
import TutorialSteps from "./TutorialSteps";
import AppContext from "../../../context/AppContext";
import {eq} from "../js/functions";
import {Alert} from 'react-bootstrap'
import {useRouter} from 'next/router'
import {driver} from "driver.js";
import "driver.js/dist/driver.css";

function AppTutorial({name = "app", autoStart = false, lastButtonLabel = 'Finish Tutorial', showProgress = true}) {
    const router = useRouter()
    const {isLoggedIn, tutorialTrigger, setTutorialTrigger} = useContext(AppContext)
    const [steps, setSteps] = useState([])
    const [driverObj, setDriverObj] = useState(null)
    const [runTutorial, setRunTutorial] = useState(false)
    const [showAlert, setShowAlert] = useState(false)
    const cookieKey = `tutorialCompleted_${name}_${isLoggedIn()}`

    const isAppTutorial = () => eq(name, "app")

    useEffect(() => {
        if (!router.isReady) return
        if (!driverObj) return
        if (router.query.tutorial && eq(router.query.tutorial, '1')) {
            handleTutorial()
        }
    }, [router.isReady, router.query, driverObj])

    useEffect(() => {
        const tutorialCompleted = eq(getCookie(cookieKey), 'true')
        if (!tutorialCompleted) {
            if (isAppTutorial()) {
                setShowAlert(true)
            }
            setRunTutorial(autoStart)

            setSteps(TutorialSteps(isLoggedIn(), name))
        }
    }, [tutorialTrigger])

    useEffect(() => {
        if (steps.length > 0) {
            console.log('steps', steps)
            setDriverObj(driver({
                popoverClass: 'driverjs-theme',
                animate: false,
                showProgress: true,
                showButtons: ['next', 'previous', 'close'],
                steps: steps,
                onDestroyed: () => {
                    seenTutorial()
                }
            }))
        }
    }, [steps])

    const seenTutorial = () => {
        let expires = new Date()
        expires.setDate(expires.getDate() + 60)
        setTutorialTrigger(tutorialTrigger + 1)
        setCookie(cookieKey, true, {sameSite: 'Lax', expires})
    }

    const handleTutorial = () => {
        setShowAlert(false)
        // Set a quick timeout to allow the alert to close
        // first before driverjs calculates the highlight region
        setTimeout(() => {
            driverObj.drive();
        }, 200)
    }

    return (
        <>
            {isAppTutorial() && <Alert variant="info" show={showAlert} onClose={() => {
                seenTutorial();
                setShowAlert(false)
            }} dismissible className='text-center alert-hlf mb-4'>
                <Alert.Heading><i className="bi bi-binoculars"></i>Getting Started</Alert.Heading>
                <p>Welcome to the SenNet Data Portal. Get a quick tour of different sections of the application.</p>
                <a className='btn btn-primary' onClick={() => handleTutorial()}>Begin Tutorial Tour</a>
            </Alert>}
        </>
    )
}


export default AppTutorial