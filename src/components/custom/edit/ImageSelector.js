import React, {useState, useRef} from 'react'
import {Button, Badge, Alert, Form, InputGroup, CloseButton, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {uploadFile} from "../../../lib/services";
import SenNetPopover from "../../SenNetPopover";


export default function ImageSelector({ editMode, values, setValues, imageByteArray, setImageByteArray, isDisabled }) {
    const imageInputRef = useRef()
    const [error, setError] = useState(null)
    const [inputInformation, setInputInformation] = useState(null)
    
    const handleFileChange = (index, description) => {
        const image = event.target.files && event.target.files[0]
        if (!image) return
        uploadFile(image)
            .then(temp_file_id => {
                const merged = {
                    ...temp_file_id,
                    ...description
                }
                
                const imageFilesToAddCopy = [...values.image_files_to_add]
                imageFilesToAddCopy[index] = merged
                setValues(prevState => ({...prevState, image_files_to_add: imageFilesToAddCopy}))
                
                const c = [...imageByteArray]
                c[index] = image
                setImageByteArray(c)
            })
            .catch(() => setError(`${image.name} (${Math.floor(image.size / 1000)} kb) has exceeded the file size limit.`))
        event.target.value = null
    }

    const handleChooseFileClick = (index, fileDetail) => {
        setInputInformation({index, fileDetail})
        imageInputRef.current.click()
    }
    
    const handleUploadImagesClick = () => {
        setImageByteArray(prevState => [...prevState, {}])
        setValues(prevState => {
            if (prevState.image_files_to_add === undefined) {
                return {...prevState, image_files_to_add: [{ description: "" }]}
            } else {
                const copy = [...prevState.image_files_to_add]
                copy.push({description: ''})
                return {...prevState, image_files_to_add: copy}
            }
        })
    }
    
    const removeImageFile = index => {
        setImageByteArray(imageByteArray.filter((_, i) => i !== index))
        let imageFiles = []
        setValues(prevState => {
            if (prevState.image_files) {
                imageFiles = prevState.image_files.filter((_, i) => i !== index)

                if (prevState.image_files && prevState.image_files[index]) {
                    if (prevState.image_files_to_remove) {
                        const imageFilesToRemoveCopy = [...prevState.image_files_to_remove]
                        imageFilesToRemoveCopy.push(prevState.image_files[index].file_uuid)
                        if (imageFiles.length === 0) {
                            delete prevState.image_files
                            return {...prevState, image_files_to_remove: imageFilesToRemoveCopy}
                        } else {
                            return {...prevState, image_files_to_remove: imageFilesToRemoveCopy, image_files: imageFiles}
                        }
                    } else {
                        const fileToRemove = []
                        fileToRemove.push(prevState.image_files[index].file_uuid)
                        if (imageFiles.length === 0) {
                            delete prevState.image_files
                            return {...prevState, image_files_to_remove: fileToRemove}
                        } else {
                            return {...prevState, image_files_to_remove: fileToRemove, image_files: imageFiles}
                        }
                    }
                }
            }
        })
    }
    
    const removeImageFilesToAdd = index => {
        setImageByteArray(imageByteArray.filter((_, i) => i !== index))
        let imageFilesToAdd = []
        setValues(prevState => {
            if (prevState.image_files_to_add) {
                imageFilesToAdd = prevState.image_files_to_add.filter((_, i) => i !== index)
                if (imageFilesToAdd.length === 0) {
                    delete prevState.image_files_to_add
                    return prevState
                }
                return {...prevState, image_files_to_add: imageFilesToAdd}
            }
        })
    }
    const handleImageDescriptionChange = (index, description, isAddingAnImage) => {
        if (isAddingAnImage) {
            const imageFilesToAddCopy = [...values.image_files_to_add]
            imageFilesToAddCopy[index].description = description
            setValues(prevState => ({
                ...prevState,
                image_files_to_add: imageFilesToAddCopy
            }))
        } else {
            const imageFilesCopy = [...values.image_files]
            imageFilesCopy[index].description = description
            setValues(prevState => ({
                ...prevState,
                image_files: imageFilesCopy
            }))
        }
    }

    return (
        <div className={'row'}>
            <div className={'col mb-2'}>
                { error && 
                    <Alert className={'w-50'} variant={'danger'} onClose={() => setError(false)} dismissible>
                        <Alert.Heading>File is too large</Alert.Heading>
                        {error}
                    </Alert>
                }
                <SenNetPopover className={'image-selector'} placement={'top'} text={isDisabled ? 'The image files of the entity cannot be updated' : 'Click here to attach a single image or multiple images'}>
                    <Button disabled={isDisabled} variant={'outline-primary rounded-0'} onClick={isDisabled ? null : handleUploadImagesClick}>
                        Upload image files
                        <i className={'bi bi-paperclip ms-2'}/>
                    </Button>
                </SenNetPopover>
            </div>
            <input
                style={{display: 'none'}}
                type={'file'}
                ref={imageInputRef}
                onChange={() => handleFileChange(inputInformation.index, inputInformation.fileDetail)}
            />
            { editMode === 'Edit' && values.image_files && values.image_files.map((i, index) => (
                <div key={'image_files' + index} className={'mb-2'}>
                    <Badge bg={'primary'} className={'badge rounded-pill text-bg-primary m-2 p-2'}>
                        <span className={'m-2'}>
                            {i.filename}
                        </span>
                    </Badge>
                    <InputGroup className="m-2 w-75 icon_inline">
                        <Button variant="outline-secondary" onClick={() => handleChooseFileClick(index, i)}>
                            Choose file
                        </Button>
                        <Form.Control
                            placeholder={'Description'}
                            onChange={e => handleImageDescriptionChange(index, e.target.value, false)}
                            value={i.description}
                            className={'me-2'}
                        />
                        <SenNetPopover className={'remove-image'} text={'Remove image'}>
                            <CloseButton onClick={() => removeImageFile(index)}/>
                        </SenNetPopover>
                    </InputGroup>
                </div>
            ))
            }
            { values && values.image_files_to_add && values.image_files_to_add.map((image_file_to_add, index) => {
                return <div key={'image_files_to_add' + index} className={'mb-2'}>
                    <Badge bg={'primary'} className={'badge rounded-pill text-bg-primary m-2 p-2'}>
                        { imageByteArray[index] && imageByteArray[index].name &&
                            <span className={'m-2'}>
                                {imageByteArray[index].name}
                            </span>
                        }
                    </Badge>
                    <InputGroup className="m-2 w-75 icon_inline">
                        <Button variant="outline-secondary" onClick={() => handleChooseFileClick(index, image_file_to_add)}>
                            Choose file
                        </Button>
                        <Form.Control
                            placeholder={'Description'}
                            onChange={e => handleImageDescriptionChange(index, e.target.value, true)}
                            value={image_file_to_add.description}
                            className={'me-2'}
                        />
                        <SenNetPopover className={'remove-image-files'} text={'Remove image'}>
                            <CloseButton onClick={() => removeImageFilesToAdd(index)}/>
                        </SenNetPopover>
                    </InputGroup>
                </div>
            })
            }
        </div>
    )
}

