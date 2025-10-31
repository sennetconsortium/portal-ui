import PropTypes from 'prop-types'

export function SpinnerEl({className = '', variant = 'ic'}) {
    return (<span className={`spinner spinner-border ${variant} alert alert-info ${className}`}></span>)
}

function Spinner({text = <span>Loading, please wait...</span> }) {
    return (
        <div className="text-center p-3 spinner-wrapper">
            <span>{text}</span>
            <br></br>
            <SpinnerEl variant={'spinner-border-lg align-center'} />
        </div>
    )
}

Spinner.propTypes = {
    text: PropTypes.object,
}

export default Spinner
