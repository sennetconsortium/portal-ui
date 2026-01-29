import { useEffect, useState, useRef } from 'react'
import {toast} from "react-toastify";
import {
    eq
} from '@/components/custom/js/functions'
import { APP_ROUTES } from '@/config/constants';

function useSelectedFacetsOffer({filters}) {

  const hasOffered = useRef({})

  const _isDatasetFilter = (f) => eq(f.field, 'entity_type') && f.values.contains('dataset')

  const offerSearchByCellTypes = () => {
    hasOffered.current['searchByCellTypes'] = true
    toast(<>With these search filters, you can now <a href={APP_ROUTES.search + '/cell-types'}>search the cell types</a>.</>, {
      className: 'Toastify__toast-center-left',
      position: "top-left",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    })
    
  }

  const determineOffers = () => {
    if (filters.length) {
        for (let f of filters) {
            if (_isDatasetFilter(f)) {
              if (!hasOffered.current['searchByCellTypes']) {
                offerSearchByCellTypes()
              }
              
              break
            }
        }
    }
  }

  useEffect(() => {
      determineOffers()
  }, [filters])

  return {}
}

export default useSelectedFacetsOffer