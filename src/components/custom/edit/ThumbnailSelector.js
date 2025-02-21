import React, {useRef, useState} from 'react'
import {Button, Badge, Alert, CloseButton} from 'react-bootstrap'
import {uploadFile} from "@/lib/services";
import SenNetPopover from "../../SenNetPopover";


export default function ThumbnailSelector({ editMode, values, setValues, isDisabled }) {
    const thumbnailInputRef = useRef()
    const [thumbnail, setThumbnail] = useState(null)
    const [error, setError] = useState(null)
    
    const handleThumbnailChange = () => {
        const thumbnailFile = event.target.files && event.target.files[0]
        if (!thumbnailFile) return
        uploadFile(thumbnailFile).then(r => {
            setValues(prevState => ({...prevState, thumbnail_file_to_add: r}))
            setThumbnail(thumbnailFile)
        }).catch(() => setError(`${thumbnailFile.name} (${Math.floor(thumbnailFile.size / 1000)} kb) has exceeded the file size limit.`))

        event.target.value = null
    }

    const removeThumbnail = () => {
        setThumbnail(null)
        if (values.thumbnail_file_to_add) {
            delete values.thumbnail_file_to_add
            setValues(values)
        }
        if (editMode === 'Edit') {
            if (values.thumbnail_file) {
                setValues(prevState => {
                    const id = prevState.thumbnail_file.file_uuid
                    delete prevState.thumbnail_file
                    return {...prevState, thumbnail_file_to_remove: id}
                })
            }
        }
    }

    const handleUploadThumbnailClick = () => thumbnailInputRef.current.click()

    return <div>
        <input
            style={{display: 'none'}}
            type={'file'}
            ref={thumbnailInputRef}
            onChange={handleThumbnailChange}
        />
        
        { error && 
            <Alert className={'w-50'} variant={'danger'} onClose={() => setError(false)} dismissible>
                <Alert.Heading>File is too large</Alert.Heading>
                {error}
            </Alert>
        }

        <SenNetPopover className={'thumbnail-selector'} placement={'top'} text={isDisabled ? 'The thumbnail files of this entity cannot be updated under its current publication status' : 'Click here to attach a single thumbnail image'}>
            <Button disabled={isDisabled} className={'mb-2'} variant={'outline-primary rounded-0'} onClick={isDisabled ? null : handleUploadThumbnailClick}>
                Upload a thumbnail file
                <i className={'bi bi-paperclip ms-2'}/>
            </Button>
        </SenNetPopover>
        
        <div className={'row'}>
            <div className={'col align-items-center d-flex'}>
                { thumbnail &&
                    <>
                        <Badge bg={'primary'} className={'badge rounded-pill text-bg-primary m-2 p-2'}>
                            <span className={'m-2'}>{thumbnail.name}</span>
                        </Badge>
                        <SenNetPopover className={'remove-thumb-1'} text={'Remove thumbnail'}>
                            <CloseButton className={'p-2'} onClick={removeThumbnail}/>
                        </SenNetPopover>
                    </>
                }
                {/* Edit mode */}
                { thumbnail === null && values.thumbnail_file &&
                    <>
                        <Badge bg={'primary'} className={'badge rounded-pill text-bg-primary m-2 p-2'}>
                            <span className={'m-2'}>{values.thumbnail_file.filename}</span>
                        </Badge>
                        <SenNetPopover className={'remove-thumb-edit'} text={'Remove thumbnail'}>
                            <CloseButton className={'p-2'} onClick={removeThumbnail}/>
                        </SenNetPopover>
                    </>
                }
            </div>
        </div>
    </div>
}