import React, {useContext, useEffect, useState} from 'react'
import {getCookie, setCookie} from "cookies-next";
import TutorialSteps from "./TutorialSteps";
import AppContext from "../../../context/AppContext";
import Joyride from "react-joyride";
import {equals} from "../js/functions";

function AppTutorial() {
    const {isLoggedIn} = useContext(AppContext)
    const [steps, setSteps] = useState([])
    const cookieKey = `tutorialCompleted_${isLoggedIn()}`

    useEffect(() => {
        const tutorialCompleted = getCookie(cookieKey)
        if (!tutorialCompleted) {
            setSteps(TutorialSteps(isLoggedIn()))
        }
    }, [])

    return (
        <>
            {steps.length > 0 && <Joyride
                steps={steps}
                callback={(res) => {
                        if (equals(res.action, 'reset')) {
                            setCookie(cookieKey, true, {sameSite: 'Lax'})
                        }
                    }
                }
                showProgress={true}
                showSkipButton={true}
                locale={{last: 'Finish Tutorial'}}
                continuous
                styles={{
                    options: {
                        arrowColor: '#ffffff',
                        backgroundColor: '#ffffff',
                        primaryColor: '#0d6efd',
                        textColor: 'rgba(0, 0, 0, 0.87)',
                        width: 900,
                        zIndex: 1000,
                    }
                }}
            />}
        </>
    )
}


export default AppTutorial