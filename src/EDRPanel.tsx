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
  const [ coordsWKT, setCoordsWKT ] = useState<string|null>(null)
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

  const flexColumnStyle : CSSProperties = {display: 'flex',minHeight: '500px' };
  const flexColumnItemStyle : CSSProperties = { flex: '2 0 50%', marginLeft: '1em' }

  return (
    <>
      <div style={flexColumnStyle}>
        <div style={flexColumnItemStyle}>
          <p>Select EDR service and parameter</p>
          <div>
            <label>Service&nbsp;</label>
            <select onChange={(event) => setSelectedService(event.target.value)}>
              {SERVICES.map((param, idx) => (<option value={param.collectionUrl} key={idx} selected={selectedInstance === param.collectionUrl}>{param.title}</option>))}
            </select>
          </div>
          <div>
            <label>Parameter&nbsp;</label>
            <select onChange={(event) => setParameter(event.target.value)}>
              <option></option>
              {availableParameters.map((param, idx) => (<option value={param} key={idx} selected={param === parameter}>{param}</option>))}
            </select>
          </div>
          {trajectory && <CrossSectionD3 data={trajectory} isLoading={false} width={640} height={480} /> }
          {!trajectory && <div style={{width:'640px', height:'480px'}} /> }
          <div>
            <p>Instance: <code style={{color: '#770000'}}>{selectedInstance ? selectedInstance.id : '-'}</code></p>
            <p>Time: <code style={{color: '#770000'}}>{selectedTime}</code></p>
          </div>
        </div>
        <div style={flexColumnItemStyle}>
          <p>Use the map to draw and drag lines to retrieve cross-sections</p>
          <MapComponent coordsWKT={coordsWKT} setCoordsWKT={setCoordsFromMap} />
        </div>
      </div>
    </>
  )
}
