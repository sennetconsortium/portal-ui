import {log} from 'xac-loglevel'
import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)

        // Define a state variable to track whether is an error or not
        this.state = {hasError: false}
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI

        return {hasError: true}
    }

    componentDidCatch(error, errorInfo) {
        // You can use your own error logging service here
        log.error({error, errorInfo})
    }

    render() {
        // Check if the error is thrown
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className={"container"}>
                    <div className={"row align-items-center error-row"}>
                        <div className={"col"}></div>
                        <div className={"col text-center"}>
                            <h2>Oops, there was a client side error!</h2>
                            <div className={"row"}>
                                <div className={"col"}></div>
                                <div className={"col text-center"}>
                                    <button
                                        className="btn btn-outline-primary"
                                        type="button"
                                        onClick={() => this.setState({hasError: false})}
                                    >
                                        Try again?
                                    </button>
                                </div>
                                <div className={"col"}></div>
                            </div>

                        </div>
                        <div className={"col"}></div>
                    </div>
                </div>
            )
        }

        // Return children components in case of no error

        return this.props.children
    }
}

export default ErrorBoundary
