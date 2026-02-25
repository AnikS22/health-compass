import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGuard from "./components/AuthGuard";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import Curriculum from "./pages/Curriculum";
import LiveSessions from "./pages/LiveSessions";
import Assignments from "./pages/Assignments";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import LessonPreview from "./pages/LessonPreview";
import TeacherLiveSession from "./pages/TeacherLiveSession";
import JoinSession from "./pages/JoinSession";
import StudentLiveView from "./pages/StudentLiveView";
import ClassDetail from "./pages/ClassDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageSchools from "./pages/admin/ManageSchools";
import ManageTeachers from "./pages/admin/ManageTeachers";
import ManageCurriculum from "./pages/admin/ManageCurriculum";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/live/student" element={<AuthGuard><StudentLiveView /></AuthGuard>} />
        <Route path="/lesson/preview" element={<AuthGuard><LessonPreview /></AuthGuard>} />
        <Route path="/live/host" element={<AuthGuard><TeacherLiveSession /></AuthGuard>} />
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/:classId" element={<ClassDetail />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/live" element={<LiveSessions />} />
          <Route path="/join" element={<JoinSession />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/reports" element={<Reports />} />
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/schools" element={<ManageSchools />} />
          <Route path="/admin/teachers" element={<ManageTeachers />} />
          <Route path="/admin/curriculum" element={<ManageCurriculum />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
