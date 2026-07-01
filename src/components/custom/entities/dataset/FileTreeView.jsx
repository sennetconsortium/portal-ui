import React, {Fragment, useContext, useEffect, useRef, useState} from 'react';
import Card from 'react-bootstrap/Card';
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import Link from "next/link";
import DerivedContext from "@/context/DerivedContext";
import {FILE_KEY_SEPARATOR, getAssetsEndpoint, getAuth} from "@/config/config";
import SenNetPopover, {SenPopoverOptions} from "../../../SenNetPopover";
import {formatByteSize, getDatasetTypeDisplay, urlify} from "@/components/custom/js/functions";
import {Button, Row} from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import {Tree} from 'primereact/tree';
import 'primeicons/primeicons.css';


export const FileTreeView = ({
                                 data,
                                 selection = {},
                                 keys = {files: 'files', uuid: 'uuid'},
                                 loadDerived = true,
                                 treeViewOnly = false,
                                 className = '',
                                 filesClassName = '',
                                 showQAButton = true,
                                 showDataProductButton = true,
                                 includeDescription = false,
                                 showDownloadAllButton = false,
                                 withoutAccordion = false,
                                 onStateUpdateCallback,
                                 expandByDefault = false
                             }) => {
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
    const [selectionMode, setSelectionMode] = useState(selection.mode)
    const [expandedKeys, setExpandedKeys] = useState({});

    const formRef = useRef(null)

    const {
        isPrimaryDataset,
        derivedDataset,
        derivedNotLatestVersion
    } = useContext(DerivedContext)

    const getLength = (obj) => {
        if (!obj) return 0
        return Array.isArray(obj) ? obj.length : Object.keys(obj).length
    }

    const _onStateUpdateCallback = (states) => {
        if (onStateUpdateCallback) {
            onStateUpdateCallback(states)
        }
    }

    const _hasFiles = (has) => {
        setHasData(has)
        _onStateUpdateCallback({hasData: has})
    }

    useEffect(() => {
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


    useEffect(() => {
        if (!treeData) return;
        let filteredTree = treeData;

        if (expandByDefault) {
            setExpandedKeys(getExpandedKeys(filteredTree));
        }

        if (!qaChecked && !dataProductChecked) return

        if (qaChecked) {
            filteredTree = filterTree(
                treeData,
                node => node?.data?.is_qa_qc === "true"
            );
        } else if (dataProductChecked) {
            filteredTree = filterTree(
                treeData,
                node => node?.data?.is_data_product === "true"
            );
        }

        setExpandedKeys(getExpandedKeys(filteredTree));
    }, [treeData, expandByDefault, qaChecked, dataProductChecked]);

    const getExpandedKeys = (nodes) => {
        return nodes.reduce((keys, node) => {
            if (node && "key" in node) {
                keys[node.key] = true;

                if (node.children) {
                    Object.assign(keys, getExpandedKeys(node.children));
                }
                return keys;
            }
        }, {});
    };

    // Filter needs to be applied to the children of the tree nodes as well.
    // Otherwise, if a root is marked as is_qa_qc or is_data_product it will display all children.
    const filterTree = (nodes, predicate) => {
        return nodes.reduce((result, node) => {
            const filteredChildren = node?.children
                ? filterTree(node.children, predicate)
                : [];

            if (predicate(node) || filteredChildren.length > 0) {
                result.push({
                    ...node,
                    children: filteredChildren
                });
            }

            return result;
        }, []);
    };

    const getFilteredData = () => {
        if (qaChecked) {
            return filterTree(
                treeData,
                node => node?.data?.is_qa_qc === "true"
            );
        }

        if (dataProductChecked) {
            return filterTree(
                treeData,
                node => node?.data?.is_data_product === "true"
            );
        }
        return treeData;
    };

    const handleToggle = (event, options, filterType) => {
        const checked = event.currentTarget.checked
        if (checked) {
            if (filterType === filterByValues.qa) {
                setQAChecked(true)
                setDataProductChecked(false)
            } else {
                setDataProductChecked(true)
                setQAChecked(false)
            }
        } else {
            handleSearchResetButtonClick(options)
        }
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
                            {Object.values(selection).length <= 0 && <a target="_blank"
                                                                        className={"icon-inline js-file"}
                                                                        href={`${getAssetsURL(node.data.uuid, node.data.rel_path)}`}><span
                                className="me-1">{node.label}</span>
                            </a>}
                            {Object.values(selection).length > 0 && <span
                                className="me-1">{node.label}</span>}
                            {!includeDescription && node.data.description &&
                                <SenNetPopover 
                                               className={`file-${self.crypto.randomUUID()}`}

                                               text={<div
                                                   dangerouslySetInnerHTML={{__html: urlify(node.data.description)}}></div>}><i
                                    role={'presentation'} className="bi bi-info-circle-fill cursor-pointer"></i>
                                </SenNetPopover>}
                        </Col>
                        <Col md={2} sm={2} className={"text-end"}>
                            {getBadgeViews(node)}
                        </Col>
                        <Col md={2} sm={2} className={"text-end"}>
                            {formatByteSize(node.data.size)}
                        </Col>
                        {includeDescription && node.data.description && <span>{node.data.description}</span>}
                    </Row>) : (
                    <Row className={`w-100 ${filesClassName}`}>
                        <Col md={8} sm={8}>
                            {node.label}
                        </Col>
                        <Col md={2} sm={2} className={"text-end"}>
                            {formatByteSize(node.data.size)}
                        </Col>
                    </Row>)
                }
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
                            onChange={(e) =>
                                handleToggle(e, filterOptions, filterByValues.qa)}
                        >
                            Show QA files only
                        </ToggleButton>
                    </Form.Group>}

                    {showDataProductButton && <Form.Group as={Col} xl={3} lg={6} className="mt-xl-0 mt-md-2">
                        <ToggleButton
                            className="rounded-0 w-100"
                            id="toggle-check-data-product"
                            type="checkbox"
                            variant="outline-primary"
                            checked={dataProductChecked}
                            value="true"
                            onChange={(e) =>
                                handleToggle(e, filterOptions, filterByValues.dataProduct)
                            }
                        >
                            Show Data Product files only
                        </ToggleButton>
                    </Form.Group>}

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
                    </Form.Group>}
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
                description: file.description,
                is_qa_qc: file?.is_qa_qc?.toString(),
                is_data_product: file?.is_data_product?.toString(),
                size: file.size
            }
        };
        let sub_directory_children = []
        directories.shift()

        //Check if directory has already been added to `data`
        if (data.length > 0 && data.filter(e => e?.label === directory_name).length > 0) {
            let alter_data = data.filter(e => e?.label === directory_name)[0]
            if (alter_data.hasOwnProperty("children")) {
                alter_data.data.size += sub_directory.data.size
                let new_child = buildSubDirectory(uuid, file, alter_data.children, directories, directories[0], id)
                // new_child will be `undefined` if children is modified, no need to push
                if (new_child) {
                    alter_data.children.push(new_child)
                }
                return
            } else {
                if (directories.length > 0) {
                    let new_child = buildSubDirectory(uuid, file, data, directories, directories[0], id)
                    alter_data.data.size += new_child.data.size
                    alter_data.children = new_child
                    return
                }
            }
        }
        if (directories.length > 0) {
            const child = buildSubDirectory(uuid, file, data, directories, directories[0], id);
            if (child) {
                sub_directory_children.push(child);
            }
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
                            description: file.description,
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
            selectionMode={selectionMode}
            selectionKeys={selection.value}
            onSelectionChange={selection.setValue ? (e) => selection.setValue(e, selection.args) : undefined}
            value={getFilteredData()}
            nodeTemplate={nodeTemplate}
            filter={true}
            filterBy={"label"}
            filterTemplate={filterTemplate}
            onExpand={onExpand}
            onCollapse={onCollapse}
            expandedKeys={Object.keys(expandedKeys).length > 0 ? expandedKeys : null}
            onToggle={Object.keys(expandedKeys).length > 0 ? (e) => setExpandedKeys(e.value) : undefined}
        />
    )

    if (treeViewOnly) {
        return treeView
    }

    const fragment = (<>
        {hasData &&
            <Card border={'0'} className={"mt-2 mb-2 pb-2"}>
                {derivedDataset &&
                    <div className={'row'}>
                        <div className={'col m-2'}>
                            {derivedNotLatestVersion &&
                                <SenNetPopover
                                    text={
                                        <span>This information comes from a more recent derived dataset that is not <code>Published</code>.</span>}
                                    className={`derivedNotLatest-fileTreeView}`}>
                                    <i className="bi text-danger bi-exclamation-circle-fill"></i>
                                </SenNetPopover>
                            }
                            <span className={'fw-light fs-6 mb-2'}> Files from descendant
                            <Link target="_blank" href={{pathname: '/dataset', query: {uuid: derivedDataset.uuid}}}>
                                    <span
                                        className={'ms-2 me-2 icon-inline'}>{`${getDatasetTypeDisplay(derivedDataset)} ${derivedDataset.sennet_id}`}</span>
                            </Link>
                        </span>
                        </div>
                    </div>
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
