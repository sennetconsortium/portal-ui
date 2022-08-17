import log from "loglevel";
import React from "react";
import 'bootstrap/dist/css/bootstrap.css';

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
                    <div className={"row"}>
                        <div className={"col-sm"}></div>
                        <div className={"col-sm"}>
                            <h2>Oops, there was a client side error!</h2>
                            <button
                                className="btn btn-outline-primary"
                                type="button"
                                onClick={() => this.setState({hasError: false})}
                            >
                                Try again?
                            </button>
                        </div>
                        <div className={"col-sm"}></div>
                    </div>
                </div>
            )
        }

        // Return children components in case of no error

        return this.props.children
    }
}

export default ErrorBoundary
