import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "../components/Nav";
import Home from "../pages/Home";
import Books from "../pages/Books";
import Admin from "../pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-4xl p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/books" element={<Books />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}