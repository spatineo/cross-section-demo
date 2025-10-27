import { useEffect, useState } from 'react'

import { CrossSectionD3 } from './components/CrossSectionD3'
import { useGetData } from './hooks/useGetData'

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
  const [ coordsBeforeTransformation, setCoordsBeforeTransformation ] = useState<string>(coordsWKT);
  const [ editableCoordsWKT, setEditableCoordsWKT ] = useState<string>(coordsWKT);
  const [ eastWestOffset, setEastWestOffset ] = useState(0);
  const [ northSouthOffset, setNorthSouthOffset ] = useState(0);
  const [ selectedService, setSelectedService ] = useState(SERVICES[0].collectionUrl);
  const [ dragging, setDragging ] = useState(false);

  const { availableParameters, selectedInstance, selectedTime, trajectory } = useGetData({
    baseurl: selectedService,
    parameter,
    coordsWKT,
    coarseData: dragging ? false: false // TODO: using `dragging` directly here causes tanstack to not refetch for one reason or another
  });

  useEffect(() => {
    if (!parameter) return;

    if (!availableParameters.includes(parameter)) {
      setParameter(null);
    }
  }, [availableParameters, parameter])

  useEffect(() => {
    const match = /^\s*([A-Z]+)\s*\((.*)\)\s*$/.exec(coordsBeforeTransformation)
    if (!match) {
      console.error('illegal / unknown WKT', coordsBeforeTransformation)
      return;
    }

    const verb = match[1];
    const values = match[2];

    const modifiedValues = values.split(/\s*,\s*/).map((pair) => {
      const v = pair.split(/\s+/)
      v[0] = String(Number(v[0]) + eastWestOffset)
      v[1] = String(Number(v[1]) + northSouthOffset)
      return v.join(' ')
    }).join(', ');

    const newValue = `${verb}(${modifiedValues})`
    
    setCoordsWKT(newValue);
  }, [eastWestOffset, northSouthOffset, coordsBeforeTransformation])

  return (
    <>
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
      <div>
        <label>Coords parameter to EDR<br />
        <textarea value={editableCoordsWKT} cols={50} rows={5} onChange={(evt) => setEditableCoordsWKT(evt.target.value)} />
        <button onClick={() => setCoordsBeforeTransformation(editableCoordsWKT)}>GO</button>
        </label>
      </div>
      <div>
        <label>Drag coords east-west (apply offset)</label>
        <input 
          type="range" 
          min="-30"
          max="30"
          step="0.1"
          value={eastWestOffset}
          onChange={(evt) => setEastWestOffset(Number(evt.target.value))}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          ></input> {eastWestOffset}
      </div>
      <div>
        <label>Drag coords north-south (apply offset)</label>
        <input
          type="range"
          min="-30"
          max="30"
          step="0.1"
          value={northSouthOffset}
          onChange={(evt) => setNorthSouthOffset(Number(evt.target.value))}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          ></input> {northSouthOffset}
      </div>
      {trajectory && <CrossSectionD3 data={trajectory} isLoading={false} width={640} height={480} /> }
      <div>
        <p>Selected instance: {selectedInstance ? selectedInstance.id : '-'}</p>
        <p>Selected time: {selectedTime}</p>
      </div>
    </>
  )
}
