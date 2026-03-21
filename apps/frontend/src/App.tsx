import { BrowserRouter, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<div>Register</div>} />
        <Route path="/onboarding" element={<div>Onboarding</div>} />
      </Routes>
    </BrowserRouter>
  );
}
