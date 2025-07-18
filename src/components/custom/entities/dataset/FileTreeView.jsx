import React, {Fragment, useContext, useEffect, useRef, useState} from 'react';
import Card from 'react-bootstrap/Card';
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import Link from "next/link";
import DerivedContext from "@/context/DerivedContext";
import {FILE_KEY_SEPARATOR, getAssetsEndpoint, getAuth} from "@/config/config";
import SenNetPopover, {SenPopoverOptions} from "../../../SenNetPopover";
import {formatByteSize, getDatasetTypeDisplay} from "../../js/functions";
import {Button, Row} from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import {Tree} from 'primereact/tree';
import 'primeicons/primeicons.css';


export const FileTreeView = ({data, selection = {}, keys = {files: 'files', uuid: 'uuid'},
                                 loadDerived = true, treeViewOnly = false, className = '', filesClassName = '',
                                 showQAButton = true, showDataProductButton = true, includeDescription= false,
                                 showDownloadAllButton = false, withoutAccordion = false, onStateUpdateCallback}) => {
    const filterByValues = {
        default: "label",
        qa: "data.is_qa_qc",
        dataProduct: "data.is_data_product"
    }

    const [treeData, setTreeData] = useState(null)
    const [qaChecked, setQAChecked] = useState(false)
    const [dataProductChecked, setDataProductChecked] = useState(false)
    const [hasData, setHasData] = useState(false)
    const [filterBy, setFilterBy] = useState(filterByValues.default)

    const formRef = useRef(null)

    const {
        isPrimaryDataset,
        derivedDataset
    } = useContext(DerivedContext)

    const getLength = (obj) => {
        if (!obj) return 0
        return Array.isArray(obj) ? obj.length : Object.keys(obj).length
    }

    const _onStateUpdateCallback = (states)=> {
        if (onStateUpdateCallback) {
            onStateUpdateCallback(states)
        }
    }

    const _hasFiles = (has) => {
        setHasData(has)
        _onStateUpdateCallback({hasData: has})
    }

    useEffect( () => {
        //Default to use files, otherwise wait until derivedDataset is populated
        if (data[keys.files] && getLength(data[keys.files])) {
            _hasFiles(true)
            buildTree(data[keys.uuid], data[keys.files])
        }
    }, [])

    useEffect(() => {
        if (derivedDataset && loadDerived) {
            if (isPrimaryDataset && derivedDataset[keys.files] && getLength(derivedDataset[keys.files])) {
                _hasFiles(true)
                buildTree(derivedDataset[keys.uuid], derivedDataset[keys.files])
            } else {
                if (!hasData) {
                    _hasFiles(false)
                }
            }
        }

    }, [derivedDataset])

    const getAssetsURL = (uuid, rel_path) => {
        let url = getAssetsEndpoint() + uuid + "/" + rel_path
        let token = getAuth()
        if (token != null) {
            url += "?token=" + token
        }
        return url
    }

    const onExpand = (event) => {
        event.node.icon = 'pi pi-fw pi-folder-open'
    }

    const onCollapse = (event) => {
        event.node.icon = 'pi pi-fw pi-folder'
    }

    const handleSearchResetButtonClick = (options) => {
        setFilterBy(filterByValues.default)
        setQAChecked(false)
        setDataProductChecked(false)
        formRef.current.reset()
        options.reset()
    }

    const handleFileSearchInputChange = (event, options) => {
        setFilterBy(filterByValues.default)
        setQAChecked(false)
        setDataProductChecked(false)
        options.filter(event)
    }

    const showHideQa = (event, options) => {
        if (event.currentTarget.checked) {
            setFilterBy(filterByValues.qa)
            options.filter(event)
        } else {
            handleSearchResetButtonClick(options)
        }
        setDataProductChecked(false)
        formRef.current.reset()
    }

    const showHideDataProduct = (event, options) => {
        if (event.currentTarget.checked) {
            setFilterBy(filterByValues.dataProduct)
            options.filter(event)
        } else {
            handleSearchResetButtonClick(options)
        }
        setQAChecked(false)
        formRef.current.reset()
    }

    const handleQAToggleButtonClick = (event, options) => {
        setQAChecked(event.currentTarget.checked)
        showHideQa(event, options)
    }

    const handleDataProductToggleButtonClick = (event, options) => {
        setDataProductChecked(event.currentTarget.checked)
        showHideDataProduct(event, options)
    }

    const getBadgeViews = (node) => {
        const badges = {
            QA: node.data.is_qa_qc === "true",
            "Data Product": node.data.is_data_product === "true",
        }
        return <>
            {Object.entries(badges).map(([label, hasBadge]) => {
                return hasBadge
                    ? <span className="badge bg-secondary mx-2" key={label}> {label}</span>
                    : null
            })}
        </>
    }

    const nodeTemplate = (node, options) => {
        /* This node instance can do many things. See the API reference. */
        return (
            <Fragment>
                {node.icon.includes("file") ? (
                    <Row className={`w-100 ${filesClassName}`}>
                        <Col md={8} sm={8}>
                            <a target="_blank"
                               className={"icon-inline js-file"}
                               href={`${getAssetsURL(node.data.uuid, node.data.rel_path)}`}><span
                               className="me-1">{node.label}</span>
                            </a>
                            {!includeDescription && <SenNetPopover className={`file-${node.label}`}
                                           trigger={SenPopoverOptions.triggers.hover}
                                           text={`${node.data.description}`}><i className="bi bi-info-circle-fill"></i>
                            </SenNetPopover>}
                        </Col>
                        <Col md={2} sm={2} className={"text-end"}>
                            {getBadgeViews(node)}
                        </Col>
                        <Col md={2} sm={2} className={"text-end"}>
                            {formatByteSize(node.data.size)}
                        </Col>
                        {includeDescription && <span>{node.data.description}</span>}
                    </Row>) : (<>{node.label}</>)}
            </Fragment>
        );
    }

    const handleDownloadAllButtonClick = () => {
        document.querySelectorAll(`.${filesClassName} .js-file`).forEach((element) => element.click())
    }

    const filterTemplate = (options) => {
        let {filterOptions} = options;
        return (
            <Form
                ref={formRef}
                id="file-search"
                onSubmit={(e) => e.preventDefault()}
            >
                <Row className="mb-4">
                    <Form.Group as={Col} xl={6} lg={12}>
                        <InputGroup>
                            <Form.Control
                                onChange={(e) => handleFileSearchInputChange(e, filterOptions)}
                                className="right-border-none rounded-0"
                                placeholder="Search"
                            />
                            <InputGroup.Text
                                className={"transparent"}>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Button
                                label="Reset"
                                onClick={() => handleSearchResetButtonClick(filterOptions)}>
                                <i className="bi bi-x"></i>
                            </Button>
                        </InputGroup>
                    </Form.Group>

                    {showQAButton && <Form.Group as={Col} xl={3} lg={6} className="mt-xl-0 mt-md-2">
                        <ToggleButton
                            className="rounded-0 w-100"
                            id="toggle-check-qa"
                            type="checkbox"
                            variant="outline-primary"
                            checked={qaChecked}
                            value="true"
                            onChange={(e) => handleQAToggleButtonClick(e, filterOptions)}
                        >
                            Show QA files only
                        </ToggleButton>
                    </Form.Group> }

                    {showDataProductButton && <Form.Group as={Col} xl={3} lg={6} className="mt-xl-0 mt-md-2">
                        <ToggleButton
                            className="rounded-0 w-100"
                            id="toggle-check-data-product"
                            type="checkbox"
                            variant="outline-primary"
                            checked={dataProductChecked}
                            value="true"
                            onChange={(e) => handleDataProductToggleButtonClick(e, filterOptions)}
                        >
                            Show Data Product files only
                        </ToggleButton>
                    </Form.Group> }

                    {showDownloadAllButton && <Form.Group as={Col} xl={3} lg={6} className="mt-xl-0 mt-md-2">
                        <Button
                            className="rounded-0 w-100"
                            id="download-all-data-products"
                            variant="outline-primary"
                            value="true"
                            onClick={handleDownloadAllButtonClick}
                        >
                            Download All <i
                            className="bi bi-download"></i>
                        </Button>
                    </Form.Group> }
                </Row>
            </Form>
        )
    }

    const formatKeyId = (str, str2) => str + FILE_KEY_SEPARATOR + str2

    function buildSubDirectory(uuid, file, data, directories, directory_name, id) {
        id = formatKeyId(id, directory_name)
        let sub_directory = {
            key: id,
            label: directory_name,
            icon: 'pi pi-fw pi-folder',
            data: {
                uuid: uuid,
                rel_path: file.rel_path,
                description: file.description || file.rel_path,
                is_qa_qc: file?.is_qa_qc?.toString(),
                is_data_product: file?.is_data_product?.toString(),
                size: file.size
            }
        };
        let sub_directory_children = []
        directories.shift()

        //Check if directory has already been added to `data`
        if (data.length > 0 && data.filter(e => e.label === directory_name).length > 0) {
            let alter_data = data.filter(e => e.label === directory_name)[0]
            if (alter_data.hasOwnProperty("children")) {
                let new_child = buildSubDirectory(uuid, file, alter_data.children, directories, directories[0], id)
                // new_child will be `undefined` if children is modified, no need to push
                if (new_child) {
                    alter_data.children.push(new_child)
                }
                return
            } else {
                if (directories.length > 0) {
                    alter_data.children = (buildSubDirectory(uuid, file, data, directories, directories[0], id))
                    return
                }
            }
        }
        if (directories.length > 0) {
            sub_directory_children.push(buildSubDirectory(uuid, file, data, directories, directories[0], id))
            sub_directory.children = sub_directory_children
        } else {
            sub_directory.icon = 'pi pi-fw pi-file'
        }
        return sub_directory
    }

    const buildTree = (uuid, files) => {
        try {
            let id = 1
            let data = [];

            files.forEach(file => {
                let directories = file.rel_path.split("/")
                if (directories.length === 0) {
                    data.push({
                        key: id,
                        label: file.rel_path,
                        icon: "pi pi-fw pi-file",
                        data: {
                            uuid: uuid,
                            rel_path: file.rel_path,
                            description: file.description || file.rel_path,
                            is_qa_qc: file?.is_qa_qc,
                            is_data_product: file?.is_data_product,
                            size: file.size
                        }
                    })
                    id++
                } else {
                    let sub_directory = buildSubDirectory(uuid, file, data, directories, directories[0], formatKeyId(uuid, id)) //use id to allow unique key name if files have same name
                    // If sub_directory is `undefined` then data was modified during the recursive call
                    if (sub_directory) {
                        id++
                        data.push(sub_directory)
                    }
                }
            });
            setTreeData(data)
        } catch (e) {
            console.error(e)
        }
    }

    const treeView = (
        <Tree
            className={`c-treeView__main ${className}`}
            selectionMode={selection.mode}
            selectionKeys={selection.value}
            onSelectionChange={selection.setValue ? (e) => selection.setValue(e, selection.args) : undefined}
            value={treeData}
            nodeTemplate={nodeTemplate}
            filter={true}
            filterBy={filterBy}
            filterTemplate={filterTemplate}
            onExpand={onExpand}
            onCollapse={onCollapse}
        />
    )

    if (treeViewOnly) {
        return treeView
    }

    const fragment = (<>
        {hasData &&
            <Card border={'0'} className={"mt-2 mb-2 pb-2"}>
                {derivedDataset &&
                    <span className={'fw-light fs-6 mb-2'}>
                                Files from descendant
                        <Link target="_blank" href={{pathname: '/dataset', query: {uuid: derivedDataset.uuid}}}>
                                    <span className={'ms-2 me-2 icon-inline'}>{`${getDatasetTypeDisplay(derivedDataset)} ${derivedDataset.sennet_id}`}</span>
                                </Link>
                            </span>
                }
                {treeData &&
                    <div className={"c-treeView"}>
                        {treeView}
                    </div>
                }
            </Card>
        }
    </>)
    if (withoutAccordion) {
        return fragment
    }

    return (<Fragment>
        <SenNetAccordion title={'Files'}>
            {fragment}
        </SenNetAccordion>
    </Fragment>)
}

export default FileTreeView
