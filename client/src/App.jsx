import {Routes,Route,Navigate} from 'react-router-dom'
import Layout from './components/Layout'
import PRList from './pages/PRList'
import PRDetails from './pages/PRDetails'
import Analytics from './pages/Analytics'


export default function App() {

  return (
      <Routes>
        <Route path='/' element={<Layout />}>
        <Route index element={<Navigate to='/prs' replace />} />   //index route to redirect to /prs
        <Route path='prs' element={<PRList />} />
        <Route path='prs/:id' element={<PRDetails />} />
        <Route path='analytics' element={<Analytics />} />
        </Route>
      </Routes>

  )
}
