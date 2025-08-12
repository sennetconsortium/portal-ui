import Spinner from "../Spinner"

const LoadingAccordion = ({id, title, children, style={ height:'100px' }, expanded=true}) => {
    return (
        <div id={id} className={`accordion accordion-flush sui-result`}>
            <div className='accordion-item'>
                <div className='accordion-header'>
                    <button
                        className='accordion-button'
                        type='button'
                        data-bs-toggle='collapse'
                        data-bs-target={`#${id}-collapse`}
                        aria-expanded={expanded}
                        aria-controls={`${id}-collapse`}
                    >
                        <span className={'me-2'}>{title}</span>
                    </button>
                </div>
                <div id={`${id}-collapse`} style={style} className={`accordion-collapse collapse ${expanded ? 'show' : 'show-invisible'}`} >
                    <div className='accordion-body'>
                        {children}
                        {!children && <Spinner />}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoadingAccordion
