import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CategoryItems from './pages/CategoryItems';
import AddItem from './pages/AddItem';
import ItemDetail from './pages/ItemDetails';
import LowStockItems from './pages/LowStockItems';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/category" element={<CategoryItems />} />
        <Route path="/add-item" element={<AddItem />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/low-stock" element={<LowStockItems />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
