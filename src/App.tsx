import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import FeaturedScalpTool from './FeaturedScalpTool';
import FreehandAreaWithReference from './FreeHandDrawing';
// import ScalpAnalysisTool from './ScalpAnalysisTool'; 
import LoginForm from './LoginForm';


function App() {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<FeaturedScalpTool />} /> */}
        <Route path="/" element={<FreehandAreaWithReference />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="*" element={<LoginForm />} />
      </Routes>
    </Router>
  );
};

export default App;



