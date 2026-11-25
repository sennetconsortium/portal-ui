import React, { Suspense } from 'react'
import Spinner from '@/components/custom/Spinner'

const Vitessce = React.lazy(() => import('./VitessceWrapper.js'))

const SuspendVitessce = ({
    vitessceConfigFromUrl,
    vitessceConfig,
    profileIndex,
    setVitessceConfigState,
    vitessceTheme,
    isFullscreen
}) => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            {vitessceConfigFromUrl ||
            (vitessceConfig && profileIndex && vitessceConfig[profileIndex]) ||
            vitessceConfig ? (
                <Vitessce
                    onConfigChange={setVitessceConfigState}
                    config={
                        vitessceConfigFromUrl ||
                        vitessceConfig[profileIndex] ||
                        vitessceConfig
                    }
                    theme={vitessceTheme}
                    height={isFullscreen ? null : 800}
                />
            ) : (
                <Spinner />
            )}
        </Suspense>
    )
}

export default SuspendVitessce
