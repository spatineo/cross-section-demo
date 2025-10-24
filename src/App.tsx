import { useState } from 'react'
import './App.css'

import { CrossSectionD3 } from './components/CrossSectionD3'
import { useGetData } from './hooks/useGetData'

function App() {
  const [ parameter, setParameter ] = useState<string|null>(null)
  const [ coordsWKT, setCoordsWKT ] = useState<string>('LINESTRING(7 66.2,8 66.2,9 66.2,10 66.2,11 66.2,12 66.2,12 66.2,13 66.2,14 66.2,15 66.2,16 66.2,17 66.2,18 66.2,19 66.2,20 66.2,21 66.2,22 66.2)')
  const [ editableCoordsWKT, setEditableCoordsWKT ] = useState<string>(coordsWKT);

  const { isLoading, availableParameters, selectedInstance, selectedTime, trajectory } = useGetData('https://opendata.fmi.fi/edr/collections/ecmwf_painepinta', parameter, coordsWKT)

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
        <button onClick={() => setCoordsWKT(editableCoordsWKT)}>GO</button>
        </label>
      </div>
      {trajectory && <CrossSectionD3 data={trajectory} isLoading={isLoading} /> }
      <div>
        <p>Selected instance: {selectedInstance ? selectedInstance.id : '-'}</p>
        <p>Selected time: {selectedTime}</p>
      </div>
    </>
  )
}

export default App
