import { useEffect, useState } from 'react'
import './App.css'

import { CrossSectionD3 } from './components/CrossSectionD3'
import { useGetData } from './hooks/useGetData'

function App() {
  const [ parameter, setParameter ] = useState<string|null>(null)
  const [ coordsWKT, setCoordsWKT ] = useState<string>('LINESTRING(7 66.2,8 66.2,9 66.2,10 66.2,11 66.2,12 66.2,12 66.2,13 66.2,14 66.2,15 66.2,16 66.2,17 66.2,18 66.2,19 66.2,20 66.2,21 66.2,22 66.2)')
  const [ coordsBeforeTransformation, setCoordsBeforeTransformation ] = useState<string>(coordsWKT);
  const [ editableCoordsWKT, setEditableCoordsWKT ] = useState<string>(coordsWKT);
  const [ eastWestOffset, setEastWestOffset ] = useState(0);

  const { isLoading, availableParameters, selectedInstance, selectedTime, trajectory } = useGetData('https://opendata.fmi.fi/edr/collections/ecmwf_painepinta', parameter, coordsWKT)

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
      return v.join(' ')
    }).join(', ');

    const newValue = `${verb}(${modifiedValues})`
    
    setCoordsWKT(newValue);
  }, [eastWestOffset, coordsBeforeTransformation])

  return (
    <>
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
        <input type="range" min="-30" max="30" value={eastWestOffset} onChange={(evt) => setEastWestOffset(Number(evt.target.value))}></input> {eastWestOffset}
      </div>
      {trajectory && <CrossSectionD3 data={trajectory} isLoading={false} /> }
      <div>
        <p>Selected instance: {selectedInstance ? selectedInstance.id : '-'}</p>
        <p>Selected time: {selectedTime}</p>
      </div>
    </>
  )
}

export default App
