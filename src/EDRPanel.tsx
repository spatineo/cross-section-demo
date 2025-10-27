import { useCallback, useEffect, useState, type CSSProperties } from 'react'

import { CrossSectionD3 } from './components/CrossSectionD3'
import { useGetData } from './hooks/useGetData'
import { MapComponent } from './components/Map';

const SERVICES = [{
  // Fast, but quite coarse
  title: 'FMI ECWMF Painepinta',
  collectionUrl: 'https://opendata.fmi.fi/edr/collections/ecmwf_painepinta'
}, {
  // Slower, but with more z levels
  title: 'FMI Harmonie Scandinavia Hybrid',
  collectionUrl: 'https://opendata.fmi.fi/edr/collections/harmonie_scandinavia_hybrid'
}];

export const EDRPanel = () => {
  const [ parameter, setParameter ] = useState<string|null>(null)
  const [ coordsWKT, setCoordsWKT ] = useState<string>('LINESTRING(7 66.2,8 66.2,9 66.2,10 66.2,11 66.2,12 66.2,12 66.2,13 66.2,14 66.2,15 66.2,16 66.2,17 66.2,18 66.2,19 66.2,20 66.2,21 66.2,22 66.2)')
  const [ selectedService, setSelectedService ] = useState(SERVICES[0].collectionUrl);

  const { availableParameters, selectedInstance, selectedTime, trajectory } = useGetData({
    baseurl: selectedService,
    parameter,
    coordsWKT,
    coarseData: false
  });

  const setCoordsFromMap = useCallback((wkt: string) => {
    setCoordsWKT(wkt)
  }, [])

  useEffect(() => {
    if (!parameter) return;

    if (!availableParameters.includes(parameter)) {
      setParameter(null);
    }
  }, [availableParameters, parameter])

  const flexColumnStyle : CSSProperties = {display: 'flex' };
  const flexColumnItemStyle : CSSProperties = { flex: '2 0 50%' }

  return (
    <>
      <div style={flexColumnStyle}>
        <div style={flexColumnItemStyle}>

          <div>
            <label>EDR Collection
            <select onChange={(event) => setSelectedService(event.target.value)}>
              {SERVICES.map((param, idx) => (<option value={param.collectionUrl} key={idx} selected={selectedInstance === param.collectionUrl}>{param.title}</option>))}
            </select>
            </label>
          </div>
          <div>
            <label>Parameter to visualise
            <select onChange={(event) => setParameter(event.target.value)}>
              <option></option>
              {availableParameters.map((param, idx) => (<option value={param} key={idx} selected={param === parameter}>{param}</option>))}
            </select>
            </label>
          </div>
          {trajectory && <CrossSectionD3 data={trajectory} isLoading={false} width={640} height={480} /> }
          <div>
            <p>Selected instance: {selectedInstance ? selectedInstance.id : '-'}</p>
            <p>Selected time: {selectedTime}</p>
          </div>
        </div>
        <div style={flexColumnItemStyle}>
          <MapComponent coordsWKT={coordsWKT} setCoordsWKT={setCoordsFromMap} />
        </div>
      </div>
    </>
  )
}
