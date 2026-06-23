import { Routes, Route } from "react-router-dom";
import { SiteDataProvider } from "./context/SiteDataContext.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Scholarships from "./pages/Scholarships.jsx";
import Research from "./pages/Research"; 
import Courses from "./pages/Courses.jsx";
import Testimonials from "./pages/Testimonials.jsx";
import Team from "./pages/Team.jsx";
import Faq from "./pages/Faq.jsx";
import Contact from "./pages/Contact.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

    
export default function App() {
  return (
    <SiteDataProvider>  
      <Routes>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/scholarships" element={<Layout><Scholarships /></Layout>} />
        <Route path="/research" element={<Layout><Research /></Layout>} />
        <Route path="/courses" element={<Layout><Courses /></Layout>} />
        <Route path="/testimonials" element={<Layout><Testimonials /></Layout>} />
        <Route path="/team" element={<Layout><Team /></Layout>} />
        <Route path="/login" element={<Login />} />  
        <Route path="/faq" element={<Layout><Faq /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />

      </Routes>
    </SiteDataProvider>
  );
}
