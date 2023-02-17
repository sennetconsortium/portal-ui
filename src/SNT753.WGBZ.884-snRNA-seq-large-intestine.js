import {getHeaders} from "./components/custom/js/functions";

export const rna_seq = (dataset_id) => ({
    "coordinationSpace": {
        "dataset": {
            "A": "A"
        },
        "embeddingType": {
            "A": "UMAP"
        }
    },
    "datasets": [
        {
            "files": [
                {
                    "fileType": "anndata-cells.zarr",
                    "options": {
                        "factors": [
                            "obs/marker_gene_0",
                            "obs/marker_gene_1",
                            "obs/marker_gene_2",
                            "obs/marker_gene_3",
                            "obs/marker_gene_4"
                        ],
                        "mappings": {
                            "UMAP": {
                                "dims": [
                                    0,
                                    1
                                ],
                                "key": "obsm/X_umap"
                            }
                        }
                    },
                    "requestInit": {
                        "headers": getHeaders()
                    },
                    "url": "https://assets.dev.sennetconsortium.org/" + dataset_id + "/hubmap_ui/anndata-zarr/secondary_analysis.zarr"
                },
                {
                    "fileType": "anndata-cell-sets.zarr",
                    "options": [
                        {
                            "groupName": "Leiden",
                            "setName": "obs/leiden"
                        }
                    ],
                    "url": "https://assets.dev.sennetconsortium.org/" + dataset_id + "/hubmap_ui/anndata-zarr/secondary_analysis.zarr"
                },
                {
                    "fileType": "anndata-expression-matrix.zarr",
                    "options": {
                        "geneAlias": "var/hugo_symbol",
                        "matrix": "X",
                        "matrixGeneFilter": "var/marker_genes_for_heatmap"
                    },
                    "url": "https://assets.dev.sennetconsortium.org/" + dataset_id + "/hubmap_ui/anndata-zarr/secondary_analysis.zarr"
                }
            ],
            "name": "SNT753.WGBZ.884",
            "uid": "A"
        }
    ],
    "description": "",
    "initStrategy": "auto",
    "layout": [
        {
            "component": "scatterplot",
            "coordinationScopes": {
                "dataset": "A",
                "embeddingType": "A"
            },
            "h": 6,
            "w": 6,
            "x": 0,
            "y": 0
        },
        {
            "component": "cellSets",
            "coordinationScopes": {
                "dataset": "A"
            },
            "h": 6,
            "w": 3,
            "x": 6,
            "y": 0
        },
        {
            "component": "genes",
            "coordinationScopes": {
                "dataset": "A"
            },
            "h": 6,
            "w": 3,
            "x": 9,
            "y": 0
        },
        {
            "component": "cellSetExpression",
            "coordinationScopes": {
                "dataset": "A"
            },
            "h": 6,
            "w": 6,
            "x": 6,
            "y": 6
        },
        {
            "component": "heatmap",
            "coordinationScopes": {
                "dataset": "A"
            },
            "h": 6,
            "w": 6,
            "x": 0,
            "y": 6
        }
    ],
    "name": "My Config",
    "version": "1.0.14"
})