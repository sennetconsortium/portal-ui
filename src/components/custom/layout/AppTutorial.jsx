import React, {useContext, useEffect, useState} from 'react'
import {getCookie, setCookie} from "cookies-next";
import TutorialSteps from "./TutorialSteps";
import AppContext from "../../../context/AppContext";
import Joyride from "react-joyride";
import {eq} from "../js/functions";
import {Alert} from 'react-bootstrap'
import {TUTORIAL_THEME} from "@/config/constants";
import { useRouter } from 'next/router'

function AppTutorial() {
    const router = useRouter()
    const {isLoggedIn, tutorialTrigger, setTutorialTrigger} = useContext(AppContext)
    const [steps, setSteps] = useState([])
    const [runTutorial, setRunTutorial] = useState(false)
    const [showAlert, setShowAlert] = useState(false)
    const cookieKey = `tutorialCompleted_${isLoggedIn()}`

    useEffect(() => {
        if (!router.isReady) return
        if (router.query.tutorial && eq(router.query.tutorial, '1')) {
            handleTutorial()
        }
    }, [router.isReady, router.query])

    useEffect(() => {
        const tutorialCompleted = eq(getCookie(cookieKey), 'true')
        if (!tutorialCompleted) {
            setShowAlert(true)
            setSteps(TutorialSteps(isLoggedIn()))
        }
    }, [tutorialTrigger])

    const seenTutorial = () => {
        let expires = new Date()
        expires.setDate(expires.getDate() + 60)
        setTutorialTrigger(tutorialTrigger + 1)
        setCookie(cookieKey, true, {sameSite: 'Lax', expires})
    }

    const handleTutorial = () => {
        setShowAlert(false)
        // Set a quick timeout to allow the alert to close
        // first before Joyride calculates the highlight region
        setTimeout(()=> {
            setRunTutorial(true)
        }, 200)
    }
    return (
        <>
            <Alert variant="info" show={showAlert} onClose={() => {seenTutorial(); setShowAlert(false)}} dismissible className='text-center alert-hlf mb-4'>
                <Alert.Heading><i className="bi bi-binoculars"></i>Getting Started</Alert.Heading>
                <p>Welcome to the SenNet Data Portal. Get a quick tour of different sections of the application.</p>
                <a className='btn btn-primary' onClick={() => handleTutorial()}>Begin Tutorial Tour</a>
            </Alert>
            {steps.length > 0 && <Joyride
                steps={steps}
                scrollOffset={80}
                callback={(res) => {
                        if (eq(res.action, 'reset')) {
                            seenTutorial()
                        }
                    }
                }
                run={runTutorial}
                showProgress={true}
                showSkipButton={true}
                locale={{last: 'Finish Tutorial'}}
                continuous
                styles={TUTORIAL_THEME}
            />}
        </>
    )
}


export default AppTutorial