import PropTypes from "prop-types"
import React from 'react';
import Form from 'react-bootstrap/Form';

function MultiProfileSelector({vitessceConfig, profileIndex, setProfileIndex}) {

    return (
        <>
            <div className={'col text-end p-2 m-2'}>
                <Form.Select
                    id={"vitessce-profile-selector"}
                    selected={profileIndex}
                    onChange={e => { setProfileIndex(e.target.value) }}>
                    {vitessceConfig.map((profile, index) => (
                        <option key={`profile-${index}`} value={index}>
                            {profile.name}
                        </option>
                    ))}
                </Form.Select>
            </div>
        </>

    )

}

MultiProfileSelector.propTypes = {
  profileIndex: PropTypes.any,
  setProfileIndex: PropTypes.func,
  vitessceConfig: PropTypes.shape({
    map: PropTypes.func
  })
}

export default MultiProfileSelector