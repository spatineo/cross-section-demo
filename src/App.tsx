import './App.css'

import * as CrossSection from './assets/example-trajectory.json'
import { CrossSectionD3 } from './components/CrossSectionD3'

function App() {
  return (
    <>
      <CrossSectionD3 data={CrossSection} />
    </>
  )
}

export default App
