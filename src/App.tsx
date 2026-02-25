import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import Curriculum from "./pages/Curriculum";
import LiveSessions from "./pages/LiveSessions";
import Assignments from "./pages/Assignments";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/live" element={<LiveSessions />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
